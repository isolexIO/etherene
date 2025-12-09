import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Send, Loader2, MoreVertical, Shield } from 'lucide-react';
import IdentityAvatar from '../profile/IdentityAvatar';
import moment from 'moment';

export default function ChatWindow({ account, otherUserAddress }) {
    const [newMessage, setNewMessage] = useState('');
    const messagesEndRef = useRef(null);
    const queryClient = useQueryClient();

    // Fetch other user's identity
    const { data: otherIdentity } = useQuery({
        queryKey: ['identity', otherUserAddress],
        queryFn: async () => {
            const res = await base44.entities.Identity.filter({ address: otherUserAddress });
            return res[0] || null;
        },
        enabled: !!otherUserAddress
    });

    // Fetch messages for this specific conversation
    const { data: messages, isLoading } = useQuery({
        queryKey: ['messages', account, otherUserAddress],
        queryFn: async () => {
            // Fetch sent and received
            const [sent, received] = await Promise.all([
                base44.entities.Message.filter({ sender_address: account, recipient_address: otherUserAddress }),
                base44.entities.Message.filter({ sender_address: otherUserAddress, recipient_address: account })
            ]);
            
            // Mark received as read
            const unread = received.filter(m => !m.read);
            if (unread.length > 0) {
                 // Fire and forget read update
                 Promise.all(unread.map(m => base44.entities.Message.update(m.id, { read: true })))
                    .then(() => queryClient.invalidateQueries(['myMessages']));
            }

            return [...sent, ...received].sort((a, b) => new Date(a.created_date) - new Date(b.created_date));
        },
        refetchInterval: 3000,
        enabled: !!account && !!otherUserAddress
    });

    const sendMessageMutation = useMutation({
        mutationFn: async (content) => {
            return await base44.entities.Message.create({
                sender_address: account,
                recipient_address: otherUserAddress,
                content: content,
                read: false
            });
        },
        onSuccess: () => {
            setNewMessage('');
            queryClient.invalidateQueries(['messages', account, otherUserAddress]);
            queryClient.invalidateQueries(['myMessages']);
        }
    });

    const handleSend = (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;
        sendMessageMutation.mutate(newMessage);
    };

    // Auto scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    if (!otherUserAddress) {
        return (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 bg-slate-50/50">
                <Shield className="w-12 h-12 mb-4 opacity-20" />
                <p>Select a conversation to start messaging</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-white">
            {/* Header */}
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-white z-10">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-100 border border-slate-200">
                        {otherIdentity?.avatar_url ? (
                            <img src={otherIdentity.avatar_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                            <IdentityAvatar address={otherUserAddress} soulHash={otherIdentity?.soul_hash} size={40} chainId={1} />
                        )}
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-900">
                            {otherIdentity?.display_name || `${otherUserAddress.slice(0, 6)}...${otherUserAddress.slice(-4)}`}
                        </h3>
                        {otherIdentity && (
                            <p className="text-xs text-slate-500 flex items-center gap-1">
                                <span className={`w-2 h-2 rounded-full ${otherIdentity.last_seen && (new Date() - new Date(otherIdentity.last_seen) < 10 * 60 * 1000) ? 'bg-green-500' : 'bg-slate-300'}`} />
                                {otherIdentity.last_seen && (new Date() - new Date(otherIdentity.last_seen) < 10 * 60 * 1000) ? 'Online' : 'Offline'}
                            </p>
                        )}
                    </div>
                </div>
                <button className="text-slate-400 hover:text-slate-600">
                    <MoreVertical className="w-5 h-5" />
                </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/30">
                {isLoading ? (
                    <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-slate-300" /></div>
                ) : (
                    messages?.map((msg) => {
                        const isMe = msg.sender_address === account;
                        return (
                            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[70%] rounded-2xl px-4 py-2 text-sm ${
                                    isMe 
                                        ? 'bg-indigo-600 text-white rounded-tr-sm' 
                                        : 'bg-white border border-slate-100 text-slate-800 rounded-tl-sm shadow-sm'
                                }`}>
                                    <p className="whitespace-pre-wrap">{msg.content}</p>
                                    <p className={`text-[10px] mt-1 text-right ${isMe ? 'text-indigo-200' : 'text-slate-400'}`}>
                                        {moment(msg.created_date).format('HH:mm')}
                                        {isMe && (
                                            <span className="ml-1 opacity-80">{msg.read ? '• Read' : '• Sent'}</span>
                                        )}
                                    </p>
                                </div>
                            </div>
                        );
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white border-t border-slate-100">
                <form onSubmit={handleSend} className="flex gap-2">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-1 bg-slate-50 border border-slate-200 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                    />
                    <button 
                        type="submit" 
                        disabled={!newMessage.trim() || sendMessageMutation.isPending}
                        className="p-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {sendMessageMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                    </button>
                </form>
            </div>
        </div>
    );
}