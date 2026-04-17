import { motion } from 'framer-motion';
import { Zap, CheckCircle } from 'lucide-react';

export const PricingCard = ({ title, price, credits, features, recommended }) => (
  <motion.div 
    whileHover={{ y: -8 }}
    className={`relative p-8 rounded-2xl bg-white border flex flex-col h-full ${
      recommended ? 'border-[#10b981] shadow-xl shadow-emerald-50 scale-105 z-10' : 'border-slate-100 shadow-sm'
    }`}
  >
    {recommended && (
      <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#10b981] text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest">
        Meilleure Offre
      </div>
    )}
    <h4 className="text-base font-bold text-slate-800 mb-1">{title}</h4>
    <div className="flex items-baseline gap-1 mb-6">
      <span className="text-3xl font-black text-slate-900">{price}</span>
      <span className="text-slate-400 font-bold uppercase text-xs tracking-tighter">DA</span>
    </div>
    <div className="bg-slate-50 rounded-xl p-3.5 mb-8 border border-slate-100">
      <p className="text-[#1e3a8a] font-bold text-base flex items-center gap-2">
        <Zap size={18} className="text-emerald-500 fill-emerald-500" />
        {credits} Crédits d'Étude
      </p>
    </div>
    <ul className="space-y-3.5 mb-10 flex-grow">
      {features.map((f, i) => (
        <li key={i} className="flex items-start gap-3 text-slate-500 font-semibold text-xs leading-tight">
          <CheckCircle className="text-[#10b981] mt-0.5 shrink-0" size={16} />
          {f}
        </li>
      ))}
    </ul>
  </motion.div>
);
