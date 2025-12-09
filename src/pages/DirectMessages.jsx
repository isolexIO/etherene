import React, { useState, useEffect } from 'react';
import { useWeb3 } from '../Layout';
import { useSearchParams } from 'react-router-dom';
import ConversationList from '../components/messaging/ConversationList';
import ChatWindow from '../components/messaging/ChatWindow';
import { MessageSquare, Shield } from 'lucide-react';
import NFTGate from '../components/shared/NFTGate';

export default function DirectMessages() {
    const { account } = useWeb3();
    const [searchParams, setSearchParams] = useSearchParams();
    const [selectedUser, setSelectedUser] = useState(searchParams.get('to') || null);

    // Update URL when user selection changes
    useEffect(() => {
        if (selectedUser) {
            setSearchParams({ to: selectedUser });
        }
    }, [selectedUser, setSearchParams]);

    // Handle initial URL param
    useEffect(() => {
        const to = searchParams.get('to');
        if (to && to !== selectedUser) {
            setSelectedUser(to);
        }
    }, [searchParams]);

    if (!account) {
        return (
            <div className="min-h-screen pt-20 flex flex-col items-center justify-center px-4">
                 <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-6">
                    <MessageSquare className="w-8 h-8 text-slate-400" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Private Messaging</h2>
                <p className="text-slate-500 mb-8">Connect your wallet to access your encrypted transmissions.</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen pt-16 bg-slate-50 flex flex-col">
             <div className="flex-1 max-w-6xl w-full mx-auto p-4 md:p-6 lg:p-8 h-[calc(100vh-4rem)]">
                <NFTGate>
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex h-full">
                        {/* Sidebar - List */}
                        <div className={`w-full md:w-80 border-r border-slate-100 bg-white flex flex-col ${selectedUser ? 'hidden md:flex' : 'flex'}`}>
                            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                                <h2 className="font-bold text-slate-900">Messages</h2>
                            </div>
                            <ConversationList 
                                account={account} 
                                onSelectUser={setSelectedUser} 
                                selectedUser={selectedUser} 
                            />
                        </div>

                        {/* Main - Chat */}
                        <div className={`flex-1 flex flex-col h-full ${!selectedUser ? 'hidden md:flex' : 'flex'}`}>
                            {selectedUser && (
                                <div className="md:hidden p-2 bg-white border-b border-slate-100">
                                    <button onClick={() => setSelectedUser(null)} className="text-sm text-indigo-600 font-medium px-2 py-1">
                                        ← Back to messages
                                    </button>
                                </div>
                            )}
                            <ChatWindow 
                                account={account} 
                                otherUserAddress={selectedUser} 
                            />
                        </div>
                    </div>
                </NFTGate>
            </div>
        </div>
    );
}