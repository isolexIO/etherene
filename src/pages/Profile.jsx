import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Buffer } from 'buffer';
import { Link, useSearchParams } from 'react-router-dom';
import { validateSolanaPK } from '../components/utils/validatePK';

// Polyfill Buffer for Solana web3.js
if (typeof window !== 'undefined') {
    window.Buffer = Buffer;
}
import { useWeb3 } from '../Layout';

import { Fingerprint, PenTool, Hash, Shield, Loader2, CheckCircle2, Copy, Settings, Globe, MessageSquare, Radio, Hexagon, Save, X, Mail, UserPlus, UserMinus, Users } from 'lucide-react';
import IdentityAvatar from '../components/profile/IdentityAvatar';
import { createPageUrl } from '../components/utils';
import { base44 } from '@/api/base44Client';
import ConversationList from '../components/messaging/ConversationList';
import ChatWindow from '../components/messaging/ChatWindow';
import ProfileEditor from '../components/profile/ProfileEditor';
import ImportIdentity from '../components/profile/ImportIdentity';
import moment from 'moment';
import { toast } from 'sonner';

export default function Profile() {
  const { account, connectWallet } = useWeb3();
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

  // Follow State
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  
  // Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [showImport, setShowImport] = useState(false);
  
  // Tabs State
  const [activeTab, setActiveTab] = useState('all');

  // Messaging State
  const [selectedConversationUser, setSelectedConversationUser] = useState(null);

  // Handle messages tab from URL or other interactions
  useEffect(() => {
      if (searchParams.get('tab') === 'messages') {
          setActiveTab('messages');
          const to = searchParams.get('to');
          if (to) setSelectedConversationUser(to);
      }
  }, [searchParams]);

  const handleSaveProfile = (updatedData) => {
    setProfileData(updatedData);
    setIsEditing(false);
  };

  const handleImportSuccess = () => {
    window.location.reload();
  };

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

              // 2. Fetch Activities & Social Graph (Parallel)
              const [transmissions, interactions, mints, resonances, followers, following, myFollow] = await Promise.all([
                  base44.entities.Transmission.filter({ author_address: viewAddress }),
                  base44.entities.OracleInteraction.filter({ user_address: viewAddress }),
                  Promise.resolve(identity ? [identity] : []),
                  base44.entities.Resonance.filter({ author_address: viewAddress }),
                  base44.entities.Follow.filter({ following_address: viewAddress }),
                  base44.entities.Follow.filter({ follower_address: viewAddress }),
                  account ? base44.entities.Follow.filter({ follower_address: account, following_address: viewAddress }) : Promise.resolve([])
              ]);

              setFollowersCount(followers.length);
              setFollowingCount(following.length);
              setIsFollowing(myFollow.length > 0);

              const timeline = [
                  ...transmissions.map(t => ({ ...t, type: 'transmission', date: t.created_date })),
                  ...interactions.map(i => ({ ...i, type: 'oracle', date: i.created_date })),
                  ...mints.map(m => ({ ...m, type: 'mint', date: m.created_date })),
                  ...resonances.map(r => ({ ...r, type: 'resonance', date: r.created_date }))
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

  useEffect(() => {
      const checkSolana = async () => {
           const provider = window.solana || window.phantom?.solana;
           if (provider) {
               try {
                   // Eager connect (silent)
                   const response = await provider.connect({ onlyIfTrusted: true });
                   setSolanaAddress(response.publicKey.toString());
               } catch (e) {
                   // User not connected yet
               }
           }
      };
      // Give time for wallet injection
      const timer = setTimeout(checkSolana, 500);
      return () => clearTimeout(timer);
  }, []);

  const connectSolana = async () => {
      try {
          const provider = window.solana || window.phantom?.solana;
          if (provider) {
              const response = await provider.connect();
              setSolanaAddress(response.publicKey.toString());
              toast.success("Wallet connected");
              return response.publicKey.toString();
          } else {
              const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
              if (isMobile) {
                  const url = `https://phantom.app/ul/browse/${encodeURIComponent(window.location.href)}?ref=${encodeURIComponent(window.location.origin)}`;
                  window.location.href = url;
                  return null;
              }

              toast.error("Please install Phantom Wallet!");
              window.open("https://phantom.app/", "_blank");
          }
      } catch (err) {
          console.error(err);
          toast.error(err.message || "Connection cancelled");
      }
      return null;
  };

  const disconnectSolana = async () => {
      try {
          const provider = window.solana || window.phantom?.solana;
          if (provider) {
              await provider.disconnect();
              setSolanaAddress(null);
              toast.success("Disconnected from Solana");
          }
      } catch (err) {
          console.error(err);
      }
  };

  const [showRecover, setShowRecover] = useState(false);
  const [recoverTx, setRecoverTx] = useState('');
  const [isRecovering, setIsRecovering] = useState(false);
  const [foundOnChain, setFoundOnChain] = useState(null);

  // Reclaim State
  const [stuckAccounts, setStuckAccounts] = useState([]);
  const [loadingStuck, setLoadingStuck] = useState(false);
  const [closingAccount, setClosingAccount] = useState(null);

  const findStuckAccounts = async () => {
      if (!account) return;
      setLoadingStuck(true);
      try {
          const res = await base44.functions.invoke('findStuckAccounts', { userAddress: account });
          setStuckAccounts(res.data?.accounts || []);
          if (res.data?.accounts?.length === 0) {
              toast.info("No stuck accounts found.");
          }
      } catch (e) {
          console.error(e);
          toast.error("Failed to scan for stuck accounts");
      } finally {
          setLoadingStuck(false);
      }
  };

  const closeStuck = async (accountKey) => {
      setClosingAccount(accountKey);
      try {
           const res = await base44.functions.invoke('closeStuckAccount', { 
               accountKey, 
               userAddress: account 
           });
           const { transaction: txBase64 } = res.data;

           // Sign and Send
           const { Transaction, Connection } = await import('@solana/web3.js');
           const connection = new Connection("https://api.mainnet-beta.solana.com", "confirmed");
           const transactionBuffer = Buffer.from(txBase64, 'base64');
           const transaction = Transaction.from(transactionBuffer);

           const { solana } = window;
           const { signature } = await solana.signAndSendTransaction(transaction);

           await connection.confirmTransaction(signature, "confirmed");
           toast.success("Account closed and SOL reclaimed!");

           // Remove from list
           setStuckAccounts(prev => prev.filter(a => a.pubkey !== accountKey));
      } catch (e) {
          console.error(e);
          toast.error("Failed to close account");
      } finally {
          setClosingAccount(null);
      }
  };

  // Check on-chain identity when wallet connects
  useEffect(() => {
    if (!account || profileData) return;
    
    const checkChain = async () => {
        try {
            const res = await base44.functions.invoke('checkSolanaIdentity', { userAddress: account });
            if (res.data?.found) {
                setFoundOnChain(res.data);
                toast.info("We found your identity on-chain! Click 'Sync Identity' to restore it.", { duration: 8000 });
                setShowRecover(true);
            }
        } catch(e) { console.error(e); }
    };
    checkChain();
  }, [account, profileData]);

  const handleRecover = async () => {
      // If we found it on chain but don't have a TX, we can try to "Recover" by just re-creating the record
      // This requires the backend to verify again (which recoverIdentity does via TX check)
      // BUT if we have the address from checkSolanaIdentity, we might want a simpler "Sync" path.
      // For now, let's guide them to use the TX hash if they have it, OR if we found the name, we can autofill.
      
      if (!recoverTx) {
          toast.error("Please enter a transaction signature");
          return;
      }
      setIsRecovering(true);
      try {
          const response = await base44.functions.invoke('recoverIdentity', {
              txHash: recoverTx.trim(),
              userAddress: account
          });
          const data = response.data;

          if (data.success) {
              toast.success(`Recovered Identity: ${data.subdomain}`);
              window.location.reload();
          } else if (data.reason === 'unknown_name') {
               toast.warning("Verified transaction, but could not read subdomain name. Please contact support or try minting again.");
          } else {
              toast.error(data.error || "Recovery failed");
          }
      } catch (e) {
          console.error(e);
          toast.error(e.response?.data?.error || "Recovery failed");
      } finally {
          setIsRecovering(false);
      }
  };

  const handleMint = async () => {
    if (!isOwner) return;

    setIsMinting(true);
    try {
      // Ensure Solana Wallet is connected
      let targetAddressStr = solanaAddress;
      if (!targetAddressStr) {
          targetAddressStr = await connectSolana();
          if (!targetAddressStr) {
             setIsMinting(false);
             return;
          }
      }

      // Validate Public Key before sending to backend
      const userPK = validateSolanaPK(targetAddressStr);
      console.debug("Minting with valid PK:", userPK.toBase58());

      // 1. Get Transaction from Backend (Generates AI Art + Transaction)
      const response = await base44.functions.invoke('mintSolanaIdentity', {
          userAddress: userPK.toBase58(),
          userEthereneAddress: account
      });
      const data = response.data;
      console.log("Mint Backend Response:", data);

      if (!data.success) throw new Error(data.error || "Setup failed");

      // 2. Decode and Sign with Phantom
      const { Transaction, Connection } = await import('@solana/web3.js');
      const connection = new Connection("https://api.mainnet-beta.solana.com", "confirmed");

      // Decode base64 to Uint8Array using Buffer
      const transactionBuffer = Buffer.from(data.transaction, 'base64');
      const transaction = Transaction.from(transactionBuffer);

      console.log("Transaction decoded. Existing signatures:", transaction.signatures.map(s => s.publicKey.toBase58()));

      // Phantom specific signing
      const { solana } = window;
      let signature;
      try {
          // Use signAndSendTransaction to leverage the wallet's RPC (avoids 403 on public nodes)
          const result = await solana.signAndSendTransaction(transaction);
          signature = result.signature;
          console.log("Transaction sent via wallet. Signature:", signature);
      } catch (signErr) {
          console.error("Signing/Sending failed:", signErr);
          throw new Error(`Wallet Transaction Failed: ${signErr.message || "User rejected or wallet error"}`);
      }

      // Transaction sent successfully - create DB record immediately
      // Note: Confirmation uses WebSocket which may be blocked in browsers
      // The transaction is likely successful if signature was returned
      
      // 4. Create DB Record
      await base44.entities.Identity.create({
           address: account, 
           subdomain: data.subdomain,
           network: 'Solana Mainnet',
           status: 'minted',
           bio: `Solana Identity: ${data.subdomain}`,
           avatar_url: data.imageUrl,
           cover_image: data.imageUrl
      });

      window.open(`https://explorer.solana.com/tx/${signature}`, '_blank');
      window.location.reload();

      } catch (err) {
      console.error("Mint failed detailed:", err);
      let msg = "Unknown error";
      if (err.response?.data?.error) {
          msg = err.response.data.error;
      } else if (err.message) {
          msg = err.message;
      }
      toast.error(`Minting failed: ${msg}`, { duration: 10000 });
      } finally {
      setIsMinting(false);
      }
      };

  const handleFollow = async () => {
      if (!account) return;
      try {
          if (isFollowing) {
              // Unfollow
              const records = await base44.entities.Follow.filter({ follower_address: account, following_address: viewAddress });
              if (records.length > 0) {
                  await base44.entities.Follow.delete(records[0].id);
                  setIsFollowing(false);
                  setFollowersCount(prev => Math.max(0, prev - 1));
                  toast.success("Unfollowed successfully");
              }
          } else {
              // Follow
              await base44.entities.Follow.create({
                  follower_address: account,
                  following_address: viewAddress
              });
              setIsFollowing(true);
              setFollowersCount(prev => prev + 1);
              toast.success("Following user");
          }
      } catch (e) {
          console.error("Follow action failed", e);
          toast.error("Failed to update follow status");
      }
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
      <div className="relative h-48 md:h-64 w-full rounded-b-3xl bg-gradient-to-r from-indigo-900 to-purple-900 overflow-hidden mb-16 md:mb-20 shadow-lg">
          {profileData?.cover_image && (
              <img src={profileData.cover_image} alt="Cover" className="w-full h-full object-cover opacity-80" />
          )}
          <div className="absolute inset-0 bg-black/20" />
      </div>

      {/* Profile Header */}
      <div className="relative -mt-24 md:-mt-32 mb-12 flex flex-col items-center text-center">
          <div className="relative mb-6">
             <div className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-white shadow-xl overflow-hidden bg-white">
                {profileData?.avatar_url ? (
                    <img src={profileData.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                    <IdentityAvatar address={viewAddress} subdomain={profileData?.subdomain} size={160} />
                )}
             </div>
             {profileData && (
                 <div className="absolute bottom-2 right-2 bg-green-500 text-white p-1.5 rounded-full border-2 border-white shadow-sm" title="Verified Node">
                     <CheckCircle2 className="w-4 h-4" />
                 </div>
             )}
          </div>

          {isEditing ? (
              <div className="w-full max-w-2xl mx-auto mb-6">
                  <ProfileEditor 
                      profileData={profileData}
                      onSave={handleSaveProfile}
                      onCancel={() => setIsEditing(false)}
                  />
              </div>
          ) : (
              <>
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
              </>
          )}

          {/* Socials */}
          {Object.keys(socials).filter(key => socials[key]).length > 0 && (
              <div className="flex gap-3 mb-8">
                  {socials.website && <a href={socials.website} target="_blank" rel="noopener" className="p-2 bg-slate-100 rounded-full hover:bg-indigo-100 hover:text-indigo-600 transition-colors" title="Website"><Globe className="w-4 h-4"/></a>}
                  {socials.twitter && <a href={`https://twitter.com/${socials.twitter}`} target="_blank" rel="noopener" className="p-2 bg-slate-100 rounded-full hover:bg-blue-100 hover:text-blue-600 transition-colors" title="Twitter"><MessageSquare className="w-4 h-4"/></a>}
                  {socials.linkedin && <a href={`https://linkedin.com/in/${socials.linkedin}`} target="_blank" rel="noopener" className="p-2 bg-slate-100 rounded-full hover:bg-blue-100 hover:text-blue-600 transition-colors" title="LinkedIn"><Globe className="w-4 h-4"/></a>}
                  {socials.github && <a href={`https://github.com/${socials.github}`} target="_blank" rel="noopener" className="p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors" title="GitHub"><Globe className="w-4 h-4"/></a>}
              </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            {!isOwner && viewAddress && (
                <>
                  <button 
                      onClick={handleFollow}
                      className={`px-6 py-2 rounded-full font-medium transition-colors flex items-center gap-2 shadow-lg ${
                          isFollowing 
                          ? 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50' 
                          : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200'
                      }`}
                  >
                      {isFollowing ? <UserMinus className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                      {isFollowing ? 'Unfollow' : 'Follow'}
                  </button>
                  <Link 
                      to={`${createPageUrl('Profile')}?tab=messages&to=${viewAddress}`}
                      className="px-6 py-2 bg-white border border-slate-200 text-slate-700 rounded-full font-medium hover:bg-slate-50 transition-colors flex items-center gap-2"
                  >
                      <MessageSquare className="w-4 h-4" /> Message
                  </Link>
                </>
            )}
            {isOwner && (
                <>
                  {!isEditing && (
                      <button onClick={() => setIsEditing(true)} className="px-6 py-2 bg-white border border-slate-200 text-slate-700 rounded-full font-medium hover:bg-slate-50 transition-colors flex items-center gap-2">
                          <PenTool className="w-4 h-4" /> Edit Profile
                      </button>
                  )}
                  {!profileData && (
                      <div className="flex flex-col gap-4 items-center w-full max-w-xs">
                          {account ? (
                            <div className="w-full space-y-3">
                                <div className="flex justify-between text-xs text-slate-500 px-4">
                                    <span>Platform Fee</span>
                                    <span className="font-medium">$3.00 USD</span>
                                </div>
                                <button 
                                    onClick={handleMint} 
                                    disabled={isMinting} 
                                    className="w-full px-6 py-3 bg-indigo-600 text-white rounded-full font-medium hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {isMinting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Shield className="w-5 h-5" />}
                                    {isMinting ? "Minting Identity..." : "Mint Identity Token"}
                                </button>
                                <p className="text-center text-xs text-slate-400">
                                    + Network transaction fees (~0.0001 SOL)
                                </p>
                            </div>
                          ) : (
                            <button onClick={connectWallet} className="w-full px-6 py-3 bg-purple-600 text-white rounded-full font-medium hover:bg-purple-700 transition-colors shadow-lg shadow-purple-200 flex items-center justify-center gap-2 group">
                                        <span className="w-2 h-2 bg-white rounded-full group-hover:scale-125 transition-transform" /> 
                                        Connect Phantom
                                    </button>
                                  )}

                                  <div className="mt-4">
                                      <button 
                                          onClick={() => setShowRecover(!showRecover)}
                                          className={`text-xs underline ${foundOnChain ? 'text-green-600 font-bold animate-pulse' : 'text-slate-400 hover:text-indigo-600'}`}
                                      >
                                          {foundOnChain ? "⚠️ Found Identity On-Chain! Sync Now" : "Already minted? Recover Identity"}
                                      </button>

                                      {showRecover && (
                                          <motion.div 
                                              initial={{ opacity: 0, height: 0 }}
                                              animate={{ opacity: 1, height: 'auto' }}
                                              className="mt-2 bg-slate-50 p-3 rounded-lg border border-slate-200"
                                          >
                                              {foundOnChain && (
                                                  <div className="mb-2 text-xs text-green-700 bg-green-50 p-2 rounded">
                                                      Found: {foundOnChain.subdomain || "Unnamed Identity"} <br/>
                                                      <span className="opacity-70">Address: {foundOnChain.registryAddress?.slice(0,8)}...</span>
                                                                  </div>
                                                              )}
                                                              <input 
                                                                  type="text" 
                                                                  placeholder="Paste Transaction Signature"
                                                                  value={recoverTx}
                                                                  onChange={(e) => setRecoverTx(e.target.value)}
                                                                  className="w-full text-xs p-2 border rounded mb-2 font-mono"
                                                              />
                                                              <div className="flex gap-2">
                                                                  <button 
                                                                      onClick={handleRecover}
                                                                      disabled={isRecovering}
                                                                      className="flex-1 py-1 bg-slate-200 text-slate-700 text-xs rounded hover:bg-slate-300 flex justify-center"
                                                                  >
                                                                      {isRecovering ? <Loader2 className="w-3 h-3 animate-spin"/> : "Sync"}
                                                                  </button>
                                                                  <button 
                                                                      onClick={() => setShowImport(true)}
                                                                      className="flex-1 py-1 bg-indigo-600 text-white text-xs rounded hover:bg-indigo-700 transition-colors"
                                                                  >
                                                                      Import Identity
                                                                  </button>
                                                              </div>

                                              <div className="mt-3 pt-3 border-t border-slate-200">
                                                  <div className="flex justify-between items-center mb-2">
                                                      <span className="text-[10px] uppercase text-slate-400 font-bold">Cleanup</span>
                                                      <button 
                                                          onClick={findStuckAccounts}
                                                          disabled={loadingStuck}
                                                          className="text-[10px] text-indigo-600 hover:underline"
                                                      >
                                                          {loadingStuck ? "Scanning..." : "Scan for stuck SOL"}
                                                      </button>
                                                  </div>
                                                  {stuckAccounts.length > 0 && (
                                                      <div className="space-y-2 max-h-32 overflow-y-auto">
                                                          {stuckAccounts.map(acc => (
                                                              <div key={acc.pubkey} className="flex justify-between items-center bg-white p-2 rounded border border-red-100">
                                                                  <div className="text-[10px] text-slate-500 truncate w-20" title={acc.pubkey}>
                                                                      {acc.pubkey.slice(0,4)}...{acc.pubkey.slice(-4)}
                                                                  </div>
                                                                  <div className="text-[10px] text-slate-400">
                                                                      {(acc.lamports / 1000000000).toFixed(3)} SOL
                                                                  </div>
                                                                  <button 
                                                                      onClick={() => closeStuck(acc.pubkey)}
                                                                      disabled={closingAccount === acc.pubkey}
                                                                      className="px-2 py-1 bg-red-50 text-red-600 hover:bg-red-100 rounded text-[10px] font-medium"
                                                                  >
                                                                      {closingAccount === acc.pubkey ? <Loader2 className="w-3 h-3 animate-spin"/> : "Reclaim"}
                                                                  </button>
                                                              </div>
                                                          ))}
                                                      </div>
                                                  )}
                                              </div>
                                              </motion.div>
                                              )}
                                              </div>
                              </div>
                            )}
                </>
            )}
          </div>
      </div>

      {/* Import Identity Modal */}
      {showImport && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div 
                  className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                  onClick={() => setShowImport(false)}
              />
              <div className="relative max-w-lg w-full">
                  <ImportIdentity 
                      account={account}
                      onSuccess={handleImportSuccess}
                  />
              </div>
          </div>
      )}

      <div className="grid lg:grid-cols-3 gap-8">

        {/* Left Column: Stats & Identity */}
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                 <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <Users className="w-5 h-5 text-indigo-600" />
                    Community Stats
                </h3>
                <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="text-center p-3 bg-slate-50 rounded-xl">
                        <span className="block text-2xl font-bold text-slate-900">{followersCount}</span>
                        <span className="text-xs text-slate-500 uppercase tracking-wide">Followers</span>
                    </div>
                    <div className="text-center p-3 bg-slate-50 rounded-xl">
                        <span className="block text-2xl font-bold text-slate-900">{followingCount}</span>
                        <span className="text-xs text-slate-500 uppercase tracking-wide">Following</span>
                    </div>
                </div>

                <div className="h-px bg-slate-100 my-6" />

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
                            <span className="text-xs text-slate-400 block mb-1">Subdomain</span>
                            <code className="block w-full bg-slate-50 p-2 rounded text-xs text-slate-600 break-all">{profileData.subdomain}</code>
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
             <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden min-h-[500px]">
                {/* Tabs Header */}
                <div className="flex border-b border-slate-100 overflow-x-auto">
                    <button 
                        onClick={() => setActiveTab('all')}
                        className={`flex-1 py-4 px-2 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${
                            activeTab === 'all' 
                                ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50' 
                                : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                        }`}
                    >
                        All Activity
                    </button>
                    <button 
                        onClick={() => setActiveTab('created')}
                        className={`flex-1 py-4 px-2 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${
                            activeTab === 'created' 
                                ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50' 
                                : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                        }`}
                    >
                        Transmissions
                    </button>
                    <button 
                        onClick={() => setActiveTab('participated')}
                        className={`flex-1 py-4 px-2 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${
                            activeTab === 'participated' 
                                ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50' 
                                : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                        }`}
                    >
                        Resonances
                    </button>
                    {isOwner && (
                        <button 
                            onClick={() => setActiveTab('messages')}
                            className={`flex-1 py-4 px-2 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${
                                activeTab === 'messages' 
                                    ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50' 
                                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                            }`}
                        >
                            <span className="flex items-center gap-2 justify-center">
                                <MessageSquare className="w-4 h-4" />
                                Messages
                            </span>
                        </button>
                    )}
                </div>

                {/* Content */}
                {activeTab === 'messages' && isOwner ? (
                    <div className="h-[600px] flex flex-col md:flex-row bg-white">
                         <div className={`w-full md:w-80 border-r border-slate-100 bg-white flex flex-col ${selectedConversationUser ? 'hidden md:flex' : 'flex'}`}>
                            <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                                <h2 className="font-bold text-slate-900 text-sm">Conversations</h2>
                            </div>
                            <ConversationList 
                                account={account} 
                                onSelectUser={(addr) => setSelectedConversationUser(addr)} 
                                selectedUser={selectedConversationUser} 
                            />
                        </div>

                        <div className={`flex-1 flex flex-col h-full ${!selectedConversationUser ? 'hidden md:flex' : 'flex'}`}>
                            {selectedConversationUser && (
                                <div className="md:hidden p-2 bg-white border-b border-slate-100">
                                    <button onClick={() => setSelectedConversationUser(null)} className="text-sm text-indigo-600 font-medium px-2 py-1 flex items-center gap-1">
                                        <X className="w-4 h-4" /> Close Chat
                                    </button>
                                </div>
                            )}
                            <ChatWindow 
                                account={account} 
                                otherUserAddress={selectedConversationUser} 
                            />
                        </div>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100">
                        {activities
                            .filter(item => {
                                if (activeTab === 'all') return true;
                                if (activeTab === 'created') return item.type === 'transmission';
                                if (activeTab === 'participated') return item.type === 'resonance';
                                return true;
                            })
                            .map((item, i) => (
                                <div key={i} className="p-6 flex gap-4 hover:bg-slate-50 transition-colors">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                                        item.type === 'transmission' ? 'bg-purple-100 text-purple-600' :
                                        item.type === 'oracle' ? 'bg-blue-100 text-blue-600' :
                                        item.type === 'resonance' ? 'bg-amber-100 text-amber-600' :
                                        'bg-green-100 text-green-600'
                                    }`}>
                                        {item.type === 'transmission' && <Radio className="w-5 h-5" />}
                                        {item.type === 'oracle' && <MessageSquare className="w-5 h-5" />}
                                        {item.type === 'mint' && <Shield className="w-5 h-5" />}
                                        {item.type === 'resonance' && <MessageSquare className="w-5 h-5" />}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start mb-1">
                                            <p className="font-medium text-slate-900">
                                                {item.type === 'transmission' && 'Broadcasted a Transmission'}
                                                {item.type === 'oracle' && 'Consulted the Oracle'}
                                                {item.type === 'mint' && 'Minted Identity'}
                                                {item.type === 'resonance' && 'Replied to a Transmission'}
                                            </p>
                                            <span className="text-xs text-slate-400">{moment(item.date).fromNow()}</span>
                                        </div>
                                        <p className="text-slate-600 text-sm whitespace-pre-wrap">
                                            {item.type === 'transmission' && item.content}
                                            {item.type === 'oracle' && (item.topic ? `Topic: ${item.topic}` : 'Deep protocol meditation')}
                                            {item.type === 'mint' && `Subdomain: ${item.subdomain}`}
                                            {item.type === 'resonance' && item.content}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        
                        {activities.filter(item => {
                            if (activeTab === 'all') return true;
                            if (activeTab === 'created') return item.type === 'transmission';
                            if (activeTab === 'participated') return item.type === 'resonance';
                            return true;
                        }).length === 0 && (
                            <div className="p-12 text-center text-slate-500">
                                No activity found in this frequency.
                            </div>
                        )}
                    </div>
                )}
             </div>
        </div>

      </div>
    </div>
  );
}