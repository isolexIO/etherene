import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Box, Shield, Activity, Clock, CheckCircle } from 'lucide-react';
import TransactionList from '../components/explorer/TransactionList';
import IdentityList from '../components/explorer/IdentityList';
import ExplorerStats from '../components/explorer/ExplorerStats';

export default function BlockExplorer() {
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('transactions');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header & Search */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-12 gap-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
            >
                <h1 className="text-3xl font-bold text-slate-900">Block Explorer</h1>
                <p className="text-slate-600">Immutable record of truth and identity</p>
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="relative w-full md:w-96"
            >
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input 
                    type="text"
                    placeholder="Search by address, hash, or block..."
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none bg-white shadow-sm"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </motion.div>
        </div>

        {/* Stats */}
        <ExplorerStats />

        {/* Main Content */}
        <div className="mt-12">
            <div className="flex gap-6 border-b border-slate-200 mb-8">
                <button 
                    onClick={() => setActiveTab('transactions')}
                    className={`pb-4 px-2 font-medium text-sm transition-colors relative ${activeTab === 'transactions' ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    Latest Transactions
                    {activeTab === 'transactions' && (
                        <motion.div 
                            layoutId="activeTab"
                            className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600"
                        />
                    )}
                </button>
                <button 
                    onClick={() => setActiveTab('identities')}
                    className={`pb-4 px-2 font-medium text-sm transition-colors relative ${activeTab === 'identities' ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    Verified Identities
                    {activeTab === 'identities' && (
                        <motion.div 
                            layoutId="activeTab"
                            className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600"
                        />
                    )}
                </button>
            </div>

            <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
            >
                {activeTab === 'transactions' ? <TransactionList searchTerm={search} /> : <IdentityList searchTerm={search} />}
            </motion.div>
        </div>
    </div>
  );
}