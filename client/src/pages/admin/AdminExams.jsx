import { useState, useEffect } from 'react';
import api from '../../api/client';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, 
  Upload, 
  Search, 
  Trash2, 
  MoreVertical, 
  Filter, 
  Plus, 
  X,
  FileDown,
  Calendar,
  Layers,
  CheckCircle2,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { Card, CardContent } from '../../components/ui/card';
import PDFViewer from '../../components/admin/PDFViewer';

const AdminExams = () => {
  const [exams, setExams] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [search, setSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [examToDelete, setExamToDelete] = useState(null);
  const [selectedPreviewUrl, setSelectedPreviewUrl] = useState(null);
  const [selectedExamId, setSelectedExamId] = useState(null);
  const [selectedExamTitle, setSelectedExamTitle] = useState('');
  const [filterYear, setFilterYear] = useState('');
  const [filterSemester, setFilterSemester] = useState('');
  const [filterStream, setFilterStream] = useState('');
  const [filterSubject, setFilterSubject] = useState('');
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    subjectId: '',
    year: new Date().getFullYear(),
    stream: 'Science',
    type: 'BAC',
    semester: '1',
    file: null
  });

  const streams = ['Science', 'Math', 'Technique Math', 'Gestion', 'Lettres', 'Langues'];
  const types = ['BAC', 'BAC Blanc', 'Exercices', 'Correction'];
  const semesters = ['1', '2', '3'];

  useEffect(() => {
    fetchExams();
    fetchSubjects();
  }, [pagination.page]);

  const fetchExams = async () => {
    try {
      setLoading(true);
      // We'll filter on the frontend for now for snappiness, but backend has pagination
      const res = await api(`/api/admin/exams?page=${pagination.page}&limit=50`); 
      setExams(res.data);
      console.log('DEBUG: Exams:', res.data);
      setPagination(prev => ({ ...prev, totalPages: res.pagination.totalPages }));
    } catch (error) {
      console.error('Error fetching exams:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubjects = async () => {
    try {
      const res = await api('/api/subjects');
      setSubjects(res.data || res);
      console.log('DEBUG: Subjects:', res.data || res);
    } catch (error) {
      console.error('Error fetching subjects:', error);
    }
  };

  const handleFileChange = (e) => {
    setFormData({ ...formData, file: e.target.files[0] });
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!formData.file) return alert('Veuillez sélectionner un fichier PDF');

    const data = new FormData();
    data.append('title', formData.title);
    data.append('subjectId', formData.subjectId);
    data.append('year', formData.year);
    data.append('stream', formData.stream);
    data.append('type', formData.type);
    data.append('semester', formData.semester);
    data.append('pdf', formData.file);

    try {
      setUploading(true);
      await api('/api/admin/exams', {
        method: 'POST',
        body: data
      });
      setShowUploadModal(false);
      setFormData({
        title: '',
        subjectId: '',
        year: new Date().getFullYear(),
        stream: 'Science',
        type: 'BAC',
        semester: '1',
        file: null
      });
      fetchExams();
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Erreur lors de l\'upload');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteClick = (exam) => {
    setExamToDelete(exam);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!examToDelete) return;
    try {
      await api(`/api/admin/exams/${examToDelete.id}`, { method: 'DELETE' });
      setExams(prev => prev.filter(ex => ex.id !== examToDelete.id));
      setShowDeleteModal(false);
      setExamToDelete(null);
    } catch (error) {
      console.error('Delete failed:', error);
      alert('Erreur lors de la suppression');
    }
  };

  const filteredExams = exams.filter(ex => {
    const matchesSearch = ex.title.toLowerCase().includes(search.toLowerCase()) ||
                         ex.subject?.name?.toLowerCase().includes(search.toLowerCase());
    const matchesYear = !filterYear || ex.year.toString() === filterYear;
    const matchesSemester = !filterSemester || ex.semester?.toString() === filterSemester;
    const matchesStream = !filterStream || ex.stream === filterStream;
    const matchesSubject = !filterSubject || ex.subjectId.toString() === filterSubject;
    
    return matchesSearch && matchesYear && matchesSemester && matchesStream && matchesSubject;
  });

  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Gestion des Examens</h1>
          <p className="text-sm font-bold text-slate-400 mt-1">Bibliothèque de PDF et Sujets du Bac</p>
        </div>
        <button 
          onClick={() => setShowUploadModal(true)}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl text-sm font-black shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all hover:scale-105 active:scale-95"
        >
          <Upload size={18} />
          Ajouter un Sujet
        </button>
      </div>

      {/* Filters & Search */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text"
              placeholder="Rechercher par titre ou matière..."
              className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-sans"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold transition-all border ${
              showFilters ? 'bg-slate-900 text-white border-slate-900' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Filter size={18} />
            {showFilters ? 'Fermer Filtres' : 'Filtres'}
          </button>
        </div>

        {/* Filter Bar */}
        <AnimatePresence>
          {showFilters && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="p-5 bg-slate-50 border border-slate-200 rounded-xl grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Année</label>
                  <select 
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold focus:ring-2 focus:ring-blue-500/20 outline-none"
                    value={filterYear}
                    onChange={(e) => setFilterYear(e.target.value)}
                  >
                    <option value="">Toutes</option>
                    {[2024, 2023, 2022, 2021, 2020].map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Semestre</label>
                  <select 
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold focus:ring-2 focus:ring-blue-500/20 outline-none"
                    value={filterSemester}
                    onChange={(e) => setFilterSemester(e.target.value)}
                  >
                    <option value="">Tous</option>
                    <option value="1">Semestre 1</option>
                    <option value="2">Semestre 2</option>
                    <option value="3">Semestre 3</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Filière</label>
                  <select 
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold focus:ring-2 focus:ring-blue-500/20 outline-none"
                    value={filterStream}
                    onChange={(e) => setFilterStream(e.target.value)}
                  >
                    <option value="">Toutes</option>
                    {streams.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Matière</label>
                  <select 
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold focus:ring-2 focus:ring-blue-500/20 outline-none"
                    value={filterSubject}
                    onChange={(e) => setFilterSubject(e.target.value)}
                  >
                    <option value="">Toutes</option>
                    {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Stats Quick View */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <Card className="bg-white border-slate-200/60 shadow-sm rounded-xl hover:shadow-md transition-shadow">
           <CardContent className="p-5 flex items-center gap-4">
             <div className="w-12 h-12 bg-blue-50 text-blue-600 flex items-center justify-center rounded-xl">
               <FileText size={22} />
             </div>
             <div>
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">Total PDFs</p>
               <h3 className="text-xl font-black text-slate-900">{exams.length}</h3>
             </div>
           </CardContent>
         </Card>
         <Card className="bg-white border-slate-200/60 shadow-sm rounded-xl hover:shadow-md transition-shadow">
           <CardContent className="p-5 flex items-center gap-4">
             <div className="w-12 h-12 bg-emerald-50 text-emerald-600 flex items-center justify-center rounded-xl">
               <CheckCircle2 size={22} />
             </div>
             <div>
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">Résultats Filtrés</p>
               <h3 className="text-xl font-black text-emerald-600">{filteredExams.length}</h3>
             </div>
           </CardContent>
         </Card>
      </div>

      {/* Exams Table */}
      <Card className="border-slate-200/60 shadow-sm rounded-xl overflow-hidden bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Sujet / Examen</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Année / Filière</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Type</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date d'Upload</th>
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
              ) : filteredExams.length > 0 ? (
                filteredExams.map((exam) => (
                  <tr 
                    key={exam.id} 
                    onClick={() => {
                      setSelectedExamId(exam.id);
                      setSelectedExamTitle(exam.title);
                      setShowPreviewModal(true);
                    }}
                    className="hover:bg-slate-50/80 transition-all cursor-pointer group border-l-2 border-l-transparent hover:border-l-blue-500"
                  >
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-red-50 text-red-500 flex items-center justify-center rounded-lg border border-red-100 group-hover:scale-110 transition-transform">
                          <FileText size={18} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900 leading-tight">{exam.title}</p>
                          <p className="text-xs font-semibold text-blue-600 mt-0.5">{exam.subject?.name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                          <Calendar size={12} className="text-slate-400" />
                          <span>Année: {exam.year}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                          <Layers size={12} className="text-slate-400" />
                          <span>{exam.stream}</span>
                        </div>
                        {exam.semester && (
                          <div className="flex items-center gap-2 text-[10px] font-black text-blue-500 uppercase">
                             Semestre {exam.semester}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        exam.type === 'BAC' ? 'bg-amber-50 text-amber-600 border border-amber-100' : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}>
                        {exam.type}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-xs font-bold text-slate-500 italic">
                      {new Date(exam.uploadedAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-5" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => {
                            setSelectedExamId(exam.id);
                            setSelectedExamTitle(exam.title);
                            setShowPreviewModal(true);
                          }}
                          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                          title="Aperçu"
                        >
                          <FileText size={18} />
                        </button>
                        <a 
                          href={exam.fileUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                          title="Télécharger"
                        >
                          <FileDown size={18} />
                        </a>
                        <button 
                          onClick={() => handleDeleteClick(exam)}
                          className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                          title="Supprimer"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="p-4 bg-slate-50 rounded-full text-slate-300">
                        <FileText size={48} />
                      </div>
                      <p className="text-slate-400 font-bold">Aucun examen trouvé</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Upload Modal */}
      <AnimatePresence>
        {showUploadModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowUploadModal(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-xl bg-white rounded-lg shadow-2xl overflow-hidden"
            >
              <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-600 text-white flex items-center justify-center rounded-xl shadow-lg shadow-blue-200">
                    <Upload size={20} />
                  </div>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight">Nouveau Sujet</h3>
                </div>
                <button onClick={() => setShowUploadModal(false)} className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-200/50 rounded-lg transition-all">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleUpload} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                  <div className="col-span-2 space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Titre de l'examen</label>
                    <input 
                      type="text" 
                      required
                      placeholder="Ex: BAC MATHÉMATIQUES 2023"
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-sans"
                      value={formData.title}
                      onChange={(e) => setFormData({...formData, title: e.target.value})}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Matière</label>
                    <select 
                      required
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-sans"
                      value={formData.subjectId}
                      onChange={(e) => setFormData({...formData, subjectId: e.target.value})}
                    >
                      <option value="">Sélectionner...</option>
                      {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Année</label>
                    <input 
                      type="number" 
                      required
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-sans"
                      value={formData.year}
                      onChange={(e) => setFormData({...formData, year: e.target.value})}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Filière</label>
                    <select 
                      required
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-sans"
                      value={formData.stream}
                      onChange={(e) => setFormData({...formData, stream: e.target.value})}
                    >
                      {streams.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Type</label>
                    <select 
                      required
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-sans"
                      value={formData.type}
                      onChange={(e) => setFormData({...formData, type: e.target.value})}
                    >
                      {types.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>

                  <div className="col-span-2 space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Semestre</label>
                    <div className="flex gap-2">
                       {semesters.map(s => (
                         <button
                           key={s}
                           type="button"
                           onClick={() => setFormData({...formData, semester: s})}
                           className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all border ${
                             formData.semester === s 
                             ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-100' 
                             : 'bg-white text-slate-500 border-slate-200 hover:border-blue-300'
                           }`}
                         >
                           Semestre {s}
                         </button>
                       ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-1 pt-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Fichier PDF</label>
                  <div className="relative group border-2 border-dashed border-slate-200 rounded-xl p-4 transition-all hover:border-blue-400 hover:bg-blue-50/10 cursor-pointer flex items-center gap-4">
                     <input 
                        type="file" 
                        accept=".pdf"
                        required
                        className="absolute inset-0 opacity-0 cursor-pointer"
                        onChange={handleFileChange}
                     />
                     <div className="w-9 h-9 bg-slate-50 text-slate-400 group-hover:text-blue-500 group-hover:bg-blue-50 flex items-center justify-center rounded-lg transition-all shrink-0">
                       {formData.file ? <CheckCircle2 className="text-emerald-500" size={18} /> : <Plus size={18} />}
                     </div>
                     <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-700 truncate">{formData.file ? formData.file.name : 'Choisir le PDF'}</p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">Max 10MB</p>
                     </div>
                  </div>
                </div>

                <div className="pt-2 flex gap-3">
                  <button 
                    type="button"
                    onClick={() => setShowUploadModal(false)}
                    className="flex-1 py-4 bg-slate-50 text-slate-600 rounded-xl text-xs font-black uppercase tracking-widest border border-slate-100 hover:bg-slate-100 transition-all"
                  >
                    Annuler
                  </button>
                  <button 
                    type="submit"
                    disabled={uploading}
                    className="flex-1 py-4 bg-blue-600 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
                  >
                    {uploading ? <Loader2 className="animate-spin" size={16} /> : 'Confirmer Upload'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* High-Fidelity PDF Preview Modal */}
      <AnimatePresence>
        {showPreviewModal && selectedExamId && (
          <PDFViewer 
            examId={selectedExamId} 
            title={selectedExamTitle}
            onClose={() => {
              setShowPreviewModal(false);
              setSelectedExamId(null);
            }} 
          />
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
              <h3 className="text-2xl font-black text-slate-900 mb-2">Supprimer l'examen ?</h3>
              <p className="text-slate-500 font-medium mb-8">
                Êtes-vous sûr de vouloir supprimer <span className="font-bold text-slate-900">"{examToDelete?.title}"</span> ? Cette action est irréversible.
              </p>
              <div className="flex gap-4">
                <button 
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all font-sans"
                >
                  Annuler
                </button>
                <button 
                  onClick={handleConfirmDelete}
                  className="flex-1 py-4 bg-red-500 text-white rounded-lg text-[10px] font-black uppercase tracking-widest shadow-xl shadow-red-200 hover:bg-red-600 transition-all flex items-center justify-center gap-2 font-sans"
                >
                  Supprimer
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminExams;
