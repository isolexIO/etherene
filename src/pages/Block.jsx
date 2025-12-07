import React from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Box, Clock, Database, Shield, Hash } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createPageUrl } from '../utils';

export default function Block() {
  const [searchParams] = useSearchParams();
  const number = searchParams.get('number') || "0";

  const blockData = {
    number: number,
    hash: "0xabc...def",
    timestamp: "Just now",
    transactions: 142,
    miner: "0xMiner...123",
    reward: "2.1 ETH",
    size: "45,230 bytes",
    gasUsed: "14,500,000 (48%)",
    parentHash: "0xprev...hash"
  };

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
          <h1 className="text-2xl font-bold text-slate-900">Block #{number}</h1>
          <p className="text-slate-500 font-mono text-sm">{blockData.hash}</p>
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
                <dd className="col-span-2 font-mono text-indigo-600">{blockData.miner}</dd>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6">
                <dt className="font-medium text-slate-500">Block Reward</dt>
                <dd className="col-span-2 text-slate-700">{blockData.reward}</dd>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6">
                <dt className="font-medium text-slate-500">Gas Used</dt>
                <dd className="col-span-2 text-slate-700">{blockData.gasUsed}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}