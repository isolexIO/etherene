import React, { useState, useEffect, useCallback } from 'react';
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
import usePullToRefresh from '../components/mobile/usePullToRefresh';
import PullToRefreshIndicator from '../components/mobile/PullToRefreshIndicator';

const ACTION_TYPES = [
  { entity: 'Transmission', label: 'Transmission', to: 'Agora', status: 'Broadcasted', addressField: 'author_address' },
  { entity: 'Resonance', label: 'Resonance', to: 'Agora', status: 'Resonated', addressField: 'author_address' },
  { entity: 'OracleInteraction', label: 'Oracle Interaction', to: 'Oracle', status: 'Revealed', addressField: 'user_address' },
  { entity: 'Identity', label: 'Identity Mint', to: 'Etherene Identity', status: 'Minted', addressField: 'address' },
  { entity: 'Follow', label: 'Follow', to: 'Network', status: 'Connected', addressField: 'follower_address' },
];

async function fetchAllBlocks() {
  const moment = (await import('moment')).default;
  const settingsList = await base44.entities.GlobalSettings.list();
  const genesisDate = settingsList[0]?.genesis_date || '2024-01-01';
  const genesis = moment.utc(genesisDate).startOf('day');
  const blockHeight = moment.utc().diff(genesis, 'days');

  const results = await Promise.all(
    ACTION_TYPES.map(async ({ entity, label, to, status, addressField }) => {
      const records = await base44.entities[entity].list('-created_date', 200);
      return records.map(r => ({
        hash: r.id,
        from: r[addressField] || 'Unknown',
        to,
        type: label,
        created_date: r.created_date,
        status,
        blockNumber: moment.utc(r.created_date).diff(genesis, 'days') + 1,
      }));
    })
  );

  const allTxs = results.flat().sort((a, b) => new Date(b.created_date) - new Date(a.created_date));

  return { blocks: allTxs, blockHeight };
}

export default function BlockExplorer() {
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('transactions');

  // Global State
  const [stats, setStats] = useState({ blocks: 0, totalTxns: 0, gasPrice: 0, identities: 0, tps: 0 });
  const [transactions, setTransactions] = useState([]);
  const [graphData, setGraphData] = useState([]);

  // Pull to refresh
  const { scrollContainerRef, isRefreshing, pullDistance } = usePullToRefresh(async () => {
    await refetchWatchlist();
    await refetchTransactions();
  });

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

  // Separate refetch function
  const refetchTransactions = useCallback(async () => {
    const moment = (await import('moment')).default;

    try {
      const { blocks, blockHeight } = await fetchAllBlocks();
      const identities = await base44.entities.Identity.list();

      const totalTxns = blocks.length;
      let actionsPerDay = 0;
      if (blockHeight > 0) {
        actionsPerDay = (totalTxns / blockHeight).toFixed(1);
      }

      setStats({
        blocks: blockHeight,
        totalTxns,
        gasPrice: "10",
        identities: identities.length,
        tps: actionsPerDay,
      });

      setTransactions(blocks.slice(0, 50).map(tx => ({
        ...tx,
        age: moment.utc(tx.created_date).fromNow(),
      })));
    } catch (error) {
      console.error("Failed to fetch blocks:", error);
    }
  }, []);

  useEffect(() => {
    const fetchMetaphysicalStats = async () => {
      await refetchTransactions();
    };

    // Initial Graph
    setGraphData(Array.from({ length: 20 }, (_, i) => ({
      time: new Date(Date.now() - (20 - i) * 2000).toISOString().substr(11, 8),
      tps: 5
    })));

    fetchMetaphysicalStats();
    const interval = setInterval(fetchMetaphysicalStats, 30000);

    // Visual Graph Update
    const graphInterval = setInterval(() => {
        setGraphData(prev => {
            const newData = [...prev.slice(1), {
              time: new Date().toISOString().substr(11, 8),
              tps: Math.floor(Math.random() * 10) + 2
            }];
            return newData;
        });
    }, 2000);

    return () => {
        clearInterval(interval);
        clearInterval(graphInterval);
    };
  }, [refetchTransactions]);



  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:overflow-hidden" ref={scrollContainerRef} style={{ overscrollBehavior: 'contain' }}>
        <PullToRefreshIndicator distance={pullDistance} isRefreshing={isRefreshing} />
        {/* Header & Search */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-12 gap-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
            >
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-bold text-slate-900">Block Explorer</h1>
                  <span className="flex items-center gap-! px-2 py-1 rounded-full bg-green-100 text-green-700 text-xs font-medium animate-pulse">
                    <Wifi className="w-3 h-3" /> Live
                  </span>
                </div>
                <p className="text-slate-600">Immutable log of every action on the Etherene network</p>
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
            <div className="lg:col-span-2 overflow-y-auto max-h-[calc(100vh-300px)]">
                <div className="flex gap-3 border-b border-slate-200 mb-8 overflow-x-auto min-h-11">
                    <button
                        onClick={() => setActiveTab('transactions')}
                        className={`pb-4 px-2 font-medium text-sm transition-colors relative ${activeTab === 'transactions' ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Latest Blocks
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
            <div className="hidden lg:block space-y-8 relative">
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