import { useState, useEffect } from 'react';
import { useLocation, useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Trophy, 
  XCircle, 
  CheckCircle2, 
  ArrowLeft, 
  RotateCcw,
  BookOpen, 
  Zap,
  TrendingUp,
  Layout,
  Loader2
} from 'lucide-react';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import Skeleton from '../components/ui/skeleton';
import LatexRenderer from '../components/LatexRenderer';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import api from '../api/client';

const QuizResults = () => {
  const { attemptId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  // Try to restore from router state first (fast path: coming directly from quiz)
  // Fall back to a fresh API fetch on page refresh
  const stateResults = location.state?.results?.data || location.state?.results;
  const [results, setResults] = useState(stateResults || null);
  const [loading, setLoading] = useState(!stateResults);
  const [fetchError, setFetchError] = useState(null);

  useEffect(() => {
    if (stateResults || results) return; // already have data
    const fetchResults = async () => {
      try {
        const res = await api(`/api/quiz/${attemptId}/results`);
        setResults(res.data);
      } catch (err) {
        setFetchError(err.message || 'Impossible de charger les résultats.');
      } finally {
        setLoading(false);
      }
    };
    fetchResults();
  }, [attemptId]);

  if (loading) {
    return (
      <div className="p-4 md:p-8 lg:p-10 space-y-8">
        <Skeleton className="h-72 w-full rounded-[3rem]" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (fetchError || !results) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
        <XCircle size={48} className="text-rose-500 mb-4" />
        <h1 className="text-2xl font-black text-slate-900">Résultats Introuvables</h1>
        <p className="text-slate-500 font-bold mt-2">{fetchError || 'Veuillez retourner au tableau de bord.'}</p>
        <Button onClick={() => navigate('/dashboard')} className="mt-8 rounded-full">
           Retourner au Dashboard
        </Button>
      </div>
    );
  }

  const { score, maxScore, percentage, breakdown } = results;

  const chartData = [
    { name: 'Correct', value: score, color: '#10b981' },
    { name: 'Incorrect', value: maxScore - score, color: '#f1f5f9' }
  ];

  const getPerformanceMessage = (p) => {
    if (p >= 90) return { title: "Maître du Sujet !", sub: "Une performance exceptionnelle. Vous êtes prêt pour le Bac.", icon: Trophy, color: "text-amber-500" };
    if (p >= 70) return { title: "Excellent Travail", sub: "Vous maîtrisez bien les concepts clés. Continuez ainsi.", icon: Zap, color: "text-emerald-500" };
    if (p >= 50) return { title: "Bon Début", sub: "Les bases sont là, mais quelques points méritent une révision.", icon: TrendingUp, color: "text-indigo-500" };
    return { title: "En Apprentissage", sub: "Ne vous découragez pas ! L'erreur est une étape du succès.", icon: BookOpen, color: "text-rose-500" };
  };

  const message = getPerformanceMessage(percentage);

  return (
    <div className="p-4 md:p-8 lg:p-10 pb-24 space-y-12">
      
      {/* 1. SCORE OVERVIEW */}
      <section className="relative overflow-hidden rounded-[3rem] bg-slate-900 p-8 lg:p-14 text-white shadow-2xl">
         <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            
            <div className="space-y-6 text-center lg:text-left">
               <motion.div 
                 initial={{ opacity: 0, scale: 0.9 }}
                 animate={{ opacity: 1, scale: 1 }}
                 className={`inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border border-white/10 ${message.color}`}
               >
                  <message.icon size={14} /> {message.title}
               </motion.div>
               <h1 className="text-4xl lg:text-5xl font-black tracking-tight leading-tight">
                  Voici votre <br/> <span className="text-indigo-400">Score Final.</span>
               </h1>
               <p className="text-slate-400 font-bold text-lg max-w-md mx-auto lg:mx-0">
                  {message.sub}
               </p>
               <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-4">
                  <Button onClick={() => navigate('/quiz')} className="h-12 px-8 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-black uppercase tracking-widest text-[10px]">
                     Nouveau Quiz
                  </Button>
                  <Button variant="ghost" onClick={() => navigate('/dashboard')} className="h-12 px-8 bg-white/5 hover:bg-white/10 text-white rounded-lg font-black uppercase tracking-widest text-[10px]">
                     Tableau de Bord
                  </Button>
               </div>
            </div>

            <div className="flex justify-center items-center relative">
               <div className="w-64 h-64 lg:w-80 lg:h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        innerRadius="75%"
                        outerRadius="100%"
                        paddingAngle={5}
                        dataKey="value"
                        stroke="none"
                      >
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ borderRadius: '16px', border: 'none', color: '#000' }} 
                        itemStyle={{ color: '#000', fontWeight: 'bold' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
               </div>
               <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-6xl lg:text-7xl font-black">{percentage}%</span>
                  <span className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] mt-2">Précision</span>
               </div>
            </div>

         </div>

         {/* Abstract background elements */}
         <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
         <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl" />
      </section>

      {/* 2. STATS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         <Card className="border-none bg-white shadow-sm rounded-xl p-8 border border-slate-50">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Points Obtenus</p>
            <div className="flex items-center justify-between">
               <span className="text-3xl font-black text-slate-900">{score} / {maxScore}</span>
               <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                  <Trophy size={18} />
               </div>
            </div>
         </Card>
         <Card className="border-none bg-white shadow-sm rounded-xl p-8 border border-slate-50">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Statut</p>
            <div className="flex items-center justify-between">
               <span className="text-xl font-black text-slate-900 uppercase tracking-tight">Soumis ✅</span>
               <div className="w-10 h-10 bg-slate-50 text-slate-400 rounded-xl flex items-center justify-center">
                  <Layout size={18} />
               </div>
            </div>
         </Card>
      </div>

      {/* 3. DETAILED BREAKDOWN */}
      <section className="space-y-8">
         <div className="flex items-center justify-between">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Analyse Question par Question</h2>
            <div className="flex items-center gap-4 text-xs font-bold">
               <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Correct</div>
               <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Incorrect</div>
            </div>
         </div>

         <div className="space-y-6">
            {breakdown.map((item, idx) => (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                key={item.questionId || idx}
              >
                <Card className={`border-none ${item.isCorrect ? 'bg-emerald-50/20' : 'bg-rose-50/20'} rounded-xl overflow-hidden transition-all hover:shadow-md`}>
                   <CardContent className="p-0">
                      <div className="p-8 lg:p-10 flex flex-col lg:flex-row gap-8">
                         
                         <div className="shrink-0">
                            <div className={`w-14 h-14 rounded-lg flex items-center justify-center font-black text-lg ${
                               item.isCorrect ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'
                            }`}>
                               {item.isCorrect ? <CheckCircle2 size={28} /> : <XCircle size={28} />}
                            </div>
                         </div>

                         <div className="flex-grow space-y-6">
                            <div>
                               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Question {idx + 1}</p>
                               <div className="text-lg font-bold text-slate-800 leading-snug">
                                 <LatexRenderer content={item.content} />
                               </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                               <div className="p-4 bg-white rounded-lg border border-slate-100 shadow-sm">
                                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Votre Réponse</p>
                                  <div className={`text-sm font-black ${item.isCorrect ? 'text-emerald-600' : 'text-rose-600'}`}>
                                     <LatexRenderer content={item.studentAnswer || '(Aucune réponse)'} />
                                  </div>
                               </div>
                               {!item.isCorrect && (
                                 <div className="p-4 bg-white rounded-lg border border-emerald-100 shadow-sm ring-1 ring-emerald-50">
                                    <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1.5">Solution Correcte</p>
                                    <div className="text-sm font-black text-emerald-600">
                                       <LatexRenderer content={item.correctAnswer} />
                                    </div>
                                 </div>
                               )}
                            </div>
                         </div>

                         <div className="lg:w-32 lg:text-right shrink-0">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Score</p>
                            <p className="text-2xl font-black text-slate-900">{item.score} <span className="text-xs text-slate-400">/ {item.maxPoints}</span></p>
                         </div>
                      </div>
                   </CardContent>
                </Card>
              </motion.div>
            ))}
         </div>
      </section>

      {/* 4. FINAL CTA */}
      <div className="text-center py-10">
         <Button 
           onClick={() => navigate('/dashboard')}
           variant="outline" 
           className="h-14 px-12 rounded-full font-black text-slate-700 uppercase tracking-widest text-xs gap-3 hover:bg-slate-50 border-slate-200 transition-all active:scale-95 shadow-lg shadow-slate-100"
         >
            <ArrowLeft size={16} /> Retour au Dashboard
         </Button>
      </div>

    </div>
  );
};

export default QuizResults;
