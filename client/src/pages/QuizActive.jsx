import { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import api from '../api/client';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle, 
  ChevronRight, 
  ChevronLeft, 
  Send,
  HelpCircle,
  Clock,
  Layout,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';

const QuizActive = () => {
  const { attemptId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  
  // Get questions from navigation state (passed from QuizSelect)
  const [questions, setQuestions] = useState(location.state?.questions || []);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // If no questions in state, we shouldn't be here
  useEffect(() => {
    if (!questions.length) {
      navigate('/quiz');
    }
  }, [questions, navigate]);

  const handleAnswerChange = (questionId, value) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      
      // Format answers for API
      const formattedAnswers = questions.map(q => ({
        questionId: q.id,
        studentAnswer: String(answers[q.id] || '')
      }));

      const res = await api('/api/quiz/submit', {
        method: 'POST',
        body: JSON.stringify({
          attemptId: parseInt(attemptId),
          answers: formattedAnswers
        })
      });

      // Navigate to results
      navigate(`/quiz/${attemptId}/results`, { state: { results: res.data } });
    } catch (error) {
      console.error('Submission failed:', error);
      alert('Erreur lors de la soumission du quiz.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!questions.length) return null;

  const currentQuestion = questions[currentIndex];
  const progress = ((currentIndex + 1) / questions.length) * 100;
  const answeredCount = Object.keys(answers).filter(k => answers[k] !== undefined && answers[k] !== '').length;

  return (
    <div className="p-4 md:p-8 lg:p-10 pb-24 space-y-8">
      
      {/* 1. QUIZ HEADER & PROGRESS */}
      <div className="space-y-6">
         <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
               <div className="w-12 h-12 bg-white shadow-sm border border-slate-100 rounded-lg flex items-center justify-center text-indigo-600">
                  <Layout size={24} />
               </div>
               <div>
                  <h1 className="text-xl font-black text-slate-900 tracking-tight">Session d'Excellence</h1>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Attempt ID: #{attemptId}</p>
               </div>
            </div>
            
            <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-full text-[10px] font-black uppercase tracking-widest">
               <Clock size={12} className="text-indigo-400" />
               Chrono Actif
            </div>
         </div>

         <div className="space-y-2">
            <div className="flex justify-between items-end">
               <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Question {currentIndex + 1} / {questions.length}</span>
               <span className="text-xs font-black text-indigo-600">{Math.round(progress)}% complété</span>
            </div>
            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
               <motion.div 
                 initial={{ width: 0 }}
                 animate={{ width: `${progress}%` }}
                 className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600"
               />
            </div>
         </div>
      </div>

      {/* 2. QUESTION CARD */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="border-none bg-white shadow-2xl shadow-slate-100/50 rounded-2xl overflow-hidden min-h-[450px] flex flex-col">
            <CardContent className="p-8 lg:p-12 flex-grow flex flex-col">
               
               {/* Question Content */}
               <div className="space-y-8 flex-grow">
                  <div className="flex items-start gap-4">
                     <span className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-xs shrink-0">
                        Q
                     </span>
                     <h2 className="text-xl lg:text-2xl font-bold text-slate-900 leading-snug">
                        {currentQuestion.content}
                     </h2>
                  </div>

                  {currentQuestion.imageUrl && (
                    <div className="rounded-lg border border-slate-100 p-2 bg-slate-50 overflow-hidden">
                       <img src={currentQuestion.imageUrl} alt="Ref" className="w-full h-auto rounded-xl" />
                    </div>
                  )}

                  {/* Answers UI */}
                  <div className="space-y-4 pt-4">
                     {currentQuestion.type === 'mcq' ? (
                       <div className="grid grid-cols-1 gap-3">
                          {currentQuestion.options.map((option, idx) => (
                            <button
                              key={idx}
                              onClick={() => handleAnswerChange(currentQuestion.id, option)}
                              className={`flex items-center gap-4 p-5 rounded-lg border-2 transition-all text-left ${
                                answers[currentQuestion.id] === option 
                                ? 'bg-indigo-50 border-indigo-500 shadow-lg shadow-indigo-100 translate-x-2' 
                                : 'bg-white border-slate-100 hover:border-indigo-200'
                              }`}
                            >
                               <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                                 answers[currentQuestion.id] === option ? 'border-indigo-500 bg-indigo-500' : 'border-slate-200'
                               }`}>
                                  {answers[currentQuestion.id] === option && <CheckCircle size={14} className="text-white" />}
                               </div>
                               <span className={`text-sm font-bold ${answers[currentQuestion.id] === option ? 'text-indigo-900' : 'text-slate-700'}`}>
                                  {option}
                               </span>
                            </button>
                          ))}
                       </div>
                     ) : (
                       <div className="space-y-3">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Votre Réponse Numérique</label>
                          <input 
                            type="number" 
                            step="any"
                            placeholder="Entrez un nombre..."
                            className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-lg text-lg font-bold focus:outline-none focus:border-indigo-500 transition-all shadow-inner"
                            value={answers[currentQuestion.id] || ''}
                            onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                          />
                          <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 italic px-2">
                             <AlertCircle size={12} /> Précision attendue selon l'énoncé
                          </div>
                       </div>
                     )}
                  </div>
               </div>

               {/* Navigation Controls */}
               <div className="pt-10 flex items-center justify-between border-t border-slate-50 mt-10">
                  <Button
                    variant="ghost"
                    disabled={currentIndex === 0}
                    onClick={() => setCurrentIndex(prev => prev - 1)}
                    className="h-12 px-6 rounded-lg font-black text-slate-500 uppercase tracking-widest text-[10px] gap-2"
                  >
                     <ChevronLeft size={16} /> Précédent
                  </Button>

                  {currentIndex === questions.length - 1 ? (
                    <Button
                      onClick={handleSubmit}
                      disabled={submitting}
                      className="h-14 px-10 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-black uppercase tracking-widest text-xs gap-3 shadow-xl shadow-emerald-100 transition-all hover:scale-105"
                    >
                       {submitting ? <Loader2 className="animate-spin" /> : <><Send size={16} /> Terminer le Quiz</>}
                    </Button>
                  ) : (
                    <Button
                      onClick={() => setCurrentIndex(prev => prev + 1)}
                      className="h-12 px-8 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-black uppercase tracking-widest text-[10px] gap-2 transition-all"
                    >
                       Suivant <ChevronRight size={16} />
                    </Button>
                  )}
               </div>
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>

      {/* 3. FOOTER INFO */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4 px-6 bg-white shadow-sm border border-slate-100 rounded-xl">
         <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-50 text-amber-500 rounded-xl flex items-center justify-center">
               <HelpCircle size={20} />
            </div>
            <p className="text-sm font-bold text-slate-700">
               {answeredCount} / {questions.length} questions répondues
            </p>
         </div>
         <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">Pression constructive active</p>
      </div>

    </div>
  );
};

export default QuizActive;
