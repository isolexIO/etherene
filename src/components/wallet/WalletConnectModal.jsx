import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Wallet, Download, AlertCircle, Loader2, Smartphone, ExternalLink, ShieldCheck,
} from 'lucide-react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletReadyState } from '@solana/wallet-adapter-base';

// Custom wallet connection sheet.
//
// Why this exists (Solana dApp Store review):
//  - WAL-002: the stock react-ui modal failed the mobile connection flow.
//    This sheet only attempts to connect to wallets that are actually
//    available (Detected extension or Loadable MWA), and on mobile it
//    prioritizes the Mobile Wallet Adapter instead of extension wallets
//    that just open a website.
//  - WAL-003: when no wallet is available, it shows clear in-app guidance
//    and download links instead of an un-closeable background popup.
//  - ELI-004: connection is always a deliberate user tap; signing never
//    happens here — it only happens later when the user approves a specific
//    action (mint, quest, message) in its own flow.
//  - The overlay is rendered at z-[10001] with a working close button so it
//    can never trap the app in a non-responsive state.
export default function WalletConnectModal({ open, onClose }) {
  const { wallets, select, connect, connecting, connected, publicKey } = useWallet();
  const [pendingName, setPendingName] = useState(null);
  const [error, setError] = useState(null);

  // Close automatically once a wallet is connected.
  useEffect(() => {
    if (connected && publicKey) {
      onClose();
      setPendingName(null);
      setError(null);
    }
  }, [connected, publicKey, onClose]);

  const isMobile = typeof navigator !== 'undefined' &&
    /android|iphone|ipad|ipod|mobile/i.test(navigator.userAgent);

  const isUsable = (w) =>
    w.readyState === WalletReadyState.Detected ||
    w.readyState === WalletReadyState.Loadable;

  // On mobile, only show wallets that can actually connect (MWA / detected).
  // Extension wallets that aren't installed would just open a website, which
  // is exactly the failed behavior the reviewer flagged.
  const visibleWallets = wallets.filter((w) => (isMobile ? isUsable(w) : true));

  const handleConnect = async (wallet) => {
    setError(null);
    if (!isUsable(wallet)) {
      // Not installed — send the user to the install page instead of
      // attempting a connection that would open a website (Solflare issue).
      if (wallet.url) {
        window.open(wallet.url, '_blank', 'noopener,noreferrer');
      }
      return;
    }
    try {
      setPendingName(wallet.adapter.name);
      await select(wallet.adapter.name);
      await connect();
    } catch (e) {
      const msg = (e && (e.message || e.name)) || 'Connection failed.';
      setError(msg.includes('not found') || msg.includes('NotFound')
        ? 'No Solana wallet was found on this device. Install a mobile wallet to continue.'
        : msg);
    } finally {
      setPendingName(null);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-[10001] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-sm"
        >
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-slate-900 border border-fuchsia-500/30 rounded-t-2xl sm:rounded-2xl w-full max-w-md shadow-2xl max-h-[90vh] flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Wallet className="w-5 h-5 text-cyan-400" />
                <h2 className="text-lg font-bold text-white">Connect Wallet</h2>
              </div>
              <button
                onClick={onClose}
                aria-label="Close"
                className="p-2 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 space-y-3 overflow-y-auto">
              {isMobile && (
                <div className="flex items-start gap-2 p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-lg text-cyan-200 text-xs">
                  <Smartphone className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>
                    Use a Solana Mobile-compatible wallet app (Phantom or Solflare
                    mobile). If the handover does not open your wallet, install one
                    from the links below.
                  </span>
                </div>
              )}

              {error && (
                <div className="flex items-start gap-2 p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-300 text-sm">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {visibleWallets.length === 0 ? (
                <div className="text-center py-6">
                  <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-3">
                    <AlertCircle className="w-6 h-6 text-amber-400" />
                  </div>
                  <h3 className="text-white font-semibold mb-1">No wallet detected</h3>
                  <p className="text-sm text-slate-400 mb-4">
                    A Solana wallet is required to connect. Install one of the
                    wallets below, then return here.
                  </p>
                </div>
              ) : (
                visibleWallets.map((wallet) => {
                  const usable = isUsable(wallet);
                  const isPending = pendingName === wallet.adapter.name || (connecting && pendingName === wallet.adapter.name);
                  return (
                    <button
                      key={wallet.adapter.name}
                      onClick={() => handleConnect(wallet)}
                      disabled={isPending}
                      className="w-full flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-fuchsia-500/40 transition-colors disabled:opacity-60"
                    >
                      {wallet.adapter.icon ? (
                        <img src={wallet.adapter.icon} alt="" className="w-8 h-8 rounded-lg" />
                      ) : (
                        <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                          <Wallet className="w-4 h-4 text-slate-300" />
                        </div>
                      )}
                      <div className="flex-1 text-left">
                        <div className="text-sm font-medium text-white">{wallet.adapter.name}</div>
                        <div className="text-xs text-slate-400">
                          {usable ? 'Available' : 'Not installed — tap to install'}
                        </div>
                      </div>
                      {isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
                      ) : usable ? (
                        <span className="text-xs text-cyan-400 font-medium">Connect</span>
                      ) : (
                        <Download className="w-4 h-4 text-slate-400" />
                      )}
                    </button>
                  );
                })
              )}

              {/* Wallet unavailable guidance (WAL-003) */}
              <div className="pt-3 mt-2 border-t border-white/10">
                <p className="text-xs text-slate-400 mb-2">
                  {visibleWallets.length === 0
                    ? 'Install a wallet to get started:'
                    : 'No wallet installed? Get one here:'}
                </p>
                <div className="flex flex-wrap gap-3">
                  <a
                    href="https://phantom.app/download"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-cyan-400 hover:underline"
                  >
                    Get Phantom <ExternalLink className="w-3 h-3" />
                  </a>
                  <a
                    href="https://solflare.com/download"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-cyan-400 hover:underline"
                  >
                    Get Solflare <ExternalLink className="w-3 h-3" />
                  </a>
                  <a
                    href="https://solanamobile.com/wallets"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-cyan-400 hover:underline"
                  >
                    Solana Mobile wallets <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-white/10 flex items-center justify-center gap-2">
              <ShieldCheck className="w-3.5 h-3.5 text-slate-500" />
              <p className="text-xs text-slate-500 text-center">
                You will be asked to approve each signature. Nothing is signed
                without your confirmation.
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}