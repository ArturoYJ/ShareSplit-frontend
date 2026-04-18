'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { ChevronLeft, Plus, Loader2, Trash2, Users } from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

export default function CreateExpense({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params);
  const groupId = unwrappedParams.id;
  
  const [description, setDescription] = useState('');
  const [items, setItems] = useState<{ id: number; name: string; price: string; consumers: string[] }[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { user } = useAuthStore();

  useEffect(() => {
    // Mock members
    setMembers([
      { id: 'u1', name: 'Alice' },
      { id: 'u2', name: 'Bob' },
      { id: 'u3', name: 'Charlie' }
    ]);
  }, [groupId]);

  const addItem = () => {
    setItems([...items, { id: Date.now(), name: '', price: '', consumers: [] }]);
  };

  const updateItem = (id: number, field: string, value: any) => {
    setItems(items.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const removeItem = (id: number) => {
    setItems(items.filter(item => item.id !== id));
  };

  const toggleConsumer = (itemId: number, userId: string) => {
    setItems(items.map(item => {
      if (item.id === itemId) {
        const consumers = item.consumers.includes(userId)
          ? item.consumers.filter(id => id !== userId)
          : [...item.consumers, userId];
        return { ...item, consumers };
      }
      return item;
    }));
  };

  const handleSave = async () => {
    if (!description || items.length === 0 || !user) return;
    
    // Validations
    const validItems = items.filter(i => i.name && i.price && !isNaN(Number(i.price)));
    if (validItems.length === 0) return;

    setLoading(true);
    try {
      // Mock saving expense
      setTimeout(() => {
        router.push(`/groups/${groupId}`);
      }, 500);
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  };

  const totalAmount = items.reduce((sum, item) => sum + (Number(item.price) || 0), 0);

  return (
    <div className="flex-1 flex flex-col pt-4 pb-24">
      <header className="flex items-center gap-4 mb-8">
        <Link href={`/groups/${groupId}`}>
          <button className="p-2 glass-button rounded-full">
            <ChevronLeft size={24} />
          </button>
        </Link>
        <h1 className="text-2xl font-bold">Add Expense</h1>
      </header>

      <div className="space-y-6">
        <div className="glass-panel p-5 space-y-4">
          <div>
            <label className="text-sm font-medium text-text-muted">Where/What is this for?</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Dinner at Mario's"
              className="w-full bg-white/5 border border-white/10 rounded-xl p-4 mt-2 text-lg focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            />
          </div>
        </div>

        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">Items</h2>
          <span className="text-text-muted font-medium">Total: <span className="text-white font-bold">${totalAmount.toFixed(2)}</span></span>
        </div>

        <div className="space-y-4">
          <AnimatePresence>
            {items.map((item, index) => (
              <motion.div 
                key={item.id}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="glass-panel p-4 space-y-4 relative"
              >
                <div className="flex gap-3">
                  <div className="flex-1">
                    <input
                      type="text"
                      value={item.name}
                      onChange={(e) => updateItem(item.id, 'name', e.target.value)}
                      placeholder="Item name (e.g. Beer)"
                      className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>
                  <div className="w-24 shrink-0">
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">$</span>
                      <input
                        type="number"
                        value={item.price}
                        onChange={(e) => updateItem(item.id, 'price', e.target.value)}
                        placeholder="0.00"
                        className="w-full bg-white/5 border border-white/10 rounded-lg p-3 pl-7 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                      />
                    </div>
                  </div>
                  <button onClick={() => removeItem(item.id)} className="p-3 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors">
                    <Trash2 size={18} />
                  </button>
                </div>

                {/* Consumers Selection */}
                <div>
                  <label className="text-xs font-medium text-text-muted mb-2 block flex items-center gap-1">
                    <Users size={12} /> Who consumed this?
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {members.map(member => {
                      const isSelected = item.consumers.includes(member.id);
                      return (
                        <button
                          key={member.id}
                          onClick={() => toggleConsumer(item.id, member.id)}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                            isSelected 
                              ? 'bg-primary text-white shadow-lg shadow-primary/30 border border-primary' 
                              : 'bg-white/5 text-text-muted border border-white/10 hover:bg-white/10'
                          }`}
                        >
                          {member.name.split(' ')[0]}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <button
          onClick={addItem}
          className="w-full py-4 glass-button border-dashed border-2 border-white/20 rounded-xl font-bold flex items-center justify-center gap-2 text-text-muted hover:text-white"
        >
          <Plus size={20} />
          Add Item
        </button>
      </div>

      <div className="fixed bottom-8 left-0 right-0 px-4 max-w-md mx-auto">
        <button
          onClick={handleSave}
          disabled={loading || items.length === 0 || !description}
          className="w-full py-4 primary-gradient text-white shadow-lg shadow-violet-500/30 rounded-xl font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 className="animate-spin" /> : 'Save Expense'}
        </button>
      </div>
    </div>
  );
}
