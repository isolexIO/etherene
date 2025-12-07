import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { Search, Wifi } from 'lucide-react';
import TransactionList from '../components/explorer/TransactionList';
import IdentityList from '../components/explorer/IdentityList';
import ExplorerStats from '../components/explorer/ExplorerStats';
import NetworkGraph from '../components/explorer/NetworkGraph';
import AddressWatchlist from '../components/explorer/AddressWatchlist';

// Initial Mock Data
const INITIAL_STATS = {
  blocks: 14205921,
  nodes: 8432,
  identities: 128940,
};

const INITIAL_TXS = [
  { hash: "0x71c...9a23", from: "0xab1...23cd", to: "0xef4...56gh", type: "Declaration", age: "12 secs ago", status: "Success" },
  { hash: "0x3b2...1c4d", from: "0x890...12kl", to: "Contract: Identity", type: "Mint Identity", age: "45 secs ago", status: "Success" },
  { hash: "0x9d1...8e2f", from: "0x345...67mn", to: "0xab1...23cd", type: "Oracle Interaction", age: "1 min ago", status: "Success" },
];

export default function BlockExplorer() {
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('transactions');
  
  // Global State
  const [stats, setStats] = useState(INITIAL_STATS);
  const [transactions, setTransactions] = useState(INITIAL_TXS);
  const [graphData, setGraphData] = useState([]);
  const [watchedAddresses, setWatchedAddresses] = useState(() => {
    const saved = localStorage.getItem('etherene_watchlist');
    return saved ? JSON.parse(saved) : [];
  });

  // Refs for simulation state to avoid closure staleness
  const txSinceLastBlock = useRef(0);

  // Save watchlist
  useEffect(() => {
    localStorage.setItem('etherene_watchlist', JSON.stringify(watchedAddresses));
  }, [watchedAddresses]);

  // Simulated WebSocket / Real-time Update
  useEffect(() => {
    // Initial Graph Data
    const now = new Date();
    const initialGraph = Array.from({ length: 20 }, (_, i) => ({
      time: new Date(now - (20 - i) * 2000).toLocaleTimeString(),
      tps: Math.floor(Math.random() * 50) + 10
    }));
    setGraphData(initialGraph);

    const interval = setInterval(() => {
      // 1. Generate New Transaction
      const newTx = {
        hash: `0x${Math.random().toString(16).substr(2, 10)}...`,
        from: `0x${Math.random().toString(16).substr(2, 8)}...`,
        to: Math.random() > 0.7 ? "Contract: Identity" : `0x${Math.random().toString(16).substr(2, 8)}...`,
        type: ["Declaration", "Mint Identity", "Oracle Interaction"][Math.floor(Math.random() * 3)],
        age: "Just now",
        status: "Success"
      };
      
      setTransactions(prev => [newTx, ...prev.slice(0, 14)]);
      
      // Increment transaction counter
      txSinceLastBlock.current += 1;

      // 2. Update Stats & Check for Block Generation
      setStats(prev => {
        let newBlockCount = prev.blocks;
        
        // Every 10 transactions, mine a new block
        if (txSinceLastBlock.current >= 10) {
          newBlockCount += 1;
          txSinceLastBlock.current = 0; // Reset counter
        }

        return {
          blocks: newBlockCount,
          nodes: prev.nodes + (Math.random() > 0.9 ? (Math.random() > 0.5 ? 1 : -1) : 0),
          identities: prev.identities + (newTx.type === "Mint Identity" ? 1 : 0),
        };
      });

      // 3. Update Graph
      setGraphData(prev => {
        const newData = [...prev.slice(1), {
          time: new Date().toLocaleTimeString(),
          tps: Math.floor(Math.random() * 60) + 20
        }];
        return newData;
      });

    }, 2000); // Faster interval to demonstrate block generation

    return () => clearInterval(interval);
  }, []);

  const addToWatchlist = useCallback((address) => {
    setWatchedAddresses(prev => [...prev, address]);
  }, []);

  const removeFromWatchlist = useCallback((address) => {
    setWatchedAddresses(prev => prev.filter(a => a !== address));
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header & Search */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-12 gap-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
            >
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-bold text-white">Block Explorer</h1>
                  <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-green-500/10 border border-green-500/30 text-green-400 text-xs font-medium animate-pulse shadow-[0_0_10px_rgba(74,222,128,0.2)]">
                    <Wifi className="w-3 h-3" /> Live
                  </span>
                </div>
                <p className="text-slate-400">Immutable record of truth and identity</p>
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="relative w-full md:w-96"
            >
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input 
                    type="text"
                    placeholder="Search by address, hash, or block..."
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-800 bg-slate-900/60 text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none shadow-sm placeholder:text-slate-600"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </motion.div>
        </div>

        {/* Stats */}
        <ExplorerStats globalStats={stats} />

        {/* Main Content Grid */}
        <div className="mt-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left Column: List & Tabs */}
            <div className="lg:col-span-2">
                <div className="flex gap-6 border-b border-slate-800 mb-8">
                    <button 
                        onClick={() => setActiveTab('transactions')}
                        className={`pb-4 px-2 font-medium text-sm transition-colors relative ${activeTab === 'transactions' ? 'text-indigo-400 drop-shadow-[0_0_5px_rgba(129,140,248,0.5)]' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        Latest Transactions
                        {activeTab === 'transactions' && (
                            <motion.div 
                                layoutId="activeTab"
                                className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,1)]"
                            />
                        )}
                    </button>
                    <button 
                        onClick={() => setActiveTab('identities')}
                        className={`pb-4 px-2 font-medium text-sm transition-colors relative ${activeTab === 'identities' ? 'text-indigo-400 drop-shadow-[0_0_5px_rgba(129,140,248,0.5)]' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        Verified Identities
                        {activeTab === 'identities' && (
                            <motion.div 
                                layoutId="activeTab"
                                className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,1)]"
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
                    {activeTab === 'transactions' ? (
                      <TransactionList 
                        transactions={transactions} 
                        searchTerm={search} 
                        watchedAddresses={watchedAddresses}
                      />
                    ) : (
                      <IdentityList searchTerm={search} />
                    )}
                </motion.div>
            </div>

            {/* Right Column: Graph & Watchlist */}
            <div className="space-y-8">
                <NetworkGraph data={graphData} />
                <AddressWatchlist 
                  watchedAddresses={watchedAddresses} 
                  onAdd={addToWatchlist}
                  onRemove={removeFromWatchlist}
                />
            </div>

        </div>
    </div>
  );
}