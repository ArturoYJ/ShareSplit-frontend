'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { ChevronLeft, Loader2, KeyRound } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function JoinGroup() {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const { user } = useAuthStore();

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !user) return;

    setLoading(true);
    setError('');
    try {
      // Mocking the join response instead of fetching from backend
      setTimeout(() => {
        if (code === 'A1B2C3') {
          router.push(`/groups/1`); // Mock redirect
        } else {
          setError('Group not found or invalid code.');
        }
        setLoading(false);
      }, 500);
    } catch (err) {
      setError('Something went wrong. Try again.');
      setLoading(false);
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
        <h1 className="text-2xl font-bold">Join Group</h1>
      </header>

      <motion.form 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={handleJoin} 
        className="space-y-6 flex-1 flex flex-col"
      >
        <div className="glass-panel p-6 flex flex-col items-center justify-center text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
            <KeyRound size={32} className="text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Have an invite code?</h2>
            <p className="text-text-muted text-sm mt-1">Ask the group creator for the 6-character code.</p>
          </div>
        </div>

        <div className="space-y-2">
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="e.g. A1B2C3"
            maxLength={6}
            className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-center text-2xl font-mono tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all uppercase"
            autoFocus
          />
          {error && <p className="text-red-400 text-sm text-center font-medium">{error}</p>}
        </div>

        <div className="flex-1" />

        <button
          type="submit"
          disabled={code.length < 3 || loading}
          className="w-full py-4 primary-gradient text-white rounded-xl font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-violet-500/20"
        >
          {loading ? <Loader2 className="animate-spin" /> : 'Join Group'}
        </button>
      </motion.form>
    </div>
  );
}
