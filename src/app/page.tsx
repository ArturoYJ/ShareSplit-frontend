'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';

export default function HomePage() {
  const { user, token } = useAuth();

  return (
    <main className="page">
      <section className="shell grid" style={{ gap: 22 }}>
        <article className="card" style={{ padding: '30px 28px' }}>
          <p className="muted" style={{ margin: 0, fontWeight: 700 }}>ShareSplit</p>
          <h1 className="h1" style={{ marginTop: 10 }}>
            Divide gastos con justicia por consumo real.
          </h1>
          <p className="muted" style={{ maxWidth: 720, fontSize: '1.05rem', lineHeight: 1.5 }}>
            Crea grupos, registra tickets por ítem, deja que cada persona reclame lo que consumió y obtén balances claros de quién le debe a quién.
          </p>

          <div className="row-wrap" style={{ marginTop: 12 }}>
            {token ? (
              <Link className="btn btn-primary" href="/dashboard">
                Ir a mi dashboard
              </Link>
            ) : (
              <>
                <Link className="btn btn-primary" href="/register">
                  Crear cuenta
                </Link>
                <Link className="btn btn-secondary" href="/login">
                  Iniciar sesión
                </Link>
              </>
            )}
          </div>

          {user && (
            <p className="muted" style={{ marginTop: 12, fontSize: '.95rem' }}>
              Sesión activa como <b>{user.name}</b>.
            </p>
          )}
        </article>

        <section className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))' }}>
          <article className="kpi">
            <p className="muted" style={{ margin: 0, fontWeight: 700 }}>Registro granular</p>
            <p style={{ margin: 0 }}>Cada gasto se captura línea por línea, no solo con un total global.</p>
          </article>
          <article className="kpi">
            <p className="muted" style={{ margin: 0, fontWeight: 700 }}>Claims por usuario</p>
            <p style={{ margin: 0 }}>Cada miembro marca solo lo que consumió; si comparten, se divide automáticamente.</p>
          </article>
          <article className="kpi">
            <p className="muted" style={{ margin: 0, fontWeight: 700 }}>Liquidación transparente</p>
            <p style={{ margin: 0 }}>Visualiza deudas simplificadas y registra pagos para cerrar cuentas.</p>
          </article>
        </section>
      </section>
    </main>
  );
}
