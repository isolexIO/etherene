import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bell, UserPlus, MessageCircle, Radio, Loader2, CheckCircle2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useWeb3 } from '../Layout';
import { toast } from 'sonner';

const PREFS = [
  {
    key: 'new_follower',
    icon: UserPlus,
    title: 'New Follower',
    description: 'When someone follows you on the network.',
    color: 'from-cyan-500 to-blue-600',
  },
  {
    key: 'new_reply',
    icon: MessageCircle,
    title: 'Transmission Reply',
    description: 'When someone replies to one of your transmissions.',
    color: 'from-fuchsia-500 to-purple-600',
  },
  {
    key: 'following_transmission',
    icon: Radio,
    title: 'New Transmission from Followed Nodes',
    description: 'When someone you follow broadcasts a new transmission.',
    color: 'from-amber-500 to-orange-600',
  },
];

export default function NotificationSettings() {
  const { account } = useWeb3();
  const [prefs, setPrefs] = useState({ new_follower: true, new_reply: true, following_transmission: true });
  const [prefId, setPrefId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!account) { setLoading(false); return; }
    base44.entities.NotificationPrefs.filter({ address: account }).then(res => {
      if (res[0]) {
        setPrefs({
          new_follower: res[0].new_follower ?? true,
          new_reply: res[0].new_reply ?? true,
          following_transmission: res[0].following_transmission ?? true,
        });
        setPrefId(res[0].id);
      }
      setLoading(false);
    });
  }, [account]);

  const handleSave = async () => {
    if (!account) return;
    setSaving(true);
    try {
      const data = { address: account, ...prefs };
      if (prefId) {
        await base44.entities.NotificationPrefs.update(prefId, data);
      } else {
        const created = await base44.entities.NotificationPrefs.create(data);
        setPrefId(created.id);
      }
      toast.success('Notification preferences saved');
    } catch (e) {
      toast.error('Failed to save preferences');
    } finally {
      setSaving(false);
    }
  };

  if (!account) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-slate-400">
        <Bell className="w-12 h-12 mb-4 opacity-30" />
        <p>Connect your wallet to manage notifications.</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-fuchsia-600 flex items-center justify-center">
            <Bell className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Notification Settings</h1>
            <p className="text-slate-400 text-sm">Choose what you want to be notified about.</p>
          </div>
        </div>

        <div className="mt-8 space-y-4">
          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-fuchsia-500" />
            </div>
          ) : PREFS.map(({ key, icon: Icon, title, description, color }) => (
            <div
              key={key}
              className="flex items-center justify-between bg-slate-900/60 border border-slate-800 rounded-2xl p-5 gap-4"
            >
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center flex-shrink-0`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-white text-sm">{title}</p>
                  <p className="text-slate-400 text-xs mt-0.5">{description}</p>
                </div>
              </div>

              {/* Toggle */}
              <button
                onClick={() => setPrefs(p => ({ ...p, [key]: !p[key] }))}
                className={`relative w-12 h-6 rounded-full transition-colors flex-shrink-0 ${
                  prefs[key] ? 'bg-fuchsia-500' : 'bg-slate-700'
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                    prefs[key] ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          ))}
        </div>

        {!loading && (
          <button
            onClick={handleSave}
            disabled={saving}
            className="mt-8 w-full py-3 bg-gradient-to-r from-cyan-500 to-fuchsia-600 text-white font-bold rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            {saving ? 'Saving...' : 'Save Preferences'}
          </button>
        )}
      </motion.div>
    </div>
  );
}