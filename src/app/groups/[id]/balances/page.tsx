'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ApiError,
  BalanceRow,
  DebtRow,
  PaymentRow,
  balancesApi,
  groupsApi,
} from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/lib/toast-context';

export default function BalancesPage() {
  const params = useParams<{ id: string }>();
  const groupId = params.id;

  const { token, user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [balances, setBalances] = useState<BalanceRow[]>([]);
  const [debts, setDebts] = useState<DebtRow[]>([]);
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [myRole, setMyRole] = useState<'owner' | 'member'>('member');

  const [loading, setLoading] = useState(true);

  const [paying, setPaying] = useState<string | null>(null);
  const [settling, setSettling] = useState(false);
  const { success, error: toastError } = useToast();

  const fetchData = useCallback(async () => {
    if (!token) return;

    try {
      const [balancesRes, paymentsRes, groupRes] = await Promise.all([
        balancesApi.get(groupId, token),
        balancesApi.getPayments(groupId, token),
        groupsApi.get(groupId, token),
      ]);

      setBalances(balancesRes.balances);
      setDebts(balancesRes.debts);
      setPayments(paymentsRes.payments);

      const me = groupRes.members.find((member) => member.id === user?.id);
      setMyRole(me?.role || 'member');
    } catch (err) {
      if (err instanceof ApiError) {
        toastError(err.message);
      } else {
        toastError('No se pudieron cargar los balances del grupo.');
      }
    } finally {
      setLoading(false);
    }
  }, [token, groupId, user, toastError]);

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

  const myDebts = useMemo(
    () => debts.filter((debt) => debt.from_user_id === user?.id),
    [debts, user]
  );

  const registerPayment = async (debt: DebtRow) => {
    if (!token) return;

    setPaying(`${debt.from_user_id}-${debt.to_user_id}`);

    try {
      await balancesApi.pay(
        groupId,
        {
          to_user_id: debt.to_user_id,
          amount: Number(debt.amount),
          note: 'Pago registrado desde ShareSplit',
        },
        token
      );
      success('¡Pago registrado con éxito!');
      await fetchData();
    } catch (err) {
      if (err instanceof ApiError) {
        toastError(err.message);
      } else {
        toastError('No se pudo registrar el pago.');
      }
    } finally {
      setPaying(null);
    }
  };

  const settleAll = async () => {
    if (!token) return;

    setSettling(true);
    try {
      const result = await balancesApi.settleAll(groupId, token);
      success(result.message);
      await fetchData();
    } catch (err) {
      if (err instanceof ApiError) {
        toastError(err.message);
      } else {
        toastError('No se pudo liquidar el grupo.');
      }
    } finally {
      setSettling(false);
    }
  };

  if (authLoading || loading) {
    return (
      <main className="page">
        <section className="shell stack" style={{ gap: 14 }}>
          <div>
            <div className="skeleton skeleton-text" style={{ width: 140 }} />
            <div className="skeleton skeleton-title" />
          </div>
          <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20 }}>
            <div className="skeleton skeleton-card" style={{ height: 150 }} />
            <div className="skeleton skeleton-card" style={{ height: 150 }} />
          </div>
          <div className="skeleton skeleton-card" style={{ height: 200 }} />
        </section>
      </main>
    );
  }

  return (
    <main className="page fade-in">
      <section className="shell stack" style={{ gap: 14 }}>
        <div className="justify-between row-mobile">
          <div>
            <Link href={`/groups/${groupId}`} className="muted" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>←</span> Volver al grupo
            </Link>
            <h1 className="h1" style={{ marginTop: 8 }}>Balances y Deudas</h1>
          </div>
          {myRole === 'owner' && (
            <button className="btn btn-primary" onClick={settleAll} disabled={settling}>
              {settling ? 'Liquidando...' : 'Cerrar y liquidar'}
            </button>
          )}
        </div>

        <section className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20 }}>
          {balances.map((balance) => (
            <article className="card" key={balance.user_id}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
                <div className="avatar">{balance.name[0]}</div>
                <div>
                  <h3 className="h3" style={{ fontSize: '1.1rem' }}>{balance.name}</h3>
                  <span style={{ fontSize: '0.8rem', color: balance.net_balance >= 0 ? 'var(--success)' : 'var(--danger)', fontWeight: 700 }}>
                    {balance.net_balance >= 0 ? 'A favor' : 'En contra'}
                  </span>
                </div>
                <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                  <p className="kpi-value" style={{ fontSize: '1.5rem', color: balance.net_balance >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                    {balance.net_balance >= 0 ? '+' : ''}${balance.net_balance.toFixed(2)}
                  </p>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, paddingTop: 16, borderTop: '1px solid var(--line)' }}>
                <div>
                  <p className="muted" style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>Pagó</p>
                  <p style={{ fontWeight: 600 }}>${balance.total_paid.toFixed(2)}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p className="muted" style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>Consumió</p>
                  <p style={{ fontWeight: 600 }}>${balance.total_owed.toFixed(2)}</p>
                </div>
              </div>
            </article>
          ))}
        </section>

        <section className="card" style={{ padding: 'clamp(20px, 4vw, 32px)' }}>
          <h2 className="h3" style={{ marginBottom: 24 }}>Deudas Simplificadas</h2>
          {debts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 16px', border: '1px dashed var(--line)', borderRadius: 10 }}>
              <p className="muted">Sin deudas pendientes en este grupo.</p>
            </div>
          ) : (
            <div className="stack" style={{ gap: 16 }}>
              {debts.map((debt) => {
                const key = `${debt.from_user_id}-${debt.to_user_id}`;
                const canPay = debt.from_user_id === user?.id;

                return (
                  <div className="card-flat" style={{ padding: '20px 24px' }} key={key}>
                    <div className="justify-between mobile-stack" style={{ gap: 12 }}>
                      <div>
                        <p style={{ fontWeight: 600, fontSize: '0.9375rem', marginBottom: 3 }}>
                          {debt.from_name} → {debt.to_name}
                        </p>
                        <p className="muted" style={{ fontSize: '0.8125rem' }}>Transferencia o efectivo</p>
                      </div>
                      <div className="row-wrap" style={{ alignItems: 'center', gap: 20 }}>
                        <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text)' }}>
                          ${Number(debt.amount).toFixed(2)}
                        </span>
                        {canPay && (
                          <button
                            className="btn btn-primary"
                            onClick={() => registerPayment(debt)}
                            disabled={paying === key}
                            style={{ padding: '10px 20px' }}
                          >
                            {paying === key ? '...' : 'Pagar'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section className="card" style={{ padding: 16 }}>
          <h2 className="h3" style={{ marginBottom: 10 }}>Historial de pagos</h2>
          {payments.length === 0 ? (
            <p className="muted" style={{ margin: 0 }}>Aún no hay pagos registrados.</p>
          ) : (
            <div className="stack" style={{ gap: 10 }}>
              {payments.map((payment) => (
                <div className="card-flat" key={payment.id} style={{ padding: 12 }}>
                  <p style={{ margin: 0 }}>
                    <b>{payment.from_name}</b> pagó <b>${Number(payment.amount).toFixed(2)}</b> a <b>{payment.to_name}</b>
                  </p>
                  <p className="muted" style={{ margin: '4px 0 0', fontSize: '.85rem' }}>
                    {new Date(payment.paid_at).toLocaleString('es-MX')}
                    {payment.note ? ` · ${payment.note}` : ''}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>

        {myDebts.length > 0 && (
          <p className="muted" style={{ margin: 0, fontSize: '.88rem' }}>
            Puedes registrar pagos en las deudas donde apareces como deudor.
          </p>
        )}
      </section>
    </main>
  );
}
