import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useWeb3 } from '../../Layout';
import TransmissionItem from './TransmissionItem';
import { Loader2, Radio, Users } from 'lucide-react';
import { motion } from 'framer-motion';

export default function TransmissionFeed({ feedType = 'global' }) {
  const { account } = useWeb3();

  const { data: transmissions, isLoading } = useQuery({
    queryKey: ['transmissions', feedType, account],
    queryFn: async () => {
        // 1. Fetch Transmissions (Limit to 50 for now for simple filtering)
        const allTransmissions = await base44.entities.Transmission.list('-created_date', 50);

        if (feedType === 'following' && account) {
            // 2. Fetch who I follow
            const follows = await base44.entities.Follow.filter({ follower_address: account });
            const followingAddresses = new Set(follows.map(f => f.following_address));
            
            // 3. Filter
            return allTransmissions.filter(t => followingAddresses.has(t.author_address));
        }

        return allTransmissions;
    },
    refetchInterval: 10000,
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin mb-4" />
        <p>Tuning into the network...</p>
      </div>
    );
  }

  if (!transmissions || transmissions.length === 0) {
    if (feedType === 'following') {
        return (
            <div className="text-center py-20 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-slate-900 font-medium mb-1">Network is quiet</h3>
              <p className="text-slate-500 text-sm max-w-xs mx-auto">
                {account 
                    ? "Users you follow haven't transmitted lately. Follow more nodes to expand your network." 
                    : "Connect your wallet to see activity from your network."}
              </p>
            </div>
        );
    }
    return (
      <div className="text-center py-20 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
        <Radio className="w-12 h-12 text-slate-300 mx-auto mb-4" />
        <h3 className="text-slate-900 font-medium mb-1">Silence on the frequency</h3>
        <p className="text-slate-500 text-sm">Be the first to transmit a signal.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {transmissions.map((transmission, index) => (
        <motion.div
            key={transmission.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
        >
            <TransmissionItem transmission={transmission} />
        </motion.div>
      ))}
    </div>
  );
}