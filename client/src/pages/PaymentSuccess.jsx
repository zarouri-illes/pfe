import { motion } from 'framer-motion';
import { CheckCircle, ArrowRight, Stars, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';

export default function PaymentSuccess() {
  const navigate = useNavigate();

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-6 text-center">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-24 h-24 bg-emerald-50 text-emerald-500 rounded-xl flex items-center justify-center mb-8 shadow-xl shadow-emerald-100"
      >
        <CheckCircle size={48} />
      </motion.div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-600 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest mb-6 border border-indigo-100">
           <Stars size={14} className="fill-indigo-600" /> Transaction Réussie
        </div>
        <h1 className="text-4xl lg:text-5xl font-black text-slate-900 tracking-tight mb-4">
           Vos Crédits sont <br/> <span className="text-emerald-500">Prêts !</span>
        </h1>
        <p className="text-slate-500 font-bold text-lg max-w-md mx-auto mb-10">
           Merci pour votre confiance. Vos crédits ont été ajoutés à votre compte. Vous pouvez maintenant reprendre vos révisions.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
           <Button 
             onClick={() => navigate('/dashboard')}
             className="h-14 px-10 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-black uppercase tracking-widest text-xs gap-3 shadow-xl shadow-slate-200 transition-all hover:scale-105"
           >
              Tableau de Bord <ArrowRight size={18} />
           </Button>
           <Button 
             variant="ghost"
             onClick={() => navigate('/quiz')}
             className="h-14 px-10 bg-white text-slate-600 rounded-lg font-black uppercase tracking-widest text-xs gap-3 border border-slate-100 hover:bg-slate-50"
           >
              Lancer un Quiz <Zap size={18} />
           </Button>
        </div>
      </motion.div>
    </div>
  );
}
