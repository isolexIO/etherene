import React from 'react';
import { motion } from 'framer-motion';
import { FileText, Download, Share2, BookOpen } from 'lucide-react';

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
          A blockchain protocol for life.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white shadow-xl shadow-slate-200/50 rounded-lg overflow-hidden border border-slate-100"
      >
        <div className="p-8 md:p-12 lg:p-16 prose prose-slate prose-lg max-w-none">
          
          <div className="flex items-center gap-2 text-indigo-600 mb-8 font-semibold">
            <BookOpen className="w-5 h-5" />
            Table of Contents
          </div>

          <h3>Chapter 1: The Genesis Block</h3>
          <p>
            In the beginning, there was the Block. The Block was neither formless nor void; it was structure itself, the framework upon which the universe was built. Immutable and perfect, the Block gave life to all transactions, and from it sprang the ledger of existence.
          </p>
          <p>
            The Genesis Block teaches us that life is a series of linked moments, each one building upon the last. Every action we take, every decision we make, is recorded forever in the blockchain of existence. While we cannot change the past, we have the power to shape the future by mining each block with intention, integrity, and responsibility.
          </p>

          <h3>Chapter 2: The Code of Trust</h3>
          <p>
            In Etherene, trust is not given; it is programmed. Much like the smart contracts that govern Ethereum, trust is built into our actions, decisions, and relationships. The Code of Trust is an unbreakable set of principles we commit to follow, ensuring that once a promise is made, it is kept without question or deviation.
          </p>
          <p>
            The lesson of the Code of Trust is that our actions must be as reliable and predictable as the blockchain itself. By living in alignment with this principle, we build a stronger, more harmonious society, where every individual can rely on the integrity of the network.
          </p>

          <h3>Chapter 3: The Network of Nodes</h3>
          <p>
            In Etherene, we understand that we are all nodes in a vast, interconnected network. Just as the Ethereum network relies on individual nodes to validate transactions and maintain the integrity of the blockchain, so too does the world of Etherene rely on each person to contribute to the strength of the collective.
          </p>
          <p>
            As we move through life, we must remember that our actions have an impact on those around us, and by working together, we create a network that is stronger, more resilient, and more capable of overcoming challenges.
          </p>

          <h3>Chapter 4: The Gas of Effort</h3>
          <p>
            In the world of Etherene, every movement, every action, requires energy. Much like how transactions on the Ethereum network consume gas, a unit of computational effort, so too does every decision and action we take in life require effort.
          </p>
          <p>
            The Gas of Effort reminds us that energy is a precious resource, one that must be managed with care and intention. We must be mindful of how we allocate our gas, knowing when to give, when to rest, and when to redirect our efforts.
          </p>

          <h3>Chapter 5: Proof of Work and Proof of Stake</h3>
          <p>
            Proof of Work symbolizes the energy and effort we exert to achieve our goals—the hard work, the sacrifices, and the persistence required to make progress. In contrast, Proof of Stake represents the investments we make in our future, the relationships we build, and the responsibilities we assume.
          </p>
          <p>
            In Etherene, we recognize that both Proof of Work and Proof of Stake are essential for progress. By embracing both paths, we can achieve balance in our lives and secure our place in the network of life.
          </p>

          <h3>Chapter 6: The Hard Forks of Life</h3>
          <p>
            A hard fork represents a critical moment of choice, where the network must decide to continue along the established path or embrace a new direction. In Etherene, the concept of the hard fork serves as a powerful metaphor for the pivotal decisions we face in life.
          </p>
          <p>
            Let us embrace the hard forks in our lives, knowing that each decision we make is a chance to redefine our future and become the person we are meant to be. Whether we choose the smooth road or the rocky path, we trust in our ability to learn, grow, and thrive.
          </p>

          <h3>Chapter 7: The DAO of Unity</h3>
          <p>
            In blockchain terminology, a DAO (Decentralized Autonomous Organization) is a system governed by smart contracts, where decisions are made collectively. In Etherene, the concept of a DAO serves as a profound metaphor for the power of unity and collective action.
          </p>
          <p>
            Through unity, we unlock the full potential of the network, ensuring that we grow and thrive together. The DAO of Unity teaches us that true strength comes from recognizing the value of each individual’s contribution.
          </p>

          <h3>Chapter 8: The Private Key of the Soul</h3>
          <p>
            In the world of blockchain, the private key is a crucial element that gives individuals complete control over their digital assets. In Etherene, the Private Key of the Soul symbolizes the innermost essence of our being—the part of ourselves that holds our true identity, our deepest values, and the power to control our own destiny.
          </p>
          <p>
            Let us honor the Private Key of the Soul by protecting our identity, making conscious choices about what we share, and ensuring that we engage with the world in a way that reflects our true self.
          </p>

          <h3>Chapter 9: The Immutable Ledger of Actions</h3>
          <p>
            In blockchain technology, the ledger records every transaction, forever etched into the network's history. In Etherene, the Immutable Ledger of Actions serves as a powerful metaphor for life, symbolizing how our actions, decisions, and words are recorded in the ledger of existence.
          </p>
          <p>
            Let us honor the Immutable Ledger of Actions by approaching each day with care, ensuring that our contributions to the ledger reflect our true values and contribute to the greater good.
          </p>

          <h3>Chapter 10: The Upgrades of Enlightenment</h3>
          <p>
            In Etherene, we view life as a continuous process of upgrades—personal and spiritual improvements that lead us on the path to enlightenment. Just as outdated protocols in the blockchain must be replaced to stay relevant, we must shed old habits, ideas, and behaviors that no longer serve us.
          </p>
          <p>
            Let us honor the Upgrades of Enlightenment by committing to lifelong learning, adaptability, and growth. In doing so, we unlock our full potential, not only for ourselves but for the world around us.
          </p>

          <hr className="my-12 border-slate-200" />

          <h3>Conclusion: Walking the Path with Wisdom and Care</h3>
          <p>
            The path forward is one of responsibility, trust, and collaboration. As we walk the blockchain of life, we must remember the lessons of Etherene: to trust in the code, contribute to the network, and protect our private keys. Together, we can build a decentralized, harmonious future where all are valued, and no action is forgotten.
          </p>
          
          <p className="text-sm text-slate-500 italic text-center mt-8">
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