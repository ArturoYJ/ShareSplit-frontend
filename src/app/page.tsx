'use client';

import { useAuthStore } from '@/lib/store';
import { motion } from 'framer-motion';
import { Receipt, Users, Plus, LogOut } from 'lucide-react';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function Home() {
  const { user, setUser, isLoading } = useAuthStore();
  const [groups, setGroups] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      // Mock groups since backend is removed
      setGroups([
        { id: '1', name: 'Weekend Trip', _count: { members: 4 } },
        { id: '2', name: 'Apartment Expenses', _count: { members: 3 } }
      ]);
    }
  }, [user]);


  const handleLogout = () => {
    setUser(null);
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center space-y-8">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="w-24 h-24 rounded-3xl primary-gradient flex items-center justify-center shadow-lg shadow-violet-500/30"
        >
          <Receipt size={48} className="text-white" />
        </motion.div>
        
        <div className="space-y-4">
          <h1 className="text-4xl font-extrabold tracking-tight">
            Share<span className="text-gradient">Split</span>
          </h1>
          <p className="text-text-muted text-lg max-w-[280px] mx-auto">
            Fair expense sharing for friends. Pay only for what you consume.
          </p>
        </div>

        <div className="mt-8 flex flex-col w-full max-w-[280px] gap-4">
          <Link href="/register">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-full py-4 primary-gradient text-white rounded-xl font-bold text-lg shadow-lg shadow-violet-500/30"
            >
              Get Started
            </motion.button>
          </Link>
          <Link href="/login">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-full py-4 glass-button rounded-xl font-bold text-lg"
            >
              Log in
            </motion.button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col space-y-6">
      <header className="flex items-center justify-between mt-4">
        <div className="flex items-center gap-3">
          {user.avatarUrl ? (
            <Image src={user.avatarUrl} alt="Avatar" width={40} height={40} className="rounded-full border-2 border-white/20" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
              <Users size={20} />
            </div>
          )}
          <div>
            <h2 className="text-sm text-text-muted">Welcome back,</h2>
            <p className="font-semibold">{user.name}</p>
          </div>
        </div>
        <button onClick={handleLogout} className="p-2 glass-button rounded-full">
          <LogOut size={18} />
        </button>
      </header>

      <section className="flex-1 mt-8">
        <h3 className="text-xl font-bold mb-4">Your Groups</h3>
        
        {groups.length === 0 ? (
          <div className="glass-panel p-8 text-center mt-4">
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
              <Users size={32} className="text-text-muted" />
            </div>
            <p className="text-text-muted mb-6">You aren't in any groups yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {groups.map(group => (
              <Link href={`/groups/${group.id}`} key={group.id}>
                <motion.div 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="glass-panel p-5 flex items-center justify-between cursor-pointer group hover:border-primary/50 transition-colors"
                >
                  <div>
                    <h4 className="font-bold text-lg group-hover:text-primary transition-colors">{group.name}</h4>
                    <p className="text-sm text-text-muted">{group._count?.members || 1} members</p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
                    <Receipt size={18} className="text-white" />
                  </div>
                </motion.div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <div className="fixed bottom-8 left-0 right-0 px-4 max-w-md mx-auto">
        <div className="flex gap-4">
          <Link href="/groups/join" className="flex-1">
            <button className="w-full py-4 glass-button rounded-xl font-semibold flex items-center justify-center gap-2">
              Join Group
            </button>
          </Link>
          <Link href="/groups/create" className="flex-1">
            <button className="w-full py-4 primary-gradient text-white shadow-lg shadow-violet-500/30 rounded-xl font-semibold flex items-center justify-center gap-2">
              <Plus size={20} />
              Create
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}