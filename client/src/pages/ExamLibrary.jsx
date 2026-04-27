import { useState, useEffect } from 'react';
import api from '../api/client';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Filter, 
  FileText, 
  Download, 
  ExternalLink, 
  BookOpen, 
  ChevronDown,
  X,
  Loader2
} from 'lucide-react';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import Skeleton from '../components/ui/skeleton';

const ExamLibrary = () => {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [subjects, setSubjects] = useState([]);
  
  // Filters
  const [filters, setFilters] = useState({
    subjectId: '',
    year: '',
    stream: '',
    type: ''
  });

  const streams = ['Sciences Expérimentales', 'Mathématiques', 'Technique Mathématique', 'Gestion et Economie', 'Lettres et Philosophie', 'Langues Etrangères'];
  const types = [{ id: 'exam', label: 'Sujet' }, { id: 'correction', label: 'Corrigé' }];
  const years = Array.from({ length: 15 }, (_, i) => 2024 - i);

  useEffect(() => {
    fetchSubjects();
    fetchExams();
  }, [filters]);

  const fetchSubjects = async () => {
    try {
      const res = await api('/api/subjects');
      setSubjects(res.data || res);
    } catch (error) {
      console.error('Error fetching subjects:', error);
    }
  };

  const fetchExams = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.subjectId) params.append('subjectId', filters.subjectId);
      if (filters.year) params.append('year', filters.year);
      if (filters.stream) params.append('stream', filters.stream);
      if (filters.type) params.append('type', filters.type);

      const res = await api(`/api/exams?${params.toString()}`);
      setExams(res.data || res);
    } catch (error) {
      console.error('Error fetching exams:', error);
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setFilters({ subjectId: '', year: '', stream: '', type: '' });
  };

  return (
    <div className="p-4 md:p-8 lg:p-10 pb-24 space-y-10">
      
      {/* 1. HERO HEADER */}
      <section className="text-center space-y-4 max-w-3xl mx-auto py-10">
         <motion.div 
           initial={{ opacity: 0, scale: 0.9 }}
           animate={{ opacity: 1, scale: 1 }}
           className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-600 px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest border border-indigo-100"
         >
            <BookOpen size={14} /> Bibliothèque Digitale
         </motion.div>
         <h1 className="text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-tight">
            Tous les Sujets du Bac <br/> <span className="text-indigo-600">à portée de main.</span>
         </h1>
         <p className="text-slate-500 font-semibold text-lg">
            Accédez gratuitement aux archives officielles et aux corrections détaillées du Baccalauréat Algérien.
         </p>
      </section>

      {/* 2. FILTER BAR */}
      <Card className="border-none bg-white shadow-xl shadow-slate-100/50 rounded-xl p-4 lg:p-6 overflow-visible sticky top-24 z-30 ring-1 ring-slate-100">
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            
            {/* Subject Filter */}
            <div className="space-y-1.5">
               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Matière</label>
               <div className="relative">
                 <select 
                   className="w-full h-12 pl-4 pr-10 bg-slate-50 border-none rounded-lg text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500/20 appearance-none cursor-pointer"
                   value={filters.subjectId}
                   onChange={(e) => setFilters({...filters, subjectId: e.target.value})}
                 >
                    <option value="">Toutes</option>
                    {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                 </select>
                 <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
               </div>
            </div>

            {/* Stream Filter */}
            <div className="space-y-1.5">
               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Filière</label>
               <div className="relative">
                 <select 
                   className="w-full h-12 pl-4 pr-10 bg-slate-50 border-none rounded-lg text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500/20 appearance-none cursor-pointer"
                   value={filters.stream}
                   onChange={(e) => setFilters({...filters, stream: e.target.value})}
                 >
                    <option value="">Tous les flux</option>
                    {streams.map(s => <option key={s} value={s}>{s}</option>)}
                 </select>
                 <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
               </div>
            </div>

            {/* Year Filter */}
            <div className="space-y-1.5">
               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Année</label>
               <div className="relative">
                 <select 
                   className="w-full h-12 pl-4 pr-10 bg-slate-50 border-none rounded-lg text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500/20 appearance-none cursor-pointer"
                   value={filters.year}
                   onChange={(e) => setFilters({...filters, year: e.target.value})}
                 >
                    <option value="">Toutes</option>
                    {years.map(y => <option key={y} value={y}>{y}</option>)}
                 </select>
                 <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
               </div>
            </div>

            {/* Type Filter */}
            <div className="space-y-1.5">
               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Type</label>
               <div className="relative">
                 <select 
                   className="w-full h-12 pl-4 pr-10 bg-slate-50 border-none rounded-lg text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500/20 appearance-none cursor-pointer"
                   value={filters.type}
                   onChange={(e) => setFilters({...filters, type: e.target.value})}
                 >
                    <option value="">Tout</option>
                    {types.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                 </select>
                 <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
               </div>
            </div>

            <div className="flex items-end">
               <button 
                 onClick={clearFilters}
                 className="w-full h-12 flex items-center justify-center gap-2 bg-slate-900 text-white rounded-lg text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all active:scale-95"
               >
                  <X size={14} /> Réinitialiser
               </button>
            </div>
         </div>
      </Card>

      {/* 3. EXAMS GRID */}
      <div className="space-y-6">
         <div className="flex items-center justify-between">
            <h2 className="text-xl font-black text-slate-900 tracking-tight">Liste des Examens</h2>
            <p className="text-xs font-bold text-slate-400">{exams.length} résultats trouvés</p>
         </div>

         {loading ? (
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1,2,3,4,5,6].map(i => (
                <div key={i} className="flex flex-col gap-4">
                  <Skeleton className="h-48 w-full rounded-xl" />
                </div>
              ))}
           </div>
         ) : exams.length > 0 ? (
           <motion.div 
             initial="hidden"
             animate="visible"
             variants={{
               hidden: { opacity: 0 },
               visible: { 
                 opacity: 1,
                 transition: { staggerChildren: 0.05 }
               }
             }}
             className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
           >
              {exams.map((exam) => (
                <motion.div 
                  layout
                  variants={{
                    hidden: { opacity: 0, y: 20, scale: 0.95 },
                    visible: { opacity: 1, y: 0, scale: 1 }
                  }}
                  key={exam.id}
                >
                  <Card className="border-none bg-white shadow-sm hover:shadow-xl hover:shadow-indigo-50/50 transition-all rounded-xl overflow-hidden group border border-slate-50">
                    <CardContent className="p-0">
                      <div className="p-6 space-y-4">
                         <div className="flex items-center justify-between">
                            <div className="w-10 h-10 bg-indigo-50 text-indigo-600 flex items-center justify-center rounded-xl">
                               <FileText size={20} />
                            </div>
                            <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${
                               exam.type === 'correction' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'
                            }`}>
                               {exam.type === 'correction' ? 'Corrigé' : 'Sujet'}
                            </span>
                         </div>

                         <div>
                            <h3 className="text-lg font-black text-slate-900 leading-tight group-hover:text-indigo-600 transition-colors">
                               {exam.subject?.name} {exam.year}
                            </h3>
                            <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-wider">{exam.stream}</p>
                         </div>

                         <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{exam.title || 'Examen Officiel'}</span>
                            <div className="flex gap-2">
                               <a 
                                 href={exam.fileUrl} 
                                 target="_blank" 
                                 rel="noopener noreferrer"
                                 className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                                 title="Aperçu"
                               >
                                  <ExternalLink size={18} />
                               </a>
                               <a 
                                 href={exam.fileUrl} 
                                 download
                                 className="p-2 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 rounded-lg transition-all"
                                 title="Télécharger"
                               >
                                  <Download size={18} />
                               </a>
                            </div>
                         </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
           </motion.div>
         ) : (
           <div className="py-20 text-center bg-white rounded-2xl border border-dashed border-slate-200">
              <div className="w-20 h-20 bg-slate-50 text-slate-200 flex items-center justify-center rounded-full mx-auto mb-6">
                 <Search size={40} />
              </div>
              <h3 className="text-xl font-black text-slate-900 mb-2">Aucun examen trouvé</h3>
              <p className="text-slate-400 font-bold">Essayez d'ajuster vos filtres pour trouver ce que vous cherchez.</p>
              <Button onClick={clearFilters} variant="outline" className="mt-6 rounded-full font-bold">
                 Voir Tout
              </Button>
           </div>
         )}
      </div>

    </div>
  );
};

export default ExamLibrary;
