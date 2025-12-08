import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useSearchParams } from 'react-router-dom';
import { useWeb3 } from '../Layout';
import { ETHERENE_NFT_ABI, CONTRACT_ADDRESSES } from '../components/ethereneAbi';
import { Fingerprint, PenTool, Hash, Shield, Loader2, CheckCircle2, Copy, Settings, Globe, MessageSquare, Radio, Hexagon } from 'lucide-react';
import IdentityAvatar from '../components/profile/IdentityAvatar';
import { createPageUrl } from '../components/utils';
import { base44 } from '@/api/base44Client';
import moment from 'moment';

export default function Profile() {
  const { account, chainId, connectWallet } = useWeb3();
  const [searchParams] = useSearchParams();
  const paramAddress = searchParams.get('address');
  
  // View mode logic: If paramAddress exists, we are viewing that user. 
  // If not, we view 'account' (current user).
  // If neither (and no param), we show empty/connect state.
  
  const viewAddress = paramAddress || account;
  const isOwner = account && viewAddress && account.toLowerCase() === viewAddress.toLowerCase();

  const [isMinting, setIsMinting] = useState(false);
  const [switching, setSwitching] = useState(false);
  
  const [profileData, setProfileData] = useState(null);
  const [activities, setActivities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load Data
  useEffect(() => {
      const loadProfile = async () => {
          if (!viewAddress) {
              setIsLoading(false);
              return;
          }

          setIsLoading(true);
          try {
              // 1. Fetch Identity
              const identities = await base44.entities.Identity.filter({ address: viewAddress });
              const identity = identities[0] || null;
              setProfileData(identity);

              // 2. Fetch Activities (Parallel)
              const [transmissions, interactions, mints] = await Promise.all([
                  base44.entities.Transmission.filter({ author_address: viewAddress }),
                  base44.entities.OracleInteraction.filter({ user_address: viewAddress }),
                  // Re-using identity fetch for mint event basically
                  Promise.resolve(identity ? [identity] : [])
              ]);

              const timeline = [
                  ...transmissions.map(t => ({ ...t, type: 'transmission', date: t.created_date })),
                  ...interactions.map(i => ({ ...i, type: 'oracle', date: i.created_date })),
                  ...mints.map(m => ({ ...m, type: 'mint', date: m.created_date }))
              ].sort((a, b) => new Date(b.date) - new Date(a.date));

              setActivities(timeline);

          } catch (e) {
              console.error("Failed to load profile", e);
          } finally {
              setIsLoading(false);
          }
      };

      loadProfile();
  }, [viewAddress]);


  // Solana Wallet Integration
  const [solanaAddress, setSolanaAddress] = useState(null);

  const connectSolana = async () => {
      try {
          const { solana } = window;
          if (solana && solana.isPhantom) {
              const response = await solana.connect();
              setSolanaAddress(response.publicKey.toString());
              return response.publicKey.toString();
          } else {
              alert("Please install Phantom Wallet!");
              window.open("https://phantom.app/", "_blank");
          }
      } catch (err) {
          console.error(err);
      }
      return null;
  };

  const handleMint = async () => {
    if (!isOwner) return;
    
    // Ensure Solana Wallet is connected
    let targetAddress = solanaAddress;
    if (!targetAddress) {
        targetAddress = await connectSolana();
        if (!targetAddress) return;
    }

    setIsMinting(true);
    try {
      // 1. Get Transaction from Backend (Generates AI Art + Transaction)
      const { data } = await base44.functions.invoke('mintSolanaIdentity', {
          userAddress: targetAddress,
          userEthereneAddress: account, // Pass ETH address to look up profile data
          soulHash: profileData?.soul_hash 
      });

      if (!data.success) throw new Error(data.error || "Setup failed");

      // 2. Decode and Sign with Phantom
      const { Transaction } = await import('@solana/web3.js');
      
      // Decode base64 to Uint8Array without Buffer dependency
      const binaryString = atob(data.transaction);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
      }
      
      const transaction = Transaction.from(bytes);
      
      // Phantom specific signing
      const { solana } = window;
      const { signature } = await solana.signAndSendTransaction(transaction);
      
      // 3. Wait for Confirmation (Optional, but good UX)
      // For now, we assume success if signature is returned, as DB update follows.

      // 4. Create DB Record
      const existingCount = (await base44.entities.Identity.list()).length;
      await base44.entities.Identity.create({
           address: account, 
           soul_hash: data.mint, 
           network: 'Solana Devnet',
           status: 'minted',
           token_id: existingCount + 1,
           bio: `Solana Mint: ${data.mint}`,
           avatar_url: data.imageUrl, // Save the AI generated image
           cover_image: data.imageUrl // Optional: use as cover too or just avatar
      });
      
      window.open(`https://explorer.solana.com/tx/${signature}?cluster=devnet`, '_blank');
      window.location.reload();

    } catch (err) {
      console.error("Mint failed:", err);
      alert(`Minting failed: ${err.message}`);
    } finally {
      setIsMinting(false);
    }
  };

  const switchNetwork = async (targetChainId) => {
      // Implementation kept simple for brevity
      try {
          await window.ethereum.request({
              method: 'wallet_switchEthereumChain',
              params: [{ chainId: "0x" + targetChainId.toString(16) }],
          });
      } catch (e) { console.error(e); }
  };


  if (isLoading) {
      return <div className="flex justify-center p-20"><Loader2 className="w-10 h-10 animate-spin text-indigo-600"/></div>;
  }

  if (!viewAddress) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-6">
          <Shield className="w-8 h-8 text-slate-400" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Connect Wallet</h2>
        <p className="text-slate-500 mb-8">Connect your wallet to view your profile or search for others.</p>
        <button onClick={connectWallet} className="px-8 py-3 rounded-full bg-slate-900 text-white font-medium hover:bg-slate-800 transition-colors">
          Connect Wallet
        </button>
      </div>
    );
  }

  const socials = profileData?.socials ? JSON.parse(profileData.socials) : {};

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-0 pb-20">
      
      {/* Cover Image */}
      <div className="relative h-64 w-full rounded-b-3xl bg-gradient-to-r from-indigo-900 to-purple-900 overflow-hidden mb-20 shadow-lg">
          {profileData?.cover_image && (
              <img src={profileData.cover_image} alt="Cover" className="w-full h-full object-cover opacity-80" />
          )}
          <div className="absolute inset-0 bg-black/20" />
      </div>

      {/* Profile Header */}
      <div className="relative -mt-32 mb-12 flex flex-col items-center text-center">
          <div className="relative mb-6">
             <div className="w-40 h-40 rounded-full border-4 border-white shadow-xl overflow-hidden bg-white">
                {profileData?.avatar_url ? (
                    <img src={profileData.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                    <IdentityAvatar address={viewAddress} soulHash={profileData?.soul_hash} size={160} chainId={1} />
                )}
             </div>
             {profileData && (
                 <div className="absolute bottom-2 right-2 bg-green-500 text-white p-1.5 rounded-full border-2 border-white shadow-sm" title="Verified Node">
                     <CheckCircle2 className="w-4 h-4" />
                 </div>
             )}
          </div>

          <h1 className="text-3xl font-bold text-slate-900 mb-2">
              {profileData?.display_name || 'Anonymous Node'}
          </h1>
          <div className="flex items-center gap-2 text-slate-500 font-mono text-sm bg-slate-100 px-3 py-1 rounded-full mb-4">
              <Hash className="w-3 h-3" />
              {viewAddress.slice(0,6)}...{viewAddress.slice(-4)}
          </div>

          {profileData?.bio && (
              <p className="text-slate-600 max-w-lg mb-6 leading-relaxed">{profileData.bio}</p>
          )}

          {/* Socials */}
          <div className="flex gap-3 mb-8">
              {socials.twitter && <a href={`https://twitter.com/${socials.twitter}`} target="_blank" className="p-2 bg-slate-100 rounded-full hover:bg-blue-100 hover:text-blue-600 transition-colors"><Globe className="w-4 h-4"/></a>}
              {socials.website && <a href={socials.website} target="_blank" className="p-2 bg-slate-100 rounded-full hover:bg-green-100 hover:text-green-600 transition-colors"><Globe className="w-4 h-4"/></a>}
          </div>

          {/* Actions */}
          <div className="flex gap-3">
              {isOwner && (
                  <>
                    <Link to={createPageUrl('CustomizeProfile')} className="px-6 py-2 bg-white border border-slate-200 text-slate-700 rounded-full font-medium hover:bg-slate-50 transition-colors flex items-center gap-2">
                        <Settings className="w-4 h-4" /> Customize
                    </Link>
                    {!profileData && (
                        <div className="flex flex-col gap-2">
                            {!solanaAddress && (
                                <button onClick={connectSolana} className="px-6 py-2 bg-purple-600 text-white rounded-full font-medium hover:bg-purple-700 transition-colors shadow-lg shadow-purple-200">
                                    Connect Phantom
                                </button>
                            )}
                            <button onClick={handleMint} disabled={isMinting} className="px-6 py-2 bg-indigo-600 text-white rounded-full font-medium hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 disabled:opacity-50">
                                {isMinting ? "Minting on Solana..." : "Mint Identity NFT"}
                            </button>
                        </div>
                    )}
                  </>
              )}
          </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        
        {/* Left Column: Stats & Identity */}
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <Shield className="w-5 h-5 text-indigo-600" />
                    Identity Status
                </h3>
                {profileData ? (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-slate-500">Status</span>
                            <span className="px-2 py-1 bg-green-100 text-green-700 rounded-lg font-medium text-xs">Verified</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-slate-500">Network</span>
                            <span className="font-medium text-slate-900">Solana (Metaphysical)</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-slate-500">Token ID</span>
                            <span className="font-mono text-slate-900">#{profileData.token_id || '---'}</span>
                        </div>
                        <div className="pt-4 border-t border-slate-100">
                            <span className="text-xs text-slate-400 block mb-1">Soul Hash</span>
                            <code className="block w-full bg-slate-50 p-2 rounded text-xs text-slate-600 break-all">{profileData.soul_hash}</code>
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-6 text-slate-500 text-sm">
                        No identity minted yet.
                    </div>
                )}
            </div>
        </div>

        {/* Right Column: Activity Feed */}
        <div className="lg:col-span-2">
             <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                    <h3 className="font-bold text-slate-900 flex items-center gap-2">
                        <Hexagon className="w-5 h-5 text-indigo-600" />
                        Network Contributions
                    </h3>
                    <span className="text-xs text-slate-500">{activities.length} Events</span>
                </div>
                <div className="divide-y divide-slate-100">
                    {activities.length === 0 ? (
                        <div className="p-12 text-center text-slate-500">
                            No recent network activity.
                        </div>
                    ) : (
                        activities.map((item, i) => (
                            <div key={i} className="p-6 flex gap-4 hover:bg-slate-50 transition-colors">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                                    item.type === 'transmission' ? 'bg-purple-100 text-purple-600' :
                                    item.type === 'oracle' ? 'bg-blue-100 text-blue-600' :
                                    'bg-green-100 text-green-600'
                                }`}>
                                    {item.type === 'transmission' && <Radio className="w-5 h-5" />}
                                    {item.type === 'oracle' && <MessageSquare className="w-5 h-5" />}
                                    {item.type === 'mint' && <Shield className="w-5 h-5" />}
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between items-start mb-1">
                                        <p className="font-medium text-slate-900">
                                            {item.type === 'transmission' && 'Broadcasted a Transmission'}
                                            {item.type === 'oracle' && 'Consulted the Oracle'}
                                            {item.type === 'mint' && 'Minted Identity'}
                                        </p>
                                        <span className="text-xs text-slate-400">{moment(item.date).fromNow()}</span>
                                    </div>
                                    <p className="text-slate-600 text-sm">
                                        {item.type === 'transmission' && item.content}
                                        {item.type === 'oracle' && (item.topic ? `Topic: ${item.topic}` : 'Deep protocol meditation')}
                                        {item.type === 'mint' && `Soul Hash: ${item.soul_hash?.slice(0,10)}...`}
                                    </p>
                                </div>
                            </div>
                        ))
                    )}
                </div>
             </div>
        </div>

      </div>
    </div>
  );
}