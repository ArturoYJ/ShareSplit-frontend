'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ApiError,
  ExpenseDetailResponse,
  claimsApi,
  expensesApi,
  groupsApi,
} from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

function statusLabel(status: 'draft' | 'open' | 'settled') {
  if (status === 'draft') return 'Borrador';
  if (status === 'open') return 'Abierto';
  return 'Liquidado';
}

function statusClass(status: 'draft' | 'open' | 'settled') {
  if (status === 'draft') return 'badge badge-draft';
  if (status === 'open') return 'badge badge-open';
  return 'badge badge-settled';
}

export default function ExpenseDetailPage() {
  const params = useParams<{ id: string; expenseId: string }>();
  const groupId = params.id;
  const expenseId = params.expenseId;

  const { token, user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [data, setData] = useState<ExpenseDetailResponse | null>(null);
  const [myClaims, setMyClaims] = useState<string[]>([]);
  const [myRole, setMyRole] = useState<'owner' | 'member'>('member');
  const [loading, setLoading] = useState(true);
  const [busyItemId, setBusyItemId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [actionInfo, setActionInfo] = useState('');

  const fetchData = useCallback(async () => {
    if (!token) return;

    try {
      const [expenseRes, claimsRes, groupRes] = await Promise.all([
        expensesApi.get(groupId, expenseId, token),
        claimsApi.getMyClaims(groupId, expenseId, token),
        groupsApi.get(groupId, token),
      ]);

      setData(expenseRes);
      setMyClaims(claimsRes.claimed_item_ids || []);

      const me = groupRes.members.find((member) => member.id === user?.id);
      setMyRole(me?.role || 'member');

      setError('');
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('No fue posible cargar este gasto.');
      }
    } finally {
      setLoading(false);
    }
  }, [token, groupId, expenseId, user]);

  useEffect(() => {
    if (authLoading) return;
    if (!token) {
      router.push('/login');
      return;
    }
    const timer = window.setTimeout(() => {
      void fetchData();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [authLoading, token, router, fetchData]);

  const myTotal = useMemo(() => {
    if (!data) return 0;

    return data.items.reduce((acc, item) => {
      if (!myClaims.includes(item.id)) return acc;
      return acc + Number(item.my_share || 0);
    }, 0);
  }, [data, myClaims]);

  const toggleClaim = async (itemId: string) => {
    if (!token || busyItemId) return;

    setActionError('');
    setActionInfo('');
    setBusyItemId(itemId);

    try {
      await claimsApi.toggle(groupId, expenseId, itemId, token);
      await fetchData();
    } catch (err) {
      if (err instanceof ApiError) {
        setActionError(err.message);
      } else {
        setActionError('No se pudo actualizar el reclamo.');
      }
    } finally {
      setBusyItemId(null);
    }
  };

  const handleDeleteExpense = async () => {
    if (!token) return;
    if (!window.confirm('¿Eliminar este gasto? Esta acción no se puede deshacer.')) return;

    setActionError('');
    setActionInfo('');

    try {
      await expensesApi.delete(groupId, expenseId, token);
      router.push(`/groups/${groupId}`);
    } catch (err) {
      if (err instanceof ApiError) {
        setActionError(err.message);
      } else {
        setActionError('No fue posible eliminar el gasto.');
      }
    }
  };

  const updateStatus = async (status: 'open' | 'settled') => {
    if (!token) return;

    setActionError('');
    setActionInfo('');

    try {
      await expensesApi.updateStatus(groupId, expenseId, status, token);
      setActionInfo(status === 'open' ? 'Gasto publicado.' : 'Gasto liquidado.');
      await fetchData();
    } catch (err) {
      if (err instanceof ApiError) {
        const unclaimedItems =
          (err.payload.details &&
            typeof err.payload.details === 'object' &&
            'unclaimed_items' in err.payload.details &&
            Array.isArray((err.payload.details as { unclaimed_items: unknown[] }).unclaimed_items)
            ? (err.payload.details as { unclaimed_items: unknown[] }).unclaimed_items
            : err.payload.unclaimed_items) || [];

        if (unclaimedItems.length > 0) {
          const names = unclaimedItems
            .map((item) => {
              if (item && typeof item === 'object' && 'name' in item) {
                return String((item as { name: string }).name);
              }
              if (item && typeof item === 'object' && 'item_name' in item) {
                return String((item as { item_name: string }).item_name);
              }
              return 'Ítem pendiente';
            })
            .slice(0, 5)
            .join(', ');
          setActionError(`${err.message}. Pendientes: ${names}`);
        } else {
          setActionError(err.message);
        }
      } else {
        setActionError('No fue posible actualizar el estado del gasto.');
      }
    }
  };

  if (authLoading || loading) {
    return (
      <main className="page centered">
        <p className="muted">Cargando gasto...</p>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="page centered">
        <p className="muted">No hay datos disponibles para este gasto.</p>
      </main>
    );
  }

  const { expense, items } = data;
  const canPublish = myRole === 'owner' && expense.status === 'draft';
  const canSettle = myRole === 'owner' && expense.status === 'open';
  const canClaim = expense.status === 'open';
  const canDelete =
    expense.status !== 'settled' &&
    (myRole === 'owner' || expense.paid_by === user?.id);

  return (
    <main className="page">
      <section className="shell stack" style={{ gap: 14 }}>
        <Link href={`/groups/${groupId}`} className="muted" style={{ fontSize: '.9rem' }}>
          ← Volver al grupo
        </Link>

        <article className="card" style={{ padding: 18 }}>
          <div className="justify-between row-mobile">
            <div>
              <div className="row-wrap" style={{ alignItems: 'center' }}>
                <h1 className="h2">{expense.title}</h1>
                <span className={statusClass(expense.status)}>{statusLabel(expense.status)}</span>
              </div>
              <p className="muted" style={{ margin: '4px 0 0' }}>
                Pagó {expense.paid_by_name} · {new Date(expense.expense_date).toLocaleDateString('es-MX')}
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p className="muted" style={{ margin: 0 }}>Total del ticket</p>
              <p style={{ margin: '4px 0 0', fontWeight: 800, fontSize: '1.5rem' }}>
                ${Number(expense.total_amount).toFixed(2)}
              </p>
            </div>
          </div>

          {(error || actionError || actionInfo) && (
            <div className="stack" style={{ marginTop: 12, gap: 8 }}>
              {error && <div className="error-box">{error}</div>}
              {actionError && <div className="error-box">{actionError}</div>}
              {actionInfo && <div className="info-box">{actionInfo}</div>}
            </div>
          )}

          {(canPublish || canSettle || canDelete) && (
            <div className="row-wrap" style={{ marginTop: 12 }}>
              {canPublish && (
                <button className="btn btn-primary" onClick={() => updateStatus('open')}>
                  Publicar gasto
                </button>
              )}
              {canSettle && (
                <button className="btn btn-secondary" onClick={() => updateStatus('settled')}>
                  Marcar como liquidado
                </button>
              )}
              {canDelete && (
                <button className="btn btn-danger" onClick={handleDeleteExpense}>
                  Eliminar gasto
                </button>
              )}
            </div>
          )}
        </article>

        <section className="grid" style={{ gridTemplateColumns: '2fr 1fr' }}>
          <article className="card" style={{ padding: 16 }}>
            <h2 className="h3" style={{ marginBottom: 10 }}>Ítems y reclamos</h2>
            <div className="stack" style={{ gap: 10 }}>
              {items.map((item) => {
                const selected = myClaims.includes(item.id);
                return (
                  <button
                    key={item.id}
                    className="card-flat"
                    type="button"
                    onClick={() => toggleClaim(item.id)}
                    disabled={!canClaim || busyItemId === item.id}
                    style={{
                      padding: 12,
                      cursor: canClaim ? 'pointer' : 'default',
                      borderColor: selected ? 'var(--primary)' : undefined,
                      background: selected ? '#edf8fa' : undefined,
                      textAlign: 'left',
                    }}
                  >
                    <div className="justify-between row-mobile">
                      <div>
                        <p style={{ margin: 0, fontWeight: 700 }}>{item.name}</p>
                        <p className="muted" style={{ margin: '3px 0 0', fontSize: '.9rem' }}>
                          ${Number(item.total_price).toFixed(2)} · {Number(item.quantity)} unidad(es)
                        </p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ margin: 0, fontWeight: 700 }}>
                          {Number(item.claimant_count)} reclamo(s)
                        </p>
                        <p className="muted" style={{ margin: '3px 0 0', fontSize: '.85rem' }}>
                          Tu parte: ${Number(item.my_share).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {!canClaim && (
              <p className="muted" style={{ marginTop: 12 }}>
                Solo puedes reclamar ítems cuando el gasto está en estado abierto.
              </p>
            )}
          </article>

          <aside className="card" style={{ padding: 16, alignSelf: 'start' }}>
            <h2 className="h3" style={{ marginBottom: 12 }}>Tu resumen</h2>
            <div className="stack" style={{ gap: 10 }}>
              <div className="kpi">
                <p className="muted" style={{ margin: 0, fontWeight: 700 }}>Ítems reclamados</p>
                <p className="kpi-value" style={{ margin: 0 }}>{myClaims.length}</p>
              </div>
              <div className="kpi">
                <p className="muted" style={{ margin: 0, fontWeight: 700 }}>Total de tu parte</p>
                <p className="kpi-value" style={{ margin: 0, color: 'var(--primary-strong)' }}>${myTotal.toFixed(2)}</p>
              </div>
              <p className="muted" style={{ margin: 0, fontSize: '.86rem' }}>
                El cálculo respeta el prorrateo por reclamantes y el ajuste de centavos definido para el pagador.
              </p>
            </div>
          </aside>
        </section>
      </section>
    </main>
  );
}
