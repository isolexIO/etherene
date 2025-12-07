import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useWeb3 } from '../Layout';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../components/utils';
import { User, Camera, Save, ArrowLeft, Loader2, AlertCircle, FileText, CheckCircle2, XCircle, ShieldCheck } from 'lucide-react';
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
    id_document_url: ''
  });
  const [isUploading, setIsUploading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

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
        id_document_url: identity.id_document_url || ''
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
      setFormData(prev => ({ ...prev, [field]: file_url }));
      toast.success(`${field === 'avatar_url' ? 'Avatar' : 'Document'} uploaded!`);
    } catch (error) {
      console.error("Upload failed:", error);
      toast.error("Failed to upload image.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleVerification = async () => {
    if (!identity || !formData.id_document_url) return;
    
    // Save first to ensure the URL is in the DB
    await updateProfileMutation.mutateAsync(formData);

    setIsVerifying(true);
    try {
      toast.info("Analyzing document with AI...");
      const response = await base44.functions.invoke('verifyIdentity', { identityId: identity.id });
      
      if (response.data.status === 'verified') {
        toast.success("Identity Verified Successfully!");
      } else {
        toast.error(`Verification Rejected: ${response.data.reason}`);
      }
      queryClient.invalidateQueries(['identity', account]);
    } catch (error) {
      console.error("Verification failed:", error);
      toast.error("Verification process failed. Please try again.");
    } finally {
      setIsVerifying(false);
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
                <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'avatar_url')} disabled={isUploading} />
              </label>
            </div>
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

          <div className="pt-6 border-t border-slate-100">
            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-indigo-600" />
              Identity Verification
            </h3>
            
            <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
              <div className="mb-4">
                <Label className="mb-2 block">Government ID Upload</Label>
                <div className="flex items-center gap-4">
                  {formData.id_document_url ? (
                    <div className="relative w-full h-32 bg-white rounded-lg border border-slate-200 overflow-hidden group">
                      <img src={formData.id_document_url} alt="ID Document" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <label className="cursor-pointer text-white font-medium hover:underline">
                          Change
                          <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'id_document_url')} disabled={isUploading || identity?.verification_status === 'verified'} />
                        </label>
                      </div>
                    </div>
                  ) : (
                    <label className="flex-1 flex flex-col items-center justify-center h-32 bg-white border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
                      <FileText className="w-8 h-8 text-slate-400 mb-2" />
                      <span className="text-sm text-slate-500">Upload ID Document</span>
                      <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'id_document_url')} disabled={isUploading} />
                    </label>
                  )}
                </div>
              </div>

              {identity?.verification_status === 'verified' ? (
                <div className="flex items-center gap-2 text-green-600 bg-green-50 p-3 rounded-lg border border-green-100">
                  <CheckCircle2 className="w-5 h-5" />
                  <span className="font-medium">Identity Verified</span>
                </div>
              ) : identity?.verification_status === 'rejected' ? (
                <div className="space-y-3">
                  <div className="flex items-start gap-2 text-red-600 bg-red-50 p-3 rounded-lg border border-red-100">
                    <XCircle className="w-5 h-5 mt-0.5" />
                    <div>
                      <span className="font-medium block">Verification Rejected</span>
                      <span className="text-sm opacity-90">{identity.verification_feedback}</span>
                    </div>
                  </div>
                  <Button 
                    type="button"
                    onClick={handleVerification}
                    disabled={isVerifying || !formData.id_document_url}
                    className="w-full bg-slate-900 text-white"
                  >
                    {isVerifying ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : "Retry Verification"}
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-slate-500">
                    Upload a valid government ID to verify your identity. This will add a verification badge to your profile.
                  </p>
                  <Button 
                    type="button"
                    onClick={handleVerification}
                    disabled={isVerifying || !formData.id_document_url}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
                  >
                    {isVerifying ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : "Verify Identity"}
                  </Button>
                </div>
              )}
            </div>
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