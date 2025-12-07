import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, User, Box, MessageSquare, Radio } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import moment from 'moment';

export default function ActivityFeed() {
  const [activities, setActivities] = useState([]);

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        // Fetch Identities
        const identities = await base44.entities.Identity.list('-created_date', 5);
        
        // Fetch Transmissions
        const transmissions = await base44.entities.Transmission.list('-created_date', 5);

        // Fetch Real Block (just one to show network aliveness)
        let blockActivity = null;
        try {
            const { ethers } = await import('ethers');
            const provider = new ethers.JsonRpcProvider("https://eth.llamarpc.com");
            const blockNumber = await provider.getBlockNumber();
            blockActivity = {
                type: 'block',
                address: 'Network',
                created_date: new Date().toISOString(),
                hash: `#${blockNumber}`,
                id: `block-${blockNumber}`
            };
        } catch (e) {
            console.error("Eth fetch failed", e);
        }

        const combined = [
            ...identities.map(i => ({ 
                type: 'mint', 
                address: i.address, 
                created_date: i.created_date, 
                hash: i.display_name || 'Identity',
                id: i.id
            })),
            ...transmissions.map(t => ({ 
                type: 'transmission', 
                address: t.author_address, 
                created_date: t.created_date, 
                hash: 'Signal',
                id: t.id
            }))
        ];

        if (blockActivity) combined.push(blockActivity);

        // Sort by date desc
        combined.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));

        setActivities(combined.slice(0, 6));

      } catch (err) {
        console.error("Activity feed error:", err);
      }
    };

    fetchActivities();
    const interval = setInterval(fetchActivities, 15000);
    return () => clearInterval(interval);
  }, []);

  const getIcon = (type) => {
    switch (type) {
      case 'block': return <Box className="w-4 h-4 text-blue-500" />;
      case 'transmission': return <Radio className="w-4 h-4 text-purple-500" />;
      case 'mint': return <User className="w-4 h-4 text-green-500" />;
      default: return <Activity className="w-4 h-4 text-slate-500" />;
    }
  };

  const getText = (item) => {
    if (item.type === 'block') return <span className="font-bold text-blue-600">Mined Block {item.hash}</span>;
    if (item.type === 'transmission') return 'broadcasted a signal';
    if (item.type === 'mint') return 'minted Identity';
    return 'active';
  };

  return (
    <div className="w-full max-w-md bg-white/50 backdrop-blur-sm border border-white/50 rounded-2xl p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-6">
        <Activity className="w-5 h-5 text-indigo-600" />
        <h3 className="font-bold text-slate-900">Network Consensus</h3>
      </div>
      
      <div className="space-y-4">
        <AnimatePresence initial={false}>
          {activities.length === 0 ? (
              <div className="text-sm text-slate-500 text-center py-4">Waiting for network activity...</div>
          ) : (
            activities.map((item) => (
                <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, height: 0 }}
                className={`flex items-center gap-3 text-sm ${item.type === 'block' ? 'bg-blue-50/50 p-2 rounded-lg -mx-2' : ''}`}
                >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${item.type === 'block' ? 'bg-blue-100' : 'bg-slate-100'}`}>
                    {getIcon(item.type)}
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-slate-900 truncate">
                    <span className="font-mono text-xs">{item.address === 'Network' ? 'Network' : `${item.address.slice(0,6)}...`}</span>
                    <span className="text-slate-500"> {getText(item)}</span>
                    </p>
                    <p className="text-xs text-slate-400">{moment(item.created_date).fromNow()}</p>
                </div>
                </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}