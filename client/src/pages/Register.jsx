import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Mail, Lock, CheckCircle } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import api from '../api/client';

export default function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      return setError('Les mots de passe ne correspondent pas.');
    }

    setIsLoading(true);

    try {
      const res = await api('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password
        })
      });
      
      console.log('Registration data:', res);
      navigate('/login');
    } catch (err) {
      setError(err.message || "Une erreur est survenue lors de l'inscription.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center pt-24 px-6 lg:px-8 font-inter">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link to="/" className="flex items-center justify-center gap-2 mb-6 cursor-pointer">
           <div className="w-10 h-10 rounded-lg bg-[#1e3a8a] flex items-center justify-center font-black text-xl text-white">BP</div>
           <span className="text-xl font-black text-slate-900 tracking-tighter">BacPrep</span>
        </Link>
        <h2 className="mt-2 text-center text-3xl font-black tracking-tight text-slate-900">
          Créer un compte
        </h2>
        <p className="mt-2 text-center text-sm font-semibold text-slate-500">
          Rejoignez des milliers de bacheliers vers l'excellence.
        </p>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-8 sm:mx-auto sm:w-full sm:max-w-md"
      >
        <div className="bg-white py-8 px-6 shadow-xl border border-slate-100 rounded-lg sm:px-10">
          <form className="space-y-5" onSubmit={handleSubmit}>
            {error && (
              <div className="p-3 rounded-xl bg-red-50 text-red-600 text-sm font-bold border border-red-100 text-center">
                {error}
              </div>
            )}
            
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">Nom complet</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-slate-400" />
                </div>
                <Input
                  name="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="pl-10 h-12 bg-slate-50 border-slate-200 text-sm font-semibold focus-visible:ring-[#1e3a8a]"
                  placeholder="Kamel Yassine"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">Adresse Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-slate-400" />
                </div>
                <Input
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="pl-10 h-12 bg-slate-50 border-slate-200 text-sm font-semibold focus-visible:ring-[#1e3a8a]"
                  placeholder="kamel@exemple.dz"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">Mot de passe</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <Input
                  name="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="pl-10 h-12 bg-slate-50 border-slate-200 text-sm font-semibold focus-visible:ring-[#1e3a8a]"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">Confirmer le mot de passe</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <CheckCircle className="h-5 w-5 text-slate-400" />
                </div>
                <Input
                  name="confirmPassword"
                  type="password"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="pl-10 h-12 bg-slate-50 border-slate-200 text-sm font-semibold focus-visible:ring-[#1e3a8a]"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="pt-2">
              <Button 
                type="submit" 
                disabled={isLoading}
                className="w-full h-12 bg-[#1e3a8a] hover:bg-[#1e40af] text-white font-bold rounded-xl text-base transition-all shadow-md active:scale-[0.98]"
              >
                {isLoading ? "Création en cours..." : "Créer mon compte"}
              </Button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm font-semibold text-slate-500">
              Vous avez déjà un compte ?{' '}
              <Link to="/login" className="font-bold text-[#10b981] hover:text-emerald-500 transition-colors">
                Connectez-vous
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
