'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ApiError,
  BalanceRow,
  ExpenseListItem,
  GroupDetailResponse,
  balancesApi,
  expensesApi,
  groupsApi,
} from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/lib/toast-context';

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

export default function GroupDetailPage() {
  const params = useParams<{ id: string }>();
  const groupId = params.id;
  const router = useRouter();
  const { token, user, loading: authLoading } = useAuth();

  const [groupData, setGroupData] = useState<GroupDetailResponse | null>(null);
  const [expenses, setExpenses] = useState<ExpenseListItem[]>([]);
  const [pagination, setPagination] = useState({ page: 1, total_pages: 1, total_count: 0 });
  const [balances, setBalances] = useState<BalanceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [copied, setCopied] = useState(false);
  const [transferTarget, setTransferTarget] = useState('');
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const { success, error: toastError } = useToast();

  const fetchData = useCallback(async (targetPage = page) => {
    if (!token || !groupId) return;

    try {
      const [groupRes, expensesRes, balancesRes] = await Promise.all([
        groupsApi.get(groupId, token),
        expensesApi.list(groupId, token, { page: targetPage, limit: 10 }),
        balancesApi.get(groupId, token),
      ]);

      setGroupData(groupRes);
      setExpenses(expensesRes.expenses);
      setPagination(expensesRes.pagination);
      setBalances(balancesRes.balances);
      setError('');
    } catch (err) {
      if (err instanceof ApiError) {
        toastError(err.message);
      } else {
        toastError('No fue posible cargar este grupo.');
      }
    } finally {
      setLoading(false);
    }
  }, [token, groupId, page]);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    void fetchData(newPage);
  };

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

  const myMember = useMemo(() => {
    return groupData?.members.find((member) => member.id === user?.id) ?? null;
  }, [groupData, user]);

  const myBalance = useMemo(() => {
    if (!user) return null;
    return balances.find((balance) => balance.user_id === user.id) ?? null;
  }, [balances, user]);

  const isOwner = myMember?.role === 'owner';

  const copyInvite = async () => {
    if (!groupData?.group.invite_code) return;
    await navigator.clipboard.writeText(groupData.group.invite_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleApiAction = async (actionKey: string, action: () => Promise<void>) => {
    setBusyAction(actionKey);
    try {
      await action();
    } catch (err) {
      if (err instanceof ApiError) {
        toastError(err.message);
      } else {
        toastError('No se pudo completar la acción.');
      }
    } finally {
      setBusyAction(null);
    }
  };

  const handleRemoveMember = async (memberId: string, memberName: string) => {
    if (!token) return;
    if (!window.confirm(`¿Expulsar a ${memberName} del grupo?`)) return;

    await handleApiAction(`remove-${memberId}`, async () => {
      const result = await groupsApi.removeMember(groupId, memberId, token);
      success(result.message);
      await fetchData();
    });
  };

  const handleTransferOwner = async () => {
    if (!token || !transferTarget) return;
    const target = groupData?.members.find((m) => m.id === transferTarget);
    if (!target) return;

    if (!window.confirm(`¿Transferir ownership a ${target.name}? Esta acción cambia tu rol a miembro.`)) return;

    await handleApiAction('transfer-owner', async () => {
      const result = await groupsApi.transferOwner(groupId, transferTarget, token);
      success(result.message);
      setTransferTarget('');
      await fetchData();
    });
  };

  const handleLeaveGroup = async () => {
    if (!token || !user) return;
    if (!window.confirm('¿Seguro que quieres abandonar este grupo?')) return;

    await handleApiAction('leave-group', async () => {
      const result = await groupsApi.leave(groupId, user.id, token);
      success(result.message);
      router.push('/dashboard');
    });
  };

  const handleDeleteGroup = async () => {
    if (!token) return;
    if (!window.confirm('¿Eliminar grupo permanentemente? Esta acción no se puede deshacer.')) return;

    await handleApiAction('delete-group', async () => {
      const result = await groupsApi.delete(groupId, token);
      success(result.message);
      router.push('/dashboard');
    });
  };

  if (authLoading || loading) {
    return (
      <main className="page centered">
        <p className="muted">Cargando grupo...</p>
      </main>
    );
  }

  return (
    <main className="page">
      <section className="shell stack" style={{ gap: 16 }}>
          <div className="justify-between row-mobile">
            <div>
              <Link href="/dashboard" className="muted" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span>←</span> Dashboard
              </Link>
              <h1 className="h1" style={{ marginTop: 8 }}>{groupData?.group.name || 'Grupo'}</h1>
              <div className="row-wrap" style={{ marginTop: 8, alignItems: 'center' }}>
                <span className="badge badge-open">Grupo Activo</span>
                <span className="muted">Rol: <b>{myMember?.role === 'owner' ? '👑 Dueño' : '👤 Miembro'}</b></span>
              </div>
            </div>

            <div className="row-wrap">
              <button className="btn btn-secondary" onClick={copyInvite} style={{ gap: 10 }}>
                <span>📋</span>
                {copied ? '¡Copiado!' : `Invitar: ${groupData?.group.invite_code || '---'}`}
              </button>
              <Link href={`/groups/${groupId}/expenses/new`} className="btn btn-primary" style={{ gap: 10 }}>
                <span>➕</span> Nuevo gasto
              </Link>
            </div>
          </div>

        {/* Notificaciones via Toast ahora */}

        <section className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
          <article className="kpi card">
            <span className="muted" style={{ fontWeight: 600 }}>Miembros</span>
            <div className="justify-between">
              <p className="kpi-value">{groupData?.members.length ?? 0}</p>
              <span style={{ fontSize: '2rem' }}>👥</span>
            </div>
          </article>
          <article className="kpi card">
            <span className="muted" style={{ fontWeight: 600 }}>Gastos Totales</span>
            <div className="justify-between">
              <p className="kpi-value">{pagination.total_count}</p>
              <span style={{ fontSize: '2rem' }}>🧾</span>
            </div>
          </article>
          <article className="kpi card" style={{ background: (myBalance?.net_balance || 0) >= 0 ? 'rgba(16, 185, 129, 0.05)' : 'rgba(239, 68, 68, 0.05)' }}>
            <span className="muted" style={{ fontWeight: 600 }}>Mi Saldo Neto</span>
            <div className="justify-between">
              <p className="kpi-value" style={{ color: (myBalance?.net_balance || 0) >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                {(myBalance?.net_balance || 0) >= 0 ? '+' : ''}${(myBalance?.net_balance || 0).toFixed(2)}
              </p>
              <span style={{ fontSize: '2rem' }}>💰</span>
            </div>
          </article>
        </section>

        <section className="card" style={{ padding: 16 }}>
          <div className="justify-between" style={{ marginBottom: 20 }}>
            <h2 className="h3">Integrantes del Equipo</h2>
            <div className="row-wrap">
              {!isOwner && (
                <button
                  className="btn btn-secondary"
                  onClick={handleLeaveGroup}
                  disabled={busyAction === 'leave-group'}
                  style={{ color: 'var(--danger)' }}
                >
                  {busyAction === 'leave-group' ? 'Saliendo...' : 'Abandonar'}
                </button>
              )}
              {isOwner && (
                <button
                  className="btn btn-danger"
                  onClick={handleDeleteGroup}
                  disabled={busyAction === 'delete-group'}
                >
                  {busyAction === 'delete-group' ? 'Eliminando...' : 'Eliminar Grupo'}
                </button>
              )}
            </div>
          </div>

          <div className="stack" style={{ gap: 12 }}>
            {groupData?.members.map((member) => (
              <div className="card-flat" key={member.id} style={{ padding: '14px 18px' }}>
                <div className="justify-between">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'grid', placeItems: 'center', fontWeight: 700 }}>
                      {member.name[0]}
                    </div>
                    <div>
                      <p style={{ fontWeight: 600 }}>{member.name} {member.id === user?.id && <span className="muted">(tú)</span>}</p>
                      <p className="muted" style={{ fontSize: '0.8rem' }}>{member.role === 'owner' ? '👑 Administrador' : '👤 Miembro'}</p>
                    </div>
                  </div>
                  {isOwner && member.role !== 'owner' && (
                    <button
                      className="btn btn-secondary"
                      onClick={() => handleRemoveMember(member.id, member.name)}
                      disabled={busyAction === `remove-${member.id}`}
                      style={{ padding: '8px 12px', fontSize: '0.85rem' }}
                    >
                      {busyAction === `remove-${member.id}` ? '...' : 'Remover'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {isOwner && (
            <div className="stack" style={{ marginTop: 14, gap: 8 }}>
              <span className="label">Transferir ownership</span>
              <div className="row-wrap">
                <select
                  className="select"
                  value={transferTarget}
                  onChange={(e) => setTransferTarget(e.target.value)}
                  style={{ minWidth: 260 }}
                >
                  <option value="">Selecciona un miembro</option>
                  {groupData?.members
                    .filter((m) => m.role !== 'owner')
                    .map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                </select>
                <button
                  className="btn btn-secondary"
                  disabled={!transferTarget || busyAction === 'transfer-owner'}
                  onClick={handleTransferOwner}
                >
                  {busyAction === 'transfer-owner' ? 'Transfiriendo...' : 'Transferir'}
                </button>
              </div>
            </div>
          )}
        </section>

        <section className="card" style={{ padding: 24 }}>
          <div className="justify-between" style={{ marginBottom: 20 }}>
            <h2 className="h3">Historial de Gastos</h2>
            <Link href={`/groups/${groupId}/expenses/new`} className="btn btn-primary" style={{ padding: '8px 16px' }}>
              <span>+</span> Agregar
            </Link>
          </div>

          {expenses.length === 0 ? (
            <div className="centered" style={{ padding: '40px 0', border: '2px dashed var(--line)', borderRadius: 20 }}>
              <p className="muted">No hay gastos registrados. ¡Empieza por agregar uno!</p>
            </div>
          ) : (
            <div className="stack" style={{ gap: 12 }}>
              {expenses.map((expense) => (
                <Link
                  key={expense.id}
                  href={`/groups/${groupId}/expenses/${expense.id}`}
                  className="card-flat"
                  style={{ padding: '18px 20px', textDecoration: 'none', color: 'inherit' }}
                >
                  <div className="justify-between row-mobile" style={{ alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                      <div style={{ width: 48, height: 48, borderRadius: 12, background: '#f1f5f9', display: 'grid', placeItems: 'center', fontSize: '1.2rem' }}>
                        {expense.status === 'settled' ? '✅' : '⏳'}
                      </div>
                      <div>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>{expense.title}</h3>
                        <p className="muted" style={{ fontSize: '0.85rem', marginTop: 4 }}>
                          Pagado por <b>{expense.paid_by_name}</b> · {new Date(expense.expense_date).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}
                        </p>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: 'var(--text)' }}>
                        ${Number(expense.total_amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </p>
                      <span className={statusClass(expense.status)} style={{ marginTop: 6, display: 'inline-block' }}>
                        {statusLabel(expense.status)}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {pagination.total_pages > 1 && (
            <div className="row-wrap" style={{ marginTop: 20, justifyContent: 'center' }}>
              <button
                className="btn btn-secondary"
                disabled={page <= 1}
                onClick={() => handlePageChange(page - 1)}
              >
                Anterior
              </button>
              <span className="muted" style={{ padding: '0 12px' }}>
                Página {page} de {pagination.total_pages}
              </span>
              <button
                className="btn btn-secondary"
                disabled={page >= pagination.total_pages}
                onClick={() => handlePageChange(page + 1)}
              >
                Siguiente
              </button>
            </div>
          )}
        </section>
      </section>
    </main>
  );
}
