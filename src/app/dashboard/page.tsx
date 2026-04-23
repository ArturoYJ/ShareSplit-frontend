'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ApiError, GroupSummary, groupsApi } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/lib/toast-context';

function GroupCard({ group }: { group: GroupSummary }) {
  const initial = group.name.charAt(0).toUpperCase();
  const isOwner = group.role === 'owner';

  return (
    <Link
      href={`/groups/${group.id}`}
      className="card-flat"
      style={{ padding: 20, textDecoration: 'none', color: 'inherit', display: 'block' }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
        <div
          style={{
            width: 40, height: 40, borderRadius: 10,
            background: 'var(--primary-bg)', color: 'var(--primary)',
            display: 'grid', placeItems: 'center',
            fontSize: '1rem', fontWeight: 700,
            border: '1px solid var(--line)',
          }}
        >
          {initial}
        </div>
        <span className={`badge ${isOwner ? 'badge-open' : 'badge-draft'}`}>
          {isOwner ? 'Admin' : 'Miembro'}
        </span>
      </div>

      <h3 className="h3" style={{ marginBottom: 4 }}>{group.name}</h3>
      <p className="muted">{group.member_count} {group.member_count === 1 ? 'persona' : 'personas'}</p>

      <div
        style={{
          marginTop: 16, paddingTop: 14,
          borderTop: '1px solid var(--line)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}
      >
        <span className="muted" style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Código</span>
        <code style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '0.875rem', letterSpacing: 1 }}>
          {group.invite_code}
        </code>
      </div>
    </Link>
  );
}

export default function DashboardPage() {
  const { user, token, loading: authLoading } = useAuth();
  const { error: toastError, success } = useToast();
  const router = useRouter();

  const [groups, setGroups]     = useState<GroupSummary[]>([]);
  const [loading, setLoading]   = useState(true);
  const [showJoin, setShowJoin] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [joinLoading, setJoinLoading] = useState(false);
  const [joinError, setJoinError]     = useState('');

  const fetchGroups = useCallback(async () => {
    if (!token) return;
    try {
      const data = await groupsApi.list(token);
      setGroups(data.groups);
    } catch (err) {
      toastError(err instanceof ApiError ? err.message : 'No se pudieron cargar tus grupos.');
    } finally {
      setLoading(false);
    }
  }, [token, toastError]);

  useEffect(() => {
    if (authLoading) return;
    if (!token) { router.push('/login'); return; }
    const timer = window.setTimeout(() => { void fetchGroups(); }, 0);
    return () => window.clearTimeout(timer);
  }, [authLoading, token, router, fetchGroups]);

  const handleJoin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!token) return;
    setJoinLoading(true);
    setJoinError('');
    try {
      await groupsApi.join(joinCode.trim().toUpperCase(), token);
      success('¡Te uniste al grupo!');
      setJoinCode('');
      setShowJoin(false);
      await fetchGroups();
    } catch (err) {
      setJoinError(err instanceof ApiError ? err.message : 'No se pudo unir al grupo.');
    } finally {
      setJoinLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <main className="page centered">
        <p className="muted">Cargando...</p>
      </main>
    );
  }

  return (
    <main className="page">
      <div className="shell" style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>

        {/* Page header */}
        <div className="justify-between row-mobile">
          <div>
            <h1 className="h1">Mis grupos</h1>
            <p className="muted" style={{ marginTop: 4 }}>
              {user?.name.split(' ')[0]} · {groups.length} {groups.length === 1 ? 'grupo' : 'grupos'}
            </p>
          </div>
          <div className="row-wrap">
            <button className="btn btn-secondary" onClick={() => setShowJoin(true)}>
              Unirme con código
            </button>
            <Link href="/groups/new" className="btn btn-primary">
              Nuevo grupo
            </Link>
          </div>
        </div>

        <hr className="divider" />

        {/* Groups grid */}
        {groups.length === 0 ? (
          <div
            className="card"
            style={{ textAlign: 'center', padding: '48px 24px' }}
          >
            <p style={{ fontSize: '2rem', marginBottom: 12 }}>🤝</p>
            <h2 className="h2" style={{ marginBottom: 8 }}>Sin grupos todavía</h2>
            <p className="muted" style={{ maxWidth: 340, margin: '0 auto 24px' }}>
              Crea tu primer grupo o únete a uno con un código de invitación.
            </p>
            <div className="row-wrap" style={{ justifyContent: 'center' }}>
              <Link href="/groups/new" className="btn btn-primary">Crear grupo</Link>
              <button className="btn btn-secondary" onClick={() => setShowJoin(true)}>Unirme</button>
            </div>
          </div>
        ) : (
          <div
            className="grid"
            style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}
          >
            {groups.map((group) => (
              <GroupCard key={group.id} group={group} />
            ))}
          </div>
        )}
      </div>

      {/* Join modal */}
      {showJoin && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Unirse a un grupo"
          style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <div
            onClick={() => setShowJoin(false)}
            style={{ position: 'absolute', inset: 0, background: 'rgba(28,25,23,0.5)' }}
          />
          <div className="card" style={{ position: 'relative', width: 'min(400px, 90vw)', padding: 28 }}>
            <div className="justify-between" style={{ marginBottom: 20 }}>
              <h2 className="h3">Unirse a un grupo</h2>
              <button
                className="btn btn-ghost"
                onClick={() => setShowJoin(false)}
                style={{ padding: '4px 8px', fontSize: '1rem' }}
                aria-label="Cerrar"
              >
                ✕
              </button>
            </div>

            <p className="muted" style={{ marginBottom: 20 }}>
              Ingresa el código de invitación de 8 caracteres.
            </p>

            <form onSubmit={handleJoin} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label className="label" htmlFor="join-code">Código de invitación</label>
                <input
                  id="join-code"
                  className="input"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  maxLength={8}
                  style={{
                    textTransform: 'uppercase', letterSpacing: 6,
                    textAlign: 'center', fontSize: '1.25rem', fontWeight: 700,
                  }}
                  placeholder="XXXXXXXX"
                  required
                />
              </div>
              {joinError && <div className="error-box">{joinError}</div>}
              <button
                type="submit"
                className="btn btn-primary"
                disabled={joinLoading || joinCode.length < 6}
                style={{ width: '100%', padding: '10px' }}
              >
                {joinLoading ? 'Procesando...' : 'Unirme'}
              </button>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
