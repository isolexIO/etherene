import React, { createContext, useContext, useState, useCallback } from 'react';
import WalletConnectModal from './WalletConnectModal';

// Replaces @solana/wallet-adapter-react-ui's modal with a custom connect sheet
// that handles Mobile Wallet Adapter (MWA) properly and provides a clear
// "wallet unavailable" fallback state (Solana dApp Store WAL-002 / WAL-003).
const WalletModalContext = createContext(null);

export function WalletModalProvider({ children }) {
  const [isOpen, setIsOpen] = useState(false);
  const openModal = useCallback(() => setIsOpen(true), []);
  const closeModal = useCallback(() => setIsOpen(false), []);
  return (
    <WalletModalContext.Provider value={{ openModal, closeModal }}>
      {children}
      <WalletConnectModal open={isOpen} onClose={closeModal} />
    </WalletModalContext.Provider>
  );
}

export function useWalletModalOpen() {
  const ctx = useContext(WalletModalContext);
  if (!ctx) return { openModal: () => {}, closeModal: () => {} };
  return ctx;
}