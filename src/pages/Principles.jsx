import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Network, ShieldCheck, Database, Users, Sparkles } from 'lucide-react';

const icons = {
  Network,
  ShieldCheck,
  Database,
  Users,
  Sparkles
};

export default function Principles() {
  const { data: principles, isLoading } = useQuery({
    queryKey: ['principles'],
    queryFn: () => base44.entities.Principle.list('order', 50),
    initialData: []
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-16"
      >
        <h1 className="text-4xl font-bold text-slate-900 mb-4">Core Principles</h1>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto">
          The axioms that define the Etherene protocol and guide our collective consensus.
        </p>
      </motion.div>

      <div className="space-y-8">
        {principles.map((principle, index) => {
          const Icon = icons[principle.icon] || Sparkles;
          
          return (
            <motion.div
              key={principle.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white/70 backdrop-blur-md rounded-3xl p-6 md:p-8 border border-white/60 shadow-sm hover:shadow-lg transition-all group"
            >
              <div className="flex items-start gap-6">
                <div className="hidden sm:flex flex-col items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-900 group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-500">
                    <span className="font-mono text-lg font-bold">0{index + 1}</span>
                  </div>
                  {index !== principles.length - 1 && (
                    <div className="w-px h-full bg-slate-200" />
                  )}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <Icon className="w-5 h-5 text-indigo-600" />
                    <h3 className="text-2xl font-bold text-slate-900">{principle.title}</h3>
                  </div>
                  <p className="text-slate-600 text-lg leading-relaxed">
                    {principle.description}
                  </p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="mt-20 p-8 rounded-3xl bg-slate-900 text-slate-200 text-center relative overflow-hidden">
        <div className="relative z-10">
          <h3 className="text-2xl font-bold text-white mb-4">Propose a new Principle</h3>
          <p className="mb-6 opacity-80">Governance is open to all token holders.</p>
          <button className="px-6 py-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white font-medium border border-white/10">
            Submit Proposal
          </button>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/20 blur-[80px] rounded-full" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-600/20 blur-[80px] rounded-full" />
      </div>
    </div>
  );
}