'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';

const FEATURES = [
  {
    title: 'Registro granular',
    description: 'Captura cada ticket línea por línea. Sin totales arbitrarios.',
  },
  {
    title: 'Claims por usuario',
    description: 'Cada quien marca lo que consumió. Si comparten un ítem, se divide automáticamente.',
  },
  {
    title: 'Balances claros',
    description: 'Ve exactamente quién le debe a quién. Sin matemáticas manuales.',
  },
] as const;

export default function HomePage() {
  const { user, token } = useAuth();

  return (
    <main className="page">
      <div className="shell" style={{ display: 'flex', flexDirection: 'column', gap: 48 }}>

        {/* Hero */}
        <section style={{ paddingTop: 40 }}>
          <div style={{ maxWidth: 600 }}>
            <p
              className="badge badge-open"
              style={{ marginBottom: 16, display: 'inline-flex', textTransform: 'none', fontSize: '0.8125rem', letterSpacing: 0 }}
            >
              División justa por consumo real
            </p>
            <h1 className="h1" style={{ marginBottom: 16 }}>
              Divide gastos sin conflictos.
            </h1>
            <p style={{ color: 'var(--text-2)', fontSize: '1rem', lineHeight: 1.7, maxWidth: 480, marginBottom: 28 }}>
              ShareSplit calcula exactamente cuánto debe cada persona según lo que consumió — no el total del ticket dividido entre todos.
            </p>

            <div className="row-wrap">
              {token ? (
                <Link className="btn btn-primary" href="/dashboard" style={{ padding: '9px 20px' }}>
                  Ir a mis grupos
                </Link>
              ) : (
                <>
                  <Link className="btn btn-primary" href="/register" style={{ padding: '9px 20px' }}>
                    Crear cuenta gratis
                  </Link>
                  <Link className="btn btn-secondary" href="/login" style={{ padding: '9px 20px' }}>
                    Iniciar sesión
                  </Link>
                </>
              )}
            </div>

            {user && (
              <p className="muted" style={{ marginTop: 14 }}>
                Sesión activa como <strong style={{ color: 'var(--text)' }}>{user.name}</strong>.
              </p>
            )}
          </div>
        </section>

        {/* Divider */}
        <hr className="divider" />

        {/* Features */}
        <section>
          <p className="muted" style={{ marginBottom: 20, fontWeight: 500, textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.06em' }}>
            Cómo funciona
          </p>
          <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
            {FEATURES.map((f, i) => (
              <article key={i} className="kpi">
                <p style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  0{i + 1}
                </p>
                <h3 className="h3" style={{ marginTop: 4 }}>{f.title}</h3>
                <p className="muted" style={{ marginTop: 2, lineHeight: 1.5 }}>{f.description}</p>
              </article>
            ))}
          </div>
        </section>

      </div>
    </main>
  );
}
