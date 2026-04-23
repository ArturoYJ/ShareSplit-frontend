'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { authApi, User, setUnauthorizedHandler } from './api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (token: string, user: User) => void;
  logout: () => Promise<void>;
  refreshMe: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // ── Restaurar sesión al montar ─────────────────────────────────────────────
  // Llama a /auth/me con credentials: 'include' para que la cookie httpOnly
  // ss_token autentique la petición automáticamente (sin localStorage).
  useEffect(() => {
    let mounted = true;

    async function bootstrap() {
      try {
        const profile = await authApi.me(); // no token arg — relies on cookie
        if (!mounted) return;
        setUser(profile.user);
        // Token lives only in memory; cookie handles re-auth on next mount
        setToken('cookie'); // non-null sentinel so route guards treat user as authenticated
      } catch {
        // Cookie absent, expired, or invalid → unauthenticated; this is expected
        // for any page load without an active session, NOT a mid-session expiry.
        if (mounted) {
          setUser(null);
          setToken(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
          // Register AFTER bootstrap so the expected 401 from /auth/me on an
          // unauthenticated page load never triggers a redirect loop.
          // From this point, any 401 means a session that was valid just expired.
          setUnauthorizedHandler(() => {
            setToken(null);
            setUser(null);
            if (typeof window !== 'undefined') {
              const publicPaths = ['/', '/login', '/register'];
              if (!publicPaths.includes(window.location.pathname)) {
                window.location.href = '/login';
              }
            }
          });
        }
      }
    }

    bootstrap();
    return () => { mounted = false; };
  }, []);

  // ── Login ──────────────────────────────────────────────────────────────────
  // El backend ya emitió la cookie httpOnly. Solo guardamos en memoria.
  const login = (newToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);
    // ❌ Sin localStorage: el token solo vive en memoria de React.
    //    La cookie httpOnly garantiza la restauración en el próximo montado.
  };

  // ── Logout ─────────────────────────────────────────────────────────────────
  const logout = async () => {
    try {
      await authApi.logout(); // limpia la cookie en el backend
    } catch {
      // Si falla la red, igual limpiamos el estado local
    } finally {
      setToken(null);
      setUser(null);
    }
  };

  // ── Refrescar perfil (ej: después de PATCH /auth/me) ──────────────────────
  const refreshMe = async () => {
    try {
      const profile = await authApi.me();
      setUser(profile.user);
    } catch {
      // Silent refresh failure — session restored on next mount via cookie
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, refreshMe }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return context;
}
