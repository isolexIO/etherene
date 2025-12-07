import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Layers, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createPageUrl } from '../utils';

export default function Transaction() {
  const [searchParams] = useSearchParams();
  const hash = searchParams.get('hash');
  const [txData, setTxData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTx = async () => {
        if (!hash) return;
        setLoading(true);
        try {
            const { ethers } = await import('ethers');
            const provider = new ethers.JsonRpcProvider("https://eth.llamarpc.com");
            const tx = await provider.getTransaction(hash);
            const receipt = await provider.getTransactionReceipt(hash);

            if (tx) {
                setTxData({
                    hash: tx.hash,
                    status: receipt && receipt.status === 1 ? "Success" : "Failed",
                    block: tx.blockNumber,
                    from: tx.from,
                    to: tx.to,
                    value: ethers.formatEther(tx.value) + " ETH",
                    fee: receipt ? ethers.formatEther(receipt.fee) + " ETH" : "Pending",
                    gasPrice: ethers.formatUnits(tx.gasPrice, 'gwei') + " Gwei",
                    nonce: tx.nonce
                });
            } else {
                setError("Transaction not found");
            }
        } catch (e) {
            console.error(e);
            setError("Failed to fetch transaction");
        } finally {
            setLoading(false);
        }
    };
    fetchTx();
  }, [hash]);

  if (loading) return <div className="flex justify-center p-20"><Loader2 className="w-10 h-10 animate-spin text-indigo-600"/></div>;
  if (error || !txData) return <div className="p-20 text-center text-red-500"><AlertCircle className="w-10 h-10 mx-auto mb-4"/>{error || "Transaction not found"}</div>;

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <Link to={createPageUrl('BlockExplorer')} className="inline-flex items-center gap-2 text-slate-500 hover:text-indigo-600 mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Back to Explorer
      </Link>

      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600">
          <Layers className="w-8 h-8" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Transaction Details</h1>
          <p className="text-slate-500 font-mono text-sm break-all">{txData.hash}</p>
        </div>
      </div>

      <Card className="border-slate-100 shadow-sm mb-8">
        <CardHeader className="border-b border-slate-50 bg-slate-50/50">
          <CardTitle className="text-lg text-slate-800 flex items-center gap-2">
            <CheckCircle2 className={`w-5 h-5 ${txData.status === 'Success' ? 'text-green-500' : 'text-red-500'}`} />
            Transaction {txData.status}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <dl className="divide-y divide-slate-100">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6">
              <dt className="font-medium text-slate-500">Transaction Hash</dt>
              <dd className="col-span-2 font-mono text-slate-900 break-all">{txData.hash}</dd>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6">
              <dt className="font-medium text-slate-500">Block</dt>
              <dd className="col-span-2 text-indigo-600 font-mono cursor-pointer hover:underline">
                <Link to={`${createPageUrl('Block')}?number=${txData.block}`}>#{txData.block}</Link>
              </dd>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6">
              <dt className="font-medium text-slate-500">From</dt>
              <dd className="col-span-2 font-mono text-slate-900 break-all">{txData.from}</dd>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6">
              <dt className="font-medium text-slate-500">To</dt>
              <dd className="col-span-2 font-mono text-slate-900 break-all">{txData.to}</dd>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6">
              <dt className="font-medium text-slate-500">Value</dt>
              <dd className="col-span-2 text-slate-900 font-medium">{txData.value}</dd>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6">
              <dt className="font-medium text-slate-500">Transaction Fee</dt>
              <dd className="col-span-2 text-slate-600">{txData.fee}</dd>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6">
              <dt className="font-medium text-slate-500">Gas Price</dt>
              <dd className="col-span-2 text-slate-600">{txData.gasPrice}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}