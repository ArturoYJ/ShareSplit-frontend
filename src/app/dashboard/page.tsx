"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { groupsApi } from "@/lib/api";
import Link from "next/link";

export default function Dashboard() {
  const { user, token, loading: authLoading, logout } = useAuth();
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteCode, setInviteCode] = useState("");
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [joinError, setJoinError] = useState("");
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !token) {
      router.push("/login");
    } else if (token) {
      fetchGroups();
    }
  }, [authLoading, token]);

  const fetchGroups = async () => {
    try {
      const data = await groupsApi.list(token!);
      setGroups(data.groups);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    setJoinError("");
    try {
      await groupsApi.join(inviteCode, token!);
      setInviteCode("");
      setShowJoinModal(false);
      fetchGroups();
    } catch (err: any) {
      setJoinError(err.message);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-main px-6 py-12">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <header className="flex items-center justify-between mb-12 animate-fade-in">
          <div>
            <h1 className="text-3xl font-bold">Hola, <span className="text-primary">{user?.name}</span></h1>
            <p className="text-slate-400">Gestiona tus grupos y gastos compartidos.</p>
          </div>
          <button onClick={logout} className="text-slate-400 hover:text-accent text-sm font-medium transition-colors">
            Cerrar sesión
          </button>
        </header>

        {/* Action Cards */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 mb-12 animate-fade-in [animation-delay:100ms]">
          <Link href="/groups/new" className="glass p-8 rounded-3xl group hover:border-primary/50 transition-all">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/20 text-primary group-hover:bg-primary group-hover:text-white transition-all">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <h3 className="text-xl font-bold mb-2">Crear nuevo grupo</h3>
            <p className="text-slate-400 text-sm">Empieza un nuevo viaje o evento y agrega a tus amigos.</p>
          </Link>

          <button 
            onClick={() => setShowJoinModal(true)}
            className="glass p-8 rounded-3xl text-left group hover:border-secondary/50 transition-all"
          >
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary/20 text-secondary group-hover:bg-secondary group-hover:text-white transition-all">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold mb-2">Unirse con código</h3>
            <p className="text-slate-400 text-sm">Ingresa el código que te compartieron tus amigos.</p>
          </button>
        </div>

        {/* Groups List */}
        <div className="animate-fade-in [animation-delay:200ms]">
          <h2 className="text-2xl font-bold mb-6">Mis Grupos</h2>
          
          {groups.length === 0 ? (
            <div className="glass p-12 rounded-3xl text-center">
              <p className="text-slate-400 mb-6">Aún no eres miembro de ningún grupo.</p>
              <Link href="/groups/new" className="btn-primary">
                Crear mi primer grupo
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {groups.map((group) => (
                <Link 
                  key={group.id} 
                  href={`/groups/${group.id}`}
                  className="glass p-6 rounded-2xl hover:bg-white/5 transition-colors border-l-4 border-l-primary"
                >
                  <h4 className="font-bold text-lg mb-1">{group.name}</h4>
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>{group.member_count} miembros</span>
                    <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full uppercase tracking-wider font-bold">
                      {group.invite_code}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Join Modal */}
      {showJoinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
          <div className="glass w-full max-w-sm p-8 rounded-3xl animate-fade-in">
            <h3 className="text-2xl font-bold mb-4">Unirse a un grupo</h3>
            <form onSubmit={handleJoinGroup} className="flex flex-col gap-4">
              <input 
                type="text" 
                placeholder="Código (ej: A1B2C3D4)"
                maxLength={8}
                autoFocus
                className="text-center text-xl uppercase tracking-widest font-mono"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                required
              />
              {joinError && <p className="text-accent text-xs">{joinError}</p>}
              <div className="flex gap-2">
                <button 
                  type="button" 
                  onClick={() => setShowJoinModal(false)}
                  className="btn-secondary flex-1"
                >
                  Cancelar
                </button>
                <button type="submit" className="btn-primary flex-1">
                  Unirse
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
