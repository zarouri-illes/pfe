import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  FileText, 
  HelpCircle, 
  CreditCard, 
  LogOut,
  ChevronRight
} from 'lucide-react';

const AdminLayout = () => {
  const { logout, user } = useContext(AuthContext);
  const navigate = useNavigate();

  const navItems = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Examens', path: '/admin/exams', icon: FileText },
    { name: 'Questions', path: '/admin/questions', icon: HelpCircle },
    { name: 'Packs Credits', path: '/admin/packs', icon: CreditCard },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex min-h-screen bg-[#f8fafc]">
      {/* Sidebar */}
      <aside className="w-68 bg-[#0f172a] text-slate-300 flex flex-col fixed inset-y-0 z-50 shadow-xl transition-all duration-300">
        <div className="p-7 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-blue-900/20">
              BP
            </div>
            <div>
              <h1 className="text-lg font-black text-white tracking-tight leading-none">BacPrep</h1>
              <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-[0.2em] font-bold">Admin Portal</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto custom-scrollbar">
          <p className="px-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-4 mt-2">Menu Principal</p>
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `
                flex items-center justify-between px-4 py-2.5 rounded-lg transition-all duration-200 group
                ${isActive 
                  ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20 shadow-sm' 
                  : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'}
              `}
            >
              {({ isActive }) => (
                <>
                  <div className="flex items-center gap-3">
                    <item.icon size={19} className={isActive ? 'text-blue-500' : 'text-slate-500 group-hover:text-slate-300'} />
                    <span className="text-sm font-semibold tracking-wide">{item.name}</span>
                  </div>
                  {isActive && <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-sm shadow-blue-500/50"></div>}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 mt-auto">
          <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-4 mb-4">
            <div className="flex items-center gap-3">
               <div className="w-9 h-9 rounded-lg bg-slate-700 flex items-center justify-center text-slate-200 font-bold uppercase text-xs">
                 {user?.name?.[0] || 'A'}
               </div>
               <div className="overflow-hidden">
                 <p className="text-xs font-bold text-white truncate">{user?.name}</p>
                 <p className="text-[10px] text-slate-500 truncate">{user?.role}</p>
               </div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-slate-400 hover:text-red-400 hover:bg-red-400/5 rounded-lg transition-all font-bold text-sm"
          >
            <LogOut size={18} />
            <span>Se déconnecter</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-68">
        <div className="h-full bg-slate-50/30 p-8 lg:p-10 min-h-screen">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
