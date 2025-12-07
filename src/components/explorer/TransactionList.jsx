import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, ArrowRight, Clock, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';

export default function TransactionList({ transactions, searchTerm, watchedAddresses }) {
  const filteredTxs = transactions.filter(tx => 
    tx.hash.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tx.from.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tx.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const isWatched = (address) => watchedAddresses.includes(address);

  return (
    <div className="bg-slate-900/40 rounded-2xl border border-slate-800 backdrop-blur-sm overflow-hidden shadow-lg">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-900/50 border-b border-slate-800">
            <tr>
              <th className="px-6 py-4 font-semibold text-slate-400 text-sm">Tx Hash</th>
              <th className="px-6 py-4 font-semibold text-slate-400 text-sm">Type</th>
              <th className="px-6 py-4 font-semibold text-slate-400 text-sm">From / To</th>
              <th className="px-6 py-4 font-semibold text-slate-400 text-sm">Age</th>
              <th className="px-6 py-4 font-semibold text-slate-400 text-sm">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            <AnimatePresence initial={false}>
              {filteredTxs.map((tx, i) => (
                <motion.tr 
                  key={tx.hash}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="hover:bg-indigo-500/5 transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Link 
                      to={`${createPageUrl('Transaction')}?hash=${tx.hash}`}
                      className="flex items-center gap-2 text-indigo-400 font-mono text-sm hover:text-indigo-300 hover:underline decoration-indigo-400/50"
                    >
                      <FileText className="w-4 h-4 text-slate-600" />
                      {tx.hash}
                    </Link>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700">
                      {tx.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2 text-sm text-slate-400">
                      <span className={`font-mono ${isWatched(tx.from) ? "bg-amber-900/30 px-1 rounded text-amber-200 border border-amber-500/30" : ""}`}>
                        {tx.from}
                      </span>
                      <ArrowRight className="w-3 h-3 text-slate-600" />
                      <span className={`font-mono ${isWatched(tx.to) ? "bg-amber-900/30 px-1 rounded text-amber-200 border border-amber-500/30" : ""}`}>
                        {tx.to}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {tx.age}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full border ${
                      tx.status === 'Success' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 
                      tx.status === 'Pending' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 
                      'bg-red-500/10 text-red-400 border-red-500/20'
                    }`}>
                      {tx.status === 'Success' && <CheckCircle2 className="w-3 h-3" />}
                      {tx.status}
                    </span>
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
      </div>
    </div>
  );
}