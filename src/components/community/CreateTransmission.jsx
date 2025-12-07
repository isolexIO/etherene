import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Sparkles, AlertCircle, Loader2 } from 'lucide-react';
import { useWeb3 } from '../../Layout';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export default function CreateTransmission() {
  const { account } = useWeb3();
  const [content, setContent] = useState('');
  const [type, setType] = useState('insight');
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: async (newTransmission) => {
      return await base44.entities.Transmission.create(newTransmission);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transmissions'] });
      setContent('');
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!content.trim() || !account) return;

    createMutation.mutate({
      content,
      author_address: account,
      type,
      amplified_by: []
    });
  };

  if (!account) {
    return (
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-center">
        <p className="text-slate-500 text-sm">Connect your wallet to transmit signals to the network.</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm mb-8">
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <div className="flex gap-2 mb-3">
            {['insight', 'question', 'proposal'].map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={`px-3 py-1 rounded-full text-xs font-medium capitalize transition-colors ${
                  type === t 
                    ? 'bg-indigo-100 text-indigo-700' 
                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Broadcast your signal..."
            className="w-full min-h-[100px] p-4 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-indigo-100 resize-none placeholder:text-slate-400 text-slate-700"
          />
        </div>
        
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Sparkles className="w-3 h-3" />
            <span>Immutable Signal</span>
          </div>
          
          <button
            type="submit"
            disabled={!content.trim() || createMutation.isPending}
            className="px-6 py-2 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
          >
            {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Transmit
          </button>
        </div>
      </form>
    </div>
  );
}