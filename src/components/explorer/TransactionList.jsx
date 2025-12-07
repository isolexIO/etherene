import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, ArrowRight, Clock, CheckCircle2 } from 'lucide-react';

const MOCK_TXS = [
  { hash: "0x71c...9a23", from: "0xab1...23cd", to: "0xef4...56gh", type: "Declaration", age: "12 secs ago", status: "Success" },
  { hash: "0x3b2...1c4d", from: "0x890...12kl", to: "Contract: Identity", type: "Mint Identity", age: "45 secs ago", status: "Success" },
  { hash: "0x9d1...8e2f", from: "0x345...67mn", to: "0xab1...23cd", type: "Transfer", age: "1 min ago", status: "Success" },
  { hash: "0x1a2...3b4c", from: "0x678...90op", to: "Contract: Oracle", type: "Query", age: "2 mins ago", status: "Pending" },
  { hash: "0x5e6...7f8g", from: "0x123...45qr", to: "0xef4...56gh", type: "Vote", age: "5 mins ago", status: "Success" },
  { hash: "0x9h0...1i2j", from: "0xab1...23cd", to: "Contract: Governance", type: "Proposal", age: "8 mins ago", status: "Success" },
  { hash: "0x3k4...5l6m", from: "0x789...01st", to: "0x345...67mn", type: "Transfer", age: "12 mins ago", status: "Failed" },
];

export default function TransactionList({ searchTerm }) {
  const [transactions, setTransactions] = useState(MOCK_TXS);

  // Simulate live feed
  useEffect(() => {
    const interval = setInterval(() => {
      const newTx = {
        hash: `0x${Math.random().toString(16).substr(2, 10)}...`,
        from: `0x${Math.random().toString(16).substr(2, 8)}...`,
        to: Math.random() > 0.7 ? "Contract: Identity" : `0x${Math.random().toString(16).substr(2, 8)}...`,
        type: ["Declaration", "Mint Identity", "Transfer", "Vote"][Math.floor(Math.random() * 4)],
        age: "Just now",
        status: "Success"
      };
      setTransactions(prev => [newTx, ...prev.slice(0, 9)]);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const filteredTxs = transactions.filter(tx => 
    tx.hash.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tx.from.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tx.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
                    <div className="flex items-center gap-2 text-indigo-600 font-mono text-sm">
                      <FileText className="w-4 h-4 text-slate-400" />
                      {tx.hash}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-medium">
                      {tx.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <span className="font-mono">{tx.from}</span>
                      <ArrowRight className="w-3 h-3 text-slate-400" />
                      <span className="font-mono">{tx.to}</span>
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