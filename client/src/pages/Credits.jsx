import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import api from '../api/client';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Zap, 
  ShieldCheck, 
  CreditCard, 
  Loader2, 
  CheckCircle2,
  AlertCircle,
  Coins,
  History
} from 'lucide-react';
import { Button } from '../components/ui/button';

const Credits = () => {
  const { user, isAuthenticated } = useAuth();
  const [packs, setPacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(null);
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    fetchPacks();
    if (isAuthenticated) fetchHistory();
  }, [isAuthenticated]);

  const fetchPacks = async () => {
    try {
      const res = await api('/api/credits/packs');
      setPacks(res.data);
    } catch (error) {
      console.error('Error fetching packs:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    try {
      const res = await api('/api/credits/history');
      setHistory(res.data);
    } catch (error) {
       console.error('Error fetching history:', error);
    }
  };

  const handleBuy = async (packId) => {
    if (!isAuthenticated) {
      window.location.href = '/login?redirect=/credits';
      return;
    }
    
    try {
      setProcessing(packId);
      const res = await api('/api/credits/checkout', {
        method: 'POST',
        body: JSON.stringify({ packId })
      });
      
      console.log('Checkout API Response:', res);
      
      if (res && res.checkoutUrl) {
        console.log('Redirecting to:', res.checkoutUrl);
        window.location.href = res.checkoutUrl;
      } else {
        console.error('Invalid checkout response:', res);
        alert('Erreur: URL de paiement introuvable');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      alert('Erreur lors du paiement');
    } finally {
      setProcessing(null);
    }
  };

  return (
    <div className="p-4 md:p-8 lg:p-10 pb-24">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-16">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-600 font-bold text-[10px] px-4 py-1.5 rounded-full uppercase tracking-[0.2em] mb-6 border border-indigo-100"
          >
            <Zap size={14} className="fill-indigo-600" /> Booster de Réussite
          </motion.div>
          <h1 className="text-4xl lg:text-5xl font-black text-slate-900 tracking-tight mb-4">
            Crédits d'Étude Pro
          </h1>
          <p className="text-slate-500 font-semibold max-w-2xl mx-auto leading-relaxed">
            Débloquez des quiz exclusifs, accédez au mentor IA 24/7 et accélérez votre préparation au Bac avec nos packs adaptés.
          </p>
        </div>

        {/* Current Balance (if logged in) */}
        {isAuthenticated && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-md mx-auto mb-16 bg-white p-6 rounded-xl border border-slate-100 shadow-xl shadow-slate-200/50 flex items-center justify-between"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-amber-100 text-amber-600 flex items-center justify-center rounded-lg shadow-sm">
                <Coins size={24} />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Solde Actuel</p>
                <p className="text-2xl font-black text-slate-900 leading-none mt-1">{user.creditBalance} <span className="text-sm">Crédits</span></p>
              </div>
            </div>
            <button 
              onClick={() => setShowHistory(!showHistory)}
              className="p-3 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
              title="Historique des transactions"
            >
              <History size={20} />
            </button>
          </motion.div>
        )}

        {/* Transaction History (Collapsible) */}
        <AnimatePresence>
          {showHistory && (
             <motion.div 
               initial={{ height: 0, opacity: 0 }}
               animate={{ height: 'auto', opacity: 1 }}
               exit={{ height: 0, opacity: 0 }}
               className="max-w-2xl mx-auto mb-12 overflow-hidden bg-slate-50 border border-slate-200 rounded-xl"
             >
                <div className="p-6">
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-4">Dernières Transactions</h3>
                  <div className="space-y-3">
                    {history.length > 0 ? history.map(tx => (
                      <div key={tx.id} className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                        <div className="flex items-center gap-3">
                          <CheckCircle2 size={16} className="text-emerald-500" />
                          <div>
                            <p className="text-sm font-black text-slate-900">{tx.pack?.name}</p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase">{new Date(tx.createdAt).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <div className="text-right text-emerald-600 font-black text-sm">
                          +{tx.creditsAdded} <span className="text-[10px]">CR</span>
                        </div>
                      </div>
                    )) : (
                      <p className="text-center py-4 text-slate-400 text-xs font-bold uppercase">Aucune transaction trouvée</p>
                    )}
                  </div>
                </div>
             </motion.div>
          )}
        </AnimatePresence>

        {/* Packs Grid */}
        {loading ? (
          <div className="grid md:grid-cols-3 gap-8">
            {[1,2,3].map(i => <div key={i} className="h-[400px] bg-white rounded-xl animate-pulse shadow-sm"></div>)}
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {packs.map((pack) => (
              <motion.div
                key={pack.id}
                whileHover={{ y: -8 }}
                className={`relative bg-white rounded-xl p-8 border-2 shadow-sm transition-all flex flex-col ${
                  pack.credits > 500 ? 'border-indigo-100 ring-4 ring-indigo-50/50' : 'border-slate-100 h-full'
                }`}
              >
                {pack.credits > 500 && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-[0.2em] px-5 py-1.5 rounded-full shadow-lg shadow-indigo-200">
                    Meilleure Offre
                  </div>
                )}

                <div className="mb-8">
                  <h3 className="text-2xl font-black text-slate-900 mb-2">{pack.name}</h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-black text-slate-900">{pack.priceDa}</span>
                    <span className="text-sm font-black text-slate-400 uppercase tracking-widest">DZD</span>
                  </div>
                </div>

                <div className="p-5 bg-slate-50 rounded-lg mb-8 border border-slate-100/50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-amber-100 text-amber-600 flex items-center justify-center rounded-xl shadow-sm">
                      <Coins size={20} />
                    </div>
                    <div>
                      <p className="text-2xl font-black text-amber-600 tracking-tight leading-none">{pack.credits}</p>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Crédits</p>
                    </div>
                  </div>
                </div>

                <ul className="space-y-4 mb-10 flex-grow">
                  {[
                    "Accès complet aux sujets de Bac",
                    `Mentor IA (${pack.credits > 300 ? 'Illimité' : 'Standard'})`,
                    "Correction automatique des quiz",
                    "Téléchargement des corrigés PDF",
                    "Support Telegram Prioritaire"
                  ].map((feature, i) => (
                    <li key={i} className="flex items-center gap-3 text-slate-600 font-semibold text-[13px]">
                      <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>

                <button 
                  onClick={() => handleBuy(pack.id)}
                  disabled={processing === pack.id}
                  className={`w-full py-4 rounded-lg text-[10px] font-black uppercase tracking-[0.2em] shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 ${
                    pack.credits > 500 
                    ? 'bg-indigo-600 text-white shadow-indigo-200 hover:bg-indigo-700' 
                    : 'bg-slate-900 text-white shadow-slate-200 hover:bg-slate-800'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {processing === pack.id ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <>
                      Acheter Maintenant
                      <CreditCard size={14} className="opacity-60" />
                    </>
                  )}
                </button>
              </motion.div>
            ))}
          </div>
        )}

        {/* Info */}
        <div className="mt-20 flex flex-col items-center gap-8 text-center border-t border-slate-100 pt-16">
          <div className="flex gap-12 flex-wrap justify-center">
            <div className="flex items-center gap-2 text-slate-400 font-bold text-xs uppercase tracking-widest">
               <ShieldCheck size={20} className="text-emerald-500" />
               Paiement Sécurisé par Chargily
            </div>
            <div className="flex items-center gap-2 text-slate-400 font-bold text-xs uppercase tracking-widest">
               <AlertCircle size={20} className="text-blue-500" />
               Support Client 24/7
            </div>
          </div>
          <div className="flex gap-4">
               <img src="https://chargily.com/wp-content/uploads/2022/10/edahabia-badge.png" alt="Edahabia" className="h-8 grayscale opacity-70 hover:grayscale-0 transition-all cursor-default" />
               <img src="https://chargily.com/wp-content/uploads/2022/10/cib-logo.png" alt="CIB" className="h-8 grayscale opacity-70 hover:grayscale-0 transition-all cursor-default" />
          </div>
        </div>

      </div>
    </div>
  );
};

export default Credits;
