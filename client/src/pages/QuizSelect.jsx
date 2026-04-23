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
import { useAuth } from '../hooks/useAuth';

const QuizSelect = () => {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSubject, setActiveSubject] = useState(null);
  const { creditBalance } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    try {
      setLoading(true);
      const res = await api('/api/subjects');
      const data = res.data || res;
      setSubjects(data);
      if (data.length > 0) setActiveSubject(data[0].id);
    } catch (error) {
      console.error('Error fetching subjects:', error);
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
       <div className="max-w-7xl mx-auto px-6 py-12 space-y-8 animate-pulse">
         <div className="h-20 bg-slate-100 rounded-xl w-64 mx-auto" />
         <div className="grid grid-cols-1 md:grid-cols-4 gap-4 h-12" />
         <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {[1,2,3,4,5,6].map(i => <div key={i} className="h-56 bg-slate-100 rounded-xl" />)}
         </div>
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
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                {subjects.find(s => s.id === activeSubject)?.chapters.map((chapter) => (
                  <Card key={chapter.id} className="border-none bg-white shadow-sm hover:shadow-2xl hover:shadow-indigo-50 transition-all rounded-2xl overflow-hidden group border border-slate-50">
                    <CardContent className="p-8 space-y-6">
                       <div className="flex items-center justify-between">
                          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 flex items-center justify-center rounded-lg group-hover:scale-110 transition-transform">
                             <BookOpen size={24} />
                          </div>
                          <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border flex items-center gap-2 ${
                             creditBalance >= chapter.creditCost 
                             ? 'bg-amber-50 text-amber-600 border-amber-100' 
                             : 'bg-rose-50 text-rose-600 border-rose-100'
                          }`}>
                             <Coins size={12} />
                             {chapter.creditCost} Crédits
                          </div>
                       </div>

                       <div className="min-h-[60px]">
                          <h3 className="text-xl font-black text-slate-800 tracking-tight leading-tight group-hover:text-indigo-600 transition-colors">
                             {chapter.name}
                          </h3>
                       </div>

                       <div className="pt-6 border-t border-slate-50 flex items-center gap-3">
                          <Button 
                            className="flex-grow h-12 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-black uppercase tracking-widest shadow-lg shadow-indigo-100 group-hover:px-8 transition-all"
                            onClick={() => handleStartQuiz(chapter.id)}
                            disabled={creditBalance < chapter.creditCost}
                          >
                             {creditBalance < chapter.creditCost ? 'Fonds Insuffisants' : 'Commencer'} <Play size={14} className="ml-2 fill-white" />
                          </Button>
                          <div className="w-12 h-12 bg-slate-50 flex items-center justify-center rounded-lg text-slate-400 group-hover:text-indigo-600 transition-colors">
                             <Zap size={18} />
                          </div>
                       </div>
                    </CardContent>
                  </Card>
                ))}
              </motion.div>
            )}
         </AnimatePresence>
      </div>

    </div>
  );
};

export default QuizSelect;
