import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Box, Clock, Database, Shield, Hash, Loader2, AlertCircle } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { createPageUrl } from '../utils';

export default function Block() {
  const [searchParams] = useSearchParams();
  const number = searchParams.get('number');
  const [blockData, setBlockData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchBlock = async () => {
        if (!number) return;
        setLoading(true);
        try {
            const { ethers } = await import('ethers');
            const provider = new ethers.JsonRpcProvider("https://eth.llamarpc.com");
            const block = await provider.getBlock(number);
            
            if (block) {
                setBlockData({
                    number: block.number,
                    hash: block.hash,
                    timestamp: new Date(Number(block.timestamp) * 1000).toLocaleString(),
                    transactions: block.transactions.length,
                    miner: block.miner,
                    gasUsed: block.gasUsed.toString(),
                    parentHash: block.parentHash
                });
            } else {
                setError("Block not found");
            }
        } catch (e) {
            console.error(e);
            setError("Failed to fetch block data");
        } finally {
            setLoading(false);
        }
    };
    fetchBlock();
  }, [number]);

  if (loading) return <div className="flex justify-center p-20"><Loader2 className="w-10 h-10 animate-spin text-indigo-600"/></div>;
  if (error || !blockData) return <div className="p-20 text-center text-red-500"><AlertCircle className="w-10 h-10 mx-auto mb-4"/>{error || "Block not found"}</div>;

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <Link to={createPageUrl('BlockExplorer')} className="inline-flex items-center gap-2 text-slate-500 hover:text-indigo-600 mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Back to Explorer
      </Link>

      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600">
          <Box className="w-8 h-8" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Block #{blockData.number}</h1>
          <p className="text-slate-500 font-mono text-sm break-all">{blockData.hash}</p>
        </div>
      </div>

      <div className="grid gap-6">
        <Card className="border-slate-100 shadow-sm">
          <CardContent className="p-0">
            <dl className="divide-y divide-slate-100">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6">
                <dt className="font-medium text-slate-500 flex items-center gap-2">
                  <Hash className="w-4 h-4" /> Block Height
                </dt>
                <dd className="col-span-2 font-bold text-slate-900">{blockData.number}</dd>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6">
                <dt className="font-medium text-slate-500 flex items-center gap-2">
                  <Clock className="w-4 h-4" /> Timestamp
                </dt>
                <dd className="col-span-2 text-slate-700">{blockData.timestamp}</dd>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6">
                <dt className="font-medium text-slate-500 flex items-center gap-2">
                  <Database className="w-4 h-4" /> Transactions
                </dt>
                <dd className="col-span-2 text-slate-700">
                  <span className="text-indigo-600 font-medium">{blockData.transactions} transactions</span> in this block
                </dd>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6">
                <dt className="font-medium text-slate-500 flex items-center gap-2">
                  <Shield className="w-4 h-4" /> Validated By
                </dt>
                <dd className="col-span-2 font-mono text-indigo-600 break-all">{blockData.miner}</dd>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6">
                <dt className="font-medium text-slate-500">Gas Used</dt>
                <dd className="col-span-2 text-slate-700">{blockData.gasUsed}</dd>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6">
                <dt className="font-medium text-slate-500">Parent Hash</dt>
                <dd className="col-span-2 font-mono text-slate-500 break-all">{blockData.parentHash}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}