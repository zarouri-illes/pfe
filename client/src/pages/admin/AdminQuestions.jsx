import { useState, useEffect } from 'react';
import api from '../../api/client';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  HelpCircle, 
  Plus, 
  Search, 
  Filter, 
  Trash2, 
  Edit3, 
  MoreVertical,
  CheckCircle2,
  Image as ImageIcon,
  X,
  Loader2,
  ChevronRight,
  Eye,
  BookOpen,
  Target,
  Zap,
  MoreHorizontal
} from 'lucide-react';
import { Card, CardContent } from '../../components/ui/card';

const AdminQuestions = () => {
  const [questions, setQuestions] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  
  // Filters
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedChapter, setSelectedChapter] = useState('');
  const [search, setSearch] = useState('');

  // Form State
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    subjectId: '',
    chapterId: '',
    type: 'mcq', // 'mcq' or 'numerical'
    content: '',
    options: ['', '', '', ''],
    correctAnswer: '',
    points: 10,
    image: null,
    imagePreview: null
  });

  useEffect(() => {
    fetchSubjects();
    fetchQuestions();
  }, []);

  const fetchSubjects = async () => {
    try {
      const res = await api('/api/subjects');
      setSubjects(res.data || res);
    } catch (error) {
      console.error('Error fetching subjects:', error);
    }
  };

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      const res = await api('/api/admin/questions');
      setQuestions(res.data || res);
    } catch (error) {
      console.error('Error fetching questions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({ 
        ...formData, 
        image: file, 
        imagePreview: URL.createObjectURL(file) 
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.chapterId) return alert('Veuillez sélectionner un chapitre');
    if (formData.type === 'mcq' && !formData.correctAnswer) return alert('Veuillez spécifier la réponse correcte');

    const data = new FormData();
    data.append('chapterId', formData.chapterId);
    data.append('type', formData.type);
    data.append('content', formData.content);
    data.append('points', formData.points);
    
    if (formData.type === 'mcq') {
       // Combine options and correct answer logic as needed by backend
       // The current backend usually expects options in the content or separate? 
       // Let's assume standard format for now.
       data.append('options', JSON.stringify(formData.options));
       data.append('correctAnswer', formData.correctAnswer);
    } else {
       data.append('correctAnswer', formData.correctAnswer);
    }

    if (formData.image) {
      data.append('image', formData.image);
    }

    try {
      setProcessing(true);
      const url = editingId ? `/api/admin/questions/${editingId}` : '/api/admin/questions';
      const method = editingId ? 'PUT' : 'POST';
      
      await api(url, {
        method,
        body: data
      });

      setShowModal(false);
      resetForm();
      fetchQuestions();
    } catch (error) {
      console.error('Operation failed:', error);
      alert('Erreur lors de l\'enregistrement');
    } finally {
      setProcessing(false);
    }
  };

  const handleView = (q) => {
    setSelectedQuestion(q);
    setShowViewModal(true);
  };

  const handleEdit = (q) => {
    if (!q) return;
    setEditingId(q.id);
    setFormData({
      subjectId: q.chapter?.subjectId ? String(q.chapter.subjectId) : '',
      chapterId: q.chapterId ? String(q.chapterId) : '',
      type: q.type || 'mcq',
      content: q.content || '',
      options: Array.isArray(q.options) ? q.options : ['', '', '', ''],
      correctAnswer: q.correctAnswer || '',
      points: q.points || 10,
      image: null,
      imagePreview: q.imageUrl || null
    });
    setShowModal(true);
  };

  const handleDeleteClick = (q) => {
    setItemToDelete(q);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;
    try {
      setProcessing(true);
      await api(`/api/admin/questions/${itemToDelete.id}`, { method: 'DELETE' });
      setQuestions(prev => prev.filter(q => q.id !== itemToDelete.id));
      setShowDeleteModal(false);
      setItemToDelete(null);
    } catch (error) {
       alert('Erreur lors de la suppression');
    } finally {
      setProcessing(false);
    }
  };

  const resetForm = () => {
    setFormData({
      subjectId: '',
      chapterId: '',
      type: 'mcq',
      content: '',
      options: ['', '', '', ''],
      correctAnswer: '',
      points: 10,
      image: null,
      imagePreview: null
    });
    setEditingId(null);
  };

  const activeChapters = subjects.find(s => String(s.id) === String(formData.subjectId || selectedSubject))?.chapters || [];
  const filterChapters = subjects.find(s => String(s.id) === String(selectedSubject))?.chapters || [];

  const filteredQuestions = questions.filter(q => {
    const matchesSubject = !selectedSubject || String(q.chapter?.subjectId || '') === String(selectedSubject);
    const matchesChapter = !selectedChapter || String(q.chapterId || '') === String(selectedChapter);
    const matchesSearch = !search || q.content?.toLowerCase().includes(search.toLowerCase());
    return matchesSubject && matchesChapter && matchesSearch;
  });

  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Banque de Questions</h1>
          <nav className="flex items-center gap-2 mt-1.5 text-xs font-bold text-slate-400">
             <span>Admin</span>
             <ChevronRight size={12} />
             <span className="text-slate-600">Quiz & Questions</span>
          </nav>
        </div>
        <button 
          onClick={() => { resetForm(); setShowModal(true); }}
          className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl text-sm font-black shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all hover:scale-105 active:scale-95"
        >
          <Plus size={18} />
          Créer une Question
        </button>
      </div>

      {/* Filters Area */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-2 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text"
            placeholder="Rechercher une question..."
            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-indigo-500/20 outline-none"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        
        <select 
          className="px-4 pr-10 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20 appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%236b7280%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22m6%208%204%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem_1.25rem] bg-[position:right_0.5rem_center] bg-no-repeat"
          value={selectedSubject}
          onChange={(e) => { setSelectedSubject(e.target.value); setSelectedChapter(''); }}
        >
          <option value="">Toutes les Matières</option>
          {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>

        <select 
          className="px-4 pr-10 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20 appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%236b7280%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22m6%208%204%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem_1.25rem] bg-[position:right_0.5rem_center] bg-no-repeat"
          value={selectedChapter}
          onChange={(e) => setSelectedChapter(e.target.value)}
          disabled={!selectedSubject}
        >
          <option value="">Tous les Chapitres</option>
          {filterChapters.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {/* Questions Table */}
      <Card className="border-slate-200/60 shadow-sm rounded-xl overflow-hidden bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Question</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Chapitre / Matière</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Points</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Type</th>
                <th className="px-6 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                [1,2,3].map(i => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan="5" className="px-6 py-8"><div className="h-4 bg-slate-100 rounded w-full"></div></td>
                  </tr>
                ))
              ) : filteredQuestions.length > 0 ? (
                filteredQuestions.map((q) => (
                  <tr key={q.id} className="hover:bg-slate-50/80 transition-all group">
                    <td className="px-6 py-5 max-w-md">
                      <div className="flex items-start gap-3">
                         <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-500 flex items-center justify-center shrink-0">
                           <HelpCircle size={16} />
                         </div>
                         <div>
                            <p className="text-sm font-bold text-slate-900 line-clamp-2">{q.content}</p>
                            {q.imageUrl && (
                              <div className="mt-2 flex items-center gap-1.5 text-[10px] font-black text-indigo-600 uppercase">
                                <ImageIcon size={12} /> Image active
                              </div>
                            )}
                         </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                       <p className="text-xs font-bold text-slate-700">{q.chapter?.name}</p>
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">{q.chapter?.subject?.name}</p>
                    </td>
                    <td className="px-6 py-5 text-center">
                       <span className="px-2.5 py-1 bg-amber-50 text-amber-600 rounded-lg text-xs font-black border border-amber-100">
                         {q.points} XP
                       </span>
                    </td>
                    <td className="px-6 py-5 text-center">
                       <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                         q.type === 'mcq' ? 'bg-indigo-50 text-indigo-600' : 'bg-emerald-50 text-emerald-600'
                       }`}>
                         {q.type}
                       </span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex justify-end gap-2 transition-all">
                        <button 
                          onClick={() => handleView(q)}
                          className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-lg transition-all shadow-sm border border-transparent hover:border-slate-100"
                        >
                          <Eye size={16} />
                        </button>
                        <button 
                          onClick={() => handleEdit(q)}
                          className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-lg transition-all shadow-sm border border-transparent hover:border-slate-100"
                        >
                          <Edit3 size={16} />
                        </button>
                        <button 
                          onClick={() => handleDeleteClick(q)}
                          className="p-2 text-slate-400 hover:text-red-500 hover:bg-white rounded-lg transition-all shadow-sm"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-6 py-20 text-center text-slate-400 font-bold italic">
                    Aucune question trouvée dans cette catégorie
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Creation Modal */}
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
              className="relative w-full max-w-2xl bg-white rounded-xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            >
              <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-600 text-white flex items-center justify-center rounded-xl shadow-lg shadow-indigo-200">
                    {editingId ? <Edit3 size={20} /> : <Plus size={20} />}
                  </div>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight">
                    {editingId ? 'Modifier la Question' : 'Nouvelle Question'}
                  </h3>
                </div>
                <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 p-2">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="flex-grow overflow-y-auto p-8 space-y-6">
                
                {/* Subject & Chapter */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Matière</label>
                    <select 
                      required
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-sans"
                      value={formData.subjectId}
                      onChange={(e) => {
                        setFormData({...formData, subjectId: e.target.value, chapterId: ''});
                      }}
                    >
                      <option value="">Sélectionner...</option>
                      {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Chapitre / Topic</label>
                    <select 
                      required
                      disabled={!formData.subjectId}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-sans"
                      value={formData.chapterId}
                      onChange={(e) => setFormData({...formData, chapterId: e.target.value})}
                    >
                      <option value="">Sélectionner...</option>
                      {activeChapters.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                </div>

                {/* Type & Points */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Type de Question</label>
                    <div className="flex gap-2">
                       {['mcq', 'numerical'].map(t => (
                         <button
                           key={t}
                           type="button"
                           onClick={() => setFormData({...formData, type: t})}
                           className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                             formData.type === t 
                             ? 'bg-slate-900 text-white border-slate-900 shadow-lg shadow-slate-200' 
                             : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                           }`}
                         >
                           {t === 'mcq' ? 'QCM' : 'Numérique'}
                         </button>
                       ))}
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Points (XP)</label>
                    <input 
                      type="number"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500/20"
                      value={formData.points}
                      onChange={(e) => setFormData({...formData, points: e.target.value})}
                    />
                  </div>
                </div>

                {/* Question Content */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Énoncé de la Question</label>
                  <textarea 
                    required
                    rows="3"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                    placeholder="Tapez le contenu de la question ici..."
                    value={formData.content}
                    onChange={(e) => setFormData({...formData, content: e.target.value})}
                  />
                </div>

                {/* Media Upload */}
                <div className="space-y-1.5">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Illustration (Optionnel)</label>
                   <div className="flex items-center gap-4">
                      <div className="relative group w-32 h-32 bg-slate-50 border-2 border-dashed border-slate-200 rounded-lg flex items-center justify-center overflow-hidden hover:border-indigo-400 transition-all cursor-pointer">
                        {formData.imagePreview ? (
                          <img src={formData.imagePreview} className="w-full h-full object-cover" alt="Preview" />
                        ) : (
                          <Plus className="text-slate-300 group-hover:text-indigo-500 transition-colors" size={32} />
                        )}
                        <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" onChange={handleImageChange} />
                      </div>
                      <div className="flex-1 text-xs text-slate-400 font-bold leading-relaxed">
                        Ajoutez un graphique, une figure géométrique ou une formule complexe en image.
                        {formData.imagePreview && (
                          <button 
                            type="button" 
                            onClick={() => setFormData({...formData, image: null, imagePreview: null})}
                            className="block mt-2 text-red-500 hover:underline uppercase tracking-tighter"
                          >
                            Supprimer l'image
                          </button>
                        )}
                      </div>
                   </div>
                </div>

                {/* Options (for MCQ) */}
                {formData.type === 'mcq' && (
                  <div className="space-y-4 pt-2 border-t border-slate-100">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Options de Réponse</label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {formData.options.map((opt, i) => (
                        <div key={i} className="flex items-center gap-3">
                           <button
                             type="button"
                             onClick={() => setFormData({...formData, correctAnswer: opt})}
                             className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all ${
                               formData.correctAnswer === opt && opt !== ''
                               ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200'
                               : 'bg-slate-100 text-slate-400'
                             }`}
                           >
                             {String.fromCharCode(65 + i)}
                           </button>
                           <input 
                             type="text"
                             className={`flex-1 px-4 py-2 bg-slate-50 border rounded-xl text-sm font-semibold outline-none transition-all ${
                               formData.correctAnswer === opt && opt !== '' ? 'border-emerald-500/50 bg-emerald-50/10' : 'border-slate-200'
                             }`}
                             placeholder={`Option ${String.fromCharCode(65 + i)}`}
                             value={opt}
                             onChange={(e) => {
                               const newOpts = [...formData.options];
                               newOpts[i] = e.target.value;
                               setFormData({...formData, options: newOpts});
                             }}
                           />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Correct Answer (Numerical) */}
                {formData.type === 'numerical' && (
                   <div className="space-y-1.5 border-t border-slate-100 pt-4">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Réponse Exacte</label>
                      <input 
                        type="text"
                        required
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500/20"
                        placeholder="Ex: 42 ou 3.14"
                        value={formData.correctAnswer}
                        onChange={(e) => setFormData({...formData, correctAnswer: e.target.value})}
                      />
                   </div>
                )}
              </form>

              <div className="px-8 py-6 bg-slate-50 border-t border-slate-100 flex gap-4">
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-4 bg-white border border-slate-200 text-slate-600 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all"
                >
                  Annuler
                </button>
                <button 
                  onClick={handleSubmit}
                  disabled={processing}
                  className="flex-1 py-4 bg-indigo-600 text-white rounded-lg text-[10px] font-black uppercase tracking-widest shadow-xl shadow-indigo-200 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
                >
                  {processing ? <Loader2 size={16} className="animate-spin" /> : 'Enregistrer Question'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* View Modal */}
      <AnimatePresence>
        {showViewModal && selectedQuestion && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowViewModal(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-xl bg-white rounded-xl shadow-2xl overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-indigo-100 text-indigo-600 flex items-center justify-center rounded-lg">
                    <Eye size={18} />
                  </div>
                  <h3 className="text-lg font-black text-slate-900 tracking-tight">Détails de la Question</h3>
                </div>
                <button onClick={() => setShowViewModal(false)} className="text-slate-400 hover:text-slate-600 p-2">
                  <X size={20} />
                </button>
              </div>

              <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
                <div className="space-y-4">
                  <p className="text-sm font-black text-slate-400 uppercase tracking-widest leading-none">Énoncé</p>
                  <p className="text-lg font-bold text-slate-900 bg-slate-50 p-6 rounded-lg border border-slate-100 italic">
                    "{selectedQuestion.content}"
                  </p>
                </div>

                {selectedQuestion.imageUrl && (
                  <div className="space-y-4">
                    <p className="text-sm font-black text-slate-400 uppercase tracking-widest leading-none">Illustration</p>
                    <div className="rounded-lg overflow-hidden border border-slate-200">
                      <img src={selectedQuestion.imageUrl} alt="Question" className="w-full object-contain max-h-64 bg-white" />
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest leading-none">Type</p>
                    <span className="inline-block px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-black uppercase tracking-widest border border-indigo-100">
                      {selectedQuestion.type}
                    </span>
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest leading-none">Points</p>
                    <span className="inline-block px-3 py-1 bg-amber-50 text-amber-600 rounded-lg text-xs font-black border border-amber-100">
                      {selectedQuestion.points} XP
                    </span>
                  </div>
                </div>

                {selectedQuestion.type === 'mcq' && selectedQuestion.options && (
                  <div className="space-y-4">
                    <p className="text-sm font-black text-slate-400 uppercase tracking-widest leading-none">Options & Réponse</p>
                    <div className="grid gap-3">
                      {selectedQuestion.options.map((opt, i) => (
                        <div 
                          key={i} 
                          className={`flex items-center gap-3 p-4 rounded-xl border transition-all ${
                            opt === selectedQuestion.correctAnswer 
                            ? 'bg-emerald-50 border-emerald-500/30 ring-2 ring-emerald-500/10' 
                            : 'bg-white border-slate-100'
                          }`}
                        >
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black shrink-0 ${
                             opt === selectedQuestion.correctAnswer ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400'
                          }`}>
                            {String.fromCharCode(65 + i)}
                          </div>
                          <span className={`text-sm font-bold ${opt === selectedQuestion.correctAnswer ? 'text-emerald-700' : 'text-slate-600'}`}>
                            {opt}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedQuestion.type === 'numerical' && (
                  <div className="space-y-4">
                    <p className="text-sm font-black text-slate-400 uppercase tracking-widest leading-none">Réponse Correcte</p>
                    <div className="p-4 bg-emerald-50 border border-emerald-500/30 rounded-xl">
                       <span className="text-xl font-black text-emerald-600">{selectedQuestion.correctAnswer}</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-4">
                 <button 
                   onClick={() => handleEdit(selectedQuestion)}
                   className="flex-1 py-4 bg-indigo-600 text-white rounded-lg text-[10px] font-black uppercase tracking-widest shadow-xl shadow-indigo-200 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
                 >
                   <Edit3 size={16} />
                   Modifier la Question
                 </button>
              </div>
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
                Êtes-vous sûr de vouloir supprimer cette question ? Cette action est irréversible.
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
                  onClick={handleDeleteConfirm}
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

export default AdminQuestions;
