import React, { useMemo, useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Wallet, Menu, X, Home, Radio, Sparkles, User } from 'lucide-react';
import { Toaster, toast } from 'sonner';
import { createPageUrl } from './components/utils';
import Logo from './components/Logo';
import { ConnectionProvider, WalletProvider, useWallet } from '@solana/wallet-adapter-react';
import { WalletModalProvider, WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { 
  PhantomWalletAdapter,
  SolflareWalletAdapter,
} from '@solana/wallet-adapter-wallets';
import '@solana/wallet-adapter-react-ui/styles.css';

// Solana Network Endpoint
const endpoint = 'https://api.mainnet-beta.solana.com';

export const useWeb3 = () => {
  const wallet = useWallet();
  return {
    account: wallet.publicKey?.toBase58() || null,
    connectWallet: wallet.connect,
    disconnectWallet: wallet.disconnect,
    isConnecting: wallet.connecting,
    wallet: wallet.wallet,
    connected: wallet.connected,
    error: null
  };
};

function LayoutContent({ children, currentPageName }) {
  const { publicKey, connected } = useWallet();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const location = useLocation();

  const account = publicKey?.toBase58() || null;

  // Dark mode sync with system preferences
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e) => {
      setIsDark(e.matches);
      if (e.matches) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    };
    
    setIsDark(mediaQuery.matches);
    if (mediaQuery.matches) {
      document.documentElement.classList.add('dark');
    }
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Google Analytics
  useEffect(() => {
    const script1 = document.createElement('script');
    script1.async = true;
    script1.src = 'https://www.googletagmanager.com/gtag/js?id=G-SDJ93Z5473';
    document.head.appendChild(script1);

    const script2 = document.createElement('script');
    script2.innerHTML = `
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', 'G-SDJ93Z5473');
    `;
    document.head.appendChild(script2);

    return () => {
      document.head.removeChild(script1);
      document.head.removeChild(script2);
    };
  }, []);

  // Heartbeat for online status
  useEffect(() => {
      if (!account) return;

      const updateHeartbeat = async () => {
          const lastUpdate = localStorage.getItem(`etherene_heartbeat_${account}`);
          const now = Date.now();

          // Update every 5 minutes max to save writes
          if (!lastUpdate || now - Number(lastUpdate) > 5 * 60 * 1000) {
              try {
                  const { base44 } = await import('@/api/base44Client');
                  const identities = await base44.entities.Identity.filter({ address: account });
                  if (identities.length > 0) {
                      await base44.entities.Identity.update(identities[0].id, {
                          last_seen: new Date().toISOString()
                      });
                      localStorage.setItem(`etherene_heartbeat_${account}`, now.toString());
                  }
              } catch (e) {
                  console.error("Heartbeat failed", e);
              }
          }
      };

      updateHeartbeat();
      const interval = setInterval(updateHeartbeat, 60000); // Check every minute
      return () => clearInterval(interval);
  }, [account]);

  const navItems = [
    { name: 'Sanctum', path: 'Sanctum' },
    { name: 'Lessons', path: 'Lessons' },
    { name: 'Principles', path: 'Principles' },
    { name: 'Oracle', path: 'Oracle' },
    { name: 'Agora', path: 'Agora' },
    { name: 'White Paper', path: 'Whitepaper' },
    { name: 'Explorer', path: 'BlockExplorer' },
    { name: 'Identity', path: 'Profile' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-indigo-100 selection:text-indigo-900 overflow-x-hidden">
      <Toaster position="top-center" richColors />

      {/* Neon Solana Background */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
         <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-cyan-500/10 blur-[120px]" />
         <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-fuchsia-500/10 blur-[120px]" />
         <div className="absolute top-[40%] left-[50%] translate-x-[-50%] w-[40%] h-[40%] rounded-full bg-purple-600/5 blur-[100px]" />
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-gradient-to-r from-slate-950/90 via-slate-900/90 to-slate-950/90 backdrop-blur-lg border-b border-fuchsia-500/30 shadow-lg shadow-fuchsia-500/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            
            {/* Logo */}
            <Link to={createPageUrl('Home')} className="flex items-center gap-3 group">
              <Logo className="w-8 h-8 drop-shadow-lg group-hover:scale-110 transition-transform duration-300" />
              <span className="text-xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-fuchsia-500 drop-shadow-sm">
                ETHERENE
              </span>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-8">
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  to={createPageUrl(item.path)}
                  className={`text-sm font-medium transition-colors ${
                    currentPageName === item.path 
                      ? 'text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-fuchsia-500' 
                      : 'text-slate-400 hover:text-cyan-300'
                  }`}
                >
                  {item.name}
                </Link>
              ))}
            </div>

            {/* Wallet Button */}
            <div className="hidden md:flex items-center">
              <WalletMultiButton className="!bg-gradient-to-r !from-cyan-600 !to-fuchsia-600 hover:!from-cyan-500 hover:!to-fuchsia-500 !rounded-full !h-10 !text-sm !font-bold !transition-all hover:!shadow-lg hover:!shadow-fuchsia-500/50" />
            </div>

            {/* Mobile Menu Button */}
            <div className="flex md:hidden">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="text-slate-600 hover:text-indigo-600 p-2"
              >
                {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-gradient-to-b from-slate-900/95 to-slate-950/95 backdrop-blur-md border-b border-fuchsia-500/30 overflow-hidden"
            >
              <div className="px-4 py-4 space-y-4">
                {navItems.map((item) => (
                  <Link
                    key={item.name}
                    to={createPageUrl(item.path)}
                    onClick={() => setIsMenuOpen(false)}
                    className={`block text-base font-medium px-2 py-1 transition-colors ${
                      currentPageName === item.path 
                        ? 'text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-fuchsia-500' 
                        : 'text-slate-400 hover:text-cyan-300'
                    }`}
                  >
                    {item.name}
                  </Link>
                ))}
                <div className="pt-2">
                  <WalletMultiButton className="!bg-slate-900 !rounded-xl !w-full !h-12 !text-sm !font-medium" />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Main Content */}
      <main className="relative z-10 pt-16 min-h-[calc(100vh-4rem)] md:pb-0 pb-20">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentPageName}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="h-full"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-fuchsia-500/30 bg-gradient-to-r from-slate-950/50 to-slate-950/50 backdrop-blur-sm mt-auto hidden md:block">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2 text-slate-400 text-sm">
              <div className="w-4 h-4 rounded-full bg-gradient-to-r from-cyan-400 to-fuchsia-500" />
              <span>© 2024 Etherene Protocol</span>
            </div>
            <div className="flex gap-6 text-sm text-slate-400">
              <a href="Whitepaper" className="hover:text-cyan-400 transition-colors">Manifesto</a>
              <a href="BlockExplorer" className="hover:text-cyan-400 transition-colors">Contract</a>
              <a href="Agora" className="hover:text-cyan-400 transition-colors">Governance</a>
            </div>
          </div>
        </div>
      </footer>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 md:hidden z-50 bg-gradient-to-t from-slate-950/95 to-slate-900/90 backdrop-blur-lg border-t border-fuchsia-500/30 safe-area-bottom shadow-lg shadow-fuchsia-500/20">
        <div className="flex items-center justify-around h-16">
          <Link to={createPageUrl('Home')} className={`flex flex-col items-center justify-center flex-1 h-full transition-all ${currentPageName === 'Home' ? 'text-cyan-400 drop-shadow-lg' : 'text-slate-400 hover:text-fuchsia-400'}`}>
            <Home className="w-6 h-6" />
          </Link>
          <Link to={createPageUrl('Agora')} className={`flex flex-col items-center justify-center flex-1 h-full transition-all ${currentPageName === 'Agora' ? 'text-cyan-400 drop-shadow-lg' : 'text-slate-400 hover:text-fuchsia-400'}`}>
            <Radio className="w-6 h-6" />
          </Link>
          <Link to={createPageUrl('Oracle')} className={`flex flex-col items-center justify-center flex-1 h-full transition-all ${currentPageName === 'Oracle' ? 'text-cyan-400 drop-shadow-lg' : 'text-slate-400 hover:text-fuchsia-400'}`}>
            <Sparkles className="w-6 h-6" />
          </Link>
          <Link to={createPageUrl('Profile')} className={`flex flex-col items-center justify-center flex-1 h-full transition-all ${currentPageName === 'Profile' ? 'text-cyan-400 drop-shadow-lg' : 'text-slate-400 hover:text-fuchsia-400'}`}>
            <User className="w-6 h-6" />
          </Link>
        </div>
      </nav>
      
    </div>
  );
}

export default function Layout({ children, currentPageName }) {
  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
    ],
    []
  );

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <LayoutContent children={children} currentPageName={currentPageName} />
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}