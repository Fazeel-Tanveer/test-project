# Technical Test

## Stack

- **Backend:** Node.js, TypeScript, NestJS
- **Frontend:** React, Vite, TypeScript
- **Database:** In-memory (seeded on startup)

## Running locally

> Requires Node 18+

**Backend** runs on `http://localhost:3000`

```bash
cd backend
npm install
npm run start
```

**Frontend** runs on `http://localhost:5173`

```bash
cd frontend
npm install
npm run dev
```

---

## API

`POST /orders` body:

```json
{
  "studentId": "student-1",
  "items": [
    { "menuItemId": "menu-2", "quantity": 1 },
    { "menuItemId": "menu-3", "quantity": 2 }
  ]
}
```

Returns 201 with the order on success. Errors come back as `{ code, message }` with the HTTP status set on the response. The codes I throw are `INSUFFICIENT_BALANCE` (402), `ALLERGEN_CONFLICT` and `ITEM_UNAVAILABLE` (both 409), `STUDENT_NOT_FOUND` / `MENU_ITEM_NOT_FOUND` (404), `PAYMENT_FAILED` (402), and `VALIDATION_ERROR` (400) for bad request bodies.

There are also three GETs that the frontend uses: `/students`, `/menu-items`, and `/parents/:id`.

---

## Seed data

Two parents and two students are seeded on startup. Alex Parent has $50 in their wallet and one child, Sam, who's allergic to nuts. Jordan Parent has $5 and one child, Riley, with no allergens, the low balance is there so you can hit the `INSUFFICIENT_BALANCE` path easily.

The menu has four items: a peanut butter sandwich ($6.50, nuts), a cheese sandwich ($5, dairy), apple juice ($2.50, no allergens), and a pasta bake ($8, dairy) which is marked unavailable so you can hit `ITEM_UNAVAILABLE`.

---

## Design decisions & assumptions

All four collections live in a single `DataStore` in production each would be its own repository against a real database, but for this exercise it keeps the seed data in one obvious place.

`OrdersService` owns the business rules. Validation runs before any state mutation, and the three checks (availability, allergens, balance) are split into helpers so `create` reads as a clear sequence.

I treated `parent.walletBalance` as if it were a call to a third-party payment provider in production this would be e.g. a Stripe charge. The debit and order insert are wrapped in a `try/catch` so anything thrown from the payment step surfaces as `PAYMENT_FAILED` instead of leaking. All validation, deduction, and insertion happen in a single event-loop tick, so nothing else can interleave with a real DB this would obviously be a transaction.

A global exception filter maps `DomainException` subclasses to the `{ code, message }` shape so HTTP status is decided once, in the error class, rather than scattered across controllers.

---

## Part 2, Production thinking

> *Some orders were created successfully, but the wallet balance was not deducted.*

- What could cause it?

The most likely cause is that the order insert and the wallet update are running as two separate statements without a transaction, so one can succeed while the other fails halfway through. I've seen this exact pattern before, the order write commits, then the wallet update throws (constraint error, connection drop, timeout) and nothing rolls back the order. It could also be that the wallet lives in a separate service and the network call between the two writes silently dropped the debit, retries weren't idempotent, or someone caught the exception too aggressively and just logged it. Race conditions are another suspect if two requests for the same wallet land at the same time without proper locking, one read-modify-write can clobber the other.

- How would you debug it?

First thing I'd do is pull the affected order IDs and cross-reference them against the wallet audit log to confirm the debit is genuinely missing and not just delayed or written under a different key. Once I've got a confirmed bad order, I'd trace one request end-to-end through the logs with its correlation ID, looking specifically for an exception that got swallowed between the order insert and the wallet update. I'd also check whether the issue clusters around a specific time window or user, that usually points at either a deploy, a downstream outage, or a hot wallet getting hammered. If the wallet service is separate, I'd compare its request logs against our outbound calls to see if the debit even left the building.

- How would you prevent it?

The cleanest fix is to wrap order creation and the wallet deduction in a single database transaction so they either both commit or both roll back, no half-states possible. If the wallet lives in another service and a real transaction isn't on the table, I'd reach for the outbox pattern, write the order and an "owed debit" row in one local transaction, then have a worker reliably push the debit to the wallet service with idempotency keys so retries are safe. Either way I'd add a reconciliation job that runs periodically and flags any order without a matching debit, so even if something slips through we catch it in hours instead of weeks.
