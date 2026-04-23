'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ApiError, ExpenseCreateInput, expensesApi } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/lib/toast-context';

interface DraftItem {
  name: string;
  unit_price: string;
  quantity: string;
}

export default function NewExpensePage() {
  const params = useParams<{ id: string }>();
  const groupId = params.id;

  const { token, loading: authLoading } = useAuth();
  const { error: toastError, success } = useToast();
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [place, setPlace] = useState('');
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<DraftItem[]>([
    { name: '', unit_price: '', quantity: '1' },
  ]);

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!token) {
      router.push('/login');
    }
  }, [authLoading, token, router]);

  const total = useMemo(() => {
    return items.reduce((acc, item) => {
      const price = Number(item.unit_price || 0);
      const quantity = Number(item.quantity || 0);
      return acc + (Number.isFinite(price) ? price : 0) * (Number.isFinite(quantity) ? quantity : 0);
    }, 0);
  }, [items]);

  const addItem = () => {
    setItems((prev) => [...prev, { name: '', unit_price: '', quantity: '1' }]);
  };

  const removeItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof DraftItem, value: string) => {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token) return;

    const normalizedItems = items
      .map((item) => ({
        name: item.name.trim(),
        unit_price: Number(item.unit_price),
        quantity: Number(item.quantity || '1'),
      }))
      .filter((item) => item.name && item.unit_price >= 0 && item.quantity > 0);

    if (!title.trim()) {
      toastError('El título del gasto es obligatorio.');
      return;
    }

    if (normalizedItems.length === 0) {
      toastError('Agrega al menos un ítem válido.');
      return;
    }

    setLoading(true);

    const payload: ExpenseCreateInput = {
      title: title.trim(),
      place: place.trim() || undefined,
      expense_date: expenseDate,
      notes: notes.trim() || undefined,
      items: normalizedItems,
    };

    try {
      const result = await expensesApi.create(groupId, payload, token);
      success('¡Gasto registrado con éxito!');
      router.push(`/groups/${groupId}/expenses/${result.expense.id}`);
    } catch (err) {
      if (err instanceof ApiError) {
        toastError(err.message);
      } else {
        toastError('No fue posible registrar el gasto.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="page">
      <section className="shell stack" style={{ gap: 14 }}>
        <Link href={`/groups/${groupId}`} className="muted" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span>←</span> Volver al grupo
        </Link>

        <article className="card" style={{ padding: 40 }}>
          <h1 className="h1" style={{ fontSize: '2.5rem' }}>Nuevo Gasto</h1>
          <p className="muted" style={{ marginTop: 8 }}>
            Ingresa los detalles del ticket. El total se calculará solo.
          </p>

          <form onSubmit={handleSubmit} className="stack" style={{ marginTop: 14 }}>
            <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 24 }}>
              <div>
                <label className="label">¿Qué compraste? *</label>
                <input
                  className="input"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ej: Cena en VIPS"
                  required
                />
              </div>

              <div>
                <label className="label">Lugar</label>
                <input
                  className="input"
                  value={place}
                  onChange={(e) => setPlace(e.target.value)}
                  placeholder="Ej: Reforma 222"
                />
              </div>

              <div>
                <label className="label">Fecha *</label>
                <input
                  className="input"
                  type="date"
                  value={expenseDate}
                  onChange={(e) => setExpenseDate(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <label className="label">Notas Adicionales</label>
              <textarea
                className="textarea"
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Escribe algo relevante sobre este gasto..."
              />
            </div>

            <section className="stack" style={{ gap: 16, marginTop: 12 }}>
              <div className="justify-between">
                <h3 className="h3">Desglose de Ítems</h3>
                <button type="button" className="btn btn-secondary" onClick={addItem} style={{ padding: '8px 16px' }}>
                  + Agregar Ítem
                </button>
              </div>

              {items.map((item, index) => (
                <div
                  key={`${index}-${item.name}`}
                  className="card-flat"
                  style={{ padding: 20, display: 'grid', gap: 16, gridTemplateColumns: '2fr 1fr 1fr auto', alignItems: 'end' }}
                >
                  <div>
                    <label className="label" style={{ fontSize: '0.7rem' }}>Producto</label>
                    <input
                      className="input"
                      placeholder="Ej: Pasta"
                      value={item.name}
                      onChange={(e) => updateItem(index, 'name', e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="label" style={{ fontSize: '0.7rem' }}>Precio Unit.</label>
                    <input
                      className="input"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      value={item.unit_price}
                      onChange={(e) => updateItem(index, 'unit_price', e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="label" style={{ fontSize: '0.7rem' }}>Cant.</label>
                    <input
                      className="input"
                      type="number"
                      min="1"
                      step="1"
                      placeholder="1"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                      required
                    />
                  </div>
                  <button
                    type="button"
                    className="btn btn-danger"
                    onClick={() => removeItem(index)}
                    disabled={items.length === 1}
                    style={{ padding: 12 }}
                    title="Eliminar ítem"
                  >
                    🗑️
                  </button>
                </div>
              ))}
            </section>

            <div style={{ background: 'var(--primary)', color: 'white', padding: '24px 32px', borderRadius: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ opacity: 0.8, fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>Total a Pagar</p>
                <p style={{ fontSize: '2rem', fontWeight: 800 }}>${total.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
              </div>
              <button className="btn" type="submit" disabled={loading} style={{ background: 'white', color: 'var(--primary)', padding: '16px 32px', fontSize: '1.1rem' }}>
                {loading ? 'Guardando...' : 'Crear Gasto'}
              </button>
            </div>
          </form>
        </article>
      </section>
    </main>
  );
}
