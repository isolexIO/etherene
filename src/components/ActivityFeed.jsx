import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, User, Box, MessageSquare } from 'lucide-react';

const MOCK_ACTIVITIES = [
  { type: 'declaration', address: '0x71C...9A23', time: '2 mins ago', hash: '0x82...91' },
  { type: 'mint', address: '0x3B2...1C4D', time: '5 mins ago', hash: '0x4A...2B' },
  { type: 'oracle', address: '0x9D1...8E2F', time: '12 mins ago', hash: '0x1C...3D' },
  { type: 'mint', address: '0x1A2...3B4C', time: '20 mins ago', hash: '0x5E...6F' },
];

export default function ActivityFeed() {
  const [activities, setActivities] = useState(MOCK_ACTIVITIES);
  const txCount = useRef(0);
  const blockHeight = useRef(14205921);

  // Simulate live feed
  useEffect(() => {
    const interval = setInterval(() => {
      // 1. Determine Event Type
      // 10 transactions = 1 block.
      // So we generate transactions, and check count.
      
      let newActivity;
      
      if (txCount.current >= 10) {
        // MINE BLOCK
        blockHeight.current += 1;
        txCount.current = 0;
        
        newActivity = {
          type: 'block',
          address: 'Network',
          time: 'Just now',
          hash: `#${blockHeight.current}`
        };
      } else {
        // NEW TRANSACTION
        txCount.current += 1;
        const types = ['declaration', 'mint', 'oracle'];
        const selectedType = types[Math.floor(Math.random() * types.length)];
        
        newActivity = {
          type: selectedType,
          address: `0x${Math.floor(Math.random()*16777215).toString(16).toUpperCase().padStart(6, '0')}...${Math.floor(Math.random()*16777215).toString(16).toUpperCase().padStart(4, '0')}`,
          time: 'Just now',
          hash: `0x${Math.floor(Math.random()*16777215).toString(16)}`
        };
      }

      setActivities(prev => [newActivity, ...prev.slice(0, 5)]); // Keep last 5-6 items
    }, 2000); // 2 seconds per event -> 20 seconds per block approx
    return () => clearInterval(interval);
  }, []);

  const getIcon = (type) => {
    switch (type) {
      case 'block': return <Box className="w-4 h-4 text-blue-500" />;
      case 'oracle': return <MessageSquare className="w-4 h-4 text-purple-500" />;
      default: return <User className="w-4 h-4 text-slate-500" />;
    }
  };

  const getText = (item) => {
    if (item.type === 'block') return <span className="font-bold text-blue-600">Mined Block {item.hash}</span>;
    if (item.type === 'oracle') return 'consulted Oracle';
    if (item.type === 'mint') return 'minted Identity';
    return 'signed Declaration';
  };

  return (
    <div className="w-full max-w-md bg-white/50 backdrop-blur-sm border border-white/50 rounded-2xl p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-6">
        <Activity className="w-5 h-5 text-indigo-600" />
        <h3 className="font-bold text-slate-900">Network Consensus</h3>
      </div>
      
      <div className="space-y-4">
        <AnimatePresence initial={false}>
          {activities.map((item, i) => (
            <motion.div
              key={item.hash + i} // key needs to be unique enough
              initial={{ opacity: 0, height: 0, x: -20 }}
              animate={{ opacity: 1, height: 'auto', x: 0 }}
              exit={{ opacity: 0, height: 0 }}
              className={`flex items-center gap-3 text-sm ${item.type === 'block' ? 'bg-blue-50/50 p-2 rounded-lg -mx-2' : ''}`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${item.type === 'block' ? 'bg-blue-100' : 'bg-slate-100'}`}>
                {getIcon(item.type)}
              </div>
              <div className="flex-1">
                <p className="text-slate-900">
                  <span className="font-mono text-xs">{item.address}</span>
                  <span className="text-slate-500"> {getText(item)}</span>
                </p>
                <p className="text-xs text-slate-400">{item.time}</p>
              </div>
              {item.type !== 'block' && (
                <a href="#" className="text-xs text-indigo-400 hover:text-indigo-600 transition-colors">View</a>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}