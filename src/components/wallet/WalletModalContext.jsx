import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { toast } from 'sonner';

const WalletModalContext = createContext(null);

export function WalletModalProvider({ children }) {
  const { wallets, select } = useWallet();
  const [connecting, setConnecting] = useState(false);
  const adapter = wallets.find(item => item.adapter.name === 'Etherene Wallet')?.adapter;

  // Selection does not authorize or connect. Only a user tap calls connect().
  useEffect(() => {
    if (adapter) select(adapter.name);
  }, [adapter, select]);

  const openModal = useCallback(async () => {
    if (!adapter || adapter.connecting) return;
    setConnecting(true);
    try {
      select(adapter.name);
      await adapter.connect();
    } catch (error) {
      if (error.error?.name !== 'WalletConnectionCancelled') {
        toast.error(error.message || 'Could not connect your wallet. Please try again.');
      }
    } finally {
      setConnecting(false);
    }
  }, [adapter, select]);

  const closeModal = useCallback(() => adapter?.closeModal(), [adapter]);
  return (
    <WalletModalContext.Provider value={{ openModal, closeModal, connecting }}>
      {children}
    </WalletModalContext.Provider>
  );
}

export function useWalletModalOpen() {
  return useContext(WalletModalContext) || { openModal: () => {}, closeModal: () => {}, connecting: false };
}