import React, { useState, useEffect, createContext, useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Wallet, Menu, X, Hexagon, Sparkles } from 'lucide-react';
import { createPageUrl } from './utils';

// Web3 Context
const Web3Context = createContext({
  account: null,
  chainId: null,
  connectWallet: async () => {},
  isConnecting: false,
  error: null
});

export const useWeb3 = () => useContext(Web3Context);

export default function Layout({ children, currentPageName }) {
  const [account, setAccount] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  const connectWallet = async () => {
    setIsConnecting(true);
    setError(null);
    try {
      if (typeof window.ethereum !== 'undefined') {
        const { ethers } = await import('ethers');
        const provider = new ethers.BrowserProvider(window.ethereum);
        const accounts = await provider.send("eth_requestAccounts", []);
        const network = await provider.getNetwork();
        
        setAccount(accounts[0]);
        setChainId(network.chainId);
        
        // Listen for changes
        window.ethereum.on('accountsChanged', (accs) => setAccount(accs[0] || null));
        window.ethereum.on('chainChanged', () => window.location.reload());
      } else {
        setError("Please install MetaMask or another EVM wallet.");
      }
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to connect wallet");
    } finally {
      setIsConnecting(false);
    }
  };

  useEffect(() => {
    // Check if already connected
    const checkConnection = async () => {
      if (typeof window.ethereum !== 'undefined') {
        try {
          const { ethers } = await import('ethers');
          const provider = new ethers.BrowserProvider(window.ethereum);
          const accounts = await provider.listAccounts();
          if (accounts.length > 0) {
              setAccount(accounts[0].address);
              const network = await provider.getNetwork();
              setChainId(network.chainId);
          }
        } catch (error) {
          console.error("Failed to check connection:", error);
        }
      }
    };
    checkConnection();
  }, []);

  const navItems = [
    { name: 'Sanctum', path: 'Sanctum' },
    { name: 'Principles', path: 'Principles' },
    { name: 'Oracle', path: 'Oracle' },
    { name: 'White Paper', path: 'Whitepaper' },
    { name: 'Explorer', path: 'BlockExplorer' },
    { name: 'Identity', path: 'Profile' },
  ];

  return (
    <Web3Context.Provider value={{ account, chainId, connectWallet, isConnecting, error }}>
      <div className="min-h-screen bg-slate-950 text-slate-50 font-sans selection:bg-indigo-500/30 selection:text-indigo-200 overflow-x-hidden">

        {/* Sacred Geometry Background */}
        <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
           <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-900/20 blur-[100px]" />
           <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-900/20 blur-[100px]" />
           <div className="absolute top-[40%] left-[50%] translate-x-[-50%] w-[40%] h-[40%] rounded-full bg-cyan-900/10 blur-[80px]" />
           <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay"></div>
        </div>

        {/* Navigation */}
        <nav className="fixed top-0 w-full z-50 bg-slate-950/70 backdrop-blur-md border-b border-white/10 shadow-lg shadow-black/5">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">

              {/* Logo */}
              <Link to={createPageUrl('Home')} className="flex items-center gap-2 group">
                <div className="relative">
                  <Hexagon className="w-8 h-8 text-indigo-400 fill-indigo-500/10 group-hover:rotate-90 transition-transform duration-700 ease-in-out" strokeWidth={1.5} />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse shadow-[0_0_10px_rgba(129,140,248,0.8)]" />
                  </div>
                </div>
                <span className="text-xl font-medium tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
                  ETHERENE
                </span>
              </Link>

              {/* Desktop Nav */}
              <div className="hidden md:flex items-center gap-8">
                {navItems.map((item) => (
                  <Link
                    key={item.name}
                    to={createPageUrl(item.path)}
                    className={`text-sm font-medium transition-colors hover:text-indigo-400 ${
                      currentPageName === item.path ? 'text-indigo-400 drop-shadow-[0_0_8px_rgba(129,140,248,0.5)]' : 'text-slate-400'
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
                  className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-100 text-slate-950 text-sm font-medium hover:bg-indigo-400 hover:text-white transition-all hover:shadow-[0_0_20px_rgba(129,140,248,0.4)] disabled:opacity-90 disabled:cursor-default active:scale-95 border border-transparent hover:border-indigo-300"
                >
                  <Wallet className="w-4 h-4" />
                  {account ? `${account.slice(0, 6)}...${account.slice(-4)}` : 'Connect Wallet'}
                </button>
              </div>

              {/* Mobile Menu Button */}
              <div className="flex md:hidden">
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="text-slate-400 hover:text-indigo-400 p-2"
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
                className="md:hidden bg-slate-950/95 backdrop-blur-md border-b border-white/10 overflow-hidden"
              >
                <div className="px-4 py-4 space-y-4">
                  {navItems.map((item) => (
                    <Link
                      key={item.name}
                      to={createPageUrl(item.path)}
                      onClick={() => setIsMenuOpen(false)}
                      className={`block text-base font-medium px-2 py-1 ${
                        currentPageName === item.path ? 'text-indigo-400' : 'text-slate-400'
                      }`}
                    >
                      {item.name}
                    </Link>
                  ))}
                  <button
                    onClick={connectWallet}
                    disabled={!!account}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-slate-100 text-slate-900 text-sm font-medium mt-4 hover:bg-indigo-400 hover:text-white transition-colors"
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
                <a href="#" className="hover:text-indigo-600 transition-colors">Manifesto</a>
                <a href="#" className="hover:text-indigo-600 transition-colors">Contract</a>
                <a href="#" className="hover:text-indigo-600 transition-colors">Governance</a>
              </div>
            </div>
          </div>
        </footer>
        
      </div>
    </Web3Context.Provider>
  );
}