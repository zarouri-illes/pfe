import { motion } from 'framer-motion';
import { Lock } from 'lucide-react';

export const SubjectCard = ({ title, img, size, icon: Icon, color, comingSoon }) => (
  <motion.div 
    whileHover={comingSoon ? {} : { y: -8, scale: 1.01 }}
    className={`relative rounded-lg overflow-hidden group shadow-lg ${
      size === 'large' ? 'col-span-1 md:col-span-2 row-span-2' : 'col-span-1'
    } ${comingSoon ? 'cursor-not-allowed opacity-90' : 'cursor-pointer'}`}
  >
    <img src={img} alt={title} className={`absolute inset-0 w-full h-full object-cover transition-transform duration-700 ${comingSoon ? 'grayscale' : 'group-hover:scale-105'}`} />
    <div className={`absolute inset-0 bg-gradient-to-t ${color} opacity-70 ${!comingSoon && 'group-hover:opacity-85'} transition-opacity`} />
    
    {comingSoon && (
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] flex items-center justify-center z-10 transition-opacity group-hover:bg-slate-900/50">
        <div className="bg-white/10 backdrop-blur-md border border-white/20 px-4 py-2 rounded-full flex items-center gap-2">
          <Lock size={14} className="text-white/80" />
          <span className="text-white text-xs font-black uppercase tracking-[0.1em]">Bientôt Disponible</span>
        </div>
      </div>
    )}

    <div className="absolute inset-0 p-6 flex flex-col justify-end">
      <div className="w-10 h-10 bg-white/10 backdrop-blur-md rounded-lg flex items-center justify-center text-white mb-3 border border-white/20">
        <Icon size={20} />
      </div>
      <h3 className="text-xl font-bold text-white mb-0.5">{title}</h3>
      <p className="text-white/60 text-xs font-semibold">{comingSoon ? "Prochainement" : "Préparation Intensive"}</p>
    </div>
  </motion.div>
);
