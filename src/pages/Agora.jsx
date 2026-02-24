import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Radio, Users, Sparkles, Circle, Globe } from 'lucide-react';
import CreateTransmission from '../components/community/CreateTransmission';
import TransmissionFeed from '../components/community/TransmissionFeed';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../components/utils';
import IdentityAvatar from '../components/profile/IdentityAvatar';
import NFTGate from '../components/shared/NFTGate';
import usePullToRefresh from '../components/mobile/usePullToRefresh';
import PullToRefreshIndicator from '../components/mobile/PullToRefreshIndicator';

export default function Agora() {
  const [feedType, setFeedType] = useState('global'); // 'global' | 'following'

  const { data: activeIdentities, refetch: refetchIdentities } = useQuery({
    queryKey: ['activeIdentities'],
    queryFn: async () => {
        const identities = await base44.entities.Identity.list('-last_seen', 20); // Get most recently active
        return identities;
    },
    refetchInterval: 30000
  });

  const { scrollContainerRef, isRefreshing, pullDistance } = usePullToRefresh(async () => {
    await refetchIdentities();
  });

  const isOnline = (dateStr) => {
      if (!dateStr) return false;
      const diff = new Date() - new Date(dateStr);
      return diff < 10 * 60 * 1000; // 10 minutes threshold
  };

  return (
    <div className="min-h-screen bg-slate-50/50 md:overflow-hidden" ref={scrollContainerRef} style={{ overscrollBehavior: 'contain' }}>
      
      {/* Header */}
      <div className="bg-white border-b border-slate-100 pb-12 pt-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 text-sm font-medium mb-6"
          >
            <Radio className="w-4 h-4" />
            <span>Live Frequency</span>
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl font-bold text-slate-900 mb-4"
          >
            The Agora
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-slate-500 max-w-2xl mx-auto"
          >
            A public square for the Etherene network. Transmit your insights, resonate with others, and reach consensus.
          </motion.p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Main Content (Center) */}
        <div className="lg:col-span-8">
          {/* Composer */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <NFTGate>
              <CreateTransmission />
            </NFTGate>
          </motion.div>

          {/* Feed Filter */}
          <div className="flex items-center gap-2 mb-6 px-2 border-b border-slate-100 overflow-x-auto">
              <button 
                  onClick={() => setFeedType('global')}
                  className={`pb-3 px-2 text-sm font-bold uppercase tracking-wider flex items-center gap-2 transition-colors border-b-2 whitespace-nowrap min-h-11 ${
                      feedType === 'global' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'
                  }`}
              >
                  <Globe className="w-4 h-4" />
                  Global Frequency
              </button>
              <button 
                  onClick={() => setFeedType('following')}
                  className={`pb-3 px-2 text-sm font-bold uppercase tracking-wider flex items-center gap-2 transition-colors border-b-2 whitespace-nowrap min-h-11 ${
                      feedType === 'following' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'
                  }`}
              >
                  <Users className="w-4 h-4" />
                  Network Activity
              </button>
          </div>

          <PullToRefreshIndicator distance={pullDistance} isRefreshing={isRefreshing} />

          {/* Feed */}
          <div className="opacity-90">
             <TransmissionFeed feedType={feedType} />
          </div>
        </div>

        {/* Sidebar (Right) - Active Identities */}
        <div className="hidden lg:block lg:col-span-4 space-y-6">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 sticky top-24">
                <div className="flex items-center gap-2 mb-6">
                    <Users className="w-5 h-5 text-indigo-600" />
                    <h3 className="font-bold text-slate-900">Active Nodes</h3>
                    <span className="ml-auto bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-xs font-medium">
                        {activeIdentities?.filter(i => isOnline(i.last_seen)).length || 0} Online
                    </span>
                </div>
                
                <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                    {activeIdentities?.map((identity) => {
                        const online = isOnline(identity.last_seen);
                        return (
                            <Link 
                                key={identity.id} 
                                to={`${createPageUrl('Profile')}?address=${identity.address}`}
                                className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-xl transition-colors group"
                            >
                                <div className="relative">
                                    <div className="w-10 h-10 rounded-full overflow-hidden border border-slate-100">
                                        {identity.avatar_url ? (
                                            <img src={identity.avatar_url} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <IdentityAvatar address={identity.address} soulHash={identity.soul_hash} size={40} chainId={1} />
                                        )}
                                    </div>
                                    {online && (
                                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" title="Online" />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-slate-900 text-sm truncate group-hover:text-indigo-600 transition-colors min-h-11 flex items-center">
                                        {identity.display_name || 'Anonymous Node'}
                                    </p>
                                    <p className="text-xs text-slate-400 font-mono truncate min-h-11 flex items-center">
                                        {identity.address.slice(0, 6)}...{identity.address.slice(-4)}
                                    </p>
                                </div>
                                {online ? (
                                    <Circle className="w-2 h-2 text-green-500 fill-green-500 animate-pulse" />
                                ) : (
                                    <span className="text-xs text-slate-400">{identity.last_seen ? new Date(identity.last_seen).toLocaleDateString() : 'Offline'}</span>
                                )}
                            </Link>
                        );
                    })}
                    
                    {!activeIdentities?.length && (
                        <div className="text-center text-slate-400 text-sm py-4">
                            No active nodes found.
                        </div>
                    )}
                </div>
            </div>
        </div>

      </div>
    </div>
  );
}