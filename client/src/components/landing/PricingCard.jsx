import { motion } from 'framer-motion';
import { Zap, CheckCircle } from 'lucide-react';

export const PricingCard = ({ title, price, credits, recommended }) => (
  <motion.div 
    whileHover={{ y: -8 }}
    className={`relative p-8 rounded-lg bg-white border flex flex-col h-full ${
      recommended ? 'border-[#10b981] shadow-xl shadow-emerald-50 scale-105 z-10' : 'border-slate-100 shadow-sm'
    }`}
  >
    {recommended && (
      <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#10b981] text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest">
        Meilleure Offre
      </div>
    )}
    <h4 className="text-base font-bold text-slate-800 mb-1 text-center">{title}</h4>
    <div className="flex items-baseline justify-center gap-1 mb-8">
      <span className="text-4xl font-black text-slate-900">{price}</span>
      <span className="text-slate-400 font-bold uppercase text-xs tracking-tighter">DA</span>
    </div>
    <div className="bg-indigo-50/50 rounded-2xl p-8 mb-2 border border-indigo-50/80 flex-grow flex items-center justify-center group-hover:bg-indigo-50 transition-colors">
      <div className="flex flex-col items-center gap-3">
        <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center shadow-sm">
          <Zap size={24} className="text-emerald-500 fill-emerald-500" />
        </div>
        <p className="text-[#1e3a8a] font-black text-2xl">
          {credits} Crédits
        </p>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Inclus</p>
      </div>
    </div>
  </motion.div>
);
