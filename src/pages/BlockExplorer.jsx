import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { Search, Wifi } from 'lucide-react';
import TransactionList from '../components/explorer/TransactionList';
import IdentityList from '../components/explorer/IdentityList';
import ExplorerStats from '../components/explorer/ExplorerStats';
import NetworkGraph from '../components/explorer/NetworkGraph';
import AddressWatchlist from '../components/explorer/AddressWatchlist';

// Initial State removed - using real data

export default function BlockExplorer() {
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('transactions');
  
  // Global State
  const [stats, setStats] = useState({ blocks: 0, gasPrice: 0, identities: 0, tps: 0 });
  const [transactions, setTransactions] = useState([]);
  const [graphData, setGraphData] = useState([]);
  const [watchedAddresses, setWatchedAddresses] = useState(() => {
    const saved = localStorage.getItem('etherene_watchlist');
    return saved ? JSON.parse(saved) : [];
  });

  // Refs for simulation state to avoid closure staleness
  const txSinceLastBlock = useRef(0); // kept for legacy reference or can be removed, but minimizing changes.

  // Save watchlist
  useEffect(() => {
    localStorage.setItem('etherene_watchlist', JSON.stringify(watchedAddresses));
  }, [watchedAddresses]);

  // Real Chain Stats (Ethereum Mainnet)
  useEffect(() => {
    const fetchRealStats = async () => {
        try {
            const { ethers } = await import('ethers');
            // Use a public RPC provider for Ethereum Mainnet
            const provider = new ethers.JsonRpcProvider("https://eth.llamarpc.com");
            
            const blockNumber = await provider.getBlockNumber();
            const feeData = await provider.getFeeData();
            const block = await provider.getBlock(blockNumber, true); // true for prefetched transactions
            
            setStats(prev => ({
                ...prev,
                blocks: blockNumber,
                gasPrice: feeData.gasPrice ? ethers.formatUnits(feeData.gasPrice, 'gwei') : '0',
                tps: block ? Math.round(block.prefetchedTransactions.length / 12) : 15
            }));

            // Map recent transactions
            if (block && block.prefetchedTransactions) {
                const recentTxs = block.prefetchedTransactions.slice(0, 10).map(tx => ({
                    hash: tx.hash,
                    from: tx.from,
                    to: tx.to || "Contract Creation",
                    type: "Transaction", // Generic type as we don't decode calldata here
                    age: "Just now",
                    status: "Success" // Assumed for mined block
                }));
                setTransactions(recentTxs);
            }

            // Sync internal identity count
            const { base44 } = await import('@/api/base44Client');
            const identities = await base44.entities.Identity.list();
            setStats(prev => ({ ...prev, identities: identities.length })); // Real count only

        } catch (error) {
            console.error("Failed to fetch real chain stats:", error);
        }
    };

    // Initial Graph
    setGraphData(Array.from({ length: 20 }, (_, i) => ({
      time: new Date(Date.now() - (20 - i) * 2000).toLocaleTimeString(),
      tps: 15
    })));

    fetchRealStats();
    const interval = setInterval(fetchRealStats, 12000); // ~Block time
    
    // Visual Graph Update
    const graphInterval = setInterval(() => {
        setGraphData(prev => {
            const newData = [...prev.slice(1), { 
              time: new Date().toLocaleTimeString(), 
              value: Math.floor((stats.tps || 15) + (Math.random() * 5 - 2.5)) 
            }];
            return newData;
        });
    }, 2000);

    return () => {
        clearInterval(interval);
        clearInterval(graphInterval);
    };
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
                  <h1 className="text-3xl font-bold text-slate-900">Block Explorer</h1>
                  <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-green-100 text-green-700 text-xs font-medium animate-pulse">
                    <Wifi className="w-3 h-3" /> Live
                  </span>
                </div>
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
        <ExplorerStats globalStats={stats} />

        {/* Main Content Grid */}
        <div className="mt-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left Column: List & Tabs */}
            <div className="lg:col-span-2">
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