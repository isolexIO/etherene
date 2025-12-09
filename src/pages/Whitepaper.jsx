import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, Download, Share2, BookOpen, ChevronRight, ChevronDown } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import Term from '../components/whitepaper/Term';
import Quiz from '../components/whitepaper/Quiz';

export default function Whitepaper() {
  const contentRef = useRef(null);
  const [openItems, setOpenItems] = useState(["chapter-1"]);

  const toc = [
    { id: "chapter-1", title: "Chapter 1: The Genesis Block" },
    { id: "chapter-2", title: "Chapter 2: The Code of Trust" },
    { id: "chapter-3", title: "Chapter 3: The Network of Nodes" },
    { id: "chapter-4", title: "Chapter 4: The Gas of Effort" },
    { id: "chapter-5", title: "Chapter 5: Proof of Work & Stake" },
    { id: "chapter-6", title: "Chapter 6: The Hard Forks of Life" },
    { id: "chapter-7", title: "Chapter 7: The DAO of Unity" },
    { id: "chapter-8", title: "Chapter 8: Private Key of the Soul" },
    { id: "chapter-9", title: "Chapter 9: The Immutable Ledger" },
    { id: "chapter-10", title: "Chapter 10: Upgrades of Enlightenment" },
    { id: "conclusion", title: "Conclusion" },
  ];

  const scrollToSection = (id) => {
    // Open the accordion item if it's not already open
    if (!openItems.includes(id)) {
      setOpenItems(prev => [...prev, id]);
    }

    // Small timeout to allow the accordion to expand before scrolling
    setTimeout(() => {
      const element = document.getElementById(id);
      if (element) {
        const offset = 100; // height of sticky header + padding
        const bodyRect = document.body.getBoundingClientRect().top;
        const elementRect = element.getBoundingClientRect().top;
        const elementPosition = elementRect - bodyRect;
        const offsetPosition = elementPosition - offset;

        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
      }
    }, 100);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-16"
      >
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 text-sm font-medium mb-6">
          <FileText className="w-4 h-4" />
          Version 1.0.0
        </div>
        <h1 className="text-3xl md:text-5xl font-bold text-slate-900 mb-6">The Etherene Manifesto</h1>
        <p className="text-xl text-slate-600">
          A blockchain protocol for life.
        </p>
      </motion.div>

      <div className="flex flex-col lg:flex-row gap-12 items-start">
        
        {/* Sidebar Navigation */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="hidden lg:block w-72 shrink-0 sticky top-24"
        >
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <div className="flex items-center gap-2 text-slate-900 font-bold mb-4 pb-4 border-b border-slate-100">
              <BookOpen className="w-5 h-5 text-indigo-600" />
              Table of Contents
            </div>
            <nav className="space-y-1">
              {toc.map((item) => (
                <button
                  key={item.id}
                  onClick={() => scrollToSection(item.id)}
                  className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors flex items-center justify-between group ${
                    openItems.includes(item.id) 
                      ? 'text-indigo-600 bg-indigo-50 font-medium' 
                      : 'text-slate-600 hover:text-indigo-600 hover:bg-indigo-50'
                  }`}
                >
                  <span className="truncate">{item.title}</span>
                  <ChevronRight className={`w-3 h-3 transition-opacity ${
                    openItems.includes(item.id) ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                  }`} />
                </button>
              ))}
            </nav>
            <div className="mt-8 pt-6 border-t border-slate-100">
              <a 
                href="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/693568c43d156a928d236e54/7ff0705e8_Etherene_the-white-paper.pdf"
                download="Etherene_Whitepaper.pdf"
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors"
              >
                <Download className="w-4 h-4" />
                Download PDF
              </a>
            </div>
          </div>
        </motion.div>

        {/* Main Content */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex-1 min-w-0"
        >
          <div 
            ref={contentRef}
            className="bg-white shadow-xl shadow-slate-200/50 rounded-lg border border-slate-100 p-4 md:p-12 w-full max-w-full overflow-hidden"
          >

            <Accordion type="multiple" value={openItems} onValueChange={setOpenItems} className="w-full space-y-4">

              {/* Chapter 1 */}
              <AccordionItem value="chapter-1" id="chapter-1" className="border border-slate-100 rounded-xl px-3 md:px-6">
                <AccordionTrigger className="text-xl md:text-2xl font-bold text-slate-900 hover:text-indigo-600 py-4 md:py-6 text-left">
                  Chapter 1: The Genesis Block
                </AccordionTrigger>
                <AccordionContent className="prose prose-slate prose-sm md:prose-lg max-w-none pb-6 break-words">
                  {/* Image placeholder: Genesis Block */}
                  <p>
                    In the beginning, there was the Block. The Block was neither formless nor void; it was structure itself, the framework upon which the universe was built. <Term term="Immutable" definition="Unchangeable over time or unable to be changed." /> and perfect, the Block gave life to all transactions, and from it sprang the ledger of existence.
                  </p>
                  <p>
                    The <Term term="Genesis Block" definition="The very first block in a blockchain network." /> teaches us that life is a series of linked moments, each one building upon the last. Every action we take, every decision we make, is recorded forever in the blockchain of existence. While we cannot change the past, we have the power to shape the future by mining each block with intention, integrity, and responsibility.
                  </p>
                  <Quiz 
                    question="What does the Genesis Block symbolize in Etherene?"
                    options={[
                      "A technological limitation of early blockchains",
                      "The starting point where life's possibilities unfold",
                      "A temporary record that can be erased",
                      "The end of the previous universe"
                    ]}
                    correctIndex={1}
                  />
                </AccordionContent>
              </AccordionItem>

              {/* Chapter 2 */}
              <AccordionItem value="chapter-2" id="chapter-2" className="border border-slate-100 rounded-xl px-3 md:px-6">
                <AccordionTrigger className="text-xl md:text-2xl font-bold text-slate-900 hover:text-indigo-600 py-4 md:py-6 text-left">
                  Chapter 2: The Code of Trust
                </AccordionTrigger>
                <AccordionContent className="prose prose-slate prose-sm md:prose-lg max-w-none pb-6 break-words">
                  {/* Image placeholder: Code of Trust */}
                  <p>
                    In Etherene, trust is not given; it is programmed. Much like the <Term term="smart contracts" definition="Self-executing contracts with the terms of the agreement directly written into code." /> that govern Ethereum, trust is built into our actions, decisions, and relationships. The Code of Trust is an unbreakable set of principles we commit to follow, ensuring that once a promise is made, it is kept without question or deviation.
                  </p>
                  <p>
                    The lesson of the Code of Trust is that our actions must be as reliable and predictable as the blockchain itself. By living in alignment with this principle, we build a stronger, more harmonious society, where every individual can rely on the integrity of the network.
                  </p>
                </AccordionContent>
              </AccordionItem>

              {/* Chapter 3 */}
              <AccordionItem value="chapter-3" id="chapter-3" className="border border-slate-100 rounded-xl px-3 md:px-6">
                <AccordionTrigger className="text-xl md:text-2xl font-bold text-slate-900 hover:text-indigo-600 py-4 md:py-6 text-left">
                  Chapter 3: The Network of Nodes
                </AccordionTrigger>
                <AccordionContent className="prose prose-slate prose-sm md:prose-lg max-w-none pb-6 break-words">
                  {/* Image placeholder: Network of Nodes */}
                  <p>
                    In Etherene, we understand that we are all <Term term="nodes" definition="Individual participants or computers in a blockchain network that maintain a copy of the ledger." /> in a vast, interconnected network. Just as the Ethereum network relies on individual nodes to validate transactions and maintain the integrity of the blockchain, so too does the world of Etherene rely on each person to contribute to the strength of the collective.
                  </p>
                  <p>
                    As we move through life, we must remember that our actions have an impact on those around us, and by working together, we create a network that is stronger, more resilient, and more capable of overcoming challenges.
                  </p>
                  <Quiz 
                    question="Why is diversity important in the Etherene network?"
                    options={[
                      "It isn't; uniformity is better for speed",
                      "It makes the network more adaptable and resilient",
                      "It increases the cost of transactions",
                      "It prevents new nodes from joining"
                    ]}
                    correctIndex={1}
                  />
                </AccordionContent>
              </AccordionItem>

              {/* Chapter 4 */}
              <AccordionItem value="chapter-4" id="chapter-4" className="border border-slate-100 rounded-xl px-3 md:px-6">
                <AccordionTrigger className="text-xl md:text-2xl font-bold text-slate-900 hover:text-indigo-600 py-4 md:py-6 text-left">
                  Chapter 4: The Gas of Effort
                </AccordionTrigger>
                <AccordionContent className="prose prose-slate prose-sm md:prose-lg max-w-none pb-6 break-words">
                  {/* Image placeholder: Gas of Effort */}
                  <p>
                    In the world of Etherene, every movement, every action, requires energy. Much like how transactions on the Ethereum network consume <Term term="gas" definition="The fee required to successfully conduct a transaction or execute a contract on the Ethereum blockchain." />, a unit of computational effort, so too does every decision and action we take in life require effort.
                  </p>
                  <p>
                    The Gas of Effort reminds us that energy is a precious resource, one that must be managed with care and intention. We must be mindful of how we allocate our gas, knowing when to give, when to rest, and when to redirect our efforts.
                  </p>
                </AccordionContent>
              </AccordionItem>

              {/* Chapter 5 */}
              <AccordionItem value="chapter-5" id="chapter-5" className="border border-slate-100 rounded-xl px-3 md:px-6">
                <AccordionTrigger className="text-xl md:text-2xl font-bold text-slate-900 hover:text-indigo-600 py-4 md:py-6 text-left">
                  Chapter 5: Proof of Work and Proof of Stake
                </AccordionTrigger>
                <AccordionContent className="prose prose-slate prose-sm md:prose-lg max-w-none pb-6 break-words">
                  {/* Image placeholder: Proof of Work and Stake */}
                  <p>
                    <Term term="Proof of Work" definition="A consensus mechanism that requires members of a network to expend effort solving an arbitrary mathematical puzzle." /> symbolizes the energy and effort we exert to achieve our goals—the hard work, the sacrifices, and the persistence required to make progress. In contrast, <Term term="Proof of Stake" definition="A consensus mechanism where validators are chosen to create new blocks based on the amount of cryptocurrency they hold." /> represents the investments we make in our future, the relationships we build, and the responsibilities we assume.
                  </p>
                  <p>
                    In Etherene, we recognize that both Proof of Work and Proof of Stake are essential for progress. By embracing both paths, we can achieve balance in our lives and secure our place in the network of life.
                  </p>
                  <Quiz 
                    question="Which concept represents the investments and relationships we build for the future?"
                    options={[
                      "Proof of Work",
                      "Gas",
                      "Proof of Stake",
                      "Hard Fork"
                    ]}
                    correctIndex={2}
                  />
                </AccordionContent>
              </AccordionItem>

              {/* Chapter 6 */}
              <AccordionItem value="chapter-6" id="chapter-6" className="border border-slate-100 rounded-xl px-3 md:px-6">
                <AccordionTrigger className="text-xl md:text-2xl font-bold text-slate-900 hover:text-indigo-600 py-4 md:py-6 text-left">
                  Chapter 6: The Hard Forks of Life
                </AccordionTrigger>
                <AccordionContent className="prose prose-slate prose-sm md:prose-lg max-w-none pb-6 break-words">
                  {/* Image placeholder: Hard Forks */}
                  <p>
                    A <Term term="hard fork" definition="A radical change to a network's protocol that makes previously valid blocks/transactions invalid (or vice-versa)." /> represents a critical moment of choice, where the network must decide to continue along the established path or embrace a new direction. In Etherene, the concept of the hard fork serves as a powerful metaphor for the pivotal decisions we face in life.
                  </p>
                  <p>
                    Let us embrace the hard forks in our lives, knowing that each decision we make is a chance to redefine our future and become the person we are meant to be. Whether we choose the smooth road or the rocky path, we trust in our ability to learn, grow, and thrive.
                  </p>
                </AccordionContent>
              </AccordionItem>

              {/* Chapter 7 */}
              <AccordionItem value="chapter-7" id="chapter-7" className="border border-slate-100 rounded-xl px-3 md:px-6">
                <AccordionTrigger className="text-xl md:text-2xl font-bold text-slate-900 hover:text-indigo-600 py-4 md:py-6 text-left">
                  Chapter 7: The DAO of Unity
                </AccordionTrigger>
                <AccordionContent className="prose prose-slate prose-sm md:prose-lg max-w-none pb-6 break-words">
                  {/* Image placeholder: DAO of Unity */}
                  <p>
                    In blockchain terminology, a <Term term="DAO" definition="Decentralized Autonomous Organization - an organization represented by rules encoded as a computer program that is transparent and controlled by the organization members." /> is a system governed by smart contracts, where decisions are made collectively. In Etherene, the concept of a DAO serves as a profound metaphor for the power of unity and collective action.
                  </p>
                  <p>
                    Through unity, we unlock the full potential of the network, ensuring that we grow and thrive together. The DAO of Unity teaches us that true strength comes from recognizing the value of each individual’s contribution.
                  </p>
                </AccordionContent>
              </AccordionItem>

              {/* Chapter 8 */}
              <AccordionItem value="chapter-8" id="chapter-8" className="border border-slate-100 rounded-xl px-3 md:px-6">
                <AccordionTrigger className="text-xl md:text-2xl font-bold text-slate-900 hover:text-indigo-600 py-4 md:py-6 text-left">
                  Chapter 8: The Private Key of the Soul
                </AccordionTrigger>
                <AccordionContent className="prose prose-slate prose-sm md:prose-lg max-w-none pb-6 break-words">
                  {/* Image placeholder: Private Key */}
                  <p>
                    In the world of blockchain, the <Term term="private key" definition="A secret number that allows cryptocurrency to be spent. It is crucial for security and identity." /> is a crucial element that gives individuals complete control over their digital assets. In Etherene, the Private Key of the Soul symbolizes the innermost essence of our being—the part of ourselves that holds our true identity, our deepest values, and the power to control our own destiny.
                  </p>
                  <p>
                    Let us honor the Private Key of the Soul by protecting our identity, making conscious choices about what we share, and ensuring that we engage with the world in a way that reflects our true self.
                  </p>
                  <Quiz 
                    question="What should you do with your Private Key of the Soul?"
                    options={[
                      "Share it with everyone immediately",
                      "Safeguard it to protect your core identity",
                      "Delete it to start fresh",
                      "Trade it for short-term gain"
                    ]}
                    correctIndex={1}
                  />
                </AccordionContent>
              </AccordionItem>

              {/* Chapter 9 */}
              <AccordionItem value="chapter-9" id="chapter-9" className="border border-slate-100 rounded-xl px-3 md:px-6">
                <AccordionTrigger className="text-xl md:text-2xl font-bold text-slate-900 hover:text-indigo-600 py-4 md:py-6 text-left">
                  Chapter 9: The Immutable Ledger of Actions
                </AccordionTrigger>
                <AccordionContent className="prose prose-slate prose-sm md:prose-lg max-w-none pb-6 break-words">
                  {/* Image placeholder: Immutable Ledger */}
                  <p>
                    In blockchain technology, the ledger records every transaction, forever etched into the network's history. In Etherene, the <Term term="Immutable Ledger" definition="A record-keeping system that cannot be changed, deleted, or altered after data is entered." /> of Actions serves as a powerful metaphor for life, symbolizing how our actions, decisions, and words are recorded in the ledger of existence.
                  </p>
                  <p>
                    Let us honor the Immutable Ledger of Actions by approaching each day with care, ensuring that our contributions to the ledger reflect our true values and contribute to the greater good.
                  </p>
                </AccordionContent>
              </AccordionItem>

              {/* Chapter 10 */}
              <AccordionItem value="chapter-10" id="chapter-10" className="border border-slate-100 rounded-xl px-3 md:px-6">
                <AccordionTrigger className="text-xl md:text-2xl font-bold text-slate-900 hover:text-indigo-600 py-4 md:py-6 text-left">
                  Chapter 10: The Upgrades of Enlightenment
                </AccordionTrigger>
                <AccordionContent className="prose prose-slate prose-sm md:prose-lg max-w-none pb-6 break-words">
                  {/* Image placeholder: Upgrades */}
                  <p>
                    In Etherene, we view life as a continuous process of upgrades—personal and spiritual improvements that lead us on the path to enlightenment. Just as outdated protocols in the blockchain must be replaced to stay relevant, we must shed old habits, ideas, and behaviors that no longer serve us.
                  </p>
                  <p>
                    Let us honor the Upgrades of Enlightenment by committing to lifelong learning, adaptability, and growth. In doing so, we unlock our full potential, not only for ourselves but for the world around us.
                  </p>
                </AccordionContent>
              </AccordionItem>

              {/* Conclusion */}
              <AccordionItem value="conclusion" id="conclusion" className="border border-slate-100 rounded-xl px-3 md:px-6">
                <AccordionTrigger className="text-xl md:text-2xl font-bold text-slate-900 hover:text-indigo-600 py-4 md:py-6 text-left">
                  Conclusion: Walking the Path with Wisdom and Care
                </AccordionTrigger>
                <AccordionContent className="prose prose-slate prose-sm md:prose-lg max-w-none pb-6 break-words">
                  <p>
                    The path forward is one of responsibility, trust, and collaboration. As we walk the blockchain of life, we must remember the lessons of Etherene: to trust in the code, contribute to the network, and protect our private keys. Together, we can build a decentralized, harmonious future where all are valued, and no action is forgotten.
                  </p>
                  <p className="text-sm text-slate-500 italic text-center mt-8">
                    "The Etherene White Paper is free. There is no charge."
                  </p>
                </AccordionContent>
              </AccordionItem>

            </Accordion>
          </div>

          <div className="bg-slate-50 px-6 py-6 mt-6 rounded-lg border border-slate-100 flex flex-col sm:flex-row gap-4 justify-between items-center lg:hidden">
            <a 
              href="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/693568c43d156a928d236e54/7ff0705e8_Etherene_the-white-paper.pdf"
              download="Etherene_Whitepaper.pdf"
              className="flex items-center gap-2 text-slate-600 hover:text-indigo-600 font-medium transition-colors"
            >
              <Download className="w-4 h-4" />
              Download PDF
            </a>
            <button className="flex items-center gap-2 text-slate-600 hover:text-indigo-600 font-medium transition-colors">
              <Share2 className="w-4 h-4" />
              Share
            </button>
          </div>
        </motion.div>

      </div>
    </div>
  );
}