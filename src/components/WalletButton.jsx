import React, { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { Wallet, LogOut, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';

// Self-contained wallet connect/disconnect control.
// Disconnect is a direct one-click action (no nested dropdown), so it works
// inside overflow-hidden containers like the mobile nav menu.
export default function WalletButton({ fullWidth = false }) {
  const { publicKey, connected, disconnect } = useWallet();
  const { setVisible } = useWalletModal();
  const [copied, setCopied] = useState(false);

  const widthClass = fullWidth ? 'w-full' : '';

  if (!connected || !publicKey) {
    return (
      <button
        onClick={() => setVisible(true)}
        className={`flex items-center justify-center gap-2 bg-slate-800 rounded-lg px-4 py-2 text-sm font-medium text-slate-100 hover:bg-slate-700 transition-colors ${widthClass}`}
      >
        <Wallet className="w-4 h-4" />
        Connect Wallet
      </button>
    );
  }

  const address = publicKey.toBase58();
  const short = `${address.slice(0, 4)}…${address.slice(-4)}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error('Could not copy address');
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnect();
      toast.success('Wallet disconnected');
    } catch (e) {
      toast.error('Disconnect failed');
    }
  };

  return (
    <div className={`flex items-center gap-2 ${widthClass}`}>
      <button
        onClick={copy}
        title={address}
        className={`flex items-center gap-2 bg-slate-800 rounded-lg px-3 py-2 text-sm font-medium text-slate-100 hover:bg-slate-700 transition-colors ${fullWidth ? 'flex-1 justify-center' : ''}`}
      >
        {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-400" />}
        <span className="font-mono">{short}</span>
      </button>
      <button
        onClick={handleDisconnect}
        title="Disconnect wallet"
        className="flex items-center justify-center bg-slate-800 rounded-lg px-2.5 py-2 hover:bg-rose-900/60 transition-colors"
      >
        <LogOut className="w-4 h-4 text-rose-400" />
      </button>
    </div>
  );
}