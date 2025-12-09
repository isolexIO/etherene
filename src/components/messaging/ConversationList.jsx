import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Search, Loader2 } from 'lucide-react';
import IdentityAvatar from '../profile/IdentityAvatar';
import moment from 'moment';

export default function ConversationList({ account, onSelectUser, selectedUser }) {
    const [conversations, setConversations] = useState([]);
    
    // Fetch all messages involving the user to build the conversation list
    // In a real app with many messages, this would be an optimized backend query
    const { data: messages, isLoading } = useQuery({
        queryKey: ['myMessages', account],
        queryFn: async () => {
            if (!account) return [];
            // We need both sent and received messages
            const [sent, received] = await Promise.all([
                base44.entities.Message.filter({ sender_address: account }),
                base44.entities.Message.filter({ recipient_address: account })
            ]);
            return [...sent, ...received].sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
        },
        refetchInterval: 5000,
        enabled: !!account
    });

    const { data: identities } = useQuery({
        queryKey: ['identities'],
        queryFn: () => base44.entities.Identity.list(),
        staleTime: 60000
    });

    useEffect(() => {
        if (!messages || !account) return;

        const uniqueUsers = new Map();

        messages.forEach(msg => {
            const otherUser = msg.sender_address === account ? msg.recipient_address : msg.sender_address;
            if (!uniqueUsers.has(otherUser)) {
                uniqueUsers.set(otherUser, {
                    address: otherUser,
                    lastMessage: msg,
                    unreadCount: (!msg.read && msg.recipient_address === account) ? 1 : 0
                });
            } else {
                // If we already have this user, just update unread count if needed
                // Note: since we sorted by date descending, the first one we hit is the lastMessage
                if (!msg.read && msg.recipient_address === account) {
                    const existing = uniqueUsers.get(otherUser);
                    existing.unreadCount += 1;
                }
            }
        });

        // Resolve identities
        const conversationArray = Array.from(uniqueUsers.values()).map(conv => {
            const identity = identities?.find(i => i.address === conv.address);
            return {
                ...conv,
                displayName: identity?.display_name || `${conv.address.slice(0, 6)}...`,
                avatarUrl: identity?.avatar_url,
                soulHash: identity?.soul_hash
            };
        });

        setConversations(conversationArray);
    }, [messages, account, identities]);

    if (isLoading) {
        return <div className="p-8 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>;
    }

    if (conversations.length === 0) {
        return (
            <div className="p-8 text-center text-slate-500 text-sm">
                No active conversations. Visit a profile to start messaging.
            </div>
        );
    }

    return (
        <div className="h-full overflow-y-auto">
            {conversations.map((conv) => (
                <button
                    key={conv.address}
                    onClick={() => onSelectUser(conv.address)}
                    className={`w-full p-4 flex items-center gap-3 hover:bg-slate-50 transition-colors border-b border-slate-100 text-left ${
                        selectedUser === conv.address ? 'bg-indigo-50/50' : ''
                    }`}
                >
                    <div className="relative flex-shrink-0">
                        <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-100 border border-slate-200">
                            {conv.avatarUrl ? (
                                <img src={conv.avatarUrl} alt="" className="w-full h-full object-cover" />
                            ) : (
                                <IdentityAvatar address={conv.address} soulHash={conv.soulHash} size={48} chainId={1} />
                            )}
                        </div>
                        {conv.unreadCount > 0 && (
                            <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-white">
                                {conv.unreadCount}
                            </div>
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-baseline mb-1">
                            <span className="font-medium text-slate-900 truncate">{conv.displayName}</span>
                            <span className="text-xs text-slate-400 flex-shrink-0">{moment(conv.lastMessage.created_date).fromNow(true)}</span>
                        </div>
                        <p className={`text-sm truncate ${conv.unreadCount > 0 ? 'text-slate-900 font-medium' : 'text-slate-500'}`}>
                            {conv.lastMessage.sender_address === account ? 'You: ' : ''}{conv.lastMessage.content}
                        </p>
                    </div>
                </button>
            ))}
        </div>
    );
}