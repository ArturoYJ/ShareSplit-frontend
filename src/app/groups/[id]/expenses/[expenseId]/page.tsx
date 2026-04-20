"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { expensesApi, claimsApi } from "@/lib/api";
import Link from "next/link";

export default function ExpenseDetailPage() {
  const { id, expenseId } = useParams();
  const { token, user, authLoading }: any = useAuth();
  const router = useRouter();

  const [expense, setExpense] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [myClaims, setMyClaims] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [claimingId, setClaimingId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !token) {
      router.push("/login");
    } else if (token) {
      fetchData();
    }
  }, [authLoading, token, expenseId]);

  const fetchData = async () => {
    try {
      const [expenseData, claimsData] = await Promise.all([
        expensesApi.get(id as string, expenseId as string, token!),
        claimsApi.getMyClaims(id as string, expenseId as string, token!),
      ]);
      setExpense(expenseData.expense);
      setItems(expenseData.items);
      setMyClaims(claimsData.claims.map((c: any) => c.item_id));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleClaim = async (itemId: string) => {
    if (claimingId) return;
    setClaimingId(itemId);
    try {
      await claimsApi.toggle(id as string, expenseId as string, itemId, token!);
      // Optimistic update or refetch
      if (myClaims.includes(itemId)) {
        setMyClaims(myClaims.filter(id => id !== itemId));
      } else {
        setMyClaims([...myClaims, itemId]);
      }
      // Re-fetch to get updated claim counts from other people
      const expenseData = await expensesApi.get(id as string, expenseId as string, token!);
      setItems(expenseData.items);
    } catch (err) {
      console.error(err);
    } finally {
      setClaimingId(null);
    }
  };

  const handleOpenExpense = async () => {
    try {
      await expensesApi.updateStatus(id as string, expenseId as string, 'open', token!);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  const isOwner = user?.id === expense?.paid_by;

  return (
    <main className="min-h-screen bg-gradient-main px-6 py-12">
      <div className="mx-auto max-w-4xl">
        <Link href={`/groups/${id}`} className="text-slate-500 hover:text-white text-sm flex items-center gap-1 mb-8 animate-fade-in">
          ← Volver al grupo
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-12 animate-fade-in">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-4xl font-black">{expense?.title}</h1>
              <span className={`text-xs uppercase px-2 py-0.5 rounded-full font-black ${
                expense?.status === 'draft' ? 'bg-slate-700 text-slate-300' :
                expense?.status === 'open' ? 'bg-primary/20 text-primary' :
                'bg-green-500/20 text-green-400'
              }`}>
                {expense?.status === 'draft' ? 'Borrador' : 
                 expense?.status === 'open' ? 'En reclamo' : 'Liquidado'}
              </span>
            </div>
            <p className="text-slate-400">
              Pagado por <span className="text-white font-medium">{expense?.paid_by_name}</span> el {new Date(expense?.expense_date).toLocaleDateString()}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-slate-500">Monto Total</p>
            <p className="text-4xl font-black text-gradient">${parseFloat(expense?.total_amount).toFixed(2)}</p>
          </div>
        </div>

        {expense?.status === 'draft' && isOwner && (
          <div className="glass p-6 rounded-3xl mb-8 border-primary/30 flex items-center justify-between animate-fade-in">
            <p className="text-sm text-slate-300">
              Este gasto está en modo <b>Borrador</b>. Los demás no pueden verlo hasta que lo publiques.
            </p>
            <button onClick={handleOpenExpense} className="btn-primary py-2 px-6">Publicar ahora</button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Item List */}
          <div className="lg:col-span-2 space-y-4 animate-fade-in [animation-delay:100ms]">
            <h2 className="text-xl font-bold mb-4">¿Qué consumiste tú?</h2>
            {items.map((item) => {
              const isClaimedByMe = myClaims.includes(item.id);
              const othersClaimed = parseInt(item.claim_count) - (isClaimedByMe ? 1 : 0);
              
              return (
                <button
                  key={item.id}
                  disabled={expense?.status !== 'open' || claimingId === item.id}
                  onClick={() => handleToggleClaim(item.id)}
                  className={`w-full glass flex items-center justify-between p-6 rounded-2xl transition-all text-left ${
                    isClaimedByMe ? 'border-primary ring-1 ring-primary bg-primary/5' : 'hover:border-white/10'
                  } ${claimingId === item.id ? 'opacity-50' : ''}`}
                >
                  <div>
                    <h4 className="font-bold text-lg flex items-center gap-2">
                      {item.name}
                      {isClaimedByMe && (
                        <span className="bg-primary text-[10px] text-white px-2 py-0.5 rounded-full uppercase font-black">Tu consumo</span>
                      )}
                    </h4>
                    <p className="text-sm text-slate-500">
                      ${parseFloat(item.price).toFixed(2)} x {item.quantity} un.
                    </p>
                  </div>
                  <div className="text-right flex items-center gap-6">
                    {othersClaimed > 0 && (
                      <div className="text-right">
                        <p className="text-[10px] text-slate-500 uppercase font-bold">Otros reclamos</p>
                        <p className="text-sm font-medium text-secondary">+{othersClaimed} personas</p>
                      </div>
                    )}
                    <div className={`h-6 w-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                      isClaimedByMe ? 'bg-primary border-primary' : 'border-slate-700'
                    }`}>
                      {isClaimedByMe && (
                        <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Sidebar: Summary */}
          <div className="space-y-6 animate-fade-in [animation-delay:200ms]">
            <section className="glass p-6 rounded-3xl sticky top-8">
              <h3 className="text-xl font-bold mb-6">Tu resumen</h3>
              <div className="space-y-4 mb-8">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Ítems reclamados</span>
                  <span className="font-bold">{myClaims.length}</span>
                </div>
                <div className="flex justify-between items-end">
                  <span className="text-slate-500 text-sm">Total a pagar</span>
                  <span className="text-2xl font-black text-primary">
                    ${items.filter(i => myClaims.includes(i.id)).reduce((acc, i) => acc + (parseFloat(i.price) * i.quantity / parseInt(i.claim_count || "1")), 0).toFixed(2)}
                  </span>
                </div>
              </div>
              <p className="text-[10px] text-slate-500 italic leading-relaxed">
                * El monto se calcula dividiendo el precio del ítem entre todas las personas que lo reclamaron.
              </p>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
