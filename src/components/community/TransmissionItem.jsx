import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, Heart, Share2, MoreHorizontal, User } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import IdentityAvatar from '../profile/IdentityAvatar';
import { useWeb3 } from '../../Layout';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';

export default function TransmissionItem({ transmission }) {
  const { account } = useWeb3();
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const queryClient = useQueryClient();

  // Amplification (Like) Logic
  const isAmplified = account && transmission.amplified_by?.includes(account);
  
  const amplifyMutation = useMutation({
    mutationFn: async () => {
      const newAmplifiedBy = isAmplified
        ? (transmission.amplified_by || []).filter(a => a !== account)
        : [...(transmission.amplified_by || []), account];
      return await base44.entities.Transmission.update(transmission.id, { amplified_by: newAmplifiedBy });
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['transmissions'] });
      const previousData = queryClient.getQueriesData({ queryKey: ['transmissions'] });

      const updater = (old) => {
        if (!Array.isArray(old)) return old;
        return old.map(t => {
          if (t.id !== transmission.id) return t;
          const newAmplifiedBy = isAmplified
            ? (t.amplified_by || []).filter(a => a !== account)
            : [...(t.amplified_by || []), account];
          return { ...t, amplified_by: newAmplifiedBy };
        });
      };
      queryClient.setQueriesData({ queryKey: ['transmissions'] }, updater);
      return { previousData };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousData) {
        context.previousData.forEach(([key, value]) => queryClient.setQueryData(key, value));
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['transmissions'] });
    }
  });

  // Comments Logic
  const { data: resonances, isLoading: loadingResonances } = useQuery({
    queryKey: ['resonances', transmission.id],
    queryFn: () => base44.entities.Resonance.filter({ transmission_id: transmission.id }),
    enabled: showComments,
    refetchInterval: 5000
  });

  const commentMutation = useMutation({
    mutationFn: async (newComment) => {
      return await base44.entities.Resonance.create(newComment);
    },
    onMutate: async (newComment) => {
      await queryClient.cancelQueries({ queryKey: ['resonances', transmission.id] });
      const previous = queryClient.getQueryData(['resonances', transmission.id]);
      const optimistic = {
        id: `optimistic-${Date.now()}`,
        created_date: new Date().toISOString(),
        ...newComment,
      };
      queryClient.setQueryData(['resonances', transmission.id], (old) =>
        Array.isArray(old) ? [...old, optimistic] : [optimistic]
      );
      setCommentText('');
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous !== undefined) {
        queryClient.setQueryData(['resonances', transmission.id], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['resonances', transmission.id] });
    }
  });

  const handleAmplify = () => {
    if (!account) return;
    amplifyMutation.mutate();
  };

  const handleComment = (e) => {
    e.preventDefault();
    if (!commentText.trim() || !account) return;
    commentMutation.mutate();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-100">
             {/* Using IdentityAvatar for visual consistency, seeding with address */}
             <div className="scale-50 origin-top-left w-[200%] h-[200%]">
                 <IdentityAvatar address={transmission.author_address} size={80} chainId={1} />
             </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-slate-900 text-sm">
                {transmission.author_address.slice(0, 6)}...{transmission.author_address.slice(-4)}
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wider ${
                transmission.type === 'insight' ? 'bg-indigo-50 text-indigo-600' :
                transmission.type === 'question' ? 'bg-amber-50 text-amber-600' :
                'bg-emerald-50 text-emerald-600'
              }`}>
                {transmission.type}
              </span>
            </div>
            <span className="text-xs text-slate-400">
              {formatDistanceToNow(new Date(transmission.created_date), { addSuffix: true })}
            </span>
          </div>
        </div>
        <button className="text-slate-400 hover:text-slate-600">
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </div>

      {/* Content */}
      <div className="mb-6">
        <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">{transmission.content}</p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-6 border-t border-slate-50 pt-4">
        <button 
          onClick={handleAmplify}
          className={`flex items-center gap-2 text-sm transition-colors ${isAmplified ? 'text-pink-500' : 'text-slate-500 hover:text-pink-500'}`}
        >
          <Heart className={`w-4 h-4 ${isAmplified ? 'fill-current' : ''}`} />
          <span>{transmission.amplified_by?.length || 0}</span>
        </button>
        
        <button 
          onClick={() => setShowComments(!showComments)}
          className="flex items-center gap-2 text-sm text-slate-500 hover:text-indigo-600 transition-colors"
        >
          <MessageCircle className="w-4 h-4" />
          <span>Replies</span>
        </button>

        <button className="flex items-center gap-2 text-sm text-slate-500 hover:text-indigo-600 transition-colors ml-auto">
          <Share2 className="w-4 h-4" />
        </button>
      </div>

      {/* Comments Section */}
      <AnimatePresence>
        {showComments && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 pt-4 border-t border-slate-50 overflow-hidden"
          >
            {/* Input */}
            {account && (
              <form onSubmit={handleComment} className="flex gap-3 mb-6">
                <input
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Resonate with this frequency..."
                  className="flex-1 bg-slate-50 border-none rounded-xl px-4 py-2 text-sm focus:ring-1 focus:ring-indigo-200"
                />
                <button 
                  type="submit"
                  disabled={!commentText.trim() || commentMutation.isPending}
                  className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-sm font-medium hover:bg-indigo-100 transition-colors"
                >
                  Send
                </button>
              </form>
            )}

            {/* List */}
            <div className="space-y-4">
                {loadingResonances ? (
                    <div className="text-center py-4 text-slate-400 text-xs">Loading resonances...</div>
                ) : resonances?.length > 0 ? (
                    resonances.map((resonance) => (
                        <div key={resonance.id} className="flex gap-3">
                            <div className="w-6 h-6 rounded-full bg-slate-100 flex-shrink-0 overflow-hidden">
                                <IdentityAvatar address={resonance.author_address} size={24} chainId={1} />
                            </div>
                            <div className="flex-1 bg-slate-50 rounded-r-xl rounded-bl-xl p-3 text-sm">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="font-medium text-slate-700 text-xs">
                                        {resonance.author_address.slice(0, 6)}...
                                    </span>
                                    <span className="text-[10px] text-slate-400">
                                        {formatDistanceToNow(new Date(resonance.created_date))}
                                    </span>
                                </div>
                                <p className="text-slate-600">{resonance.content}</p>
                            </div>
                        </div>
                    ))
                ) : (
                    <p className="text-center text-slate-400 text-xs py-2">No resonances yet. Be the first.</p>
                )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}