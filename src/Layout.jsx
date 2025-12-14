import React, { useState, useEffect, createContext, useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Wallet, Menu, X, Hexagon, Sparkles } from 'lucide-react';
import { Toaster, toast } from 'sonner';
import { createPageUrl } from './components/utils';

// Web3 Context (Solana)
const Web3Context = createContext({
  account: null,
  connectWallet: async () => {},
  disconnectWallet: async () => {},
  isConnecting: false,
  error: null
});

export const useWeb3 = () => useContext(Web3Context);

export default function Layout({ children, currentPageName }) {
  const [account, setAccount] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

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

  const connectWallet = async () => {
    setIsConnecting(true);
    setError(null);
    try {
      const provider = window.solana || window.phantom?.solana;
      if (provider) {
        const response = await provider.connect();
        setAccount(response.publicKey.toString());
        // Listen for disconnect
        provider.on('disconnect', () => setAccount(null));
        provider.on('accountChanged', (publicKey) => {
            if (publicKey) {
                setAccount(publicKey.toString());
            } else {
                setAccount(null);
            }
        });
      } else {
        // Mobile Deep Link Support
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        if (isMobile) {
             const url = `https://phantom.app/ul/browse/${encodeURIComponent(window.location.href)}?ref=${encodeURIComponent(window.location.origin)}`;
             window.location.href = url;
             return;
        }

        const msg = "Please install Phantom Wallet or a compatible Solana wallet.";
        setError(msg);
        toast.error(msg);
        window.open("https://phantom.app/", "_blank");
      }
    } catch (err) {
      console.error(err);
      const msg = err.message || "Failed to connect wallet";
      setError(msg);
      toast.error(msg);
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = async () => {
      try {
          const { solana } = window;
          if (solana) {
              await solana.disconnect();
              setAccount(null);
          }
      } catch (err) {
          console.error(err);
      }
  };

  useEffect(() => {
    // Check if already connected (eagerly)
    const checkConnection = async () => {
      const provider = window.solana || window.phantom?.solana;
      if (provider) {
        try {
          const response = await provider.connect({ onlyIfTrusted: true });
          setAccount(response.publicKey.toString());
        } catch (error) {
          // User not connected yet, ignore
        }
      }
    };
    // Small delay to allow injection
    setTimeout(checkConnection, 500);
  }, []);

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
      <Web3Context.Provider value={{ account, connectWallet, disconnectWallet, isConnecting, error }}>
      <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-indigo-100 selection:text-indigo-900 overflow-x-hidden">
        <Toaster position="top-center" richColors />

        {/* Sacred Geometry Background */}
        <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
           <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-200/20 blur-[100px]" />
           <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-200/20 blur-[100px]" />
           <div className="absolute top-[40%] left-[50%] translate-x-[-50%] w-[40%] h-[40%] rounded-full bg-sky-100/30 blur-[80px]" />
        </div>

        {/* Navigation */}
        <nav className="fixed top-0 w-full z-50 bg-white/70 backdrop-blur-md border-b border-white/50 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              
              {/* Logo */}
              <Link to={createPageUrl('Home')} className="flex items-center gap-2 group">
                <div className="relative">
                  <Hexagon className="w-8 h-8 text-indigo-600 fill-indigo-50 group-hover:rotate-90 transition-transform duration-700 ease-in-out" strokeWidth={1.5} />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse" />
                  </div>
                </div>
                <span className="text-xl font-medium tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
                  ETHERENE
                </span>
              </Link>

              {/* Desktop Nav */}
              <div className="hidden md:flex items-center gap-8">
                {navItems.map((item) => (
                  <Link
                    key={item.name}
                    to={createPageUrl(item.path)}
                    className={`text-sm font-medium transition-colors hover:text-indigo-600 ${
                      currentPageName === item.path ? 'text-indigo-600' : 'text-slate-600'
                    }`}
                  >
                    {item.name}
                  </Link>
                ))}
              </div>

              {/* Wallet Button */}
              <div className="hidden md:flex items-center">
                <button
                  onClick={connectWallet}
                  disabled={!!account}
                  className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 transition-all hover:shadow-lg disabled:opacity-90 disabled:cursor-default active:scale-95"
                >
                  <Wallet className="w-4 h-4" />
                  {account ? `${account.slice(0, 6)}...${account.slice(-4)}` : 'Connect Wallet'}
                </button>
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
                className="md:hidden bg-white/95 backdrop-blur-md border-b border-slate-100 overflow-hidden"
              >
                <div className="px-4 py-4 space-y-4">
                  {navItems.map((item) => (
                    <Link
                      key={item.name}
                      to={createPageUrl(item.path)}
                      onClick={() => setIsMenuOpen(false)}
                      className={`block text-base font-medium px-2 py-1 ${
                        currentPageName === item.path ? 'text-indigo-600' : 'text-slate-600'
                      }`}
                    >
                      {item.name}
                    </Link>
                  ))}
                  <button
                    onClick={connectWallet}
                    disabled={!!account}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-slate-900 text-white text-sm font-medium mt-4"
                  >
                    <Wallet className="w-4 h-4" />
                    {account ? `${account.slice(0, 6)}...${account.slice(-4)}` : 'Connect Wallet'}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </nav>

        {/* Main Content */}
        <main className="relative z-10 pt-16 min-h-[calc(100vh-4rem)]">
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
        <footer className="relative z-10 border-t border-slate-200 bg-white/50 backdrop-blur-sm mt-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-2 text-slate-500 text-sm">
                <Hexagon className="w-4 h-4" />
                <span>© 2024 Etherene Protocol</span>
              </div>
              <div className="flex gap-6 text-sm text-slate-500">
                <a href="Whitepaper" className="hover:text-indigo-600 transition-colors">Manifesto</a>
                <a href="BlockExplorer" className="hover:text-indigo-600 transition-colors">Contract</a>
                <a href="Agora" className="hover:text-indigo-600 transition-colors">Governance</a>
              </div>
            </div>
          </div>
        </footer>
        
      </div>
    </Web3Context.Provider>
  );
}