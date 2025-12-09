import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Eye, Trash2, Plus, AlertCircle } from 'lucide-react';

export default function AddressWatchlist({ watchedAddresses, onAdd, onRemove }) {
  const [newAddress, setNewAddress] = useState('');

  const handleAdd = () => {
    if (newAddress && !watchedAddresses.includes(newAddress)) {
      onAdd(newAddress);
      setNewAddress('');
    }
  };

  return (
    <Card className="border-slate-100 shadow-sm sticky top-20 z-0">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <Eye className="w-5 h-5 text-indigo-600" />
          Watchlist
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2 mb-4">
          <Input 
            placeholder="0x..." 
            value={newAddress}
            onChange={(e) => setNewAddress(e.target.value)}
            className="font-mono text-sm"
          />
          <Button onClick={handleAdd} size="icon" className="bg-indigo-600 hover:bg-indigo-700 shrink-0">
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
          {watchedAddresses.length === 0 ? (
            <div className="text-center py-6 text-slate-400 text-sm flex flex-col items-center">
              <AlertCircle className="w-8 h-8 mb-2 opacity-20" />
              No addresses watched
            </div>
          ) : (
            watchedAddresses.map(addr => (
              <div key={addr} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg group">
                <span className="font-mono text-xs text-slate-600 truncate max-w-[180px]">{addr}</span>
                <button 
                  onClick={() => onRemove(addr)}
                  className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}