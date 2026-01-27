import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, Loader2, CheckCircle2, AlertCircle, Search } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function ImportIdentity({ account, onSuccess }) {
    const [domain, setDomain] = useState('');
    const [isVerifying, setIsVerifying] = useState(false);
    const [verificationResult, setVerificationResult] = useState(null);

    const handleVerify = async () => {
        if (!domain.trim()) {
            toast.error("Please enter a domain name");
            return;
        }

        setIsVerifying(true);
        setVerificationResult(null);

        try {
            const response = await base44.functions.invoke('verifyIdentity', {
                domain: domain.trim(),
                userAddress: account
            });

            const data = response.data;

            if (data.success) {
                setVerificationResult({
                    success: true,
                    subdomain: data.subdomain,
                    owner: data.owner
                });
                toast.success("Identity verified! Click Import to claim it.");
            } else {
                setVerificationResult({
                    success: false,
                    error: data.error || "Verification failed"
                });
                toast.error(data.error || "Could not verify ownership");
            }
        } catch (error) {
            console.error(error);
            setVerificationResult({
                success: false,
                error: error.response?.data?.error || "Verification failed"
            });
            toast.error("Failed to verify identity");
        } finally {
            setIsVerifying(false);
        }
    };

    const handleImport = async () => {
        if (!verificationResult?.success) return;

        try {
            await base44.entities.Identity.create({
                address: account,
                subdomain: verificationResult.subdomain,
                network: 'Solana Mainnet',
                status: 'minted',
                bio: `Imported Solana identity: ${verificationResult.subdomain}`
            });

            toast.success("Identity imported successfully!");
            onSuccess?.();
        } catch (error) {
            console.error(error);
            toast.error("Failed to import identity");
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm"
        >
            <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-indigo-50 rounded-lg">
                    <Shield className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                    <h3 className="font-bold text-slate-900">Import Existing Identity</h3>
                    <p className="text-sm text-slate-500">Claim a Solana domain you already own</p>
                </div>
            </div>

            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                        Domain Name
                    </label>
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                value={domain}
                                onChange={(e) => setDomain(e.target.value)}
                                placeholder="yourname.sol or subdomain.parent.sol"
                                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-100 focus:border-indigo-600 outline-none"
                                onKeyPress={(e) => e.key === 'Enter' && handleVerify()}
                            />
                        </div>
                        <button
                            onClick={handleVerify}
                            disabled={isVerifying || !domain.trim()}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {isVerifying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                            Verify
                        </button>
                    </div>
                    <p className="text-xs text-slate-400 mt-2">
                        Enter any Solana domain name you own. We'll verify ownership via your connected wallet.
                    </p>
                </div>

                {verificationResult && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className={`p-4 rounded-lg border ${
                            verificationResult.success
                                ? 'bg-green-50 border-green-200'
                                : 'bg-red-50 border-red-200'
                        }`}
                    >
                        {verificationResult.success ? (
                            <div>
                                <div className="flex items-center gap-2 text-green-700 font-medium mb-2">
                                    <CheckCircle2 className="w-5 h-5" />
                                    Ownership Verified
                                </div>
                                <p className="text-sm text-green-600 mb-4">
                                    You own <strong>{verificationResult.subdomain}</strong>
                                </p>
                                <button
                                    onClick={handleImport}
                                    className="w-full px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
                                >
                                    Import This Identity
                                </button>
                            </div>
                        ) : (
                            <div className="flex items-start gap-2 text-red-700">
                                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-medium mb-1">Verification Failed</p>
                                    <p className="text-sm text-red-600">{verificationResult.error}</p>
                                </div>
                            </div>
                        )}
                    </motion.div>
                )}
            </div>
        </motion.div>
    );
}