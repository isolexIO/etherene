import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useWeb3 } from '../Layout';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../components/utils';
import { User, Camera, Save, ArrowLeft, Loader2 } from 'lucide-react';
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
    avatar_url: ''
  });
  const [isUploading, setIsUploading] = useState(false);

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
        avatar_url: identity.avatar_url || ''
      });
    }
  }, [identity]);

  const updateProfileMutation = useMutation({
    mutationFn: async (data) => {
      if (!identity) {
        throw new Error("No identity found. Please mint your identity first.");
      }
      return await base44.entities.Identity.update(identity.id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['identity', account]);
      navigate(createPageUrl('Profile'));
    },
  });

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFormData(prev => ({ ...prev, avatar_url: file_url }));
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
          
          {/* Avatar Section */}
          <div className="flex flex-col items-center mb-8">
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
                <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} disabled={isUploading} />
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