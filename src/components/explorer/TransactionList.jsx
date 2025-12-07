import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, ArrowRight, Clock, CheckCircle2 } from 'lucide-react';

const MOCK_TXS = [];

import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';

export default function TransactionList({ transactions, searchTerm, watchedAddresses }) {
  const displayTxs = transactions || [];
  const filteredTxs = displayTxs.filter(tx => 
    tx.hash.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tx.from.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tx.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (filteredTxs.length === 0) {
      return (
          <div className="p-8 text-center text-slate-500 bg-white rounded-2xl border border-slate-100">
              No transactions found.
          </div>
      );
  }

  const isWatched = (address) => watchedAddresses.includes(address);

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Tx Hash</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Type</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">From / To</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Age</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            <AnimatePresence initial={false}>
              {filteredTxs.map((tx) => (
                <motion.tr 
                  key={tx.hash}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="hover:bg-slate-50/50 transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Link 
                      to={`${createPageUrl('Transaction')}?hash=${tx.hash}`}
                      className="flex items-center gap-2 text-indigo-600 font-mono text-sm hover:underline"
                    >
                      <FileText className="w-4 h-4 text-slate-400" />
                      {tx.hash}
                    </Link>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-medium">
                      {tx.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <span className={`font-mono ${isWatched(tx.from) ? "bg-amber-100 px-1 rounded text-amber-800 font-bold" : ""}`}>
                        {tx.from}
                      </span>
                      <ArrowRight className="w-3 h-3 text-slate-400" />
                      <span className={`font-mono ${isWatched(tx.to) ? "bg-amber-100 px-1 rounded text-amber-800 font-bold" : ""}`}>
                        {tx.to}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-1 text-sm text-slate-500">
                      <Clock className="w-3 h-3" />
                      {tx.age}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full w-fit ${
                      tx.status === 'Success' ? 'bg-green-50 text-green-600' : 
                      tx.status === 'Pending' ? 'bg-amber-50 text-amber-600' : 
                      'bg-red-50 text-red-600'
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