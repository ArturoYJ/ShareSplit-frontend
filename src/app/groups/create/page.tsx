'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { ChevronLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function CreateGroup() {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { user } = useAuthStore();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !user) return;

    setLoading(true);
    try {
      // Mocking the group creation instead of fetching from backend
      setTimeout(() => {
        const mockGroup = { id: Math.random().toString(36).substring(7), name };
        router.push(`/groups/${mockGroup.id}`);
      }, 500);
    } catch (error) {
      console.error(error);
    } finally {
      // Wait a bit to simulate loading
      setTimeout(() => setLoading(false), 500);
    }
  };

  return (
    <div className="flex-1 flex flex-col pt-4">
      <header className="flex items-center gap-4 mb-8">
        <Link href="/">
          <button className="p-2 glass-button rounded-full">
            <ChevronLeft size={24} />
          </button>
        </Link>
        <h1 className="text-2xl font-bold">Create Group</h1>
      </header>

      <motion.form 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={handleCreate} 
        className="space-y-6 flex-1 flex flex-col"
      >
        <div className="space-y-2">
          <label className="text-sm font-medium text-text-muted">Group Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Weekend Trip to Vegas"
            className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-lg focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            autoFocus
          />
        </div>

        <div className="flex-1" />

        <button
          type="submit"
          disabled={!name.trim() || loading}
          className="w-full py-4 primary-gradient text-white rounded-xl font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-violet-500/20"
        >
          {loading ? <Loader2 className="animate-spin" /> : 'Create Group'}
        </button>
      </motion.form>
    </div>
  );
}
