'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';

export default function Navbar() {
  const { user, token, logout } = useAuth();

  return (
    <nav className="topnav" aria-label="Navegación principal">
      <div className="topnav-inner">
        {/* Brand */}
        <Link href={token ? '/dashboard' : '/'} className="topnav-brand">
          <span className="topnav-brand-mark" aria-hidden="true" />
          ShareSplit
        </Link>

        {/* Actions */}
        <div className="topnav-actions">
          {user ? (
            <>
              <Link href="/dashboard" className="btn btn-ghost" style={{ padding: '6px 10px' }}>
                Grupos
              </Link>
              <div className="avatar" aria-hidden="true">
                {user.name.charAt(0)}
              </div>
              <span
                className="topnav-user-name muted"
                style={{ fontSize: '0.8125rem', fontWeight: 500 }}
              >
                {user.name.split(' ')[0]}
              </span>
              <button
                className="btn btn-ghost"
                style={{ padding: '6px 10px', color: 'var(--text-2)' }}
                onClick={() => void logout()}
              >
                Salir
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="btn btn-ghost" style={{ padding: '6px 12px' }}>
                Iniciar sesión
              </Link>
              <Link href="/register" className="btn btn-primary" style={{ padding: '6px 14px' }}>
                Registrarse
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
