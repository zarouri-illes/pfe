import { useState, useEffect, useRef } from 'react';
import api from '../api/client';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageSquare, 
  X, 
  Send, 
  Stars, 
  Sparkles,
  Bot,
  User,
  Loader2,
  Minimize2,
  Maximize2
} from 'lucide-react';
import { Button } from './ui/button';
import { useAuth } from '../hooks/useAuth';

export const ChatbotWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: "Bonjour ! Je suis votre mentor IA. Je peux vous aider à comprendre des concepts complexes en Maths, Physique ou Philo. Comment puis-je vous aider aujourd'hui ?" }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);
  const { isAuthenticated, user } = useAuth();

  const isVisible = isAuthenticated && user?.role === 'student';

  useEffect(() => {
    if (isVisible && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isVisible]);

  const handleSend = async () => {
    if (!input.trim() || loading || !isVisible) return;

    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const res = await api('/api/chatbot', {
        method: 'POST',
        body: JSON.stringify({ message: input })
      });

      // res is { data: { text: "...", creditBalance: ... } }
      const answer = res?.data?.text || "Désolé, je n'ai pas pu obtenir de réponse.";
      setMessages(prev => [...prev, { role: 'assistant', content: answer }]);
    } catch (error) {
      console.error('Chatbot error:', error);
      setMessages(prev => [...prev, { role: 'assistant', content: "Désolé, j'ai rencontré une petite erreur technique. Pouvez-vous reformuler votre question ?" }]);
    } finally {
      setLoading(false);
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end">
      
      {/* 1. CHAT WINDOW */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9, transformOrigin: 'bottom right' }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="mb-4 w-[380px] h-[550px] bg-white rounded-lg shadow-2xl flex flex-col overflow-hidden border border-slate-100 ring-1 ring-slate-100"
          >
            {/* Header */}
            <div className="bg-slate-900 p-6 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 bg-indigo-500/20 text-indigo-400 flex items-center justify-center rounded-lg backdrop-blur-md border border-white/10">
                    <Stars size={20} className="fill-indigo-400" />
                 </div>
                 <div>
                    <h3 className="font-black text-sm tracking-tight">Mentor IA</h3>
                    <div className="flex items-center gap-1.5 mt-0.5">
                       <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                       <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">En Ligne</span>
                    </div>
                 </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <Minimize2 size={18} className="text-slate-400" />
              </button>
            </div>

            {/* Messages */}
            <div 
              ref={scrollRef}
              className="flex-grow overflow-y-auto p-6 space-y-6 scroll-smooth bg-slate-50/50"
            >
               {messages.map((msg, i) => (
                 <motion.div 
                   initial={{ opacity: 0, x: msg.role === 'user' ? 10 : -10 }}
                   animate={{ opacity: 1, x: 0 }}
                   key={i} 
                   className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                 >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      msg.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-white shadow-sm text-indigo-600'
                    }`}>
                       {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                    </div>
                    <div className={`max-w-[80%] p-4 rounded-xl text-sm font-bold leading-relaxed ${
                      msg.role === 'user' 
                      ? 'bg-indigo-600 text-white rounded-tr-none' 
                      : 'bg-white text-slate-700 shadow-sm border border-slate-100 rounded-tl-none'
                    }`}>
                       {msg.content}
                    </div>
                 </motion.div>
               ))}
               {loading && (
                 <motion.div 
                   initial={{ opacity: 0, y: 5 }}
                   animate={{ opacity: 1, y: 0 }}
                   className="flex gap-3"
                 >
                    <div className="w-8 h-8 rounded-lg bg-white shadow-sm text-indigo-600 flex items-center justify-center">
                       <Loader2 size={16} className="animate-spin" />
                    </div>
                    <div className="p-4 bg-white text-slate-400 shadow-sm border border-slate-100 rounded-xl rounded-tl-none flex items-center gap-2">
                       <span className="text-xs font-bold">L'IA réfléchit</span>
                       <span className="flex gap-1">
                          <motion.span animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 1 }} className="w-1 h-1 bg-slate-300 rounded-full" />
                          <motion.span animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-1 h-1 bg-slate-300 rounded-full" />
                          <motion.span animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-1 h-1 bg-slate-300 rounded-full" />
                       </span>
                    </div>
                 </motion.div>
               )}
            </div>

            {/* Input */}
            <div className="p-4 bg-white border-t border-slate-100">
               <div className="relative flex items-center">
                  <input 
                    type="text"
                    placeholder="Posez votre question..."
                    className="w-full h-12 pl-5 pr-14 bg-slate-50 border-none rounded-xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500/20"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  />
                  <button 
                    onClick={handleSend}
                    disabled={loading || !input.trim()}
                    className="absolute right-2 p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-all active:scale-90"
                  >
                     <Send size={18} />
                  </button>
               </div>
               <p className="text-[10px] text-center text-slate-400 font-bold uppercase tracking-widest mt-3">
                  Pulsé par BacPrep Intelligence
               </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. FLOATING BUTTON */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="w-16 h-16 bg-slate-900 text-white rounded-lg shadow-2xl flex items-center justify-center relative group overflow-hidden border border-slate-800"
      >
         <AnimatePresence mode="wait">
            {isOpen ? (
              <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}>
                 <X size={28} />
              </motion.div>
            ) : (
              <motion.div key="open" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }}>
                 <Sparkles size={28} className="text-indigo-400" />
              </motion.div>
            )}
         </AnimatePresence>
         
         {/* Glow effect */}
         <motion.div 
           animate={{ 
             scale: [1, 1.2, 1],
             opacity: [0, 0.2, 0]
           }}
           transition={{ 
             duration: 2, 
             repeat: Infinity,
             ease: "easeInOut"
           }}
           className="absolute inset-0 bg-indigo-500 rounded-lg"
         />
         <div className="absolute inset-0 bg-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
      </motion.button>

    </div>
  );
};
