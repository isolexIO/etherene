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
            const moment = (await import('moment')).default;
            const { base44 } = await import('@/api/base44Client');
            
            // Reconstruct Date from Block Number (Days since Genesis 2024-01-01)
            const genesis = moment.utc('2024-01-01');
            const blockDate = genesis.add(Number(number), 'days');
            
            // Format for filtering (YYYY-MM-DD)
            const dateStr = blockDate.format('YYYY-MM-DD');
            
            // Fetch activities for this day
            // Note: Filters might need "gte" and "lt" but standard filter is equality. 
            // We'll fetch all and filter client side for now as simpler query
            const [identities, transmissions, interactions] = await Promise.all([
                base44.entities.Identity.list(),
                base44.entities.Transmission.list(),
                base44.entities.OracleInteraction.list()
            ]);

            const filterByDate = (item) => {
                const itemDate = moment.utc(item.created_date);
                return itemDate.isBetween(blockDate.clone().startOf('day'), blockDate.clone().endOf('day'));
            };

            const dayTxs = [
                ...identities.filter(filterByDate),
                ...transmissions.filter(filterByDate),
                ...interactions.filter(filterByDate)
            ];

            setBlockData({
                number: number,
                hash: "0x" + Math.abs(dateStr.split('').reduce((a,b)=>{a=((a<<5)-a)+b.charCodeAt(0);return a&a},0)).toString(16).padStart(64, '0'), // Pseudo hash from date
                timestamp: blockDate.format('MMMM Do YYYY, h:mm:ss a') + " (UTC)",
                transactions: dayTxs.length,
                miner: "Chronos (Time itself)",
                gasUsed: (dayTxs.length * 21000).toString(),
                parentHash: "0x" + Math.abs(moment(blockDate).subtract(1, 'days').format('YYYY-MM-DD').split('').reduce((a,b)=>{a=((a<<5)-a)+b.charCodeAt(0);return a&a},0)).toString(16).padStart(64, '0')
            });

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