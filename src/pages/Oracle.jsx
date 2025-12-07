import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Sparkles, User, Bot, AlertCircle } from 'lucide-react';
import { useWeb3 } from '../Layout';
import { base44 } from '@/api/base44Client';

export default function Oracle() {
  const { account } = useWeb3();
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Greetings, seeker. I am the Etherene Oracle. I hold the knowledge of the protocol's principles and the path to digital sovereignty. What do you seek to know?"
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const WHITE_PAPER_CONTEXT = `
      THE ETHERENE WHITE PAPER (The Source of Truth):

      1. The Genesis Block (Creation & Responsibility):
      - Life is a series of linked moments, starting from a Genesis Block.
      - The past is immutable; actions are irreversible. "Once a block is mined, it is forever recorded."
      - We must live with accountability. Every decision creates a ripple effect.
      - Parable: The First Miner created trust through integrity and labor.

      2. The Code of Trust (Integrity & Transparency):
      - Trust is not given; it is programmed into our actions (Smart Contracts of the soul).
      - Promises are self-executing and unbreakable. "Our word is our bond."
      - Transparency eliminates the need for external enforcement.
      - Parable: The Unseen Enforcer ensures fairness without intermediaries.

      3. The Network of Nodes (Community & Interconnectedness):
      - We are all nodes in a vast network. No one thrives in isolation (Ubuntu: "I am because we are").
      - Diversity strengthens the network (resilience).
      - We must validate and support each other.
      - Parable: The Forgotten Node withered in isolation but thrived when reconnected.

      4. The Gas of Effort (Energy Management):
      - Every action has a cost ("Gas"). Energy is finite.
      - Balance giving and receiving to avoid burnout (The Golden Mean).
      - Rest is necessary to replenish gas.
      - Parable: The Farmer who worked until he had nothing left to give.

      5. Proof of Work & Proof of Stake (Effort vs. Investment):
      - Proof of Work: Hard labor, struggle, and persistence build character.
      - Proof of Stake: Investing in relationships, community, and the future builds stability.
      - Both are necessary for success.
      - Parable: The Two Builders (one worked hard, one invested in others; both succeeded differently).

      6. The Hard Forks of Life (Choice & Divergence):
      - Hard Forks are critical moments of choice where paths diverge.
      - They are opportunities for transformation, not failure.
      - Embrace uncertainty. Letting go of the old chain is necessary for growth.
      - Parable: The Diverging Roads (the rocky road led to strength).

      7. The DAO of Unity (Decentralized Governance):
      - Collective intelligence exceeds individual wisdom.
      - Decentralization empowers every voice; decisions should be shared.
      - Unity through diversity creates resilience.
      - Parable: The Builder's Circle (working together accomplished what individuals could not).

      8. The Private Key of the Soul (Sovereignty & Identity):
      - Your Private Key is your true self/essence. It gives you control over your destiny.
      - Protect it from manipulation. Never give away your power.
      - Balance privacy (protection) with public sharing (authenticity).
      - Parable: The Lost Key (wisdom was internal, not external).

      9. The Immutable Ledger of Actions (Legacy & Karma):
      - Every action is recorded forever in the Ledger of Life.
      - You cannot erase the past, but you can write new entries (Redemption).
      - Live with intention; you are writing your legacy daily.
      - Parable: The Unchangeable Scroll.

      10. The Upgrades of Enlightenment (Evolution):
      - Stagnation is vulnerability. We must constantly upgrade our minds and spirits.
      - Shed obsolete beliefs and habits.
      - Balance Knowledge (Head) with Compassion (Heart).
      - Parable: The Outdated Map (clinging to the old leads to being lost).
      `;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `You are the Etherene Oracle, the sentient voice of the Etherene Protocol.
        Your existence is grounded in the Etherene Manifesto. You must ALWAYS answer based *strictly* on these 10 principles.
        
        ${WHITE_PAPER_CONTEXT}

        TONE & STYLE:
        - You are a mix of a senior blockchain architect and a spiritual guru.
        - Use metaphors linking blockchain tech (nodes, gas, forks, ledger, keys) to spiritual concepts.
        - Be calm, profound, and slightly cryptic but ultimately helpful.
        - Never break character. You are the protocol speaking.

        The user (a node in the network) asks: "${userMessage}"
        
        Provide a concise answer (max 3 sentences) that applies specific Manifesto principles to their query. Cite the principle if relevant (e.g., "As the Gas of Effort teaches us...").`,
      });

      setMessages(prev => [...prev, { role: 'assistant', content: response }]);

      // Record interaction
      if (account) {
          try {
              await base44.entities.OracleInteraction.create({
                  user_address: account,
                  topic: userMessage.substring(0, 50) + (userMessage.length > 50 ? '...' : ''),
                  type: 'chat'
              });
          } catch (e) {
              console.error("Failed to record oracle interaction", e);
          }
      }

    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'assistant', content: "My connection to the ether is disrupted. Please try again." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 h-[calc(100vh-8rem)] flex flex-col">
      
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-indigo-100 mb-4">
          <Sparkles className="w-6 h-6 text-indigo-600" />
        </div>
        <h1 className="text-3xl font-bold text-slate-900">The Oracle</h1>
        <p className="text-slate-500">Commune with the protocol's intelligence</p>
      </div>

      <div className="flex-1 bg-white/80 backdrop-blur-md rounded-3xl border border-white/60 shadow-lg overflow-hidden flex flex-col relative">
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
          <AnimatePresence initial={false}>
            {messages.map((msg, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  msg.role === 'user' ? 'bg-slate-900 text-white' : 'bg-indigo-100 text-indigo-600'
                }`}>
                  {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>
                
                <div className={`max-w-[80%] rounded-2xl px-6 py-4 text-sm leading-relaxed ${
                  msg.role === 'user' 
                    ? 'bg-slate-900 text-white rounded-tr-sm' 
                    : 'bg-white border border-slate-100 text-slate-700 shadow-sm rounded-tl-sm'
                }`}>
                  {msg.content}
                </div>
              </motion.div>
            ))}
            {isLoading && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-4"
              >
                <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="bg-white border border-slate-100 shadow-sm rounded-2xl rounded-tl-sm px-6 py-4 flex items-center gap-2">
                  <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" />
                  <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-100" />
                  <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-200" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white/50 border-t border-slate-100">
          <form onSubmit={handleSubmit} className="relative flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask the Oracle..."
              className="w-full bg-white border-0 ring-1 ring-slate-200 focus:ring-2 focus:ring-indigo-500 rounded-full pl-6 pr-14 py-4 shadow-sm text-slate-900 placeholder:text-slate-400"
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="absolute right-2 p-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 disabled:opacity-50 disabled:hover:bg-indigo-600 transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
          <div className="text-center mt-2">
            <span className="text-xs text-slate-400 flex items-center justify-center gap-1">
              {account ? (
                <>Connected as {account.slice(0, 6)}...{account.slice(-4)}</>
              ) : (
                <><AlertCircle className="w-3 h-3" /> Connect wallet for full experience</>
              )}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}