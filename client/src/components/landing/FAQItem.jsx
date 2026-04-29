import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

export const FAQItem = ({ question, answer }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border-b border-slate-50">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-5 flex items-center justify-between text-left group"
      >
        <span className="flex-1 min-w-0 text-base font-bold text-slate-700 group-hover:text-[#1e3a8a] transition-colors break-words">{question}</span>
        <motion.div animate={{ rotate: isOpen ? 180 : 0 }} className="shrink-0 ml-4">
          <ChevronDown className="text-slate-500" size={20} />
        </motion.div>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <p className="pb-5 text-slate-400 font-semibold text-sm leading-relaxed w-full break-words">{answer}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
