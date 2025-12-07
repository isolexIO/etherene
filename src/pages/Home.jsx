import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Hexagon, Shield, Zap, Globe } from 'lucide-react';
import ActivityFeed from '../components/ActivityFeed';
import { useWeb3 } from '../Layout';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';

export default function Home() {
  const { account, connectWallet } = useWeb3();

  const features = [
    {
      icon: Shield,
      title: "Sovereign Identity",
      description: "Your keys, your data. Claim your immutable identity on the Etherene network."
    },
    {
      icon: Zap,
      title: "Consensus Mechanism",
      description: "Participate in the decentralized governance of the protocol through direct voting."
    },
    {
      icon: Globe,
      title: "Universal State",
      description: "Access a synchronized global ledger of truth, verifiable by any node."
    }
  ];

  return (
    <div className="flex flex-col items-center">
      
      {/* Hero Section */}
      <section className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-32 flex flex-col items-center text-center">
        
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="mb-8 relative"
        >
          <div className="absolute inset-0 bg-indigo-500/20 blur-3xl rounded-full" />
          <Hexagon className="w-24 h-24 text-indigo-600 relative z-10" strokeWidth={1} />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-5xl md:text-7xl font-bold tracking-tight text-white mb-6"
        >
          The Future is <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400 drop-shadow-[0_0_15px_rgba(129,140,248,0.5)]">Immutable</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-xl text-slate-400 max-w-2xl mb-10"
        >
          Etherene is a decentralized spiritual-tech protocol designed to empower self-sovereign individuals through cryptographically verifiable truth.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="flex flex-col sm:flex-row gap-4"
        >
          {!account ? (
            <button
              onClick={connectWallet}
              className="px-8 py-4 rounded-full bg-indigo-600 text-white font-medium hover:bg-indigo-500 transition-all hover:shadow-[0_0_20px_rgba(79,70,229,0.5)] hover:-translate-y-1 active:scale-95 flex items-center justify-center gap-2 border border-indigo-500/50"
            >
              Connect Wallet <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <Link
              to={createPageUrl('Profile')}
              className="px-8 py-4 rounded-full bg-indigo-600 text-white font-medium hover:bg-indigo-500 transition-all hover:shadow-[0_0_20px_rgba(79,70,229,0.5)] hover:-translate-y-1 active:scale-95 flex items-center justify-center gap-2 border border-indigo-500/50"
            >
              View Identity <ArrowRight className="w-4 h-4" />
            </Link>
          )}
          <Link
            to={createPageUrl('Whitepaper')}
            className="px-8 py-4 rounded-full bg-slate-900/50 text-slate-200 border border-slate-700 font-medium hover:bg-slate-800 transition-all hover:border-slate-500 flex items-center justify-center backdrop-blur-sm"
          >
            Read White Paper
          </Link>
        </motion.div>
      </section>

      {/* Activity & Features Section */}
      <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-32">
        <div className="flex flex-col lg:flex-row gap-12">
          
          {/* Features Grid */}
          <div className="flex-1 grid md:grid-cols-2 gap-8">
            {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.2 }}
              className="bg-slate-900/40 backdrop-blur-md p-8 rounded-3xl border border-white/10 shadow-lg hover:shadow-indigo-900/20 hover:border-indigo-500/30 transition-all duration-300"
            >
              <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center mb-6 border border-indigo-500/20">
                <feature.icon className="w-6 h-6 text-indigo-400" />
              </div>
              <h3 className="text-xl font-bold text-slate-100 mb-3">{feature.title}</h3>
              <p className="text-slate-400 leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
          </div>

          {/* Sidebar Feed */}
          <div className="lg:w-96 flex flex-col gap-8">
            <ActivityFeed />
            
            <div className="bg-indigo-600 rounded-3xl p-8 text-white relative overflow-hidden">
              <div className="relative z-10">
                <h3 className="text-xl font-bold mb-2">Join the Network</h3>
                <p className="text-indigo-100 mb-6 text-sm">Validating truth requires participation.</p>
                <button className="w-full py-3 bg-white text-indigo-600 rounded-xl font-bold text-sm hover:bg-indigo-50 transition-colors">
                  Start Validation
                </button>
              </div>
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl translate-x-10 -translate-y-10" />
            </div>
          </div>

        </div>
      </section>

    </div>
  );
}