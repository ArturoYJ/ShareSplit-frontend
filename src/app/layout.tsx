import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/lib/auth-context';
import { ToastProvider } from '@/lib/toast-context';
import Navbar from '@/components/Navbar';

export const metadata: Metadata = {
  title: 'ShareSplit — Divide gastos por consumo real',
  description: 'La forma más justa de dividir cuentas en grupo. Cada persona paga exactamente lo que consumió.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>
        <ToastProvider>
          <AuthProvider>
            <Navbar />
            {children}
          </AuthProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
