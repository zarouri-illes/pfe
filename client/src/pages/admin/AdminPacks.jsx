import { useState, useEffect } from 'react';
import api from '../../api/client';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Package, 
  Plus, 
  Trash2, 
  Edit2, 
  CheckCircle2, 
  X, 
  Coins, 
  Zap, 
  ShieldCheck,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { Card, CardContent } from '../../components/ui/card';

const AdminPacks = () => {
  const [packs, setPacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentPackId, setCurrentPackId] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [packToDelete, setPackToDelete] = useState(null);
  const [processing, setProcessing] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState({
    name: '',
    credits: 0,
    priceDa: 0,
    isActive: true
  });

  useEffect(() => {
    fetchPacks();
  }, []);

  const fetchPacks = async () => {
    try {
      setLoading(true);
      const res = await api('/api/admin/credit-packs');
      setPacks(res.data || res);
    } catch (error) {
      console.error('Error fetching packs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (pack) => {
    setFormData({
      name: pack.name,
      credits: pack.credits,
      priceDa: pack.priceDa,
      isActive: pack.isActive
    });
    setCurrentPackId(pack.id);
    setIsEditing(true);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditing) {
        await api(`/api/admin/credit-packs/${currentPackId}`, {
          method: 'PUT',
          body: JSON.stringify(formData)
        });
      } else {
        await api('/api/admin/credit-packs', {
          method: 'POST',
          body: JSON.stringify(formData)
        });
      }
      setShowModal(false);
      resetForm();
      fetchPacks();
    } catch (error) {
      console.error('Save failed:', error);
      alert('Erreur lors de la sauvegarde');
    }
  };

  const handleDeleteClick = (pack) => {
    setPackToDelete(pack);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!packToDelete) return;
    try {
      setProcessing(true);
      await api(`/api/admin/credit-packs/${packToDelete.id}`, { method: 'DELETE' });
      setPacks(prev => prev.filter(p => p.id !== packToDelete.id));
      setShowDeleteModal(false);
      setPackToDelete(null);
    } catch (error) {
       // Specifically handle the 409 Conflict (used for foreign key violations)
       if (error.status === 409 || (error.message && error.message.includes('Désactivez'))) {
         alert(error.message || 'Impossible de supprimer un pack avec historique. Désactivez-le plutôt.');
       } else {
         console.error('Delete failed:', error);
         alert('Erreur lors de la suppression');
       }
    } finally {
      setProcessing(false);
    }
  };

  const toggleStatus = async (pack) => {
    try {
      await api(`/api/admin/credit-packs/${pack.id}`, {
        method: 'PUT',
        body: JSON.stringify({ ...pack, isActive: !pack.isActive })
      });
      setPacks(prev => prev.map(p => p.id === pack.id ? { ...p, isActive: !p.isActive } : p));
    } catch (error) {
      console.error('Toggle failed:', error);
    }
  };

  const resetForm = () => {
    setFormData({ name: '', credits: 0, priceDa: 0, isActive: true });
    setIsEditing(false);
    setCurrentPackId(null);
  };

  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Gestion des Packs</h1>
          <p className="text-sm font-bold text-slate-400 mt-1">Gérez les offres de crédits pour les étudiants</p>
        </div>
        <button 
          onClick={() => { resetForm(); setShowModal(true); }}
          className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl text-sm font-black shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all hover:scale-105 active:scale-95"
        >
          <Plus size={18} />
          Nouveau Pack
        </button>
      </div>

      {/* Packs Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
           {[1,2,3].map(i => <div key={i} className="h-64 bg-slate-100 rounded-lg"></div>)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
           {packs.map((pack) => (
             <motion.div 
               layout
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               key={pack.id}
             >
               <Card className={`relative overflow-hidden border-2 transition-all group ${
                 pack.isActive ? 'border-transparent bg-white shadow-sm hover:shadow-xl' : 'border-slate-100 bg-slate-50 grayscale opacity-60'
               }`}>
                 <CardContent className="p-6">
                   <div className="flex justify-between items-start mb-6">
                     <div className={`p-3 rounded-lg ${
                       pack.credits > 100 ? 'bg-amber-100 text-amber-600' : 'bg-indigo-100 text-indigo-600'
                     }`}>
                       <Package size={24} />
                     </div>
                     <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                       <button onClick={() => handleEdit(pack)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
                         <Edit2 size={16} />
                       </button>
                        <button onClick={() => handleDeleteClick(pack)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg">
                          <Trash2 size={16} />
                        </button>
                     </div>
                   </div>

                   <div className="space-y-4">
                     <div>
                       <h3 className="text-xl font-black text-slate-900 tracking-tight">{pack.name}</h3>
                       <div className="flex items-center gap-2 mt-1">
                          <Coins size={14} className="text-amber-500" />
                          <span className="text-sm font-black text-slate-500 tracking-wide">{pack.credits} Crédits</span>
                       </div>
                     </div>

                     <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-black text-slate-900">{pack.priceDa}</span>
                        <span className="text-xs font-black text-slate-400 uppercase tracking-widest">DZD</span>
                     </div>

                     <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                        <button 
                          onClick={() => toggleStatus(pack)}
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider transition-all ${
                            pack.isActive 
                            ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                            : 'bg-slate-200 text-slate-500 border border-slate-300'
                          }`}
                        >
                          {pack.isActive ? <CheckCircle2 size={12} /> : <X size={12} />}
                          {pack.isActive ? 'Actif' : 'Inactif'}
                        </button>
                        
                        <div className="text-[10px] text-slate-400 font-bold italic">
                           ID: #{pack.id}
                        </div>
                     </div>
                   </div>
                 </CardContent>
               </Card>
             </motion.div>
           ))}

           {packs.length === 0 && (
             <div className="col-span-full py-20 text-center bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
                <Package className="mx-auto text-slate-300 mb-4" size={48} />
                <p className="text-slate-400 font-bold uppercase tracking-widest">Aucun pack configuré</p>
             </div>
           )}
        </div>
      )}

      {/* Create/Edit Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowModal(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-lg shadow-2xl overflow-hidden"
            >
              <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-600 text-white flex items-center justify-center rounded-xl shadow-lg shadow-indigo-200">
                    {isEditing ? <Edit2 size={20} /> : <Plus size={20} />}
                  </div>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight">
                    {isEditing ? 'Modifier Pack' : 'Nouveau Pack'}
                  </h3>
                </div>
                <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-200/50 rounded-lg transition-all">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-8 space-y-6">
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nom du Pack</label>
                    <input 
                      type="text" 
                      required
                      placeholder="Ex: Pack Découverte, Pack Premium..."
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-sans"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nombre de Crédits</label>
                      <div className="relative">
                        <Coins className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input 
                          type="number" 
                          required
                          className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-sans"
                          value={formData.credits}
                          onChange={(e) => setFormData({...formData, credits: e.target.value})}
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Prix (DZD)</label>
                      <input 
                        type="number" 
                        required
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-sans"
                        value={formData.priceDa}
                        onChange={(e) => setFormData({...formData, priceDa: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-3">
                       <Zap className={formData.isActive ? "text-amber-500" : "text-slate-300"} size={18} />
                       <div>
                         <p className="text-xs font-black text-slate-900 tracking-tight">Statut du Pack</p>
                         <p className="text-[10px] font-bold text-slate-400 uppercase">Visible par les étudiants</p>
                       </div>
                    </div>
                    <button 
                      type="button"
                      onClick={() => setFormData({...formData, isActive: !formData.isActive})}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        formData.isActive ? 'bg-indigo-600' : 'bg-slate-200'
                      }`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        formData.isActive ? 'translate-x-6' : 'translate-x-1'
                      }`} />
                    </button>
                  </div>
                </div>

                <div className="pt-4 flex gap-3">
                  <button 
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 py-4 bg-slate-50 text-slate-600 rounded-xl text-xs font-black uppercase tracking-widest border border-slate-100 hover:bg-slate-100 transition-all"
                  >
                    Annuler
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-4 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all"
                  >
                    {isEditing ? 'Mettre à jour' : 'Créer le Pack'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDeleteModal(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-xl shadow-2xl overflow-hidden p-8 text-center"
            >
              <div className="w-20 h-20 bg-red-50 text-red-500 flex items-center justify-center rounded-lg mx-auto mb-6">
                <Trash2 size={40} />
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-2">Confirmer Suppression</h3>
              <p className="text-slate-500 font-medium mb-8">
                Êtes-vous sûr de vouloir supprimer le pack <span className="font-bold text-slate-900">"{packToDelete?.name}"</span> ? Cette action est irréversible.
              </p>
              <div className="flex gap-4">
                <button 
                  onClick={() => setShowDeleteModal(false)}
                  disabled={processing}
                  className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all disabled:opacity-50"
                >
                  Annuler
                </button>
                <button 
                  onClick={handleConfirmDelete}
                  disabled={processing}
                  className="flex-1 py-4 bg-red-500 text-white rounded-lg text-[10px] font-black uppercase tracking-widest shadow-xl shadow-red-200 hover:bg-red-600 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {processing ? <Loader2 size={16} className="animate-spin" /> : 'Supprimer'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminPacks;
