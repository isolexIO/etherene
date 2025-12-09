import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { Search, Wifi } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
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
  // Watchlist from DB
  const { data: watchlistItems, refetch: refetchWatchlist } = useQuery({
    queryKey: ['watchlist'],
    queryFn: async () => {
        try {
            const items = await base44.entities.Watchlist.list();
            return items;
        } catch (e) {
            console.error("Failed to fetch watchlist", e);
            return [];
        }
    }
  });

  const watchedAddresses = watchlistItems?.map(item => item.address) || [];

  const addToWatchlist = async (address) => {
    try {
        if (watchlistItems?.some(item => item.address === address)) return;
        await base44.entities.Watchlist.create({ address });
        refetchWatchlist();
        toast.success("Added to watchlist");
    } catch (e) {
        console.error(e);
        toast.error("Failed to add to watchlist");
    }
  };

  const removeFromWatchlist = async (address) => {
    try {
        const item = watchlistItems?.find(i => i.address === address);
        if (item) {
            await base44.entities.Watchlist.delete(item.id);
            refetchWatchlist();
            toast.success("Removed from watchlist");
        }
    } catch (e) {
        console.error(e);
        toast.error("Failed to remove from watchlist");
    }
  };

  // Metaphysical Chain Stats
  useEffect(() => {
    const fetchMetaphysicalStats = async () => {
        try {
            const { base44 } = await import('@/api/base44Client');
            const moment = (await import('moment')).default;
            
            // Calculate "Block Height" (Days since Genesis: 2024-01-01)
            const genesis = moment('2024-01-01');
            const now = moment();
            const blockHeight = now.diff(genesis, 'days');

            // Fetch Entities
            const [identities, transmissions, interactions] = await Promise.all([
                base44.entities.Identity.list(),
                base44.entities.Transmission.list(),
                base44.entities.OracleInteraction.list()
            ]);

            const totalActivity = identities.length + transmissions.length + interactions.length;
            const tps = totalActivity > 0 ? (totalActivity / (blockHeight * 24)).toFixed(2) : 0; // Transmissions Per Hour basically

            setStats({
                blocks: blockHeight,
                gasPrice: "10", // Constant "Energy"
                identities: identities.length,
                tps: tps
            });

            // Merge and Map Transactions
            const allTxs = [
                ...identities.map(i => ({
                    hash: i.id,
                    from: i.address,
                    to: "Etherene Identity",
                    type: "Identity Mint",
                    created_date: i.created_date,
                    status: "Minted"
                })),
                ...transmissions.map(t => ({
                    hash: t.id,
                    from: t.author_address,
                    to: "Agora",
                    type: "Transmission",
                    created_date: t.created_date,
                    status: "Broadcasted"
                })),
                ...interactions.map(i => ({
                    hash: i.id,
                    from: i.user_address,
                    to: "Oracle",
                    type: "Oracle Interaction",
                    created_date: i.created_date,
                    status: "Revealed"
                }))
            ].sort((a, b) => new Date(b.created_date) - new Date(a.created_date));

            setTransactions(allTxs.slice(0, 15).map(tx => ({
                ...tx,
                age: moment(tx.created_date).fromNow()
            })));

        } catch (error) {
            console.error("Failed to fetch metaphysical stats:", error);
        }
    };

    // Initial Graph
    setGraphData(Array.from({ length: 20 }, (_, i) => ({
      time: new Date(Date.now() - (20 - i) * 2000).toLocaleTimeString(),
      tps: 5
    })));

    fetchMetaphysicalStats();
    const interval = setInterval(fetchMetaphysicalStats, 30000); 
    
    // Visual Graph Update
    const graphInterval = setInterval(() => {
        setGraphData(prev => {
            const newData = [...prev.slice(1), { 
              time: new Date().toLocaleTimeString(), 
              value: Math.floor(Math.random() * 10) + 2
            }];
            return newData;
        });
    }, 2000);

    return () => {
        clearInterval(interval);
        clearInterval(graphInterval);
    };
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
            <div className="space-y-8 relative">
                <NetworkGraph data={graphData} />
                <div className="sticky top-24">
                  <AddressWatchlist 
                    watchedAddresses={watchedAddresses} 
                    onAdd={addToWatchlist}
                    onRemove={removeFromWatchlist}
                  />
                </div>
            </div>

        </div>
    </div>
  );
}