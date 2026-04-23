'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { authApi, User } from './api';

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
  // Ya no leemos de localStorage. Llamamos a /auth/me con `credentials: 'include'`
  // para que la cookie httpOnly ss_token autentique la petición automáticamente.
  // El backend retorna { user, token } para que podamos restaurar el estado en memoria.
  useEffect(() => {
    let mounted = true;

    async function bootstrap() {
      try {
        const profile = await authApi.me(); // sin token → usa cookie
        if (!mounted) return;

        setUser(profile.user);
        if (profile.token) setToken(profile.token);
      } catch {
        // Cookie ausente, expirada o inválida → usuario no autenticado
        if (mounted) {
          setUser(null);
          setToken(null);
        }
      } finally {
        if (mounted) setLoading(false);
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
      const profile = await authApi.me(token ?? undefined);
      setUser(profile.user);
      if (profile.token) setToken(profile.token);
    } catch {
      // Ignorar errores silenciosos en refresh
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
