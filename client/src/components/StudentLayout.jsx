import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { 
  LayoutDashboard, 
  BookOpen, 
  Brain, 
  ShoppingCart, 
  LogOut,
  ChevronRight,
  Menu,
  X,
  Coins,
  Stars
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const StudentLayout = () => {
  const { logout, user, creditBalance } = useAuth();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Close mobile menu on navigation
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [navigate]);

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Bibliothèque', path: '/exams', icon: BookOpen },
    { name: 'Entraînement', path: '/quiz', icon: Brain },
    { name: 'Boutique', path: '/credits', icon: ShoppingCart },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex min-h-screen bg-[#f8fafc] overflow-x-hidden">
      {/* Mobile Backdrop */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileMenuOpen(false)}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-[70] w-68 bg-[#ffffff] text-slate-600 flex flex-col shadow-2xl transition-transform duration-300 lg:translate-x-0 border-r border-slate-100
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-7 mb-4 flex items-center justify-between">
          <NavLink to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-indigo-100">
              BP
            </div>
            <div>
              <h1 className="text-lg font-black text-slate-900 tracking-tight leading-none">BacPrep</h1>
              <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-[0.2em] font-black">Student Portal</p>
            </div>
          </NavLink>
          <button onClick={() => setIsMobileMenuOpen(false)} className="lg:hidden p-2 text-slate-400 hover:text-slate-900">
            <X size={20} />
          </button>
        </div>

        {/* Credit Display in Sidebar */}
        <div className="px-6 mb-8">
           <div className="bg-indigo-50 rounded-xl p-5 border border-indigo-100/50 relative overflow-hidden group">
              <div className="relative z-10">
                 <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1.5">Énergie Actuelle</p>
                 <div className="flex items-center gap-2">
                    <Coins size={20} className="text-amber-500 fill-amber-500/20" />
                    <span className="text-2xl font-black text-indigo-900">{creditBalance}</span>
                    <span className="text-xs font-bold text-indigo-400 uppercase">Crédits</span>
                 </div>
              </div>
              <Stars size={40} className="absolute -bottom-2 -right-2 text-indigo-100 opacity-50 group-hover:scale-110 transition-transform" />
           </div>
        </div>

        <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto custom-scrollbar">
          <p className="px-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4 mt-2">Menu Révision</p>
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `
                flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 group
                ${isActive 
                  ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100' 
                  : 'text-slate-500 hover:bg-slate-50 hover:text-indigo-600'}
              `}
            >
              {({ isActive }) => (
                <>
                  <div className="flex items-center gap-3">
                    <item.icon size={20} className={isActive ? 'text-white' : 'text-slate-400 group-hover:text-indigo-600'} />
                    <span className="text-sm font-black tracking-tight">{item.name}</span>
                  </div>
                  {isActive && <ChevronRight size={14} className="text-white/50" />}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 mt-auto">
          <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 mb-4">
            <div className="flex items-center gap-3">
               <div className="w-9 h-9 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center font-black uppercase text-xs">
                 {user?.name?.[0] || 'S'}
               </div>
               <div className="overflow-hidden">
                 <p className="text-xs font-black text-slate-900 truncate">{user?.name}</p>
                 <p className="text-[10px] font-bold text-slate-400 truncate tracking-tight">{user?.email}</p>
               </div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all font-black text-xs uppercase tracking-widest"
          >
            <LogOut size={18} />
            <span>Se déconnecter</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 w-full lg:ml-68 transition-all duration-300">
        {/* Mobile Header Toggle */}
        <div className="lg:hidden sticky top-0 z-[40] bg-white/80 backdrop-blur-md border-b border-slate-100 p-4 flex items-center justify-between">
           <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-black text-sm shadow-md shadow-indigo-100">
                BP
              </div>
              <span className="font-black text-slate-900 tracking-tight">BacPrep Hub</span>
           </div>
           <button 
             onClick={() => setIsMobileMenuOpen(true)}
             className="p-2 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-xl hover:bg-indigo-100 transition-colors shadow-sm"
           >
             <Menu size={20} />
           </button>
        </div>

        <div className="h-full min-h-screen">
            <Outlet />
        </div>
      </main>
    </div>
  );
};

export default StudentLayout;
