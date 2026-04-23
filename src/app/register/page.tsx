'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ApiError, authApi } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/lib/toast-context';

export default function RegisterPage() {
  const { login } = useAuth();
  const { error: toastError, success } = useToast();
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const data = await authApi.register({ name, email, password });
      login(data.token, data.user);
      success(`¡Cuenta creada! Bienvenido, ${data.user.name}`);
      router.push('/dashboard');
    } catch (err) {
      if (err instanceof ApiError) {
        toastError(err.message);
        setError(err.message);
      } else {
        toastError('No se pudo establecer conexión.');
        setError('Error de servidor.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="page centered" style={{ background: 'linear-gradient(135deg, #f0f4ff 0%, #e0e7ff 100%)' }}>
      <section className="card" style={{ width: 'min(480px, 94vw)', padding: 48, borderRadius: 32 }}>
        <div className="stack" style={{ gap: 32 }}>
          <div className="text-center">
            <h1 className="h1" style={{ fontSize: '2.2rem', marginBottom: 8 }}>Únete a ShareSplit</h1>
            <p className="muted">Crea una cuenta para empezar a dividir gastos</p>
          </div>

          <form onSubmit={handleSubmit} className="stack" style={{ gap: 20 }}>
            <div className="stack" style={{ gap: 8 }}>
              <label className="label">Tu Nombre</label>
              <input
                className="input"
                type="text"
                placeholder="Juan Pérez"
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="stack" style={{ gap: 8 }}>
              <label className="label">Correo Electrónico</label>
              <input
                className="input"
                type="email"
                placeholder="juan@ejemplo.com"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="stack" style={{ gap: 8 }}>
              <label className="label">Contraseña</label>
              <input
                className="input"
                type="password"
                placeholder="Mínimo 6 caracteres"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {error && (
              <div className="error-box" style={{ padding: '12px 16px', borderRadius: 12, fontSize: '0.9rem' }}>
                {error}
              </div>
            )}

            <button 
              className="btn btn-primary" 
              type="submit" 
              disabled={loading}
              style={{ padding: '16px', fontSize: '1rem', marginTop: 8 }}
            >
              {loading ? 'Creando Perfil...' : 'Registrarme Gratis'}
            </button>
          </form>

          <div className="text-center" style={{ borderTop: '1px solid #eee', paddingTop: 24 }}>
            <p className="muted" style={{ fontSize: '0.95rem' }}>
              ¿Ya tienes una cuenta?{' '}
              <Link href="/login" style={{ color: 'var(--primary)', fontWeight: 700 }}>
                Inicia sesión aquí
              </Link>
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
