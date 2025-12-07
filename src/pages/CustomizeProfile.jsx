import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useWeb3 } from '../Layout';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../components/utils';
import { User, Camera, Save, ArrowLeft, Loader2, AlertCircle, Box } from 'lucide-react';
import { toast } from 'sonner';
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import IdentityAvatar from '../components/profile/IdentityAvatar';

export default function CustomizeProfile() {
  const { account, chainId, connectWallet } = useWeb3();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    display_name: '',
    bio: '',
    avatar_url: '',
    avatar_cid: '',
    bio_cid: '',
    cover_image: '',
    socials: '{}'
  });
  const [isUploading, setIsUploading] = useState(false);
  const [socialInputs, setSocialInputs] = useState({ twitter: '', website: '', farcaster: '', lens: '' });

  // Fetch existing identity
  const { data: identity, isLoading } = useQuery({
    queryKey: ['identity', account],
    queryFn: async () => {
      if (!account) return null;
      const identities = await base44.entities.Identity.filter({ address: account });
      return identities[0] || null;
    },
    enabled: !!account,
  });

  useEffect(() => {
    if (identity) {
      setFormData({
        display_name: identity.display_name || '',
        bio: identity.bio || '',
        avatar_url: identity.avatar_url || '',
        avatar_cid: identity.avatar_cid || '',
        bio_cid: identity.bio_cid || '',
        cover_image: identity.cover_image || '',
        socials: identity.socials || '{}'
      });
      
      try {
          const parsed = JSON.parse(identity.socials || '{}');
          setSocialInputs(prev => ({ ...prev, ...parsed }));
      } catch (e) {
          console.error("Failed to parse socials", e);
      }
    }
  }, [identity]);

  // Sync socials to formData
  useEffect(() => {
      setFormData(prev => ({ ...prev, socials: JSON.stringify(socialInputs) }));
  }, [socialInputs]);

  const updateProfileMutation = useMutation({
    mutationFn: async (data) => {
      if (!identity) {
        throw new Error("No identity found. Please mint your identity first.");
      }
      
      // Upload Bio to IPFS if changed
      let bioCid = data.bio_cid;
      if (data.bio && data.bio !== identity.bio) {
        try {
           const bioRes = await base44.functions.invoke('uploadToIpfs', { 
             type: 'json', 
             textContent: data.bio 
           });
           if (bioRes.data.cid) bioCid = bioRes.data.cid;
        } catch (e) {
            console.error("Failed to upload bio to IPFS:", e);
            // Continue without failing the whole update, but maybe warn?
        }
      }

      return await base44.entities.Identity.update(identity.id, {
        ...data,
        bio_cid: bioCid
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['identity', account]);
      toast.success("Profile updated successfully!");
      setTimeout(() => navigate(createPageUrl('Profile')), 1000);
    },
    onError: (error) => {
      console.error("Profile update failed:", error);
      toast.error(error.message || "Failed to update profile");
    }
  });

  const handleFileChange = async (e, field) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      
      if (field === 'avatar') {
        let cid = '';
        try {
            const ipfsRes = await base44.functions.invoke('uploadToIpfs', { type: 'file', fileUrl: file_url });
            if (ipfsRes.data.cid) {
                cid = ipfsRes.data.cid;
                toast.success("Avatar pinned to IPFS!");
            }
        } catch (ipfsError) {
            console.error("IPFS Upload failed:", ipfsError);
            toast.warning("Could not pin to IPFS, saved locally.");
        }
        setFormData(prev => ({ ...prev, avatar_url: file_url, avatar_cid: cid }));
      } else if (field === 'cover') {
        setFormData(prev => ({ ...prev, cover_image: file_url }));
      }

    } catch (error) {
      console.error("Upload failed:", error);
      alert("Failed to upload image.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    updateProfileMutation.mutate(formData);
  };

  if (!account) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Connect Wallet</h2>
        <p className="text-slate-500 mb-8">Please connect your wallet to customize your profile.</p>
        <button onClick={connectWallet} className="px-8 py-3 rounded-full bg-slate-900 text-white font-medium">Connect Wallet</button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!identity) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] px-4 text-center">
        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
          <AlertCircle className="w-8 h-8 text-red-500" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">Identity Not Found</h2>
        <p className="text-slate-500 mb-6 max-w-md">
          We couldn't find your Etherene Identity. You need to mint your identity before you can customize your profile.
        </p>
        <button 
          onClick={() => navigate(createPageUrl('Profile'))}
          className="px-6 py-3 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors"
        >
          Go to Profile to Mint
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <button 
        onClick={() => navigate(createPageUrl('Profile'))}
        className="flex items-center text-slate-500 hover:text-indigo-600 mb-8 transition-colors"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Profile
      </button>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm"
      >
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Customize Profile</h1>
        <p className="text-slate-500 mb-8">Update your public profile information on the Etherene network.</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Cover Image */}
          <div className="relative h-48 w-full rounded-2xl bg-slate-100 overflow-hidden mb-8 group">
             {formData.cover_image ? (
                 <img src={formData.cover_image} alt="Cover" className="w-full h-full object-cover" />
             ) : (
                 <div className="w-full h-full flex items-center justify-center text-slate-400">
                     <p>No Cover Image</p>
                 </div>
             )}
             <label className="absolute bottom-4 right-4 px-4 py-2 bg-black/50 text-white rounded-lg cursor-pointer hover:bg-black/70 transition-colors backdrop-blur-sm flex items-center gap-2">
                 <Camera className="w-4 h-4" />
                 <span>Change Cover</span>
                 <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'cover')} disabled={isUploading} />
             </label>
          </div>

          {/* Avatar Section - Negative Margin to overlap cover */}
          <div className="flex flex-col items-center mb-8 -mt-20 relative z-10">
            <div className="relative group">
              <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-lg bg-slate-50">
                {formData.avatar_url ? (
                  <img src={formData.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  identity ? (
                    <IdentityAvatar address={account} soulHash={identity.soul_hash} size={128} chainId={Number(chainId || 1)} />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-slate-100">
                      <User className="w-12 h-12 text-slate-300" />
                    </div>
                  )
                )}
              </div>
              <label className="absolute bottom-0 right-0 p-2 bg-indigo-600 rounded-full text-white cursor-pointer hover:bg-indigo-700 transition-colors shadow-md">
                <Camera className="w-4 h-4" />
                <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'avatar')} disabled={isUploading} />
              </label>
            </div>
            {isUploading && <p className="text-sm text-indigo-600 mt-2">Uploading...</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="display_name">Display Name</Label>
            <Input
              id="display_name"
              placeholder="e.g. Satoshi Nakamoto"
              value={formData.display_name}
              onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
              className="bg-slate-50 border-slate-200"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              placeholder="Tell us about yourself..."
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              className="bg-slate-50 border-slate-200 min-h-[100px]"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="twitter">Twitter / X</Label>
                <Input
                  id="twitter"
                  placeholder="@username"
                  value={socialInputs.twitter}
                  onChange={(e) => setSocialInputs({ ...socialInputs, twitter: e.target.value })}
                  className="bg-slate-50 border-slate-200"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  placeholder="https://..."
                  value={socialInputs.website}
                  onChange={(e) => setSocialInputs({ ...socialInputs, website: e.target.value })}
                  className="bg-slate-50 border-slate-200"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="farcaster">Farcaster</Label>
                <Input
                  id="farcaster"
                  placeholder="username"
                  value={socialInputs.farcaster}
                  onChange={(e) => setSocialInputs({ ...socialInputs, farcaster: e.target.value })}
                  className="bg-slate-50 border-slate-200"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lens">Lens</Label>
                <Input
                  id="lens"
                  placeholder="@handle"
                  value={socialInputs.lens}
                  onChange={(e) => setSocialInputs({ ...socialInputs, lens: e.target.value })}
                  className="bg-slate-50 border-slate-200"
                />
              </div>
          </div>

          {(formData.avatar_cid || formData.bio_cid) && (
            <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100 space-y-2">
                <div className="flex items-center gap-2 text-indigo-700 font-bold text-sm mb-2">
                    <Box className="w-4 h-4" />
                    <span>Decentralized Storage (IPFS)</span>
                </div>
                {formData.avatar_cid && (
                    <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500">Avatar CID:</span>
                        <code className="bg-white px-2 py-1 rounded border border-indigo-100 text-indigo-600 font-mono">
                            {formData.avatar_cid.slice(0, 10)}...{formData.avatar_cid.slice(-10)}
                        </code>
                    </div>
                )}
                {formData.bio_cid && (
                    <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500">Bio CID:</span>
                        <code className="bg-white px-2 py-1 rounded border border-indigo-100 text-indigo-600 font-mono">
                            {formData.bio_cid.slice(0, 10)}...{formData.bio_cid.slice(-10)}
                        </code>
                    </div>
                )}
            </div>
          )}

          <Button 
            type="submit" 
            disabled={updateProfileMutation.isPending || isUploading}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white py-6 text-lg rounded-xl"
          >
            {updateProfileMutation.isPending ? (
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
            ) : (
              <Save className="w-5 h-5 mr-2" />
            )}
            Save Changes
          </Button>
        </form>
      </motion.div>
    </div>
  );
}