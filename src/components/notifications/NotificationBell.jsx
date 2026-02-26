import React, { useState, useEffect, useRef } from 'react';
import { Bell } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { AnimatePresence, motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';

const TYPE_LABELS = {
  new_follower: 'followed you',
  new_reply: 'replied to your transmission',
  following_transmission: 'posted a new transmission',
};

export default function NotificationBell({ account }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const queryClient = useQueryClient();

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications', account],
    queryFn: () => base44.entities.Notification.filter({ recipient_address: account }, '-created_date', 30),
    enabled: !!account,
    refetchInterval: 15000,
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllRead = useMutation({
    mutationFn: async () => {
      const unread = notifications.filter(n => !n.read);
      await Promise.all(unread.map(n => base44.entities.Notification.update(n.id, { read: true })));
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications', account] }),
  });

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleOpen = () => {
    setOpen(v => !v);
    if (!open && unreadCount > 0) {
      setTimeout(() => markAllRead.mutate(), 800);
    }
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={handleOpen}
        className="relative p-2 rounded-full hover:bg-slate-800 transition-colors"
        title="Notifications"
      >
        <Bell className="w-5 h-5 text-slate-300" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-fuchsia-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-80 bg-slate-900 border border-fuchsia-500/30 rounded-2xl shadow-2xl z-50 overflow-hidden"
          >
            <div className="flex justify-between items-center px-4 py-3 border-b border-slate-800">
              <span className="text-sm font-bold text-white">Notifications</span>
              <Link
                to={createPageUrl('NotificationSettings')}
                onClick={() => setOpen(false)}
                className="text-xs text-cyan-400 hover:underline"
              >
                Settings
              </Link>
            </div>

            <div className="max-h-96 overflow-y-auto divide-y divide-slate-800">
              {notifications.length === 0 ? (
                <div className="py-10 text-center text-slate-500 text-sm">No notifications yet</div>
              ) : notifications.map(n => (
                <div
                  key={n.id}
                  className={`px-4 py-3 flex gap-3 items-start transition-colors ${!n.read ? 'bg-fuchsia-500/5' : ''}`}
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-fuchsia-600 flex items-center justify-center flex-shrink-0 text-white text-xs font-bold">
                    {(n.actor_address || '?').slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white leading-snug">
                      <span className="font-mono text-cyan-400 text-xs">
                        {n.actor_address?.slice(0, 6)}...{n.actor_address?.slice(-4)}
                      </span>{' '}
                      <span className="text-slate-300">{TYPE_LABELS[n.type]}</span>
                    </p>
                    {n.transmission_preview && (
                      <p className="text-xs text-slate-500 mt-0.5 truncate">{n.transmission_preview}</p>
                    )}
                    <span className="text-[10px] text-slate-600">
                      {formatDistanceToNow(new Date(n.created_date), { addSuffix: true })}
                    </span>
                  </div>
                  {!n.read && <div className="w-2 h-2 bg-fuchsia-400 rounded-full mt-1 flex-shrink-0" />}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}