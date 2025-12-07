import React from 'react';
import { motion } from 'framer-motion';
import { Shield, User, Hash, Calendar, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import moment from 'moment';

export default function IdentityList({ searchTerm }) {
  const { data: identities, isLoading } = useQuery({
    queryKey: ['identities'],
    queryFn: () => base44.entities.Identity.list('-created_date'),
  });

  const filteredIdentities = (identities || []).filter(id => 
    id.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (id.display_name && id.display_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (isLoading) {
      return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;
  }

  if (filteredIdentities.length === 0) {
      return <div className="text-center p-12 text-slate-500">No identities found.</div>;
  }

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {filteredIdentities.map((identity, index) => (
        <motion.div
          key={identity.address + index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all hover:-translate-y-1"
        >
          <div className="flex items-start justify-between mb-6">
            <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600">
              {identity.avatar_url ? (
                  <img src={identity.avatar_url} alt="Avatar" className="w-6 h-6 rounded-full object-cover" />
              ) : (
                  <User className="w-6 h-6" />
              )}
            </div>
            <span className={`text-xs font-medium px-3 py-1 rounded-full flex items-center gap-1 ${
                identity.verification_status === 'verified' ? 'bg-green-50 text-green-600' : 'bg-slate-50 text-slate-600'
            }`}>
              <Shield className="w-3 h-3" />
              {identity.verification_status === 'verified' ? 'Verified' : 'Minted'}
            </span>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Soul Name</label>
              <div className="text-lg font-bold text-slate-900">{identity.display_name || 'Anonymous Node'}</div>
            </div>
            
            <div>
              <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Address</label>
              <Link to={`${createPageUrl('Profile')}?address=${identity.address}`} className="flex items-center gap-2 text-sm font-mono text-indigo-600 bg-indigo-50 px-3 py-2 rounded-lg truncate hover:underline">
                <Hash className="w-3 h-3 text-indigo-400 flex-shrink-0" />
                <span className="truncate">{identity.address}</span>
              </Link>
            </div>

            <div className="pt-4 border-t border-slate-50 flex items-center gap-2 text-xs text-slate-400">
              <Calendar className="w-3 h-3" />
              Joined {moment(identity.created_date).format("MMM D, YYYY")}
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}