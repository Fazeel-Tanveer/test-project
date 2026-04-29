import { useEffect, useMemo, useState } from 'react';
import { api, ApiError, MenuItem, OrderResponse, Parent, Student } from './api';

export function App() {
  const [students, setStudents] = useState<Student[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [parent, setParent] = useState<Parent | null>(null);

  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<OrderResponse | null>(null);
  const [error, setError] = useState<ApiError | null>(null);

  useEffect(() => {
    (async () => {
      const [s, m] = await Promise.all([api.students(), api.menuItems()]);
      setStudents(s);
      setMenuItems(m);
      if (s[0]) setSelectedStudentId(s[0].id);
    })();
  }, []);

  const selectedStudent = students.find((s) => s.id === selectedStudentId);

  useEffect(() => {
    const parentId = selectedStudent?.parentId;
    if (!parentId) return;
    (async () => {
      setParent(await api.parent(parentId));
    })();
  }, [selectedStudent?.parentId, success]);

  const lines = useMemo(
    () =>
      Object.entries(quantities)
        .filter(([, q]) => q > 0)
        .map(([menuItemId, quantity]) => ({ menuItemId, quantity })),
    [quantities],
  );

  const total = useMemo(
    () =>
      lines.reduce((sum, l) => {
        const item = menuItems.find((m) => m.id === l.menuItemId);
        return sum + (item?.price ?? 0) * l.quantity;
      }, 0),
    [lines, menuItems],
  );

  function setQty(id: string, qty: number) {
    setQuantities((q) => ({ ...q, [id]: Math.max(0, qty) }));
  }

  async function submit() {
    if (!selectedStudentId || lines.length === 0) return;
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      const order = await api.createOrder({ studentId: selectedStudentId, items: lines });
      setSuccess(order);
      setQuantities({});
    } catch (e) {
      setError(e as ApiError);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="container">
      <h1>test-project</h1>

      <section className="card">
        <label>
          Student
          <select
            value={selectedStudentId}
            onChange={(e) => setSelectedStudentId(e.target.value)}
          >
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} {s.allergens.length ? `(allergens: ${s.allergens.join(', ')})` : ''}
              </option>
            ))}
          </select>
        </label>
        {parent && (
          <p className="wallet">
            Wallet ({parent.name}): <strong>${parent.walletBalance.toFixed(2)}</strong>
          </p>
        )}
      </section>

      <section className="card">
        <h2>Menu</h2>
        <table>
          <thead>
            <tr>
              <th>Item</th>
              <th>Price</th>
              <th>Allergens</th>
              <th>Status</th>
              <th>Qty</th>
            </tr>
          </thead>
          <tbody>
            {menuItems.map((m) => (
              <tr key={m.id} className={!m.available ? 'unavailable' : ''}>
                <td>{m.name}</td>
                <td>${m.price.toFixed(2)}</td>
                <td>{m.allergens.join(', ') || '—'}</td>
                <td>{m.available ? 'Available' : 'Sold out'}</td>
                <td>
                  <input
                    type="number"
                    min={0}
                    disabled={!m.available}
                    value={quantities[m.id] ?? 0}
                    onChange={(e) => setQty(m.id, Number(e.target.value))}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="card summary">
        <div>
          Total: <strong>${total.toFixed(2)}</strong>
        </div>
        <button
          type="button"
          onClick={submit}
          disabled={submitting || lines.length === 0 || !selectedStudentId}
        >
          {submitting ? 'Placing…' : 'Place order'}
        </button>
      </section>

      {error && (
        <div className="alert alert-error">
          <strong>{error.code}:</strong> {error.message}
        </div>
      )}
      {success && (
        <div className="alert alert-success">
          Order <code>{success.id}</code> placed. Total ${success.total.toFixed(2)}.
        </div>
      )}
    </main>
  );
}
