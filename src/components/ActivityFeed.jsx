import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, User } from 'lucide-react';

const MOCK_ACTIVITIES = [
  { type: 'declaration', address: '0x71C...9A23', time: '2 mins ago', hash: '0x82...91' },
  { type: 'mint', address: '0x3B2...1C4D', time: '5 mins ago', hash: '0x4A...2B' },
  { type: 'declaration', address: '0x9D1...8E2F', time: '12 mins ago', hash: '0x1C...3D' },
  { type: 'mint', address: '0x1A2...3B4C', time: '20 mins ago', hash: '0x5E...6F' },
];

export default function ActivityFeed() {
  const [activities, setActivities] = useState(MOCK_ACTIVITIES);

  // Simulate live feed
  useEffect(() => {
    const interval = setInterval(() => {
      const newActivity = {
        type: Math.random() > 0.5 ? 'declaration' : 'mint',
        address: `0x${Math.floor(Math.random()*16777215).toString(16).toUpperCase()}...${Math.floor(Math.random()*16777215).toString(16).toUpperCase()}`,
        time: 'Just now',
        hash: `0x${Math.floor(Math.random()*16777215).toString(16)}`
      };
      setActivities(prev => [newActivity, ...prev.slice(0, 4)]);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full max-w-md bg-slate-900/40 backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-lg">
      <div className="flex items-center gap-2 mb-6">
        <Activity className="w-5 h-5 text-indigo-400" />
        <h3 className="font-bold text-slate-100">Network Consensus</h3>
      </div>
      
      <div className="space-y-4">
        <AnimatePresence initial={false}>
          {activities.map((item, i) => (
            <motion.div
              key={item.hash + i}
              initial={{ opacity: 0, height: 0, x: -20 }}
              animate={{ opacity: 1, height: 'auto', x: 0 }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-center gap-3 text-sm"
            >
              <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400">
                <User className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <p className="text-slate-200">
                  <span className="font-mono text-xs text-slate-300">{item.address}</span>
                  <span className="text-slate-500"> {item.type === 'mint' ? 'minted Identity' : 'signed Declaration'}</span>
                </p>
                <p className="text-xs text-slate-500">{item.time}</p>
              </div>
              <a href="#" className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors">View</a>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}