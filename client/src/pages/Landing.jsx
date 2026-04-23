import { useState, useEffect } from 'react';
import api from '../api/client';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

import { Button } from '../components/ui/button';
import { 
  Play, 
  CheckCircle, 
  Stars, 
  BookOpen, 
  Calculator, 
  FlaskConical, 
  MessageSquare, 
  Target,
  Atom,
  Globe
} from 'lucide-react';
import { SubjectCard } from '../components/landing/SubjectCard';
import { PricingCard } from '../components/landing/PricingCard';
import { FAQItem } from '../components/landing/FAQItem';
import { FloatingIcon } from '../components/landing/FloatingIcon';

export default function Landing() {
  const [packs, setPacks] = useState([]);

  useEffect(() => {
    const fetchPacks = async () => {
      try {
        const res = await api('/api/credits/packs');
        setPacks((res.data || res).slice(0, 3));
      } catch (error) {
        console.error('Error fetching dynamic packs:', error);
      }
    };
    fetchPacks();
  }, []);

  return (
    <div className="bg-white font-inter">
      
      {/* 1. HERO SECTION */}
      <section className="sticky top-0 w-full min-h-screen flex flex-col justify-center bg-white px-6 pt-32 lg:pt-24 lg:pb-24 max-w-7xl mx-auto items-center lg:flex-row gap-12 z-[1] overflow-hidden">
        
        {/* Left: Content */}
        <div className="flex-1 text-center lg:text-left z-10">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-600 font-bold text-[10px] px-3.5 py-1.5 rounded-full uppercase tracking-[0.2em] mb-6 border border-emerald-100"
          >
            <Stars size={14} className="fill-emerald-600" /> Plateforme Spécialisée Bac 2026
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="text-4xl lg:text-[4rem] font-black text-[#111827] leading-[1.1] mb-6 tracking-tight"
          >
            Réussir Votre Bac <br/> 
            <span className="text-[#111827]">Algérien Plus Tactiquement</span> <br/>
            <span className="text-[#10b981] drop-shadow-sm">Plus Facilement</span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-base text-slate-500 font-semibold max-w-lg mb-10 leading-relaxed"
          >
            Accédez aux vrais sujets du Baccalauréat Algérien. Quiz interactifs, corrections automatiques et mentor IA personnalisé pour chaque candidat.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex flex-col sm:flex-row items-center gap-6 justify-center lg:justify-start"
          >
            <Link to="/register">
              <Button size="lg" className="h-14 px-10 text-base font-bold bg-[#1e3a8a] hover:bg-[#1e40af] text-white rounded-full shadow-lg shadow-blue-100 transition-all hover:scale-[1.03] active:scale-95">
                Essayer Gratuitement <span className="ml-2 text-emerald-400">↗</span>
              </Button>
            </Link>
           
          </motion.div>
        </div>

        {/* Right: Illustration */}
        <div className="flex-1 relative w-full lg:max-w-[550px] h-[400px] lg:h-[550px]">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            className="relative z-20 w-full h-full"
            data-speed="0.8"
          >

            <img 
              src="/hero.png" 
              alt="Student" 
              className="w-full h-full object-contain grayscale-[0.2] hover:grayscale-0 transition-all duration-700"
            />
          </motion.div>

          {/* Floating UI elements */}
          


          <FloatingIcon icon={Calculator} color="blue-600" delay={0.2} x={5} y={20} />
          <FloatingIcon icon={FlaskConical} color="purple-600" delay={0.4} x={85} y={40} />
          <FloatingIcon icon={Atom} color="emerald-600" delay={0.6} x={15} y={60} />
          <FloatingIcon icon={BookOpen} color="amber-600" delay={0.8} x={75} y={75} />
          <FloatingIcon icon={Globe} color="cyan-600" delay={1} x={30} y={85} />
          <FloatingIcon icon={CheckCircle} color="emerald-500" delay={1.2} x={60} y={15} size={40} />

        </div>
      </section>

      {/* 2. SUBJECTS GRID */}
      <section className="sticky top-0 w-full min-h-screen flex flex-col justify-center px-6 py-10 bg-slate-50 z-[2]">
        <div className="max-w-[1400px] mx-auto w-full">
          <div className="text-center mb-16">
            <h2 className="text-[#10b981] font-bold uppercase tracking-[0.2em] text-[10px] mb-4">Bibliothèque Bac</h2>
            <h3 className="text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">Quelle matière voulez-vous maîtriser ?</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-[220px]">
            <SubjectCard 
              size="large"
              title="Mathématiques" 
              img="https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=800&q=80"
              icon={Calculator}
              color="from-[#1e3a8a]/90 to-[#1e3a8a]/40"
            />
            <SubjectCard 
              size="small"
              title="Physique-Chimie" 
              img="https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?w=800&q=80"
              icon={FlaskConical}
              color="from-[#1e3a8a]/80 to-transparent"
            />
            <SubjectCard 
              size="small"
              title="Sciences (SVT)" 
              img="https://images.unsplash.com/photo-1532187643603-ba119ca4109e?w=800&q=80"
              icon={Target}
              color="from-emerald-900 to-transparent"
              comingSoon={true}
            />
            <SubjectCard 
              size="small"
              title="Arabe & Littérature" 
              img="https://images.unsplash.com/photo-1544648397-52e9dd677ba9?w=800&q=80"
              icon={BookOpen}
              color="from-slate-900 to-transparent"
              comingSoon={true}
            />
            <SubjectCard 
              size="small"
              title="Anglais" 
              img="https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800&q=80"
              icon={MessageSquare}
              color="from-[#1e3a8a]/80 to-transparent"
              comingSoon={true}
            />
          </div>
        </div>
      </section>

      {/* 3. AI SECTION */}
      <section id="about" className="sticky top-0 w-full min-h-screen flex flex-col justify-center px-6 py-12 bg-blue-50 relative overflow-hidden z-[3]">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-16 lg:gap-24">
          <div className="flex-1 relative order-2 lg:order-1">
             <motion.div 
               initial={{ rotate: -2 }}
               whileInView={{ rotate: 0 }}
               className="relative z-10 p-3 bg-slate-50 rounded-lg shadow-xl overflow-hidden border border-slate-100"
             >
                <img src="/ai.gif" alt="IA Mentor" className="rounded-xl w-full grayscale-[0.3]" />
             </motion.div>
          </div>

          <div className="flex-1 order-1 lg:order-2">
            <h2 className="text-[#10b981] font-bold uppercase tracking-[0.2em] text-[10px] mb-4">Intelligence Intégrée</h2>
            <h3 className="text-3xl lg:text-4xl font-black text-slate-900 mb-8 leading-[1.2] tracking-tight">Votre Mentor IA <br/> Dédié au Bac.</h3>
            <p className="text-base text-slate-500 font-semibold mb-10 leading-relaxed">
              Ne restez jamais bloqué sur un exercice difficile. Notre mentor IA analyse les questions réelles du Bac et vous guide étape par étape sans vous donner la solution brute.
            </p>
            <ul className="space-y-6">
              {[
                { title: "Explications Claires", text: "Les concepts complexes expliqués selon le programme officiel du Bac Algérien." },
                { title: "Disponibilité 24/7", text: "Réponses immédiates même pendant vos séances de révision nocturnes." },
                { title: "Correction Intelligente", text: "L'IA analyse vos erreurs et vous propose des exercices ciblés pour progresser." }
              ].map((item, i) => (
                <li key={i} className="flex gap-5">
                  <div className="w-11 h-11 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-emerald-600 shrink-0 shadow-sm">
                    <Stars size={20} className="fill-emerald-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 text-lg mb-1">{item.title}</h4>
                    <p className="text-slate-400 font-semibold text-xs leading-relaxed">{item.text}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* 4. PRICING */}
      <section className="sticky top-0 w-full min-h-screen flex flex-col justify-center px-6 py-12 bg-emerald-50 z-[4]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-[#10b981] font-bold uppercase tracking-[0.2em] text-[10px] mb-4">Votre Investissement</h2>
            <h3 className="text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">Tarifs Simples & Transparents</h3>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {packs.length > 0 ? (
              packs.map((pack, i) => (
                <PricingCard 
                  key={pack.id}
                  title={pack.name}
                  price={pack.priceDa}
                  credits={pack.credits}
                  recommended={i === 1}
                  features={pack.features?.length > 0 ? pack.features : [
                    "Accès Complet aux Sujets",
                    "Aide Mentor IA",
                    "Quiz par Chapitres",
                    "Suivi de Progression"
                  ]}
                />
              ))
            ) : (
              // Fallback cards
              <>
                <PricingCard 
                  title="Starter"
                  price="500"
                  credits={100}
                  features={["Accès Complet aux Sujets", "IA Mentor (Limité)", "Quiz par Chapitres", "Statistiques de Progression"]}
                />
                <PricingCard 
                  title="Candidat Passionné"
                  price="1200"
                  credits={350}
                  recommended={true}
                  features={["Support IA Prioritaire", "Quiz Illimités", "Téléchargement PDF", "Rapports de Performance", "Accès Mentor 24/7"]}
                />
                <PricingCard 
                  title="Study Master"
                  price="2500"
                  credits={1000}
                  features={["Toutes les fonctionnalités", "Accès à Vie", "Sujets Bac Blanc Exclusifs", "Groupes d'Études", "Rentabilité Maximale"]}
                />
              </>
            )}
          </div>
        </div>
      </section>
      {/* 5. FAQ */}
      <section id="faq" className="sticky top-0 w-full min-h-screen flex flex-col justify-center px-6 py-12 bg-zinc-50 z-[5]">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-[#10b981] font-bold uppercase tracking-[0.2em] text-[10px] mb-4">Assistance</h2>
            <h3 className="text-3xl font-black text-slate-900 tracking-tight">Questions Fréquentes</h3>
          </div>

          <div className="border border-slate-100 rounded-lg px-6 lg:px-10 lg:py-6 bg-white shadow-xl shadow-slate-100/50">
            <FAQItem 
              question="C'est quoi les 'Crédits d'Étude' ?"
              answer="Les crédits sont notre monnaie interne. Vous les utilisez pour débloquer des sessions de quiz ou demander des explications à l'IA. Vous ne payez que ce que vous consommez."
            />
            <FAQItem 
              question="Les sujets sont-ils conformes au Bac Algérien ?"
              answer="Absolument. Tous nos examens et quiz sont basés sur les sujets réels des années précédentes et le programme officiel du ministère."
            />
            <FAQItem 
              question="Comment s'effectue le paiement ?"
              answer="Nous utilisons Chargily Pay, qui supporte EDAHABIYA, CIB et d'autres méthodes de paiement locales en Algérie."
            />
            <FAQItem 
              question="Puis-je utiliser la plateforme sur mon téléphone ?"
              answer="Oui, BacPrep est entièrement responsive et fonctionne parfaitement sur smartphone, tablette et ordinateur."
            />
          </div>
        </div>
      </section>

      {/* 6. FOOTER */}
      <footer className="relative w-full min-h-[60vh] flex flex-col justify-center bg-[#111827] text-white pt-20 pb-12 px-6 z-[10]">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
            <div>
              <Link to="/" className="flex items-center gap-2.5 mb-8">
                <div className="w-10 h-10 rounded-lg bg-[#1e3a8a] flex items-center justify-center font-black text-xl">BP</div>
                <span className="text-xl font-black tracking-tighter">BacPrep</span>
              </Link>
              <p className="text-slate-400 font-semibold text-sm leading-relaxed max-w-xs">
                Le compagnon d'étude le plus avancé pour les étudiants algériens visant l'excellence au Baccalauréat.
              </p>
            </div>
            
            <div>
              <h4 className="font-bold text-white text-xs mb-8 uppercase tracking-[0.2em]">Navigation</h4>
              <ul className="space-y-4 text-sm font-semibold text-slate-400">
                <li><Link to="/exams" className="hover:text-emerald-400 transition-colors">Sujets de Bac</Link></li>
                <li><Link to="/#about" className="hover:text-emerald-400 transition-colors">Mentor IA</Link></li>
                <li><Link to="/credits" className="hover:text-emerald-400 transition-colors">Vente Crédits</Link></li>
                <li><Link to="/#faq" className="hover:text-emerald-400 transition-colors">Aide</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-white text-xs mb-8 uppercase tracking-[0.2em]">Légal</h4>
              <ul className="space-y-4 text-sm font-semibold text-slate-400">
                <li><Link to="/privacy" className="hover:text-emerald-400 transition-colors">Confidentialité</Link></li>
                <li><Link to="/terms" className="hover:text-emerald-400 transition-colors">Conditions d'Utilisation</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-white text-xs mb-8 uppercase tracking-[0.2em]">Mises à Jour</h4>
              <p className="text-slate-400 text-xs mb-6 font-semibold">Conseils d'études pour 5000+ bacheliers.</p>
              <div className="bg-slate-800/50 border border-slate-700 p-1.5 rounded-xl flex">
                <input type="email" placeholder="Email" className="bg-transparent px-3 py-1.5 outline-none flex-grow text-xs font-semibold" />
                <Button className="bg-[#1e3a8a] hover:bg-[#1e40af] rounded-lg px-3.5 h-8 text-[10px] font-bold">Joindre</Button>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-800 pt-10 text-center text-slate-500 text-[10px] font-bold uppercase tracking-widest">
             © 2026 BacPrep Hub. Maîtrisez Votre Futur.
          </div>
        </div>
      </footer>
      
      </div>
  );
}
