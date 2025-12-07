import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { FileText, Download, Share2, BookOpen, ChevronRight } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export default function Whitepaper() {
  const contentRef = useRef(null);

  const toc = [
    { id: "chapter-1", title: "Chapter 1: The Genesis Block" },
    { id: "chapter-2", title: "Chapter 2: The Code of Trust" },
    { id: "chapter-3", title: "Chapter 3: The Network of Nodes" },
    { id: "chapter-4", title: "Chapter 4: The Gas of Effort" },
    { id: "chapter-5", title: "Chapter 5: Proof of Work and Proof of Stake" },
    { id: "chapter-6", title: "Chapter 6: The Hard Forks of Life" },
    { id: "chapter-7", title: "Chapter 7: The DAO of Unity" },
    { id: "chapter-8", title: "Chapter 8: The Private Key of the Soul" },
    { id: "chapter-9", title: "Chapter 9: The Immutable Ledger of Actions" },
    { id: "chapter-10", title: "Chapter 10: The Upgrades of Enlightenment" },
    { id: "conclusion", title: "Conclusion" },
  ];

  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      const offset = 80; // height of sticky header + padding
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = element.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  const handleDownloadPDF = async () => {
    if (!contentRef.current) return;
    
    try {
      const canvas = await html2canvas(contentRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 30;

      pdf.setFontSize(20);
      pdf.text("Etherene Whitepaper", 105, 20, { align: "center" });
      
      // Calculate height to fit on one page or handle multi-page (simple fit for now)
      // For a real long document, you'd slice it, but for simplicity here we scale to fit width
      // and let it flow or just capture the visible part. 
      // Better approach for long text: simple addImage with auto-paging is complex in jspdf without plugins.
      // We will fit-to-width and allow it to expand height (HTML logic).
      
      // Re-approach: Simple fit width, if it's too long it might stretch. 
      // A standard A4 is 210mm x 297mm.
      
      const imgComponentWidth = pdfWidth;
      const imgComponentHeight = (canvas.height * pdfWidth) / canvas.width;
      
      // If height > A4, we might need multiple pages, but let's try to fit or just print what fits for MVP
      // or use the html2pdf library if available. Since it's not, we stick to basic image.
      // We'll split if needed or just output one long page if viewer supports (PDF standard doesn't really).
      // Let's just output the first page scaled nicely for now to ensure it works without complex pagination logic.
      
      pdf.addImage(imgData, 'PNG', 0, 0, imgComponentWidth, imgComponentHeight);
      pdf.save('etherene-whitepaper.pdf');
    } catch (err) {
      console.error("PDF generation failed", err);
    }
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
        <h1 className="text-5xl font-bold text-slate-900 mb-6">The Etherene Manifesto</h1>
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
                  className="w-full text-left px-3 py-2 text-sm text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors flex items-center justify-between group"
                >
                  <span className="truncate">{item.title}</span>
                  <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              ))}
            </nav>
            <div className="mt-8 pt-6 border-t border-slate-100">
              <button 
                onClick={handleDownloadPDF}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors"
              >
                <Download className="w-4 h-4" />
                Download PDF
              </button>
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
            className="bg-white shadow-xl shadow-slate-200/50 rounded-lg overflow-hidden border border-slate-100 p-8 md:p-12 prose prose-slate prose-lg max-w-none"
          >
            
            <h3 id="chapter-1" className="scroll-mt-24">Chapter 1: The Genesis Block</h3>
            <p>
              In the beginning, there was the Block. The Block was neither formless nor void; it was structure itself, the framework upon which the universe was built. Immutable and perfect, the Block gave life to all transactions, and from it sprang the ledger of existence.
            </p>
            <p>
              The Genesis Block teaches us that life is a series of linked moments, each one building upon the last. Every action we take, every decision we make, is recorded forever in the blockchain of existence. While we cannot change the past, we have the power to shape the future by mining each block with intention, integrity, and responsibility.
            </p>

            <h3 id="chapter-2" className="scroll-mt-24">Chapter 2: The Code of Trust</h3>
            <p>
              In Etherene, trust is not given; it is programmed. Much like the smart contracts that govern Ethereum, trust is built into our actions, decisions, and relationships. The Code of Trust is an unbreakable set of principles we commit to follow, ensuring that once a promise is made, it is kept without question or deviation.
            </p>
            <p>
              The lesson of the Code of Trust is that our actions must be as reliable and predictable as the blockchain itself. By living in alignment with this principle, we build a stronger, more harmonious society, where every individual can rely on the integrity of the network.
            </p>

            <h3 id="chapter-3" className="scroll-mt-24">Chapter 3: The Network of Nodes</h3>
            <p>
              In Etherene, we understand that we are all nodes in a vast, interconnected network. Just as the Ethereum network relies on individual nodes to validate transactions and maintain the integrity of the blockchain, so too does the world of Etherene rely on each person to contribute to the strength of the collective.
            </p>
            <p>
              As we move through life, we must remember that our actions have an impact on those around us, and by working together, we create a network that is stronger, more resilient, and more capable of overcoming challenges.
            </p>

            <h3 id="chapter-4" className="scroll-mt-24">Chapter 4: The Gas of Effort</h3>
            <p>
              In the world of Etherene, every movement, every action, requires energy. Much like how transactions on the Ethereum network consume gas, a unit of computational effort, so too does every decision and action we take in life require effort.
            </p>
            <p>
              The Gas of Effort reminds us that energy is a precious resource, one that must be managed with care and intention. We must be mindful of how we allocate our gas, knowing when to give, when to rest, and when to redirect our efforts.
            </p>

            <h3 id="chapter-5" className="scroll-mt-24">Chapter 5: Proof of Work and Proof of Stake</h3>
            <p>
              Proof of Work symbolizes the energy and effort we exert to achieve our goals—the hard work, the sacrifices, and the persistence required to make progress. In contrast, Proof of Stake represents the investments we make in our future, the relationships we build, and the responsibilities we assume.
            </p>
            <p>
              In Etherene, we recognize that both Proof of Work and Proof of Stake are essential for progress. By embracing both paths, we can achieve balance in our lives and secure our place in the network of life.
            </p>

            <h3 id="chapter-6" className="scroll-mt-24">Chapter 6: The Hard Forks of Life</h3>
            <p>
              A hard fork represents a critical moment of choice, where the network must decide to continue along the established path or embrace a new direction. In Etherene, the concept of the hard fork serves as a powerful metaphor for the pivotal decisions we face in life.
            </p>
            <p>
              Let us embrace the hard forks in our lives, knowing that each decision we make is a chance to redefine our future and become the person we are meant to be. Whether we choose the smooth road or the rocky path, we trust in our ability to learn, grow, and thrive.
            </p>

            <h3 id="chapter-7" className="scroll-mt-24">Chapter 7: The DAO of Unity</h3>
            <p>
              In blockchain terminology, a DAO (Decentralized Autonomous Organization) is a system governed by smart contracts, where decisions are made collectively. In Etherene, the concept of a DAO serves as a profound metaphor for the power of unity and collective action.
            </p>
            <p>
              Through unity, we unlock the full potential of the network, ensuring that we grow and thrive together. The DAO of Unity teaches us that true strength comes from recognizing the value of each individual’s contribution.
            </p>

            <h3 id="chapter-8" className="scroll-mt-24">Chapter 8: The Private Key of the Soul</h3>
            <p>
              In the world of blockchain, the private key is a crucial element that gives individuals complete control over their digital assets. In Etherene, the Private Key of the Soul symbolizes the innermost essence of our being—the part of ourselves that holds our true identity, our deepest values, and the power to control our own destiny.
            </p>
            <p>
              Let us honor the Private Key of the Soul by protecting our identity, making conscious choices about what we share, and ensuring that we engage with the world in a way that reflects our true self.
            </p>

            <h3 id="chapter-9" className="scroll-mt-24">Chapter 9: The Immutable Ledger of Actions</h3>
            <p>
              In blockchain technology, the ledger records every transaction, forever etched into the network's history. In Etherene, the Immutable Ledger of Actions serves as a powerful metaphor for life, symbolizing how our actions, decisions, and words are recorded in the ledger of existence.
            </p>
            <p>
              Let us honor the Immutable Ledger of Actions by approaching each day with care, ensuring that our contributions to the ledger reflect our true values and contribute to the greater good.
            </p>

            <h3 id="chapter-10" className="scroll-mt-24">Chapter 10: The Upgrades of Enlightenment</h3>
            <p>
              In Etherene, we view life as a continuous process of upgrades—personal and spiritual improvements that lead us on the path to enlightenment. Just as outdated protocols in the blockchain must be replaced to stay relevant, we must shed old habits, ideas, and behaviors that no longer serve us.
            </p>
            <p>
              Let us honor the Upgrades of Enlightenment by committing to lifelong learning, adaptability, and growth. In doing so, we unlock our full potential, not only for ourselves but for the world around us.
            </p>

            <hr className="my-12 border-slate-200" />

            <h3 id="conclusion" className="scroll-mt-24">Conclusion: Walking the Path with Wisdom and Care</h3>
            <p>
              The path forward is one of responsibility, trust, and collaboration. As we walk the blockchain of life, we must remember the lessons of Etherene: to trust in the code, contribute to the network, and protect our private keys. Together, we can build a decentralized, harmonious future where all are valued, and no action is forgotten.
            </p>
            
            <p className="text-sm text-slate-500 italic text-center mt-8">
              "The Etherene White Paper is free. There is no charge."
            </p>
          </div>

          <div className="bg-slate-50 px-8 py-6 mt-6 rounded-lg border border-slate-100 flex justify-between items-center lg:hidden">
            <button 
              onClick={handleDownloadPDF}
              className="flex items-center gap-2 text-slate-600 hover:text-indigo-600 font-medium transition-colors"
            >
              <Download className="w-4 h-4" />
              Download PDF
            </button>
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