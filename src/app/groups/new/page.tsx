"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { groupsApi } from "@/lib/api";
import Link from "next/link";

export default function NewGroupPage() {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { token } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const data = await groupsApi.create(name, token!);
      router.push(`/groups/${data.group.id}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-main p-6">
      <div className="glass w-full max-w-md p-8 rounded-3xl animate-fade-in">
        <div className="mb-8">
          <Link href="/dashboard" className="text-slate-500 hover:text-white text-sm flex items-center gap-1 mb-4">
            ← Volver al dashboard
          </Link>
          <h1 className="text-3xl font-bold">Crear nuevo grupo</h1>
          <p className="text-slate-400">Dale un nombre a tu grupo de gastos.</p>
        </div>

        {error && (
          <div className="bg-accent/10 border border-accent/20 text-accent p-4 rounded-xl mb-6 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-300">Nombre del grupo</label>
            <input 
              type="text" 
              placeholder="Ej: Viaje a la Playa 🏖️, Roomies 🏠"
              required
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <button 
            type="submit" 
            disabled={loading || !name}
            className="btn-primary disabled:opacity-50"
          >
            {loading ? "Creando..." : "Crear grupo"}
          </button>
        </form>
      </div>
    </main>
  );
}
