export class DomainException extends Error {
  constructor(
    public readonly code: string,
    public readonly message: string,
    public readonly status = 400,
    public readonly details?: Record<string, unknown>,
  ) {
    super(message);
  }
}

export class InsufficientBalanceError extends DomainException {
  constructor(details?: { balance?: number; required?: number }) {
    super('INSUFFICIENT_BALANCE', 'Insufficient wallet balance', 402, details);
  }
}

export class ItemUnavailableError extends DomainException {
  constructor(unavailable: string[]) {
    super(
      'ITEM_UNAVAILABLE',
      `Unavailable items: ${unavailable.join(', ')}`,
      409,
      { unavailable },
    );
  }
}

export class AllergenConflictError extends DomainException {
  constructor(allergens: string[]) {
    super(
      'ALLERGEN_CONFLICT',
      `Order contains allergens the student is sensitive to: ${allergens.join(', ')}`,
      409,
      { allergens },
    );
  }
}

export class PaymentFailedError extends DomainException {
  constructor(reason: string) {
    super('PAYMENT_FAILED', `Payment failed: ${reason}`, 402, { reason });
  }
}
