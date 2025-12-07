import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useWeb3 } from '../Layout';
import { ETHERENE_NFT_ABI, CONTRACT_ADDRESSES } from '../components/ethereneAbi';
import { Fingerprint, PenTool, Hash, Shield, Loader2, CheckCircle2, Copy } from 'lucide-react';
// import { ethers } from 'ethers'; // Dynamic import used instead

export default function Profile() {
  const { account, chainId, connectWallet } = useWeb3();
  const [isMinting, setIsMinting] = useState(false);
  const [hasMinted, setHasMinted] = useState(false);
  const [isSigning, setIsSigning] = useState(false);
  const [hasSigned, setHasSigned] = useState(false);
  const [soulText, setSoulText] = useState('');
  const [soulHash, setSoulHash] = useState(null);
  
  // Mock fetching existing state
  useEffect(() => {
    if (account) {
      // In a real app, you'd fetch this from the contract
      const localMinted = localStorage.getItem(`etherene_minted_${account}`);
      const localSigned = localStorage.getItem(`etherene_signed_${account}`);
      if (localMinted) setHasMinted(true);
      if (localSigned) setHasSigned(true);
    }
  }, [account]);

  const handleMint = async () => {
    setIsMinting(true);
    try {
      // Dynamic import for ethers
      const { ethers } = await import('ethers');
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      // REAL CONTRACT INTERACTION CODE (Commented out for demo without deployed contract)
      /*
      const contract = new ethers.Contract(CONTRACT_ADDRESSES[chainId], ETHERENE_NFT_ABI, signer);
      const tx = await contract.mint();
      await tx.wait();
      */
      
      // Simulation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setHasMinted(true);
      localStorage.setItem(`etherene_minted_${account}`, 'true');
    } catch (err) {
      console.error("Mint failed:", err);
      alert("Minting failed. See console for details.");
    } finally {
      setIsMinting(false);
    }
  };

  const handleSign = async () => {
    setIsSigning(true);
    try {
      const { ethers } = await import('ethers');
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      const message = "I declare my self-sovereignty on the Etherene Protocol.";
      const signature = await signer.signMessage(message);
      
      console.log("Signature:", signature);
      
      setHasSigned(true);
      localStorage.setItem(`etherene_signed_${account}`, 'true');
    } catch (err) {
      console.error("Signing failed:", err);
    } finally {
      setIsSigning(false);
    }
  };

  const generateSoulHash = async () => {
    if (!soulText) return;
    const msgBuffer = new TextEncoder().encode(soulText);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    setSoulHash(hashHex);
  };

  if (!account) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-6">
          <Shield className="w-8 h-8 text-slate-400" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Identity Not Found</h2>
        <p className="text-slate-500 mb-8">Connect your wallet to access your Etherene profile.</p>
        <button
          onClick={connectWallet}
          className="px-8 py-3 rounded-full bg-slate-900 text-white font-medium hover:bg-slate-800 transition-colors"
        >
          Connect Wallet
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      
      {/* Header */}
      <div className="mb-12">
        <h1 className="text-3xl font-bold text-slate-900">Etherene Identity</h1>
        <p className="text-slate-500 font-mono mt-2">{account}</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        
        {/* Left Col: Actions */}
        <div className="space-y-6">
          
          {/* Declaration Card */}
          <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
            <div className="flex items-center gap-4 mb-6">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${hasSigned ? 'bg-green-100 text-green-600' : 'bg-indigo-50 text-indigo-600'}`}>
                <PenTool className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">Declaration of Sovereignty</h3>
                <p className="text-slate-500 text-sm">Sign a cryptographic message to verify your intent.</p>
              </div>
            </div>
            
            {hasSigned ? (
              <div className="flex items-center gap-2 text-green-600 bg-green-50 px-4 py-3 rounded-xl border border-green-100">
                <CheckCircle2 className="w-5 h-5" />
                <span className="font-medium">Declaration Signed</span>
              </div>
            ) : (
              <button
                onClick={handleSign}
                disabled={isSigning}
                className="w-full py-3 rounded-xl bg-slate-900 text-white font-medium hover:bg-slate-800 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
              >
                {isSigning && <Loader2 className="w-4 h-4 animate-spin" />}
                Sign Declaration
              </button>
            )}
          </div>

          {/* NFT Mint Card */}
          <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden">
            <div className="flex items-center gap-4 mb-6 relative z-10">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${hasMinted ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-600'}`}>
                <Fingerprint className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">Etherene Identity NFT</h3>
                <p className="text-slate-500 text-sm">Mint your unique soul badge on-chain.</p>
              </div>
            </div>

            {hasMinted ? (
              <div className="relative z-10">
                <div className="aspect-square bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mb-4 shadow-inner">
                  <Fingerprint className="w-32 h-32 text-white/20" />
                </div>
                <div className="flex items-center justify-center gap-2 text-indigo-600 font-medium">
                  <CheckCircle2 className="w-5 h-5" />
                  Owned
                </div>
              </div>
            ) : (
              <div className="relative z-10">
                <div className="aspect-square bg-slate-50 rounded-2xl flex items-center justify-center mb-6 border-2 border-dashed border-slate-200">
                  <p className="text-slate-400 font-medium">No Identity Found</p>
                </div>
                <button
                  onClick={handleMint}
                  disabled={isMinting}
                  className="w-full py-3 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                >
                  {isMinting && <Loader2 className="w-4 h-4 animate-spin" />}
                  Mint Identity (Free)
                </button>
              </div>
            )}
          </div>

        </div>

        {/* Right Col: Soul Hash Tool */}
        <div className="bg-slate-900 text-slate-200 p-8 rounded-3xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-[80px] rounded-full" />
          
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-white">
                <Hash className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Soul Hash Generator</h3>
                <p className="text-slate-400 text-sm">Generate a SHA-256 hash of your inner truth. No data is stored.</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Your Statement</label>
                <textarea
                  value={soulText}
                  onChange={(e) => setSoulText(e.target.value)}
                  placeholder="I am..."
                  rows={4}
                  className="w-full bg-slate-800 border-slate-700 rounded-xl text-white placeholder:text-slate-600 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              
              <button
                onClick={generateSoulHash}
                className="w-full py-3 rounded-xl bg-white text-slate-900 font-medium hover:bg-slate-200 transition-colors"
              >
                Generate Hash
              </button>

              {soulHash && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-6 p-4 rounded-xl bg-slate-800 border border-slate-700 overflow-hidden"
                >
                  <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">SHA-256 Output</p>
                  <div className="flex items-center gap-2">
                    <code className="text-indigo-400 font-mono text-sm break-all">{soulHash}</code>
                    <button 
                      onClick={() => navigator.clipboard.writeText(soulHash)}
                      className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}