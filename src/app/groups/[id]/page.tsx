'use client';

import { useEffect, useState, use } from 'react';
import { useAuthStore } from '@/lib/store';
import { ChevronLeft, Plus, Receipt, Copy, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function GroupDetail({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params);
  const groupId = unwrappedParams.id;
  const [group, setGroup] = useState<any>(null);
  const [balances, setBalances] = useState<any[]>([]);
  const [copied, setCopied] = useState(false);
  const { user } = useAuthStore();

  useEffect(() => {
    // Mock group data
    setGroup({
      id: groupId,
      name: groupId === '1' ? 'Weekend Trip' : 'Group ' + groupId,
      code: 'A1B2C3',
      expenses: [
        { id: '1', description: 'Dinner', payer: { name: 'Alice' }, totalAmount: 45.50 },
        { id: '2', description: 'Gas', payer: { name: 'Bob' }, totalAmount: 30.00 }
      ]
    });

    // Mock balances
    setBalances([
      { user: { id: 'u1', name: 'Alice' }, balance: 15.50 },
      { user: { id: 'u2', name: 'Bob' }, balance: -5.00 },
      { user: { id: 'u3', name: 'Charlie' }, balance: -10.50 }
    ]);
  }, [groupId]);

  const copyCode = () => {
    if (group?.code) {
      navigator.clipboard.writeText(group.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!group) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col pt-4 pb-24">
      <header className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href="/">
            <button className="p-2 glass-button rounded-full">
              <ChevronLeft size={24} />
            </button>
          </Link>
          <h1 className="text-2xl font-bold truncate max-w-[200px]">{group.name}</h1>
        </div>
        <button 
          onClick={copyCode}
          className="flex items-center gap-2 px-3 py-1.5 glass-button rounded-full text-sm font-medium"
        >
          {copied ? <CheckCircle2 size={16} className="text-green-400" /> : <Copy size={16} />}
          <span className="font-mono tracking-wider">{group.code}</span>
        </button>
      </header>

      {/* Financial Summary */}
      <section className="mb-8">
        <h3 className="text-lg font-bold mb-3">Balances</h3>
        <div className="glass-panel p-4 flex gap-4 overflow-x-auto snap-x hide-scrollbar">
          {balances.map(b => {
            const isOwed = b.balance > 0;
            const owes = b.balance < 0;
            const settled = b.balance === 0;

            return (
              <div key={b.user.id} className="min-w-[140px] snap-center bg-white/5 rounded-xl p-4 border border-white/10 shrink-0">
                <p className="font-semibold text-sm truncate">{b.user.name}</p>
                <div className="mt-2">
                  {settled && <span className="text-text-muted text-sm">Settled up</span>}
                  {isOwed && <span className="text-green-400 font-bold">Gets +${b.balance.toFixed(2)}</span>}
                  {owes && <span className="text-red-400 font-bold">Owes -${Math.abs(b.balance).toFixed(2)}</span>}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Expenses List */}
      <section className="flex-1">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold">Expenses</h3>
        </div>

        {group.expenses?.length === 0 ? (
          <div className="glass-panel p-8 text-center mt-4">
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
              <Receipt size={32} className="text-text-muted" />
            </div>
            <p className="text-text-muted">No expenses yet. Add one to get started!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {group.expenses?.map((exp: any) => (
              <Link href={`/groups/${groupId}/expenses/${exp.id}`} key={exp.id}>
                <motion.div 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="glass-panel p-4 flex items-center justify-between cursor-pointer"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
                      <Receipt size={20} className="text-primary" />
                    </div>
                    <div>
                      <h4 className="font-bold">{exp.description}</h4>
                      <p className="text-sm text-text-muted">Paid by {exp.payer?.name}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg">${exp.totalAmount.toFixed(2)}</p>
                  </div>
                </motion.div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <div className="fixed bottom-8 left-0 right-0 px-4 max-w-md mx-auto">
        <Link href={`/groups/${groupId}/expenses/create`}>
          <button className="w-full py-4 primary-gradient text-white shadow-lg shadow-violet-500/30 rounded-xl font-bold text-lg flex items-center justify-center gap-2">
            <Plus size={24} />
            Add Expense
          </button>
        </Link>
      </div>
      
      {/* Styles for hiding scrollbar in this specific element, standard cross-browser */}
      <style dangerouslySetInnerHTML={{__html: `
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </div>
  );
}
