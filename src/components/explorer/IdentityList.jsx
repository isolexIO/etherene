import React from 'react';
import { motion } from 'framer-motion';
import { Shield, User, Hash, Calendar } from 'lucide-react';

const MOCK_IDENTITIES = [
  { address: "0xab1...23cd", soulName: "Seeker_01", joined: "Jan 12, 2024", status: "Verified" },
  { address: "0x890...12kl", soulName: "Truth_Walker", joined: "Feb 04, 2024", status: "Verified" },
  { address: "0x345...67mn", soulName: "Node_Keeper", joined: "Feb 18, 2024", status: "Verified" },
  { address: "0x678...90op", soulName: "Light_Bearer", joined: "Mar 01, 2024", status: "Verified" },
  { address: "0x123...45qr", soulName: "Code_Weaver", joined: "Mar 15, 2024", status: "Verified" },
  { address: "0xef4...56gh", soulName: "Dao_Voice", joined: "Mar 22, 2024", status: "Verified" },
];

export default function IdentityList({ searchTerm }) {
  const filteredIdentities = MOCK_IDENTITIES.filter(id => 
    id.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
    id.soulName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {filteredIdentities.map((identity, index) => (
        <motion.div
          key={identity.address}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all hover:-translate-y-1"
        >
          <div className="flex items-start justify-between mb-6">
            <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600">
              <User className="w-6 h-6" />
            </div>
            <span className="bg-green-50 text-green-600 text-xs font-medium px-3 py-1 rounded-full flex items-center gap-1">
              <Shield className="w-3 h-3" />
              {identity.status}
            </span>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Soul Name</label>
              <div className="text-lg font-bold text-slate-900">{identity.soulName}</div>
            </div>
            
            <div>
              <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Address</label>
              <div className="flex items-center gap-2 text-sm font-mono text-slate-600 bg-slate-50 px-3 py-2 rounded-lg">
                <Hash className="w-3 h-3 text-slate-400" />
                {identity.address}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-50 flex items-center gap-2 text-xs text-slate-400">
              <Calendar className="w-3 h-3" />
              Joined {identity.joined}
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}