"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { balancesApi, groupsApi } from "@/lib/api";
import Link from "next/link";

export default function BalancesPage() {
  const { id } = useParams();
  const { token, authLoading }: any = useAuth();
  const [balances, setBalances] = useState<any[]>([]);
  const [debts, setDebts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [payingDebt, setPayingDebt] = useState<any>(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !token) {
      router.push("/login");
    } else if (token) {
      fetchData();
    }
  }, [authLoading, token, id]);

  const fetchData = async () => {
    try {
      const data = await balancesApi.get(id as string, token!);
      setBalances(data.balances);
      setDebts(data.debts);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRecordPayment = async () => {
    setPaymentLoading(true);
    try {
      await balancesApi.pay(id as string, {
        receiver_id: payingDebt.to,
        amount: parseFloat(payingDebt.amount),
        notes: `Liquidación de deuda via ShareSplit`
      }, token!);
      setPayingDebt(null);
      fetchData();
    } catch (err) {
      console.error(err);
    } finally {
      setPaymentLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-main px-6 py-12">
      <div className="mx-auto max-w-5xl">
        <Link href={`/groups/${id}`} className="text-slate-500 hover:text-white text-sm flex items-center gap-1 mb-8 animate-fade-in">
          ← Volver al grupo
        </Link>

        <h1 className="text-4xl font-black mb-4 animate-fade-in">Balances y Deudas</h1>
        <p className="text-slate-400 mb-12 animate-fade-in">Algoritmo de simplificación activado para minimizar transferencias.</p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Net Balances */}
          <section className="animate-fade-in [animation-delay:100ms]">
            <h2 className="text-2xl font-bold mb-6">Resumen por persona</h2>
            <div className="space-y-3">
              {balances.map((balance, i) => (
                <div key={i} className="glass p-5 rounded-2xl flex items-center justify-between">
                  <div>
                    <p className="font-bold">{balance.name}</p>
                    <div className="flex gap-4 text-[10px] uppercase tracking-wider text-slate-500 font-bold mt-1">
                      <span>Pagó: ${parseFloat(balance.total_paid).toFixed(2)}</span>
                      <span>Consumió: ${parseFloat(balance.total_consumed).toFixed(2)}</span>
                    </div>
                  </div>
                  <div className={`text-xl font-black ${
                    parseFloat(balance.net_balance) >= 0 ? 'text-green-400' : 'text-accent'
                  }`}>
                    {parseFloat(balance.net_balance) >= 0 ? '+' : ''}
                    ${parseFloat(balance.net_balance).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Debt Simplification */}
          <section className="animate-fade-in [animation-delay:200ms]">
            <h2 className="text-2xl font-bold mb-6">Quién debe a quién</h2>
            {debts.length === 0 ? (
              <div className="glass p-12 rounded-3xl text-center">
                <p className="text-slate-400">No hay deudas pendientes. ✨</p>
              </div>
            ) : (
              <div className="space-y-4">
                {debts.map((debt, i) => (
                  <div key={i} className="glass p-6 rounded-3xl border-l-4 border-l-accent flex items-center justify-between">
                    <div>
                      <p className="text-slate-300 font-medium">
                        <span className="text-white font-bold">{debt.from_name}</span> le debe a
                      </p>
                      <p className="text-xl font-black text-white">{debt.to_name}</p>
                    </div>
                    <div className="text-right flex items-center gap-6">
                      <div className="text-3xl font-black text-accent">${debt.amount}</div>
                      <button 
                        onClick={() => setPayingDebt(debt)}
                        className="btn-secondary py-2 px-4 text-xs"
                      >
                        Liquidar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>

      {/* Payment Confirmation Modal */}
      {payingDebt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-md">
          <div className="glass w-full max-w-sm p-8 rounded-3xl animate-fade-in">
            <h3 className="text-2xl font-bold mb-4">Confirmar pago</h3>
            <p className="text-slate-400 mb-8 text-sm">
              ¿Confirmas que <span className="text-white font-bold">{payingDebt.from_name}</span> ya le transfirió 
              <span className="text-primary font-bold"> ${payingDebt.amount}</span> a 
              <span className="text-white font-bold"> {payingDebt.to_name}</span>?
            </p>
            
            <div className="flex gap-2">
              <button 
                disabled={paymentLoading}
                onClick={() => setPayingDebt(null)}
                className="btn-secondary flex-1"
              >
                No, cancelar
              </button>
              <button 
                disabled={paymentLoading}
                onClick={handleRecordPayment} 
                className="btn-primary flex-1"
              >
                {paymentLoading ? "Guardando..." : "Sí, confirmar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
