import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Save, X, Upload, Loader2, Globe, Twitter, Linkedin, Github, Link as LinkIcon } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

const SOCIAL_PLATFORMS = [
    { key: 'website', label: 'Website', icon: Globe, placeholder: 'https://yoursite.com' },
    { key: 'twitter', label: 'Twitter', icon: Twitter, placeholder: 'username' },
    { key: 'linkedin', label: 'LinkedIn', icon: Linkedin, placeholder: 'username' },
    { key: 'github', label: 'GitHub', icon: Github, placeholder: 'username' },
];

export default function ProfileEditor({ profileData, onSave, onCancel }) {
    const [formData, setFormData] = useState({
        display_name: profileData?.display_name || '',
        bio: profileData?.bio || '',
        cover_image: profileData?.cover_image || '',
        avatar_url: profileData?.avatar_url || '',
        socials: profileData?.socials ? JSON.parse(profileData.socials) : {}
    });
    const [isSaving, setIsSaving] = useState(false);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const [uploadingCover, setUploadingCover] = useState(false);

    const handleSocialChange = (platform, value) => {
        setFormData(prev => ({
            ...prev,
            socials: { ...prev.socials, [platform]: value }
        }));
    };

    const handleImageUpload = async (file, type) => {
        if (!file) return;
        
        const setLoading = type === 'avatar' ? setUploadingAvatar : setUploadingCover;
        setLoading(true);

        try {
            const response = await base44.integrations.Core.UploadFile({ file });
            const imageUrl = response.file_url;

            setFormData(prev => ({
                ...prev,
                [type === 'avatar' ? 'avatar_url' : 'cover_image']: imageUrl
            }));

            toast.success(`${type === 'avatar' ? 'Avatar' : 'Cover'} uploaded successfully`);
        } catch (error) {
            console.error(error);
            toast.error("Failed to upload image");
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSaving(true);

        try {
            await base44.entities.Identity.update(profileData.id, {
                display_name: formData.display_name,
                bio: formData.bio,
                avatar_url: formData.avatar_url,
                cover_image: formData.cover_image,
                socials: JSON.stringify(formData.socials)
            });

            toast.success("Profile updated successfully");
            onSave({ ...profileData, ...formData, socials: JSON.stringify(formData.socials) });
        } catch (error) {
            console.error(error);
            toast.error("Failed to update profile");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl p-6 border border-slate-200 shadow-lg"
        >
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-slate-900">Edit Profile</h3>
                <button onClick={onCancel} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                    <X className="w-5 h-5 text-slate-400" />
                </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Cover Image */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                        Cover Image
                    </label>
                    <div className="relative h-32 bg-slate-100 rounded-xl overflow-hidden border-2 border-dashed border-slate-200 hover:border-indigo-300 transition-colors group">
                        {formData.cover_image && (
                            <img src={formData.cover_image} alt="Cover" className="w-full h-full object-cover" />
                        )}
                        <label className="absolute inset-0 flex items-center justify-center cursor-pointer bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleImageUpload(e.target.files[0], 'cover')}
                                className="hidden"
                                disabled={uploadingCover}
                            />
                            {uploadingCover ? (
                                <Loader2 className="w-6 h-6 text-white animate-spin" />
                            ) : (
                                <div className="text-center text-white">
                                    <Upload className="w-6 h-6 mx-auto mb-1" />
                                    <span className="text-sm">Upload Cover</span>
                                </div>
                            )}
                        </label>
                    </div>
                </div>

                {/* Avatar */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                        Avatar
                    </label>
                    <div className="flex items-center gap-4">
                        <div className="relative w-20 h-20 bg-slate-100 rounded-full overflow-hidden border-2 border-slate-200 group">
                            {formData.avatar_url && (
                                <img src={formData.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                            )}
                            <label className="absolute inset-0 flex items-center justify-center cursor-pointer bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => handleImageUpload(e.target.files[0], 'avatar')}
                                    className="hidden"
                                    disabled={uploadingAvatar}
                                />
                                {uploadingAvatar ? (
                                    <Loader2 className="w-5 h-5 text-white animate-spin" />
                                ) : (
                                    <Upload className="w-5 h-5 text-white" />
                                )}
                            </label>
                        </div>
                        <p className="text-sm text-slate-500">Click to upload a new avatar</p>
                    </div>
                </div>

                {/* Display Name */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                        Display Name
                    </label>
                    <input
                        type="text"
                        value={formData.display_name}
                        onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                        placeholder="Your name"
                        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-100 focus:border-indigo-600 outline-none"
                    />
                </div>

                {/* Bio */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                        Bio
                    </label>
                    <textarea
                        value={formData.bio}
                        onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                        placeholder="Tell us about yourself..."
                        rows={4}
                        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-100 focus:border-indigo-600 outline-none resize-none"
                    />
                    <p className="text-xs text-slate-400 mt-1">{formData.bio.length} characters</p>
                </div>

                {/* Social Links */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-3">
                        Social Links
                    </label>
                    <div className="space-y-3">
                        {SOCIAL_PLATFORMS.map((platform) => {
                            const Icon = platform.icon;
                            return (
                                <div key={platform.key} className="flex items-center gap-3">
                                    <div className="p-2 bg-slate-100 rounded-lg">
                                        <Icon className="w-4 h-4 text-slate-600" />
                                    </div>
                                    <input
                                        type="text"
                                        value={formData.socials[platform.key] || ''}
                                        onChange={(e) => handleSocialChange(platform.key, e.target.value)}
                                        placeholder={platform.placeholder}
                                        className="flex-1 px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-100 focus:border-indigo-600 outline-none"
                                    />
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4">
                    <button
                        type="submit"
                        disabled={isSaving}
                        className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                        {isSaving ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button
                        type="button"
                        onClick={onCancel}
                        className="px-6 py-3 bg-white border border-slate-200 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-colors"
                    >
                        Cancel
                    </button>
                </div>
            </form>
        </motion.div>
    );
}