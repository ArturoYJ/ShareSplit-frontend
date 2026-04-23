'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ApiError, groupsApi } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

export default function NewGroupPage() {
  const { token, loading: authLoading } = useAuth();
  const router = useRouter();

  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (authLoading) return;
    if (!token) {
      router.push('/login');
    }
  }, [authLoading, token, router]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token) return;

    setLoading(true);
    setError('');

    try {
      const result = await groupsApi.create(name.trim(), token);
      router.push(`/groups/${result.group.id}`);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('No se pudo crear el grupo.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="page centered">
      <section className="card" style={{ width: 'min(560px, 95vw)', padding: 24 }}>
        <div className="stack">
          <Link href="/dashboard" className="muted" style={{ fontSize: '.9rem' }}>
            ← Volver al dashboard
          </Link>

          <div>
            <h1 className="h2">Crear grupo</h1>
            <p className="muted" style={{ margin: '4px 0 0' }}>
              Usa un nombre claro para que todos lo identifiquen rápido.
            </p>
          </div>

          <form className="stack" onSubmit={handleSubmit}>
            <label className="stack" style={{ gap: 6 }}>
              <span className="label">Nombre del grupo</span>
              <input
                className="input"
                placeholder="Ejemplo: Viaje a Oaxaca"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </label>

            {error && <div className="error-box">{error}</div>}

            <button className="btn btn-primary" disabled={loading || !name.trim()} type="submit">
              {loading ? 'Creando...' : 'Crear grupo'}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
