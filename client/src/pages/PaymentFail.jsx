import { motion } from 'framer-motion';
import { AlertCircle, RotateCcw, MessageSquare, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';

export default function PaymentFail() {
  const navigate = useNavigate();

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-6 text-center">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-24 h-24 bg-rose-50 text-rose-500 rounded-xl flex items-center justify-center mb-8 shadow-xl shadow-rose-100"
      >
        <AlertCircle size={48} />
      </motion.div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <div className="inline-flex items-center gap-2 bg-rose-50 text-rose-600 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest mb-6 border border-rose-100">
           Transaction Échouée
        </div>
        <h1 className="text-4xl lg:text-5xl font-black text-slate-900 tracking-tight mb-4">
           Oups ! Quelque chose <br/> <span className="text-rose-500">s'est mal passé.</span>
        </h1>
        <p className="text-slate-500 font-bold text-lg max-w-md mx-auto mb-10">
           Le paiement n'a pas pu être finalisé. Ne vous inquiétez pas, aucun montant n'a été prélevé si la transaction a été annulée.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
           <Button 
             onClick={() => navigate('/credits')}
             className="h-14 px-10 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-black uppercase tracking-widest text-xs gap-3 shadow-xl shadow-indigo-100 transition-all hover:scale-105"
           >
              Réessayer le Paiement <RotateCcw size={18} />
           </Button>
           <Button 
             variant="ghost"
             onClick={() => navigate('/dashboard')}
             className="h-14 px-10 bg-white text-slate-600 rounded-lg font-black uppercase tracking-widest text-xs gap-3 border border-slate-100 hover:bg-slate-50"
           >
              <ArrowLeft size={18} /> Retour
           </Button>
        </div>

        <div className="mt-12 flex items-center justify-center gap-2 text-slate-400 font-bold text-xs uppercase tracking-widest">
           <MessageSquare size={14} /> Besoin d'aide ? Contactez notre support.
        </div>
      </motion.div>
    </div>
  );
}
