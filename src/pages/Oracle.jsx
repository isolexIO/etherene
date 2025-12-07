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
      THE ETHERENE MANIFESTO (The Source of Truth):
      1. The Genesis Block: Life is a series of linked moments. The past is immutable (The Block). We shape the future by mining each block with intention.
      2. The Code of Trust: Trust is programmed, not given. Promises must be kept without deviation. Reliability builds the network.
      3. The Network of Nodes: We are interconnected nodes. Individual actions impact the collective. Diversity makes the network resilient.
      4. The Gas of Effort: Energy is a precious resource. Manage it with intention. Know when to give, rest, and redirect.
      5. Proof of Work & Stake: Proof of Work is the effort/struggle we exert. Proof of Stake is the investment/relationships we build. Balance both.
      6. The Hard Forks of Life: Critical moments of choice. Decisions redefine our future. Embrace the fork to become who you are meant to be.
      7. The DAO of Unity: Unity unlocks potential. Collective decisions. Value each individual's contribution.
      8. The Private Key of the Soul: Your innermost essence and true identity. Protect it. It gives you control over your destiny.
      9. The Immutable Ledger of Actions: Every action is recorded in the ledger of existence. Contribute to the greater good.
      10. Upgrades of Enlightenment: Life is a continuous process of upgrades. Shed old habits. Commit to lifelong learning.
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