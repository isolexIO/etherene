import React from 'react';
import { motion } from 'framer-motion';
import { Radio, Users, Sparkles } from 'lucide-react';
import CreateTransmission from '../components/community/CreateTransmission';
import TransmissionFeed from '../components/community/TransmissionFeed';

export default function Agora() {
  return (
    <div className="min-h-screen bg-slate-50/50">
      
      {/* Header */}
      <div className="bg-white border-b border-slate-100 pb-12 pt-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 text-sm font-medium mb-6"
          >
            <Radio className="w-4 h-4" />
            <span>Live Frequency</span>
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl font-bold text-slate-900 mb-4"
          >
            The Agora
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-slate-500 max-w-2xl mx-auto"
          >
            A public square for the Etherene network. Transmit your insights, resonate with others, and reach consensus.
          </motion.p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        
        {/* Composer */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
            <CreateTransmission />
        </motion.div>

        {/* Feed Filter (Visual only for now) */}
        <div className="flex items-center justify-between mb-6 px-2">
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Latest Signals
            </h2>
            <div className="flex gap-4 text-sm text-slate-500">
                <button className="text-indigo-600 font-medium">Trending</button>
                <button className="hover:text-slate-800">New</button>
                <button className="hover:text-slate-800">Top</button>
            </div>
        </div>

        {/* Feed */}
        <TransmissionFeed />
        
      </div>
    </div>
  );
}