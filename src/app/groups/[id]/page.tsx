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
import ConfirmModal from '@/components/ConfirmModal';

interface ModalState {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
}

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
  const [copied, setCopied] = useState(false);
  const [transferTarget, setTransferTarget] = useState('');
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [modal, setModal] = useState<ModalState>({ open: false, title: '', message: '', onConfirm: () => {} });
  const { success, error: toastError } = useToast();

  const closeModal = () => setModal((prev) => ({ ...prev, open: false }));
  const openModal = (config: Omit<ModalState, 'open'>) =>
    setModal({ ...config, open: true });

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
      setPagination({
        page: expensesRes.page,
        total_count: expensesRes.total,
        total_pages: Math.ceil(expensesRes.total / expensesRes.limit) || 1
      });
      setBalances(balancesRes.balances);
    } catch (err) {
      if (err instanceof ApiError) {
        toastError(err.message);
      } else {
        toastError('No fue posible cargar este grupo.');
      }
    } finally {
      setLoading(false);
    }
  }, [token, groupId, page, toastError]);

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

  const handleRemoveMember = (memberId: string, memberName: string) => {
    if (!token) return;
    openModal({
      title: 'Expulsar miembro',
      message: `¿Expulsar a ${memberName} del grupo?`,
      confirmLabel: 'Expulsar',
      danger: true,
      onConfirm: async () => {
        closeModal();
        await handleApiAction(`remove-${memberId}`, async () => {
          const result = await groupsApi.removeMember(groupId, memberId, token);
          success(result.message);
          await fetchData();
        });
      },
    });
  };

  const handleTransferOwner = () => {
    if (!token || !transferTarget) return;
    const target = groupData?.members.find((m) => m.id === transferTarget);
    if (!target) return;
    openModal({
      title: 'Transferir ownership',
      message: `¿Transferir ownership a ${target.name}? Esta acción cambia tu rol a miembro.`,
      confirmLabel: 'Transferir',
      danger: false,
      onConfirm: async () => {
        closeModal();
        await handleApiAction('transfer-owner', async () => {
          const result = await groupsApi.transferOwner(groupId, transferTarget, token);
          success(result.message);
          setTransferTarget('');
          await fetchData();
        });
      },
    });
  };

  const handleLeaveGroup = () => {
    if (!token || !user) return;
    openModal({
      title: 'Abandonar grupo',
      message: '¿Seguro que quieres abandonar este grupo?',
      confirmLabel: 'Abandonar',
      danger: true,
      onConfirm: async () => {
        closeModal();
        await handleApiAction('leave-group', async () => {
          const result = await groupsApi.leave(groupId, user.id, token);
          success(result.message);
          router.push('/dashboard');
        });
      },
    });
  };

  const handleDeleteGroup = () => {
    if (!token) return;
    openModal({
      title: 'Eliminar grupo',
      message: '¿Eliminar grupo permanentemente? Esta acción no se puede deshacer.',
      confirmLabel: 'Eliminar',
      danger: true,
      onConfirm: async () => {
        closeModal();
        await handleApiAction('delete-group', async () => {
          const result = await groupsApi.delete(groupId, token);
          success(result.message);
          router.push('/dashboard');
        });
      },
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
      <div className="shell" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

        {/* Page header */}
        <div className="justify-between row-mobile">
          <div>
            <Link href="/dashboard" className="muted" style={{ fontSize: '0.875rem', display: 'inline-flex', alignItems: 'center', gap: 4, marginBottom: 8 }}>
              ← Mis grupos
            </Link>
            <h1 className="h1">{groupData?.group.name || 'Grupo'}</h1>
            <div className="row-wrap" style={{ marginTop: 6 }}>
              <span className={`badge ${isOwner ? 'badge-open' : 'badge-draft'}`}>
                {isOwner ? 'Administrador' : 'Miembro'}
              </span>
            </div>
          </div>
          <div className="row-wrap">
            <button className="btn btn-secondary" onClick={copyInvite}>
              {copied ? 'Copiado' : `Código: ${groupData?.group.invite_code || '---'}`}
            </button>
            <Link href={`/groups/${groupId}/expenses/new`} className="btn btn-primary">
              + Nuevo gasto
            </Link>
          </div>
        </div>

        <hr className="divider" />

        {/* KPI row */}
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
          <article className="kpi">
            <span className="muted" style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Miembros</span>
            <p className="kpi-value">{groupData?.members.length ?? 0}</p>
          </article>
          <article className="kpi">
            <span className="muted" style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Gastos</span>
            <p className="kpi-value">{pagination.total_count}</p>
          </article>
          <article
            className="kpi"
            style={{
              borderColor: (myBalance?.net_balance || 0) >= 0 ? 'var(--success-bg)' : 'var(--danger-bg)',
              background: (myBalance?.net_balance || 0) >= 0 ? 'var(--success-bg)' : 'var(--danger-bg)',
            }}
          >
            <span className="muted" style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Mi saldo</span>
            <p className="kpi-value" style={{ color: (myBalance?.net_balance || 0) >= 0 ? 'var(--success)' : 'var(--danger)' }}>
              {(myBalance?.net_balance || 0) >= 0 ? '+' : ''}${(myBalance?.net_balance || 0).toFixed(2)}
            </p>
          </article>
        </div>

        {/* Members section */}
        <section className="card">
          <div className="justify-between" style={{ marginBottom: 16 }}>
            <h2 className="h3">Integrantes</h2>
            <div className="row-wrap">
              {!isOwner && (
                <button className="btn btn-danger" onClick={handleLeaveGroup} disabled={busyAction === 'leave-group'}>
                  {busyAction === 'leave-group' ? 'Saliendo...' : 'Abandonar'}
                </button>
              )}
              {isOwner && (
                <button className="btn btn-danger" onClick={handleDeleteGroup} disabled={busyAction === 'delete-group'}>
                  {busyAction === 'delete-group' ? 'Eliminando...' : 'Eliminar grupo'}
                </button>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {groupData?.members.map((member) => (
              <div
                key={member.id}
                className="card-flat"
                style={{ padding: '12px 16px' }}
              >
                <div className="justify-between">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div className="avatar">{member.name.charAt(0)}</div>
                    <div>
                      <p style={{ fontWeight: 600, fontSize: '0.9375rem' }}>
                        {member.name}
                        {member.id === user?.id && (
                          <span className="muted" style={{ fontWeight: 400, marginLeft: 6 }}>(tú)</span>
                        )}
                      </p>
                      <p className="muted" style={{ fontSize: '0.8125rem' }}>
                        {member.role === 'owner' ? 'Administrador' : 'Miembro'}
                      </p>
                    </div>
                  </div>
                  {isOwner && member.role !== 'owner' && (
                    <button
                      className="btn btn-ghost"
                      onClick={() => handleRemoveMember(member.id, member.name)}
                      disabled={busyAction === `remove-${member.id}`}
                      style={{ fontSize: '0.8125rem', color: 'var(--danger)', padding: '6px 10px' }}
                    >
                      {busyAction === `remove-${member.id}` ? '...' : 'Remover'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {isOwner && (
            <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--line)' }}>
              <label className="label">Transferir administración</label>
              <div className="row-wrap">
                <select
                  className="select"
                  value={transferTarget}
                  onChange={(e) => setTransferTarget(e.target.value)}
                  style={{ flex: 1, minWidth: 180 }}
                >
                  <option value="">Selecciona un miembro</option>
                  {groupData?.members
                    .filter((m) => m.role !== 'owner')
                    .map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
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

        {/* Expenses section */}
        <section className="card">
          <div className="justify-between" style={{ marginBottom: 16 }}>
            <h2 className="h3">Gastos</h2>
            <Link href={`/groups/${groupId}/expenses/new`} className="btn btn-primary">
              + Agregar
            </Link>
          </div>

          {expenses.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 16px', border: '1px dashed var(--line)', borderRadius: 10 }}>
              <p className="muted">Sin gastos aún. ¡Agrega el primero!</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {expenses.map((expense) => (
                <Link
                  key={expense.id}
                  href={`/groups/${groupId}/expenses/${expense.id}`}
                  className="card-flat"
                  style={{ padding: '14px 16px', textDecoration: 'none', color: 'inherit', display: 'block' }}
                >
                  <div className="justify-between row-mobile">
                    <div>
                      <p style={{ fontWeight: 600, fontSize: '0.9375rem', marginBottom: 3 }}>{expense.title}</p>
                      <p className="muted" style={{ fontSize: '0.8125rem' }}>
                        {expense.paid_by_name} · {new Date(expense.expense_date).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}
                      </p>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <p style={{ fontWeight: 700, fontSize: '1rem', marginBottom: 4 }}>
                        ${Number(expense.total_amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </p>
                      <span className={statusClass(expense.status)}>
                        {statusLabel(expense.status)}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {pagination.total_pages > 1 && (
            <div className="row-wrap" style={{ marginTop: 16, justifyContent: 'center' }}>
              <button className="btn btn-secondary" disabled={page <= 1} onClick={() => handlePageChange(page - 1)}>
                Anterior
              </button>
              <span className="muted" style={{ padding: '0 8px', fontSize: '0.875rem' }}>
                {page} / {pagination.total_pages}
              </span>
              <button className="btn btn-secondary" disabled={page >= pagination.total_pages} onClick={() => handlePageChange(page + 1)}>
                Siguiente
              </button>
            </div>
          )}
        </section>
      </div>

      <ConfirmModal
        open={modal.open}
        title={modal.title}
        message={modal.message}
        confirmLabel={modal.confirmLabel}
        danger={modal.danger}
        onConfirm={modal.onConfirm}
        onCancel={closeModal}
      />
    </main>
  );
}
