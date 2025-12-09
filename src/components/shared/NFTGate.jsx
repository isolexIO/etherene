import React from 'react';
import { motion } from 'framer-motion';
import { Lock, Fingerprint, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useWeb3 } from '../../Layout';

export default function NFTGate({ children, fallback }) {
  const { account, connectWallet } = useWeb3();

  const { data: identity, isLoading } = useQuery({
    queryKey: ['identity', account],
    queryFn: async () => {
      if (!account) return null;
      const identities = await base44.entities.Identity.filter({ address: account });
      return identities[0] || null;
    },
    enabled: !!account,
  });

  if (!account) {
      return (
        <div className="bg-slate-900 rounded-2xl p-8 text-center text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="relative z-10">
                <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                    <Lock className="w-6 h-6 text-indigo-300" />
                </div>
                <h3 className="text-xl font-bold mb-2">Community Access Restricted</h3>
                <p className="text-slate-300 mb-6 max-w-md mx-auto">
                    Connect your Solana wallet to access the Etherene community features.
                </p>
                <button 
                    onClick={connectWallet}
                    className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full font-medium transition-colors cursor-pointer z-50 relative"
                >
                    Connect Wallet
                </button>
            </div>
        </div>
      );
  }

  if (isLoading) {
      return <div className="p-8 text-center text-slate-500 animate-pulse">Verifying Identity Token...</div>;
  }

  if (!identity || identity.status !== 'minted') {
      return fallback || (
        <div className="bg-slate-900 rounded-2xl p-8 text-center text-white relative overflow-hidden group">
            <div className="absolute inset-0 bg-indigo-600/10 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500" />
            
            <div className="relative z-10">
                <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-6 backdrop-blur-sm border border-white/10">
                    <Fingerprint className="w-8 h-8 text-indigo-300" />
                </div>
                <h3 className="text-2xl font-bold mb-3">Identity Required</h3>
                <p className="text-slate-300 mb-8 max-w-md mx-auto leading-relaxed">
                    This frequency is encrypted for verified nodes only. Mint your Etherene Identity NFT to decrypt the signal and participate in the Agora.
                </p>
                
                <Link 
                    to={createPageUrl('Profile')}
                    className="inline-flex items-center gap-2 px-8 py-3 bg-white text-slate-900 rounded-xl font-bold hover:bg-indigo-50 transition-all hover:scale-105 active:scale-95"
                >
                    Mint Identity <ArrowRight className="w-4 h-4" />
                </Link>
            </div>
        </div>
      );
  }

  return children;
}