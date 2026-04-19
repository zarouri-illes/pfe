import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import api from '../../api/client';
import { motion } from 'framer-motion';
import { 
  Users, 
  HelpCircle, 
  FileText, 
  TrendingUp,
  Award,
  BookOpen,
  Calendar,
  ArrowUpRight,
  Zap,
  MoreVertical,
  ChevronDown
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const { token } = useContext(AuthContext);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api('/api/admin/stats');
        setStats(res.data);
      } catch (error) {
        console.error('Error fetching admin stats:', error);
      } finally {
        setTimeout(() => setLoading(false), 500);
      }
    };
    fetchStats();
  }, []);

  if (loading) return (
    <div className="space-y-6 animate-pulse">
      <div className="flex justify-between items-center mb-8">
        <div className="h-8 w-48 bg-slate-200 rounded-lg"></div>
        <div className="h-10 w-32 bg-slate-200 rounded-lg"></div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {[1, 2, 3, 4].map(i => <div key={i} className="h-28 bg-slate-100 rounded-xl border border-slate-200"></div>)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-10">
        <div className="lg:col-span-2 h-96 bg-slate-100 rounded-xl"></div>
        <div className="h-96 bg-slate-100 rounded-xl"></div>
      </div>
    </div>
  );

  const statCards = [
    { title: 'Étudiants Actifs', value: stats?.totalStudents, icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/10', trend: 'Utilisateurs' },
    { title: 'Base de Questions', value: stats?.totalQuestions, icon: HelpCircle, color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/10', trend: 'Contenu' },
    { title: 'Bibliothèque PDF', value: stats?.totalExams, icon: FileText, color: 'text-indigo-500', bg: 'bg-indigo-500/10', border: 'border-indigo-500/10', trend: 'Bac Exams' },
    { title: 'Revenu Total', value: `${stats?.totalRevenue?.toLocaleString()} DA`, icon: TrendingUp, color: 'text-blue-600', bg: 'bg-blue-600/10', border: 'border-blue-600/10', trend: 'Monétisation' },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8 pb-10"
    >
      {/* Professional Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Tableau de Bord</h1>
          <nav className="flex items-center gap-2 mt-1.5 text-xs font-bold text-slate-400">
             <span className="hover:text-blue-500 cursor-pointer">Admin</span>
             <ChevronDown size={12} className="-rotate-90" />
             <span className="text-slate-600">Analytics</span>
          </nav>
        </div>
        <div className="flex items-center gap-3">
           <div className="text-right mr-2 hidden sm:block">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Dernière Sync</p>
              <p className="text-xs font-bold text-slate-700 mt-1">À l'instant</p>
           </div>
           <button className="flex items-center gap-2 px-5 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-xs font-bold hover:bg-slate-50 transition-colors shadow-sm">
             <Calendar size={14} />
             30 derniers jours
           </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, index) => (
          <Card key={index} className="border border-slate-200/60 shadow-sm rounded-xl overflow-hidden hover:border-slate-300 transition-all duration-200 bg-white">
            <CardContent className="p-5 flex items-center gap-4">
              <div className={`${card.bg} ${card.color} w-12 h-12 flex items-center justify-center rounded-xl shrink-0`}>
                <card.icon size={22} />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">{card.title}</p>
                <h3 className="text-xl font-black text-slate-900 tracking-tight truncate">{card.value}</h3>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Revenue Area Chart */}
        <Card className="lg:col-span-2 border border-slate-200/60 shadow-sm rounded-xl overflow-hidden bg-white">
          <CardHeader className="p-6 border-b border-slate-100 flex flex-row items-center justify-between bg-slate-50/30">
            <div>
              <CardTitle className="text-base font-black text-slate-900 tracking-tight">Évolution du Revenu</CardTitle>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.1em] mt-0.5">Ventes de packs crédits (30j)</p>
            </div>
            <button className="text-slate-400 hover:text-slate-600"><MoreVertical size={16} /></button>
          </CardHeader>
          <CardContent className="p-6">
            <div className="h-[320px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats?.revenueHistory?.length > 0 ? stats.revenueHistory : [{name: 'Empty', amountDa: 0}]} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} dy={10} hide={stats?.revenueHistory?.length === 0} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px' }} />
                  <Area type="monotone" dataKey="amountDa" stroke="#2563eb" strokeWidth={2.5} fillOpacity={1} fill="url(#revenueGradient)" />
                </AreaChart>
              </ResponsiveContainer>
              {stats?.revenueHistory?.length === 0 && <div className="text-center py-20 text-slate-300 font-bold text-sm italic">Aucune transaction ce mois-ci</div>}
            </div>
          </CardContent>
        </Card>

        {/* Breakdown Card */}
        <Card className="border border-slate-200/60 shadow-sm rounded-xl overflow-hidden bg-white">
          <CardHeader className="p-6 border-b border-slate-100 bg-slate-50/30">
            <CardTitle className="text-base font-black text-slate-900 tracking-tight">Distribution Questions</CardTitle>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.1em] mt-0.5">Par matière disponible</p>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              {stats?.subjectStats?.map((subject, idx) => (
                <div key={idx} className="space-y-2">
                  <div className="flex justify-between text-xs font-bold text-slate-600">
                    <span>{subject.name}</span>
                    <span>{subject.questionCount}</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      whileInView={{ width: `${(subject.questionCount / (stats.totalQuestions || 1)) * 100}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                      className="h-full bg-blue-500 rounded-full"
                    />
                  </div>
                </div>
              ))}
              {(!stats?.subjectStats || stats.subjectStats.length === 0) && (
                <p className="text-center py-10 text-slate-300 italic text-sm">Aucune matière avec questions configurée</p>
              )}
            </div>
            
            {/* Top Chapter small highlight */}
            <div className="mt-10 p-4 bg-slate-50 rounded-xl border border-slate-100">
              <div className="flex items-center gap-3 mb-3">
                 <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-amber-600">
                   <Zap size={16} fill="currentColor" />
                 </div>
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Chapitre Vedette</p>
              </div>
              <h4 className="text-sm font-black text-slate-900 truncate">{stats?.mostAttemptedChapter?.name || '---'}</h4>
              <p className="text-xs font-bold text-blue-600 mt-1">{stats?.mostAttemptedChapter?.attemptCount || 0} tentatives</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activity Monitor Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border border-slate-200/60 shadow-sm rounded-xl overflow-hidden bg-white px-2">
          <CardHeader className="p-6 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-black text-slate-900 tracking-tight">Activité Quotidienne</CardTitle>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.1em] mt-0.5">Volume de tentatives (7j)</p>
            </div>
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>
          </CardHeader>
          <CardContent className="h-[250px]">
             <ResponsiveContainer width="100%" height="100%">
               <BarChart data={stats?.activityHistory || []}>
                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                 <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontStyle: 'bold' }} hide={stats?.activityHistory?.length === 0} />
                 <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '10px' }} />
                 <Bar dataKey="count" fill="#2563eb" radius={[4, 4, 0, 0]} barSize={24} />
               </BarChart>
             </ResponsiveContainer>
             {(!stats?.activityHistory || stats.activityHistory.length === 0) && (
               <div className="text-center py-10 text-slate-300 italic text-sm">Aucune activité enregistrée récemment</div>
             )}
          </CardContent>
        </Card>

        {/* System Health / Quick Stats */}
        <div className="grid grid-cols-2 gap-4">
           <div className="bg-slate-900 rounded-xl p-6 text-white flex flex-col justify-between overflow-hidden relative">
              <div className="relative z-10">
                <BookOpen className="text-blue-500 mb-4" size={24} />
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">Total Exams</p>
                <h4 className="text-2xl font-black">{stats?.totalExams}</h4>
              </div>
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <FileText size={80} />
              </div>
              <div className="mt-4 flex items-center gap-1.5 text-[#10b981] text-[10px] font-black uppercase tracking-widest">
                <ArrowUpRight size={12} />
                <span>+2 cette semaine</span>
              </div>
           </div>
           
           <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between shadow-sm">
              <div>
                <Award className="text-amber-500 mb-4" size={24} />
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Monétisation</p>
                <h4 className="text-2xl font-black text-slate-900">{stats?.totalRevenue}</h4>
              </div>
              <button onClick={() => window.location.href='/admin/packs'} className="w-full mt-4 py-2 bg-slate-50 border border-slate-100 rounded-lg text-slate-700 text-[10px] font-black uppercase tracking-wider hover:bg-slate-100 transition-colors">
                Gérer Packs
              </button>
           </div>

           <Card className="col-span-2 bg-gradient-to-r from-blue-600 to-indigo-700 border-none rounded-xl p-6 text-white flex items-center justify-between shadow-lg shadow-blue-900/10">
              <div className="space-y-2">
                <h3 className="text-lg font-black tracking-tight">Nouveaux Contenus</h3>
                <p className="text-blue-100 text-xs font-semibold max-w-[200px]">Optimisez l'engagement en ajoutant des quiz hebdomadaires.</p>
              </div>
              <button onClick={() => window.location.href='/admin/questions'} className="px-6 py-2.5 bg-white text-blue-600 rounded-lg text-xs font-black shadow-xl hover:scale-105 transition-transform">
                Nouveau Quiz
              </button>
           </Card>
        </div>
      </div>
    </motion.div>
  );
};

export default AdminDashboard;
