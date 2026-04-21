import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Button } from './ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X } from 'lucide-react';

export function Navbar() {
  const { user, logout, isAuthenticated } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const dashboardPath = user?.role === 'admin' ? '/admin/dashboard' : '/dashboard';

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Accueil', path: '/' },
    { name: 'Sujets', path: '/exams' },
    { name: 'À Propos', path: '/#about' },
    { name: 'Tarifs', path: '/credits' },
    { name: 'FAQ', path: '/#faq' },
  ];

  return (
    <motion.nav 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        scrolled ? 'bg-white/95 backdrop-blur-md shadow-sm py-2' : 'bg-transparent py-4'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
        
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-9 h-9 rounded-lg bg-[#1e3a8a] flex items-center justify-center text-white font-bold text-lg shadow-md transition-transform group-hover:scale-105">
            BP
          </div>
          <span className="text-xl font-extrabold text-[#111827] tracking-tight">BacPrep</span>
        </Link>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map(link => (
            <Link 
              key={link.name} 
              to={link.path}
              className="text-gray-500 font-semibold text-sm hover:text-[#1e3a8a] transition-colors"
            >
              {link.name}
            </Link>
          ))}
        </div>

        {/* Desktop Auth/Actions */}
        <div className="hidden md:flex items-center gap-3">
          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              {user?.role === 'student' && (
                <div className="flex items-center gap-1.5 px-4 py-2 bg-amber-50 rounded-full border border-amber-100">
                  <Coins size={14} className="text-amber-500" />
                  <span className="text-xs font-black text-amber-600">{creditBalance}</span>
                </div>
              )}
              <Link to={dashboardPath}>
                <Button variant="ghost" className="font-bold text-slate-700 hover:text-[#1e3a8a] hover:bg-blue-50/50 text-sm rounded-full px-5 transition-all">
                  Mon Espace
                </Button>
              </Link>
              <Button 
                variant="outline" 
                onClick={logout}
                className="font-bold border-slate-200 text-slate-700 hover:bg-slate-50 text-sm h-10 px-6 rounded-full"
              >
                Déconnexion
              </Button>
            </div>
          ) : (
            <>
              <Link to="/login">
                <Button variant="ghost" className="font-bold text-slate-600 hover:text-[#1e3a8a] text-sm">
                  Se connecter
                </Button>
              </Link>
              <Link to="/register">
                <Button className="font-bold bg-[#1e3a8a] hover:bg-[#1e40af] text-white rounded-full px-7 h-10 shadow-lg shadow-blue-100 transition-all active:scale-95 text-sm">
                  S'inscrire
                </Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile Toggle */}
        <button 
          className="md:hidden p-2 text-slate-600"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="md:hidden absolute top-full left-0 w-full bg-white border-b px-6 py-6 shadow-2xl overflow-hidden"
          >
            <div className="flex flex-col gap-4">
              {navLinks.map(link => (
                <Link key={link.name} to={link.path} onClick={() => setMobileMenuOpen(false)} className="text-slate-600 font-bold text-base">
                  {link.name}
                </Link>
              ))}
              <div className="pt-4 flex flex-col gap-3">
                {isAuthenticated ? (
                  <Link to="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                    <Button className="w-full bg-[#1e3a8a] font-bold">Mon Espace</Button>
                  </Link>
                ) : (
                  <>
                    <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                      <Button variant="outline" className="w-full h-11 font-bold">Se connecter</Button>
                    </Link>
                    <Link to="/register" onClick={() => setMobileMenuOpen(false)}>
                      <Button className="w-full h-11 bg-[#1e3a8a] font-bold text-white">S'inscrire</Button>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
