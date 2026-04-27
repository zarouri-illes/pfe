import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import { motion } from 'framer-motion';
import { 
  Target, 
  Zap, 
  Calendar, 
  ChevronRight, 
  Trophy, 
  Clock, 
  BookOpen, 
  ArrowUpRight,
  BrainCircuit,
  PieChart as PieChartIcon,
  Activity as ActivityIcon
} from 'lucide-react';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import Skeleton from '../components/ui/skeleton';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await api('/api/dashboard');
        setData(res.data || res);
      } catch (error) {
        console.error('Error fetching dashboard:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="p-4 md:p-8 lg:p-10 space-y-10">
        {/* Header Skeleton */}
        <Skeleton className="h-64 md:h-72 w-full rounded-xl" />
        
        {/* Metrics Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-44 rounded-xl" />
          <Skeleton className="h-44 rounded-xl" />
          <Skeleton className="h-44 rounded-xl" />
        </div>

        {/* Chart & AI Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <Skeleton className="lg:col-span-2 h-[500px] rounded-lg" />
          <div className="space-y-8">
            <Skeleton className="h-56 rounded-lg" />
            <Skeleton className="h-64 rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  const { daysUntilBac, recentAttempts, chapterStats, weakestChapters, recommendations } = data;

  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: { 
          opacity: 1,
          transition: { staggerChildren: 0.1 }
        }
      }}
      className="p-4 md:p-8 lg:p-10 pb-24 space-y-10"
    >
      
      {/* 1. WELCOME & COUNTDOWN HEADER */}
      <motion.section 
        variants={{
          hidden: { opacity: 0, y: 20 },
          visible: { opacity: 1, y: 0 }
        }}
        className="relative overflow-hidden rounded-lg bg-indigo-600 p-8 lg:p-12 text-white shadow-2xl shadow-indigo-200"
      >
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div className="space-y-4">
             <motion.div 
               initial={{ opacity: 0, x: -20 }}
               animate={{ opacity: 1, x: 0 }}
               className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest border border-white/10"
             >
                <Trophy size={14} className="text-amber-400" />
                Objectif Bac 2026
             </motion.div>
             <h1 className="text-4xl lg:text-5xl font-black tracking-tight leading-[1.1]">
                Bonjour, {data.user?.name} ! <br/>
                <span className="text-indigo-200">Prêt pour une session ?</span>
             </h1>
          </div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="flex items-center gap-6 bg-white/5 backdrop-blur-xl p-6 lg:p-8 rounded-xl border border-white/10 shadow-inner"
          >
             <div className="text-center">
                <span className="block text-5xl lg:text-6xl font-black mb-1">{daysUntilBac}</span>
                <span className="text-[10px] font-black uppercase tracking-widest text-indigo-200">Jours Restants</span>
             </div>
             <div className="w-px h-16 bg-white/10" />
             <div className="max-w-[140px]">
                <p className="text-xs font-bold leading-relaxed text-indigo-100">
                   Le compte à rebours est lancé. Chaque minute compte !
                </p>
             </div>
          </motion.div>
        </div>
        
        {/* Abstract background elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-400/20 rounded-full translate-y-1/2 -translate-x-1/4 blur-2xl" />
      </motion.section>

      {/* 2. CORE METRICS */}
      <motion.div 
        variants={{
          hidden: { opacity: 0 },
          visible: { 
            opacity: 1,
            transition: { staggerChildren: 0.1 }
          }
        }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        <motion.div variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }}>
          <Card className="border-none bg-white shadow-sm rounded-xl p-8 hover:shadow-xl hover:shadow-indigo-50/50 transition-all border border-slate-50 h-full">
            <div className="flex items-center justify-between mb-6">
                <div className="w-12 h-12 bg-indigo-50 text-indigo-600 flex items-center justify-center rounded-xl">
                    <Zap size={24} />
                </div>
                <Link to="/credits">
                  <Button variant="ghost" className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:bg-indigo-50 rounded-full px-4">
                    Recharger
                  </Button>
                </Link>
            </div>
            <div className="space-y-1">
                <p className="text-3xl font-black text-slate-900">{data.user?.creditBalance}</p>
                <p className="text-sm font-bold text-slate-400">Crédits d'étude</p>
            </div>
          </Card>
        </motion.div>

        <motion.div variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }}>
          <Card className="border-none bg-white shadow-sm rounded-xl p-8 hover:shadow-xl hover:shadow-emerald-50/50 transition-all border border-slate-50 h-full">
            <div className="flex items-center justify-between mb-6">
                <div className="w-12 h-12 bg-emerald-50 text-emerald-600 flex items-center justify-center rounded-xl">
                    <Target size={24} />
                </div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Précision</span>
            </div>
            <div className="space-y-1">
                <p className="text-3xl font-black text-slate-900">
                  {chapterStats.length > 0 
                    ? Math.round(chapterStats.reduce((acc, c) => acc + c.averagePercentage, 0) / chapterStats.length)
                    : 0}%
                </p>
                <p className="text-sm font-bold text-slate-400">Score moyen global</p>
            </div>
          </Card>
        </motion.div>

        <motion.div variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }} className="md:col-span-2 lg:col-span-1">
          <Card className="border-none bg-white shadow-sm rounded-xl p-8 hover:shadow-xl hover:shadow-amber-50/50 transition-all border border-slate-50 h-full">
            <div className="flex items-center justify-between mb-6">
                <div className="w-12 h-12 bg-amber-50 text-amber-600 flex items-center justify-center rounded-xl">
                    <ActivityIcon size={24} />
                </div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Activité</span>
            </div>
            <div className="space-y-1">
                <p className="text-3xl font-black text-slate-900">{recentAttempts.length}</p>
                <p className="text-sm font-bold text-slate-400">Quiz complétés</p>
            </div>
          </Card>
        </motion.div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        
        {/* 3. PERFORMANCE CHART */}
        <motion.div 
          variants={{ hidden: { opacity: 0, x: -20 }, visible: { opacity: 1, x: 0 } }}
          className="lg:col-span-2"
        >
          <Card className="border-none bg-white shadow-sm rounded-lg overflow-hidden p-8 lg:p-10 h-full">
            <div className="flex items-center justify-between mb-10">
              <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Analyse par Chapitre</h2>
                <p className="text-sm font-bold text-slate-400 mt-1">Vos performances détaillées</p>
              </div>
              <div className="w-12 h-12 bg-slate-50 text-slate-400 flex items-center justify-center rounded-xl">
                 <PieChartIcon size={20} />
              </div>
            </div>

            <div className="h-[350px] min-h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chapterStats} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="chapterName" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
                  />
                  <Tooltip 
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px' }}
                  />
                  <Bar dataKey="averagePercentage" radius={[6, 6, 0, 0]} barSize={35}>
                     {chapterStats.map((entry, index) => (
                       <Cell key={`cell-${index}`} fill={entry.averagePercentage > 70 ? '#10b981' : entry.averagePercentage > 50 ? '#6366f1' : '#f43f5e'} />
                     ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </motion.div>

        {/* 4. AI INSIGHTS & WEAKNESSES */}
        <motion.div 
          variants={{ hidden: { opacity: 0, x: 20 }, visible: { opacity: 1, x: 0 } }}
          className="space-y-8"
        >
           <Card className="border-none bg-gradient-to-br from-slate-900 to-slate-800 text-white shadow-2xl rounded-lg p-8 relative overflow-hidden">
              <div className="relative z-10 space-y-6">
                 <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-500/20 text-indigo-400 flex items-center justify-center rounded-xl backdrop-blur-md border border-white/5">
                       <BrainCircuit size={20} />
                    </div>
                    <h3 className="text-lg font-black tracking-tight">Conseils du Mentor IA</h3>
                 </div>
                 
                 <p className="text-sm font-medium leading-relaxed text-slate-300 italic">
                    "{recommendations}"
                 </p>

                 <div className="pt-4 border-t border-white/10">
                    <div className="flex items-center justify-between">
                       <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Mise à jour</span>
                       <span className="text-[10px] font-black text-indigo-400 uppercase">Instantané</span>
                    </div>
                 </div>
              </div>
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
           </Card>

           <Card className="border-none bg-white shadow-sm rounded-lg p-8 border border-slate-50">
              <h3 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2">
                 <Target size={18} className="text-rose-500" />
                 Points de Vigilance
              </h3>
              <div className="space-y-4">
                 {weakestChapters.length > 0 ? weakestChapters.map((ch, i) => (
                   <div key={i} className="flex items-center justify-between p-4 bg-rose-50/50 rounded-xl border border-rose-100/50 transition-transform hover:scale-[1.02]">
                      <div>
                         <p className="text-sm font-bold text-slate-900">{ch.chapterName}</p>
                         <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest mt-0.5">Moyenne: {ch.averagePercentage}%</p>
                      </div>
                      <ChevronRight size={16} className="text-rose-300" />
                   </div>
                 )) : (
                   <div className="text-center py-6 text-slate-400 font-bold italic text-sm">
                      D'excellents résultats partout ! 🎉
                   </div>
                 )}
              </div>
           </Card>
        </motion.div>
      </div>

      {/* 5. RECENT ACTIVITY LIST */}
      <motion.section 
        variants={{ hidden: { opacity: 0 }, visible: { opacity: 1 } }}
        className="space-y-6"
      >
         <div className="flex items-center justify-between">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Activités Récentes</h2>
            <button className="text-xs font-black text-indigo-600 uppercase tracking-widest flex items-center gap-1 hover:gap-2 transition-all">
               Voir Tout <ChevronRight size={14} />
            </button>
         </div>

         <motion.div 
           variants={{
             hidden: { opacity: 0 },
             visible: { 
               opacity: 1,
               transition: { staggerChildren: 0.05 }
             }
           }}
           className="grid grid-cols-1 md:grid-cols-2 gap-4"
         >
            {recentAttempts.map((attempt) => (
              <motion.div key={attempt.id} variants={{ hidden: { opacity: 0, scale: 0.95 }, visible: { opacity: 1, scale: 1 } }}>
                <Card className="border-none bg-white shadow-sm rounded-xl p-6 hover:shadow-md transition-all group overflow-hidden border border-slate-50">
                  <div className="flex items-center gap-5">
                      <div className={`w-14 h-14 shrink-0 rounded-xl flex items-center justify-center font-black text-lg ${
                        attempt.percentage >= 70 ? 'bg-emerald-50 text-emerald-600' : 'bg-indigo-50 text-indigo-600'
                      }`}>
                        {attempt.percentage}%
                      </div>
                      <div className="flex-grow min-w-0">
                        <h4 className="text-base font-bold text-slate-900 truncate">{attempt.chapterName}</h4>
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest mt-0.5">{attempt.subjectName}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs font-bold text-slate-700">{new Date(attempt.submittedAt).toLocaleDateString()}</p>
                        <div className="flex items-center justify-end gap-1 mt-1 text-[10px] font-black text-emerald-500 uppercase">
                            <Trophy size={10} /> +{attempt.percentage} XP
                        </div>
                      </div>
                  </div>
                </Card>
              </motion.div>
            ))}

            {recentAttempts.length === 0 && (
              <div className="col-span-full py-16 text-center bg-white rounded-lg border border-dashed border-slate-200">
                 <BookOpen className="mx-auto text-slate-200 mb-4" size={48} />
                 <p className="text-slate-400 font-bold uppercase tracking-widest">Aucune activité récente</p>
                 <button className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-full text-xs font-black uppercase tracking-widest shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all">
                    Commencer à Réviser
                 </button>
              </div>
            )}
         </motion.div>
      </motion.section>

    </motion.div>
  );
};

export default Dashboard;
