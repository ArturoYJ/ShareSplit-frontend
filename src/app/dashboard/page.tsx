'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ApiError, GroupSummary, groupsApi } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/lib/toast-context';

export default function DashboardPage() {
  const { user, token, loading: authLoading, logout } = useAuth();
  const { error: toastError, success } = useToast();
  const router = useRouter();

  const [groups, setGroups] = useState<GroupSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const [showJoin, setShowJoin] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [joinLoading, setJoinLoading] = useState(false);
  const [joinError, setJoinError] = useState('');

  const fetchGroups = useCallback(async () => {
    if (!token) return;

    try {
      const data = await groupsApi.list(token);
      setGroups(data.groups);
    } catch (err) {
      if (err instanceof ApiError) {
        toastError(err.message);
      } else {
        toastError('No se pudieron cargar tus grupos.');
      }
    } finally {
      setLoading(false);
    }
  }, [token, toastError]);

  useEffect(() => {
    if (authLoading) return;
    if (!token) {
      router.push('/login');
      return;
    }
    const timer = window.setTimeout(() => {
      void fetchGroups();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [authLoading, token, router, fetchGroups]);

  const handleJoin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token) return;

    setJoinLoading(true);
    setJoinError('');

    try {
      await groupsApi.join(joinCode.trim().toUpperCase(), token);
      success('¡Te has unido al grupo correctamente!');
      setJoinCode('');
      setShowJoin(false);
      await fetchGroups();
    } catch (err) {
      if (err instanceof ApiError) {
        setJoinError(err.message);
      } else {
        setJoinError('No fue posible unirte al grupo.');
      }
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
      <div className="shell stack" style={{ gap: 18 }}>
        <section className="card" style={{ padding: '32px 40px', border: 'none', background: 'linear-gradient(135deg, white 0%, #f1f5f9 100%)' }}>
          <div className="justify-between row-mobile">
            <div>
              <h1 className="h1" style={{ fontSize: '2.5rem' }}>Hola, {user?.name.split(' ')[0]} 👋</h1>
              <p className="muted" style={{ marginTop: 8, fontSize: '1.1rem' }}>Tienes {groups.length} grupos activos actualmente.</p>
            </div>
            <div className="row-wrap">
              <button className="btn btn-secondary" onClick={() => setShowJoin(true)} style={{ gap: 10 }}>
                <span>🔑</span> Unirme
              </button>
              <Link href="/groups/new" className="btn btn-primary" style={{ gap: 10 }}>
                <span>✨</span> Nuevo grupo
              </Link>
              <button className="btn btn-secondary" onClick={() => void logout()} style={{ color: 'var(--danger)' }}>
                Salir
              </button>
            </div>
          </div>
        </section>

        <h2 className="h3" style={{ marginTop: 12 }}>Mis Grupos</h2>

        <section className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))' }}>
          {groups.length === 0 ? (
            <article className="card" style={{ padding: 48, textAlign: 'center', gridColumn: '1 / -1' }}>
              <div style={{ fontSize: '3rem', marginBottom: 16 }}>🤝</div>
              <h2 className="h2">Comienza la aventura</h2>
              <p className="muted" style={{ maxWidth: 400, margin: '12px auto 24px' }}>Comparte gastos con amigos de forma justa. Crea tu primer grupo ahora.</p>
              <div className="row-wrap" style={{ justifyContent: 'center' }}>
                <Link href="/groups/new" className="btn btn-primary">Crear mi primer grupo</Link>
                <button className="btn btn-secondary" onClick={() => setShowJoin(true)}>Unirme a uno</button>
              </div>
            </article>
          ) : (
            groups.map((group) => (
              <Link href={`/groups/${group.id}`} key={group.id} className="card-flat" style={{ padding: 24, textDecoration: 'none', color: 'inherit' }}>
                <div className="stack" style={{ gap: 16 }}>
                  <div className="justify-between">
                    <div style={{ width: 48, height: 48, borderRadius: 12, background: 'var(--primary)', color: 'white', display: 'grid', placeItems: 'center', fontSize: '1.5rem' }}>
                      🏔️
                    </div>
                    <span className="badge badge-open" style={{ alignSelf: 'start' }}>{group.role === 'owner' ? 'Admin' : 'Miembro'}</span>
                  </div>
                  <div>
                    <h3 className="h2" style={{ fontSize: '1.4rem' }}>{group.name}</h3>
                    <p className="muted" style={{ marginTop: 4 }}>{group.member_count} personas integradas</p>
                  </div>
                  <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="muted" style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase' }}>Código</span>
                    <code style={{ fontWeight: 800, color: 'var(--primary)', letterSpacing: 1 }}>{group.invite_code}</code>
                  </div>
                </div>
              </Link>
            ))
          )}
        </section>
      </div>

      {showJoin && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(8px)',
            zIndex: 2000,
            display: 'grid',
            placeItems: 'center',
            padding: 16,
          }}
        >
          <section className="card" style={{ width: 'min(440px, 94vw)', padding: 32, boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
            <div className="justify-between" style={{ marginBottom: 8 }}>
              <h3 className="h2" style={{ fontSize: '1.5rem' }}>Unirse a un grupo</h3>
              <button className="btn btn-secondary" onClick={() => setShowJoin(false)} style={{ padding: 8, borderRadius: '50%' }}>✕</button>
            </div>
            <p className="muted">Ingresa el código de invitación para empezar a dividir gastos.</p>
            <form onSubmit={handleJoin} className="stack" style={{ marginTop: 24 }}>
              <div>
                <label className="label">Código de Invitación</label>
                <input
                  className="input"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  maxLength={8}
                  style={{ textTransform: 'uppercase', letterSpacing: 4, textAlign: 'center', fontSize: '1.25rem', fontWeight: 800 }}
                  placeholder="XXXXXXXX"
                  required
                />
              </div>
              {joinError && <div className="error-box" style={{ marginTop: 0 }}>{joinError}</div>}
              <button type="submit" className="btn btn-primary" disabled={joinLoading} style={{ width: '100%', padding: 16 }}>
                {joinLoading ? 'Procesando...' : 'Unirse al Grupo'}
              </button>
            </form>
          </section>
        </div>
      )}
    </main>
  );
}
