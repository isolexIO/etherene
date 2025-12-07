import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import TransmissionItem from './TransmissionItem';
import { Loader2, Radio } from 'lucide-react';
import { motion } from 'framer-motion';

export default function TransmissionFeed() {
  const { data: transmissions, isLoading } = useQuery({
    queryKey: ['transmissions'],
    queryFn: () => base44.entities.Transmission.list('-created_date'),
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