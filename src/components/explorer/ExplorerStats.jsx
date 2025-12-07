import React from 'react';
import { motion } from 'framer-motion';
import { Box, Activity, Shield, Zap } from 'lucide-react';

export default function ExplorerStats({ globalStats }) {
  const stats = [
    { label: "Total Blocks", value: globalStats.blocks.toLocaleString(), icon: Box, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Active Nodes", value: globalStats.nodes.toLocaleString(), icon: Activity, color: "text-green-600", bg: "bg-green-50" },
    { label: "Verified Identities", value: globalStats.identities.toLocaleString(), icon: Shield, color: "text-indigo-600", bg: "bg-indigo-50" },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, index) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between mb-4">
            <div className={`p-3 rounded-xl ${stat.bg}`}>
              <stat.icon className={`w-6 h-6 ${stat.color}`} />
            </div>
            <span className="text-xs font-medium text-slate-400 bg-slate-50 px-2 py-1 rounded-full">Live</span>
          </div>
          <h3 className="text-2xl font-bold text-slate-900">{stat.value}</h3>
          <p className="text-sm text-slate-500 mt-1">{stat.label}</p>
        </motion.div>
      ))}
    </div>
  );
}