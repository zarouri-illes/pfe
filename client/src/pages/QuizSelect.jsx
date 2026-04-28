import { useState, useEffect } from 'react';
import api from '../api/client';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BookOpen, 
  Brain, 
  ChevronRight, 
  Coins, 
  Zap, 
  Play,
  Calculator,
  FlaskConical,
  GraduationCap
} from 'lucide-react';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import Skeleton from '../components/ui/skeleton';
import { useAuth } from '../hooks/useAuth';

const QuizSelect = () => {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeSubject, setActiveSubject] = useState(null);
  const { creditBalance } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api('/api/subjects');
      const data = res.data || res;
      setSubjects(data);
      if (data.length > 0) setActiveSubject(data[0].id);
    } catch (err) {
      console.error('Error fetching subjects:', err);
      setError('Impossible de charger les matières. Vérifiez votre connexion.');
    } finally {
      setLoading(false);
    }
  };

  const handleStartQuiz = async (chapterId) => {
    try {
      const res = await api('/api/quiz/start', {
        method: 'POST',
        body: JSON.stringify({ chapterId })
      });
      
      const { attemptId, questions } = res.data;
      navigate(`/quiz/${attemptId}`, { state: { questions } });
    } catch (error) {
      console.error('Failed to start quiz:', error);
      // 402 is handled by interceptor, no need to alert here
    }
  };

  const getSubjectIcon = (name) => {
    if (name.toLowerCase().includes('math')) return <Calculator size={24} />;
    if (name.toLowerCase().includes('phys')) return <FlaskConical size={24} />;
    return <GraduationCap size={24} />;
  };

  if (loading) {
     return (
       <div className="p-4 md:p-8 lg:p-10 space-y-10">
         <div className="text-center space-y-4 max-w-2xl mx-auto">
            <Skeleton className="h-8 w-48 rounded-full mx-auto" />
            <Skeleton className="h-12 w-96 rounded-lg mx-auto" />
         </div>
         <div className="flex justify-center gap-3">
            <Skeleton className="h-12 w-40 rounded-full" />
            <Skeleton className="h-12 w-40 rounded-full" />
         </div>
         <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {[1,2,3,4,5,6].map(i => <Skeleton key={i} className="h-64 rounded-2xl" />)}
         </div>
       </div>
     );
  }

  if (error) {
     return (
       <div className="p-4 md:p-8 flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center">
         <div className="w-16 h-16 bg-rose-50 text-rose-500 flex items-center justify-center rounded-2xl">
           <Brain size={32} />
         </div>
         <div>
           <h2 className="text-xl font-black text-slate-900">Erreur de Chargement</h2>
           <p className="text-slate-500 font-semibold mt-1">{error}</p>
         </div>
         <button
           onClick={fetchSubjects}
           className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-black text-sm uppercase tracking-widest hover:bg-indigo-700 transition-all"
         >
           Réessayer
         </button>
       </div>
     );
  }

  return (
    <div className="p-4 md:p-8 lg:p-10 pb-24 space-y-10">
      
      {/* 1. HEADER */}
      <section className="text-center space-y-4 max-w-2xl mx-auto">
         <motion.div 
           initial={{ opacity: 0, y: 10 }}
           animate={{ opacity: 1, y: 0 }}
           className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-600 px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest border border-indigo-100"
         >
            <Brain size={14} /> Entraînement Quotidien
         </motion.div>
         <h1 className="text-4xl lg:text-5xl font-black text-slate-900 tracking-tight">
            Prêt à relever <br/> <span className="text-indigo-600">le défi ?</span>
         </h1>
      </section>

      {/* 2. SUBJECT TABS */}
      <div className="flex flex-wrap items-center justify-center gap-3">
         {subjects.map((subject) => (
           <button
             key={subject.id}
             onClick={() => setActiveSubject(subject.id)}
             className={`px-8 py-3 rounded-full text-sm font-black transition-all flex items-center gap-3 ${
               activeSubject === subject.id 
               ? 'bg-slate-900 text-white shadow-xl shadow-slate-200' 
               : 'bg-white text-slate-500 hover:bg-slate-50 border border-slate-100'
             }`}
           >
             {getSubjectIcon(subject.name)}
             {subject.name}
           </button>
         ))}
      </div>

      {/* 3. CHAPTERS GRID */}
      <div>
         <AnimatePresence mode="wait">
            {activeSubject && (
              <motion.div
                key={activeSubject}
                exit={{ opacity: 0, x: -20 }}
                variants={{
                  hidden: { opacity: 0, x: 20 },
                  visible: { 
                    opacity: 1,
                    x: 0,
                    transition: { staggerChildren: 0.05, duration: 0.3 }
                  }
                }}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                {subjects.find(s => s.id === activeSubject)?.chapters.map((chapter) => (
                  <motion.div 
                    variants={{
                      hidden: { opacity: 0, scale: 0.95, y: 10 },
                      visible: { opacity: 1, scale: 1, y: 0 }
                    }}
                    key={chapter.id}
                  >
                    {(() => {
                      const hasQuestions = chapter._count?.questions > 0;
                      return (
                      <Card className={`border border-slate-100 rounded-2xl overflow-hidden transition-all ${hasQuestions ? 'bg-white shadow-sm hover:shadow-2xl hover:shadow-indigo-50 group border-none' : 'bg-slate-50/50 opacity-60 grayscale-[50%]'}`}>
                        <CardContent className="p-8 space-y-6">
                           <div className="flex items-center justify-between">
                              <div className={`w-12 h-12 flex items-center justify-center rounded-lg transition-transform ${hasQuestions ? 'bg-indigo-50 text-indigo-600 group-hover:scale-110' : 'bg-slate-200 text-slate-400'}`}>
                                 <BookOpen size={24} />
                              </div>
                              <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border flex items-center gap-2 ${
                                 !hasQuestions ? 'bg-slate-100 border-slate-200 text-slate-400' :
                                 creditBalance >= chapter.creditCost 
                                 ? 'bg-amber-50 text-amber-600 border-amber-100' 
                                 : 'bg-rose-50 text-rose-600 border-rose-100'
                              }`}>
                                 <Coins size={12} />
                                 {chapter.creditCost} Crédits
                              </div>
                           </div>

                           <div className="min-h-[60px]">
                              <h3 className={`text-xl font-black tracking-tight leading-tight transition-colors ${hasQuestions ? 'text-slate-800 group-hover:text-indigo-600' : 'text-slate-500'}`}>
                                 {chapter.name}
                              </h3>
                              {!hasQuestions && <p className="text-xs font-bold text-rose-500 mt-1">À venir prochainement</p>}
                           </div>

                           <div className="pt-6 border-t border-slate-50 flex items-center gap-3">
                              <Button 
                                className={`flex-grow h-12 text-white rounded-lg text-xs font-black uppercase tracking-widest shadow-none transition-all ${
                                  hasQuestions 
                                  ? 'bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-100 group-hover:px-8' 
                                  : 'bg-slate-300 hover:bg-slate-300 cursor-not-allowed'
                                }`}
                                onClick={hasQuestions ? () => handleStartQuiz(chapter.id) : undefined}
                                disabled={!hasQuestions || creditBalance < chapter.creditCost}
                              >
                                 {!hasQuestions ? 'Indisponible' : creditBalance < chapter.creditCost ? 'Fonds Insuffisants' : 'Commencer'} 
                                 {hasQuestions && <Play size={14} className="ml-2 fill-white" />}
                              </Button>
                              <div className={`w-12 h-12 flex items-center justify-center rounded-lg transition-colors ${hasQuestions ? 'bg-slate-50 text-slate-400 group-hover:text-indigo-600' : 'bg-slate-100 text-slate-400'}`}>
                                 <Zap size={18} />
                              </div>
                           </div>
                        </CardContent>
                      </Card>
                      );
                    })()}
                  </motion.div>
                ))}
              </motion.div>
            )}
         </AnimatePresence>
      </div>

    </div>
  );
};

export default QuizSelect;
