"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { expensesApi } from "@/lib/api";
import Link from "next/link";

export default function NewExpensePage() {
  const { id } = useParams();
  const { token, authLoading }: any = useAuth();
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [items, setItems] = useState([{ name: "", price: 0, quantity: 1 }]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!authLoading && !token) {
      router.push("/login");
    }
  }, [authLoading, token]);

  const addItem = () => {
    setItems([...items, { name: "", price: 0, quantity: 1 }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const updateItem = (index: number, field: string, value: any) => {
    const newItems: any = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };

  const calculateTotal = () => {
    return items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const expenseData = {
      title,
      expense_date: date,
      items: items.map(item => ({
        name: item.name,
        price: parseFloat(item.price.toString()),
        quantity: parseInt(item.quantity.toString())
      }))
    };

    try {
      await expensesApi.create(id as string, expenseData, token!);
      router.push(`/groups/${id}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-main px-6 py-12">
      <div className="mx-auto max-w-3xl">
        <Link href={`/groups/${id}`} className="text-slate-500 hover:text-white text-sm flex items-center gap-1 mb-8 animate-fade-in">
          ← Cancelar y volver
        </Link>

        <div className="glass p-8 rounded-3xl animate-fade-in">
          <h1 className="text-3xl font-bold mb-2">Nuevo Gasto</h1>
          <p className="text-slate-400 mb-8">Registra el ticket para que todos puedan reclamar sus productos.</p>

          {error && (
            <div className="bg-accent/10 border border-accent/20 text-accent p-4 rounded-xl mb-6 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-slate-300">Título del ticket</label>
                <input 
                  type="text" 
                  placeholder="Ej: Cena Sushi, Supermercado"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-slate-300">Fecha</label>
                <input 
                  type="date" 
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold">Productos / Ítems</h3>
                <button 
                  type="button" 
                  onClick={addItem}
                  className="text-primary text-sm font-bold hover:underline"
                >
                  + Agregar producto
                </button>
              </div>

              <div className="space-y-3">
                {items.map((item, index) => (
                  <div key={index} className="flex gap-3 items-end">
                    <div className="flex-[3] flex flex-col gap-1.5">
                      {index === 0 && <label className="text-xs text-slate-500">Nombre</label>}
                      <input 
                        type="text" 
                        placeholder="Coca-Cola, Pizza..."
                        required
                        value={item.name}
                        onChange={(e) => updateItem(index, "name", e.target.value)}
                      />
                    </div>
                    <div className="flex-1 flex flex-col gap-1.5">
                      {index === 0 && <label className="text-xs text-slate-500">Precio unit.</label>}
                      <input 
                        type="number" 
                        step="0.01"
                        placeholder="0.00"
                        required
                        value={item.price}
                        onChange={(e) => updateItem(index, "price", e.target.value)}
                      />
                    </div>
                    <div className="w-20 flex flex-col gap-1.5">
                      {index === 0 && <label className="text-xs text-slate-500">Cant.</label>}
                      <input 
                        type="number" 
                        required
                        value={item.quantity}
                        onChange={(e) => updateItem(index, "quantity", e.target.value)}
                      />
                    </div>
                    <button 
                      type="button" 
                      onClick={() => removeItem(index)}
                      className="p-3 text-slate-500 hover:text-accent transition-colors"
                    >
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-8 border-t border-white/5 flex items-center justify-between">
              <div>
                <p className="text-slate-500 text-sm">Total calculado</p>
                <p className="text-3xl font-black text-gradient">${calculateTotal().toFixed(2)}</p>
              </div>
              <button 
                type="submit" 
                disabled={loading || items.some(i => !i.name || i.price <= 0)}
                className="btn-primary px-12"
              >
                {loading ? "Registrando..." : "Guardar Gasto"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
