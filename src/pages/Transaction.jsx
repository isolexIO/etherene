import React from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Box, Clock, Database, Shield, CheckCircle2, Layers } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createPageUrl } from '../utils';

export default function Transaction() {
  const [searchParams] = useSearchParams();
  const hash = searchParams.get('hash') || "0x...";

  // Mock data based on hash
  const txData = {
    hash: hash,
    status: "Success",
    block: "14205921",
    timestamp: "2 mins ago",
    from: "0xab12...34cd",
    to: "0xef56...78gh",
    value: "4.2 ETH",
    fee: "0.0021 ETH",
    gasPrice: "12 Gwei",
    nonce: 42
  };

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
          <p className="text-slate-500 font-mono text-sm">{hash}</p>
        </div>
      </div>

      <Card className="border-slate-100 shadow-sm mb-8">
        <CardHeader className="border-b border-slate-50 bg-slate-50/50">
          <CardTitle className="text-lg text-slate-800 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-500" />
            Transaction Success
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <dl className="divide-y divide-slate-100">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6">
              <dt className="font-medium text-slate-500">Transaction Hash</dt>
              <dd className="col-span-2 font-mono text-slate-900 break-all">{txData.hash}</dd>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6">
              <dt className="font-medium text-slate-500">Status</dt>
              <dd className="col-span-2">
                <span className="px-2.5 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-medium">
                  {txData.status}
                </span>
              </dd>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6">
              <dt className="font-medium text-slate-500">Block</dt>
              <dd className="col-span-2 text-indigo-600 font-mono cursor-pointer hover:underline">
                <Link to={`${createPageUrl('Block')}?number=${txData.block}`}>#{txData.block}</Link>
              </dd>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6">
              <dt className="font-medium text-slate-500">From</dt>
              <dd className="col-span-2 font-mono text-slate-900">{txData.from}</dd>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6">
              <dt className="font-medium text-slate-500">To</dt>
              <dd className="col-span-2 font-mono text-slate-900">{txData.to}</dd>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6">
              <dt className="font-medium text-slate-500">Value</dt>
              <dd className="col-span-2 text-slate-900 font-medium">{txData.value}</dd>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6">
              <dt className="font-medium text-slate-500">Transaction Fee</dt>
              <dd className="col-span-2 text-slate-600">{txData.fee}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}