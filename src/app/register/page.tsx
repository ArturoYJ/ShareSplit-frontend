'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ApiError, authApi } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/lib/toast-context';

export default function RegisterPage() {
  const { login, token, loading: authLoading } = useAuth();
  const { error: toastError, success } = useToast();
  const router = useRouter();

  const [name, setName]         = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  useEffect(() => {
    if (!authLoading && token) router.replace('/dashboard');
  }, [authLoading, token, router]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const data = await authApi.register({ name, email, password });
      login(data.token, data.user);
      success(`Cuenta creada. Bienvenido, ${data.user.name.split(' ')[0]}`);
      router.push('/dashboard');
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Error de servidor.';
      setError(msg);
      toastError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="page centered">
      <div style={{ width: 'min(400px, 100%)', display: 'flex', flexDirection: 'column', gap: 24 }}>

        {/* Header */}
        <div style={{ textAlign: 'center' }}>
          <h1 className="h2" style={{ marginBottom: 4 }}>Crear cuenta</h1>
          <p className="muted">Es gratis. Sin tarjeta de crédito.</p>
        </div>

        {/* Form card */}
        <div className="card" style={{ padding: 28 }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label className="label" htmlFor="name">Nombre</label>
              <input
                id="name"
                className="input"
                type="text"
                placeholder="Juan Pérez"
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="label" htmlFor="email">Correo electrónico</label>
              <input
                id="email"
                className="input"
                type="email"
                placeholder="juan@ejemplo.com"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="label" htmlFor="password">Contraseña</label>
              <input
                id="password"
                className="input"
                type="password"
                placeholder="Mínimo 6 caracteres"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {error && <div className="error-box">{error}</div>}

            <button
              className="btn btn-primary"
              type="submit"
              disabled={loading}
              style={{ width: '100%', padding: '10px', marginTop: 4 }}
            >
              {loading ? 'Creando cuenta...' : 'Registrarme'}
            </button>
          </form>
        </div>

        {/* Footer link */}
        <p className="muted" style={{ textAlign: 'center', fontSize: '0.875rem' }}>
          ¿Ya tienes cuenta?{' '}
          <Link href="/login" style={{ color: 'var(--primary)', fontWeight: 600 }}>
            Iniciar sesión
          </Link>
        </p>

      </div>
    </main>
  );
}
