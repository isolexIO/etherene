import React from 'react';
import { motion } from 'framer-motion';
import { Box, Activity, Shield, Zap } from 'lucide-react';

export default function ExplorerStats({ globalStats }) {
  const stats = [
    { label: "Total Blocks", value: globalStats.blocks.toLocaleString(), icon: Box, color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20" },
    { label: "Active Nodes", value: globalStats.nodes.toLocaleString(), icon: Activity, color: "text-green-400", bg: "bg-green-500/10 border-green-500/20" },
    { label: "Verified Identities", value: globalStats.identities.toLocaleString(), icon: Shield, color: "text-indigo-400", bg: "bg-indigo-500/10 border-indigo-500/20" },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, index) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="bg-slate-900/50 backdrop-blur-md rounded-2xl border border-white/5 p-6 shadow-lg hover:bg-slate-800/50 transition-colors"
        >
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-xl border ${stat.bg} ${stat.color}`}>
              <stat.icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-400">{stat.label}</p>
              <div className="flex items-center gap-2">
                <h3 className="text-2xl font-bold text-slate-100">{stat.value}</h3>
                <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
              </div>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}