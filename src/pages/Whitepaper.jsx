import React from 'react';
import { motion } from 'framer-motion';
import { FileText, Download, Share2 } from 'lucide-react';

export default function Whitepaper() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-16"
      >
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 text-sm font-medium mb-6">
          <FileText className="w-4 h-4" />
          Version 1.0.0
        </div>
        <h1 className="text-5xl font-bold text-slate-900 mb-6">The Etherene Manifesto</h1>
        <p className="text-xl text-slate-600">
          A declaration of digital independence and the architecture of the new consensus.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white shadow-xl shadow-slate-200/50 rounded-lg overflow-hidden border border-slate-100"
      >
        <div className="p-8 md:p-12 lg:p-16 prose prose-slate prose-lg max-w-none">
          <h3>Abstract</h3>
          <p>
            Etherene is not merely a platform; it is a recognition of the inherent sovereignty of the digital self. 
            By leveraging the immutable properties of the Ethereum Virtual Machine (EVM), we construct a 
            framework where truth is not delegated to authorities but verified by peers.
          </p>

          <h3>1. Introduction</h3>
          <p>
            In the age of information, data is the currency of power. Centralized entities have long held the keys 
            to our digital existence. Etherene proposes a shift: a protocol where identity, assets, and 
            history are owned by the individual, secured by cryptography, and governed by consensus.
          </p>

          <h3>2. Technical Architecture</h3>
          <p>
            Built on the EVM, Etherene utilizes ERC-721 standards for unique identity verification ("Soul Badges") 
            and signed messages for off-chain verification of intent. The system is designed to be:
          </p>
          <ul>
            <li><strong>Permissionless:</strong> No gatekeepers.</li>
            <li><strong>Censorship Resistant:</strong> Code is law.</li>
            <li><strong>Interoperable:</strong> Compatible with the broader Web3 ecosystem.</li>
          </ul>

          <h3>3. The Oracle</h3>
          <p>
            The Etherene Oracle represents the bridge between human intent and machine execution. 
            It serves as a guide, providing verified information on the principles of the network.
          </p>

          <hr className="my-12 border-slate-200" />

          <p className="text-sm text-slate-500 italic text-center">
            "The Etherene White Paper is free. There is no charge."
          </p>
        </div>

        <div className="bg-slate-50 px-8 py-6 border-t border-slate-100 flex justify-between items-center">
          <div className="text-sm text-slate-500">
            Last updated: October 24, 2024
          </div>
          <div className="flex gap-4">
            <button className="flex items-center gap-2 text-slate-600 hover:text-indigo-600 font-medium transition-colors">
              <Download className="w-4 h-4" />
              PDF
            </button>
            <button className="flex items-center gap-2 text-slate-600 hover:text-indigo-600 font-medium transition-colors">
              <Share2 className="w-4 h-4" />
              Share
            </button>
          </div>
        </div>
      </motion.div>

    </div>
  );
}