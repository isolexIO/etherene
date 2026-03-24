import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useWeb3 } from '../Layout';
import { 
    Shield, 
    Settings, 
    Users, 
    Activity, 
    Ban, 
    CheckCircle, 
    Save, 
    AlertTriangle,
    DollarSign,
    Calendar,
    FileText,
    Clock,
    XCircle,
    CheckCircle2,
    ExternalLink,
    Lock
} from 'lucide-react';
import { format } from 'date-fns';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    LineChart,
    Line
} from 'recharts';
import { toast } from 'sonner';

export default function AdminPage() {
    const { account, connectWallet } = useWeb3();
    const [activeTab, setActiveTab] = useState('analytics');
    const queryClient = useQueryClient();
    const [newRequestCount, setNewRequestCount] = useState(0);

    // Fetch admin wallet from settings
    const { data: adminSettings } = useQuery({
        queryKey: ['adminCheck'],
        queryFn: async () => {
            const res = await base44.entities.GlobalSettings.list();
            return res[0] || {};
        }
    });

    // --- Analytics Data ---
    const { data: analyticsData } = useQuery({
        queryKey: ['adminAnalytics'],
        queryFn: async () => {
            const [identities, transmissions, interactions] = await Promise.all([
                base44.entities.Identity.list(),
                base44.entities.Transmission.list(),
                base44.entities.OracleInteraction.list()
            ]);

            // Daily Activity Logic
            const activityByDate = {};
            [...identities, ...transmissions, ...interactions].forEach(item => {
                const date = item.created_date.split('T')[0];
                activityByDate[date] = (activityByDate[date] || 0) + 1;
            });

            const chartData = Object.entries(activityByDate)
                .map(([date, count]) => ({ date, count }))
                .sort((a, b) => new Date(a.date) - new Date(b.date))
                .slice(-30); // Last 30 days

            return {
                totalUsers: identities.length,
                totalTransmissions: transmissions.length,
                totalInteractions: interactions.length,
                chartData,
                recentIdentities: identities.slice(0, 10)
            };
        }
    });

    // --- Settings Data ---
    const { data: settings, isLoading: settingsLoading } = useQuery({
        queryKey: ['globalSettings'],
        queryFn: async () => {
            const res = await base44.entities.GlobalSettings.list();
            return res[0] || {};
        }
    });

    const updateSettingsMutation = useMutation({
        mutationFn: async (newSettings) => {
            if (settings?.id) {
                return base44.entities.GlobalSettings.update(settings.id, newSettings);
            } else {
                return base44.entities.GlobalSettings.create(newSettings);
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['globalSettings']);
            toast.success("Settings updated successfully");
        },
        onError: () => toast.error("Failed to update settings")
    });

    const [genesisDate, setGenesisDate] = useState('');
    const [maintenanceMode, setMaintenanceMode] = useState(false);
    const [platformFee, setPlatformFee] = useState(3);
    const [adminWallet, setAdminWallet] = useState('');

    useEffect(() => {
        if (settings) {
            setGenesisDate(settings.genesis_date || '2024-01-01');
            setMaintenanceMode(settings.maintenance_mode || false);
            setPlatformFee(settings.platform_fee_usd || 3);
            setAdminWallet(settings.admin_wallet || '5PvZDRRtdcnLwCRNYY1VKs8y6CSFfy9PmMJ3cRjhgWK8');
        }
    }, [settings]);

    const handleSaveSettings = () => {
        updateSettingsMutation.mutate({
            genesis_date: genesisDate,
            maintenance_mode: maintenanceMode,
            platform_fee_usd: platformFee,
            admin_wallet: adminWallet
        });
    };

    // --- User Management ---
    const { data: users, refetch: refetchUsers } = useQuery({
        queryKey: ['allUsers'],
        queryFn: () => base44.entities.Identity.list()
    });

    const toggleBanMutation = useMutation({
        mutationFn: async ({ id, banned }) => {
            return base44.entities.Identity.update(id, { banned });
        },
        onSuccess: () => {
            refetchUsers();
            toast.success("User status updated");
        }
    });

    // --- Mint Requests ---
    const { data: mintRequests, refetch: refetchMintRequests } = useQuery({
        queryKey: ['mintRequests'],
        queryFn: () => base44.entities.MintRequest.list('-created_date')
    });

    const updateMintStatusMutation = useMutation({
        mutationFn: async ({ id, status }) => {
            return base44.entities.MintRequest.update(id, { status });
        },
        onSuccess: () => {
            refetchMintRequests();
            toast.success("Mint request updated");
        }
    });

    const pendingRequests = mintRequests?.filter(r => r.status === 'pending' || r.status === 'processing') || [];
    const historicalRequests = mintRequests?.filter(r => r.status === 'minted' || r.status === 'failed') || [];

    // Check admin access
    const isAdmin = account && adminSettings?.admin_wallet && account === adminSettings.admin_wallet;

    // Real-time notifications for new mint requests
    useEffect(() => {
        if (!isAdmin) return;

        const unsubscribe = base44.entities.MintRequest.subscribe((event) => {
            if (event.type === 'create' && event.data.status === 'pending') {
                setNewRequestCount(prev => prev + 1);
                toast.info(`New mint request: ${event.data.subdomain}`, {
                    duration: 10000,
                    action: {
                        label: 'View',
                        onClick: () => {
                            setActiveTab('mints');
                            setNewRequestCount(0);
                        }
                    }
                });
                queryClient.invalidateQueries(['mintRequests']);
            }
        });

        return unsubscribe;
    }, [isAdmin, queryClient]);

    if (!account) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-8">
                <div className="bg-white rounded-2xl p-12 shadow-lg border border-slate-200 text-center max-w-md">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Lock className="w-8 h-8 text-slate-400" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">Admin Access Required</h2>
                    <p className="text-slate-500 mb-8">Connect your wallet to access the admin dashboard.</p>
                    <button 
                        onClick={connectWallet}
                        className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors"
                    >
                        Connect Wallet
                    </button>
                </div>
            </div>
        );
    }

    if (!isAdmin) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-8">
                <div className="bg-white rounded-2xl p-12 shadow-lg border border-red-200 text-center max-w-md">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Shield className="w-8 h-8 text-red-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">Access Denied</h2>
                    <p className="text-slate-600 mb-4">This area is restricted to authorized administrators only.</p>
                    <code className="text-xs bg-slate-100 px-3 py-1 rounded text-slate-500 font-mono">
                        {account.slice(0, 8)}...{account.slice(-6)}
                    </code>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 p-8 pt-24">
            <div className="max-w-7xl mx-auto">
                
                {/* Header */}
                <div className="flex items-center gap-3 mb-8">
                    <Shield className="w-8 h-8 text-indigo-600" />
                    <h1 className="text-3xl font-bold text-slate-900">Protocol Administration</h1>
                </div>

                {/* Tabs */}
                <div className="flex gap-4 mb-8 border-b border-slate-200">
                    <button
                        onClick={() => setActiveTab('analytics')}
                        className={`pb-4 px-2 font-medium transition-colors border-b-2 ${
                            activeTab === 'analytics' 
                                ? 'border-indigo-600 text-indigo-600' 
                                : 'border-transparent text-slate-500 hover:text-slate-700'
                        }`}
                    >
                        <div className="flex items-center gap-2">
                            <Activity className="w-4 h-4" /> Analytics
                        </div>
                    </button>
                    <button
                        onClick={() => setActiveTab('users')}
                        className={`pb-4 px-2 font-medium transition-colors border-b-2 ${
                            activeTab === 'users' 
                                ? 'border-indigo-600 text-indigo-600' 
                                : 'border-transparent text-slate-500 hover:text-slate-700'
                        }`}
                    >
                        <div className="flex items-center gap-2">
                            <Users className="w-4 h-4" /> User Management
                        </div>
                    </button>
                    <button
                        onClick={() => {
                            setActiveTab('mints');
                            setNewRequestCount(0);
                        }}
                        className={`pb-4 px-2 font-medium transition-colors border-b-2 ${
                            activeTab === 'mints' 
                                ? 'border-indigo-600 text-indigo-600' 
                                : 'border-transparent text-slate-500 hover:text-slate-700'
                        }`}
                    >
                        <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4" /> Mint Requests
                            {pendingRequests.length > 0 && (
                                <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full animate-pulse">
                                    {pendingRequests.length}
                                </span>
                            )}
                            {newRequestCount > 0 && (
                                <span className="bg-green-500 text-white text-xs px-1.5 py-0.5 rounded-full animate-bounce">
                                    +{newRequestCount}
                                </span>
                            )}
                        </div>
                    </button>
                    <button
                        onClick={() => setActiveTab('settings')}
                        className={`pb-4 px-2 font-medium transition-colors border-b-2 ${
                            activeTab === 'settings' 
                                ? 'border-indigo-600 text-indigo-600' 
                                : 'border-transparent text-slate-500 hover:text-slate-700'
                        }`}
                    >
                        <div className="flex items-center gap-2">
                            <Settings className="w-4 h-4" /> Global Settings
                        </div>
                    </button>
                </div>

                {/* Analytics Tab */}
                {activeTab === 'analytics' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                                <h3 className="text-slate-500 text-sm font-medium mb-2">Total Identities</h3>
                                <div className="text-3xl font-bold text-indigo-600">{analyticsData?.totalUsers || 0}</div>
                            </div>
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                                <h3 className="text-slate-500 text-sm font-medium mb-2">Total Transmissions</h3>
                                <div className="text-3xl font-bold text-purple-600">{analyticsData?.totalTransmissions || 0}</div>
                            </div>
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                                <h3 className="text-slate-500 text-sm font-medium mb-2">Oracle Interactions</h3>
                                <div className="text-3xl font-bold text-amber-600">{analyticsData?.totalInteractions || 0}</div>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                            <h3 className="font-bold text-slate-900 mb-6">Activity Growth</h3>
                            <div className="h-80">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={analyticsData?.chartData || []}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis 
                                            dataKey="date" 
                                            tickFormatter={(val) => format(new Date(val), 'MMM d')}
                                            axisLine={false}
                                            tickLine={false}
                                        />
                                        <YAxis axisLine={false} tickLine={false} />
                                        <Tooltip 
                                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                            labelFormatter={(val) => format(new Date(val), 'MMMM d, yyyy')}
                                        />
                                        <Bar dataKey="count" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* User Management Tab */}
                {activeTab === 'users' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        {/* Desktop Table */}
                        <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-slate-50 border-b border-slate-200">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">User</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">Address</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">Status</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">Joined</th>
                                        <th className="px-6 py-4 text-right text-sm font-semibold text-slate-600">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {users?.map((user) => (
                                        <tr key={user.id} className="hover:bg-slate-50/50">
                                            <td className="px-6 py-4">
                                                <div className="font-medium text-slate-900">{user.display_name || 'Anonymous'}</div>
                                                <div className="text-xs text-slate-500">Token #{user.token_id}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <code className="text-xs bg-slate-100 px-2 py-1 rounded text-slate-600 font-mono">
                                                    {user.address}
                                                </code>
                                            </td>
                                            <td className="px-6 py-4">
                                                {user.banned ? (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                                        <Ban className="w-3 h-3" /> Banned
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                        <CheckCircle className="w-3 h-3" /> Active
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-slate-500">
                                                {format(new Date(user.created_date), 'MMM d, yyyy')}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button
                                                    onClick={() => toggleBanMutation.mutate({ id: user.id, banned: !user.banned })}
                                                    className={`text-sm font-medium px-3 py-1 rounded-lg transition-colors ${
                                                        user.banned
                                                            ? 'bg-green-50 text-green-700 hover:bg-green-100'
                                                            : 'bg-red-50 text-red-700 hover:bg-red-100'
                                                    }`}
                                                >
                                                    {user.banned ? 'Unban' : 'Ban User'}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        </div>

                        {/* Mobile Cards */}
                        <div className="md:hidden space-y-4">
                            {users?.map((user) => (
                                <div key={user.id} className="bg-white rounded-xl border border-slate-200 p-4 space-y-3 min-h-11">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="font-medium text-slate-900">{user.display_name || 'Anonymous'}</p>
                                            <p className="text-xs text-slate-500">Token #{user.token_id}</p>
                                        </div>
                                        {user.banned ? (
                                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                                <Ban className="w-3 h-3" /> Banned
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                <CheckCircle className="w-3 h-3" /> Active
                                            </span>
                                        )}
                                    </div>
                                    <code className="text-xs bg-slate-100 px-2 py-1 rounded text-slate-600 font-mono block break-all">
                                        {user.address}
                                    </code>
                                    <div className="flex justify-between items-center text-sm text-slate-500">
                                        <span>{new Date(user.created_date).toLocaleDateString()}</span>
                                        <button
                                            onClick={() => toggleBanMutation.mutate({ id: user.id, banned: !user.banned })}
                                            className={`text-sm font-medium px-3 py-2 rounded-lg transition-colors min-h-11 ${
                                                user.banned
                                                    ? 'bg-green-50 text-green-700 hover:bg-green-100'
                                                    : 'bg-red-50 text-red-700 hover:bg-red-100'
                                            }`}
                                        >
                                            {user.banned ? 'Unban' : 'Ban'}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* Mint Requests Tab */}
                {activeTab === 'mints' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                        
                        {/* Pending/Processing Requests */}
                        <div className="rounded-2xl shadow-sm border border-slate-100">
                            <div className="px-6 py-4 bg-amber-50 border-b border-amber-100 rounded-t-2xl">
                                <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                    <Clock className="w-5 h-5 text-amber-600" />
                                    Active Mint Requests ({pendingRequests.length})
                                </h3>
                                <p className="text-sm text-slate-600 mt-1">Pending verification or manual minting on Solana Name Service</p>
                            </div>

                            {/* Desktop Table */}
                            <div className="hidden md:block bg-white overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-slate-50 border-b border-slate-200">
                                        <tr>
                                            <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">Subdomain</th>
                                            <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">User</th>
                                            <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">Payment</th>
                                            <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">Requested</th>
                                            <th className="px-6 py-4 text-right text-sm font-semibold text-slate-600">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {pendingRequests.length === 0 ? (
                                            <tr>
                                                <td colSpan="5" className="px-6 py-12 text-center text-slate-500">
                                                    No pending mint requests
                                                </td>
                                            </tr>
                                        ) : (
                                            pendingRequests.map((request) => (
                                                <tr key={request.id} className="hover:bg-slate-50/50">
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-2">
                                                            <div className="font-medium text-slate-900">{request.subdomain}</div>
                                                            {request.status === 'processing' && (
                                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                                    Processing
                                                                </span>
                                                            )}
                                                        </div>
                                                        {request.image_url && (
                                                            <a 
                                                                href={request.image_url} 
                                                                target="_blank" 
                                                                rel="noopener noreferrer"
                                                                className="text-xs text-indigo-600 hover:underline flex items-center gap-1 mt-1"
                                                            >
                                                                View Avatar <ExternalLink className="w-3 h-3" />
                                                            </a>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <code className="text-xs bg-slate-100 px-2 py-1 rounded text-slate-600 font-mono">
                                                            {request.user_address.slice(0, 8)}...{request.user_address.slice(-6)}
                                                        </code>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="text-sm font-medium text-green-700">
                                                            {request.amount_paid_sol?.toFixed(4)} SOL
                                                        </div>
                                                        <a 
                                                            href={`https://explorer.solana.com/tx/${request.payment_signature}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-xs text-indigo-600 hover:underline flex items-center gap-1"
                                                        >
                                                            View TX <ExternalLink className="w-3 h-3" />
                                                        </a>
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-slate-500">
                                                        {format(new Date(request.created_date), 'MMM d, h:mm a')}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center justify-end gap-2">
                                                            {request.status === 'pending' && (
                                                                <button
                                                                    onClick={() => updateMintStatusMutation.mutate({ id: request.id, status: 'processing' })}
                                                                    className="text-sm font-medium px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors flex items-center gap-1"
                                                                >
                                                                    <Clock className="w-4 h-4" /> Start Processing
                                                                </button>
                                                            )}
                                                            <button
                                                                onClick={() => updateMintStatusMutation.mutate({ id: request.id, status: 'minted' })}
                                                                className="text-sm font-medium px-3 py-1.5 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 transition-colors flex items-center gap-1"
                                                            >
                                                                <CheckCircle2 className="w-4 h-4" /> Mark Minted
                                                            </button>
                                                            <button
                                                                onClick={() => updateMintStatusMutation.mutate({ id: request.id, status: 'failed' })}
                                                                className="text-sm font-medium px-3 py-1.5 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 transition-colors flex items-center gap-1"
                                                            >
                                                                <XCircle className="w-4 h-4" /> Mark Failed
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Historical Requests */}
                         <div className="rounded-2xl shadow-sm border border-slate-100">
                            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 rounded-t-2xl">
                                <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                    <FileText className="w-5 h-5 text-slate-600" />
                                    Historical Requests ({historicalRequests.length})
                                </h3>
                            </div>

                            {/* Desktop Table */}
                            <div className="hidden md:block bg-white overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-slate-50 border-b border-slate-200">
                                        <tr>
                                            <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">Subdomain</th>
                                            <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">User</th>
                                            <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">Status</th>
                                            <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">Date</th>
                                            <th className="px-6 py-4 text-right text-sm font-semibold text-slate-600">Payment</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {historicalRequests.length === 0 ? (
                                            <tr>
                                                <td colSpan="5" className="px-6 py-8 text-center text-slate-500">
                                                    No historical requests yet
                                                </td>
                                            </tr>
                                        ) : (
                                            historicalRequests.map((request) => (
                                                <tr key={request.id} className="hover:bg-slate-50/50">
                                                    <td className="px-6 py-4">
                                                        <div className="font-medium text-slate-900">{request.subdomain}</div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <code className="text-xs bg-slate-100 px-2 py-1 rounded text-slate-600 font-mono">
                                                            {request.user_address.slice(0, 8)}...{request.user_address.slice(-6)}
                                                        </code>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        {request.status === 'minted' ? (
                                                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                                <CheckCircle className="w-3 h-3" /> Minted
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                                                <XCircle className="w-3 h-3" /> Failed
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-slate-500">
                                                        {format(new Date(request.created_date), 'MMM d, yyyy')}
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <div className="text-sm text-slate-600">
                                                            {request.amount_paid_sol?.toFixed(4)} SOL
                                                        </div>
                                                        <a 
                                                            href={`https://explorer.solana.com/tx/${request.payment_signature}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-xs text-indigo-600 hover:underline"
                                                        >
                                                            View TX
                                                        </a>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                        </tbody>
                                        </table>
                                        </div>

                                        {/* Mobile Cards */}
                                        <div className="md:hidden bg-white space-y-3 p-4">
                                        {historicalRequests.length === 0 ? (
                                        <p className="text-center text-slate-500 py-8">No historical requests yet</p>
                                        ) : (
                                        historicalRequests.map((request) => (
                                            <div key={request.id} className="border border-slate-200 rounded-lg p-4 space-y-2 min-h-11">
                                                <div className="flex justify-between items-start">
                                                    <p className="font-medium text-slate-900">{request.subdomain}</p>
                                                    {request.status === 'minted' ? (
                                                        <span className="text-xs font-medium text-green-700">✓ Minted</span>
                                                    ) : (
                                                        <span className="text-xs font-medium text-red-700">✗ Failed</span>
                                                    )}
                                                </div>
                                                <code className="text-xs bg-slate-100 px-2 py-1 rounded block break-all">
                                                    {request.user_address.slice(0, 8)}...{request.user_address.slice(-6)}
                                                </code>
                                                <div className="text-sm text-slate-500">
                                                    <p>{new Date(request.created_date).toLocaleDateString()}</p>
                                                    <p className="text-green-700 font-medium">{request.amount_paid_sol?.toFixed(4)} SOL</p>
                                                </div>
                                            </div>
                                        ))
                                        )}
                                        </div>
                                        </div>

                                        </motion.div>
                                        )}

                {/* Settings Tab */}
                {activeTab === 'settings' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-2xl">
                        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 space-y-8">
                            
                            <div>
                                <h3 className="text-lg font-bold text-slate-900 mb-1 flex items-center gap-2">
                                    <Calendar className="w-5 h-5 text-indigo-600" />
                                    Genesis Configuration
                                </h3>
                                <p className="text-slate-500 text-sm mb-4">Set the official start date of the metaphysical chain.</p>
                                
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700">Genesis Date</label>
                                    <input
                                        type="date"
                                        value={genesisDate}
                                        onChange={(e) => setGenesisDate(e.target.value)}
                                        className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                                    />
                                </div>
                            </div>

                            <div className="border-t border-slate-100 pt-6">
                                <h3 className="text-lg font-bold text-slate-900 mb-1 flex items-center gap-2">
                                    <DollarSign className="w-5 h-5 text-indigo-600" />
                                    Payment Configuration
                                </h3>
                                <p className="text-slate-500 text-sm mb-4">Configure platform fee and payment vault.</p>
                                
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-sm font-medium text-slate-700">Platform Fee (USD)</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={platformFee}
                                            onChange={(e) => setPlatformFee(parseFloat(e.target.value))}
                                            className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none mt-2"
                                        />
                                    </div>

                                    <div>
                                        <label className="text-sm font-medium text-slate-700">Admin Wallet Address</label>
                                        <input
                                            type="text"
                                            value={adminWallet}
                                            onChange={(e) => setAdminWallet(e.target.value)}
                                            placeholder="Solana wallet address"
                                            className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none mt-2 font-mono text-sm"
                                        />
                                        <p className="text-xs text-slate-400 mt-1">This wallet will receive all mint payments</p>
                                    </div>
                                </div>
                            </div>

                            <div className="border-t border-slate-100 pt-6">
                                <h3 className="text-lg font-bold text-slate-900 mb-1 flex items-center gap-2">
                                    <AlertTriangle className="w-5 h-5 text-amber-600" />
                                    System Status
                                </h3>
                                <div className="flex items-center justify-between mt-4">
                                    <div>
                                        <div className="font-medium text-slate-900">Maintenance Mode</div>
                                        <div className="text-xs text-slate-500">Disable all new mints and transactions</div>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input 
                                            type="checkbox" 
                                            className="sr-only peer" 
                                            checked={maintenanceMode}
                                            onChange={(e) => setMaintenanceMode(e.target.checked)}
                                        />
                                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                                    </label>
                                </div>
                            </div>

                            <div className="pt-4">
                                <button
                                    onClick={handleSaveSettings}
                                    className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
                                >
                                    <Save className="w-4 h-4" /> Save Configuration
                                </button>
                            </div>

                        </div>
                    </motion.div>
                )}
            </div>
        </div>
    );
}