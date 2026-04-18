'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/lib/store';

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser, setIsLoading } = useAuthStore();

  useEffect(() => {
    // Mock check for existing session
    setTimeout(() => {
      setIsLoading(false);
    }, 500);
  }, [setIsLoading]);

  return <>{children}</>;
}
