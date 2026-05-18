import { useState, useEffect } from 'react';
import api from '../../api/client';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  Search, 
  ChevronRight,
  Mail,
  Calendar,
  UserCheck,
  FileText,
  Eye,
  Trash2,
  X,
  CreditCard,
  History,
  AlertTriangle,
  ArrowRight,
  TrendingUp
} from 'lucide-react';
import { Card } from '../../components/ui/card';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toast } from 'sonner';
import Skeleton from '../../components/ui/skeleton';

const AdminStudents = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Modal states
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const res = await api('/api/admin/students');
      setStudents(res.data || []);
    } catch (error) {
      console.error('Error fetching students:', error);
      toast.error('Erreur lors du chargement des étudiants');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (studentId) => {
    try {
      setDetailsLoading(true);
      setIsDetailsModalOpen(true);
      const res = await api(`/api/admin/students/${studentId}`);
      setSelectedStudent(res.data);
    } catch (error) {
      console.error('Error fetching student details:', error);
      toast.error('Impossible de charger les détails');
      setIsDetailsModalOpen(false);
    } finally {
      setDetailsLoading(false);
    }
  };

  const openDeleteModal = (student) => {
    setStudentToDelete(student);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteStudent = async () => {
    if (!studentToDelete) return;
    try {
      setDeleteLoading(true);
      await api(`/api/admin/students/${studentToDelete.id}`, { method: 'DELETE' });
      toast.success('Étudiant supprimé avec succès');
      setStudents(prev => prev.filter(s => s.id !== studentToDelete.id));
      setIsDeleteModalOpen(false);
    } catch (error) {
      console.error('Delete error:', error);
      toast.error(error.message || 'Erreur lors de la suppression');
    } finally {
      setDeleteLoading(false);
      setStudentToDelete(null);
    }
  };

  const filteredStudents = students.filter(s => {
    return s.name?.toLowerCase().includes(search.toLowerCase()) ||
    s.email?.toLowerCase().includes(search.toLowerCase())
  });

  const exportStudentsPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(22);
    doc.setTextColor(30, 41, 59);
    doc.text("BACPREP HUB", 14, 22);
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text("RÉPERTOIRE OFFICIEL DES ÉTUDIANTS", 14, 28);
    doc.text(`Généré le: ${new Date().toLocaleString()}`, 14, 33);
    const tableColumn = ["ID", "Nom", "Email", "Solde (Crédits)", "Inscrit le"];
    const tableRows = filteredStudents.map(s => [
      s.id, s.name, s.email, `${s.creditBalance} CR`, new Date(s.createdAt).toLocaleDateString('fr-FR')
    ]);
    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 55,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [37, 99, 235], textColor: [255, 255, 255] },
    });
    doc.save(`bacprep-etudiants-${new Date().getTime()}.pdf`);
  };

  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Gestion des Étudiants</h1>
          <nav className="flex items-center gap-2 mt-1.5 text-xs font-bold text-slate-400">
             <span>Admin</span>
             <ChevronRight size={12} />
             <span className="text-slate-600">Répertoire Utilisateurs</span>
          </nav>
        </div>
      </div>

      {/* Search Area & Export */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex-1 max-w-md relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text"
            placeholder="Rechercher un étudiant..."
            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-blue-500/20 outline-none transition-all shadow-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        
        <button 
          onClick={exportStudentsPDF}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-white border border-slate-200 text-blue-600 rounded-xl text-sm font-black shadow-sm hover:bg-blue-50 transition-all border-dashed"
        >
          <FileText size={18} />
          Exporter PDF
        </button>
      </div>

      {/* Students Table */}
      <Card className="border-slate-200/60 shadow-sm rounded-lg overflow-hidden bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Étudiant</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Contact</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Solde Credits</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                [1,2,3,4,5].map(i => (
                  <tr key={i}>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                         <Skeleton className="w-10 h-10 rounded-xl" />
                         <div className="space-y-2">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-3 w-20" />
                         </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                       <div className="space-y-2">
                          <Skeleton className="h-3 w-40" />
                          <Skeleton className="h-3 w-32" />
                       </div>
                    </td>
                    <td className="px-6 py-5">
                       <div className="flex justify-center">
                          <Skeleton className="h-6 w-16 rounded-lg" />
                       </div>
                    </td>
                    <td className="px-6 py-5">
                       <div className="flex justify-end gap-2">
                          <Skeleton className="w-8 h-8 rounded-lg" />
                          <Skeleton className="w-8 h-8 rounded-lg" />
                       </div>
                    </td>
                  </tr>
                ))
              ) : filteredStudents.length > 0 ? (
                filteredStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-slate-50/50 transition-all group">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-50 to-indigo-50 text-blue-600 flex items-center justify-center rounded-xl font-black text-sm border border-blue-100/50">
                          {student.name?.[0]?.toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900 leading-tight">{student.name}</p>
                          <div className="flex items-center gap-1 mt-0.5">
                             <UserCheck size={10} className="text-emerald-500" />
                             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Compte Actif</p>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                       <div className="flex items-center gap-2 text-slate-600">
                          <Mail size={14} className="text-slate-400" />
                          <span className="text-sm font-semibold">{student.email}</span>
                       </div>
                    </td>
                    <td className="px-6 py-5 text-center">
                        <span className={`px-4 py-1 rounded-full text-xs font-black border ${
                        student.creditBalance > 10 ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'
                        }`}>
                        {student.creditBalance} CR
                        </span>
                    </td>
                    <td className="px-6 py-5">
                        <div className="flex items-center justify-end gap-2">
                            <button 
                                onClick={() => handleViewDetails(student.id)}
                                className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                title="Voir les détails"
                            >
                                <Eye size={18} />
                            </button>
                            <button 
                                onClick={() => openDeleteModal(student)}
                                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                                title="Supprimer l'étudiant"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="px-6 py-20 text-center text-slate-400 font-bold">Aucun étudiant trouvé</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ──── MODALS ──── */}
      
      {/* 1. Details Modal */}
      <AnimatePresence>
        {isDetailsModalOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsDetailsModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-600 text-white flex items-center justify-center rounded-xl font-black text-xl">
                        {selectedStudent?.name?.[0] || '?'}
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-slate-900">{selectedStudent?.name || 'Chargement...'}</h2>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">Détails de l'étudiant</p>
                    </div>
                </div>
                <button onClick={() => setIsDetailsModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-full transition-all">
                  <X size={20} className="text-slate-500" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-8 overflow-y-auto space-y-8 flex-grow">
                {detailsLoading ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-4">
                    <div className="w-10 h-10 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin" />
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Récupération des données...</p>
                  </div>
                ) : selectedStudent ? (
                  <>
                    {/* General Info Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Informations de Profil</h3>
                            <div className="bg-slate-50 rounded-xl p-4 space-y-3">
                                <div className="flex items-center gap-3">
                                    <Mail size={16} className="text-slate-400" />
                                    <span className="text-sm font-bold text-slate-700">{selectedStudent.email}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Calendar size={16} className="text-slate-400" />
                                    <span className="text-sm font-bold text-slate-700">Inscrit le {new Date(selectedStudent.createdAt).toLocaleDateString()}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <CreditCard size={16} className="text-slate-400" />
                                    <span className="text-sm font-bold text-blue-600">{selectedStudent.creditBalance} Crédits Disponibles</span>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Statistiques Rapides</h3>
                            <div className="bg-slate-50 rounded-xl p-4 grid grid-cols-2 gap-4">
                                <div className="text-center p-3 bg-white rounded-lg shadow-sm border border-slate-100">
                                    <p className="text-xl font-black text-slate-900">{selectedStudent.attempts?.length || 0}</p>
                                    <p className="text-[9px] font-black text-slate-400 uppercase">Quizzes</p>
                                </div>
                                <div className="text-center p-3 bg-white rounded-lg shadow-sm border border-slate-100">
                                    <p className="text-xl font-black text-slate-900">{selectedStudent.transactions?.length || 0}</p>
                                    <p className="text-[9px] font-black text-slate-400 uppercase">Achats</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Transactions History */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 flex items-center gap-2">
                                <History size={14} /> Historique des Transactions
                            </h3>
                        </div>
                        <div className="border border-slate-100 rounded-xl overflow-hidden">
                            {selectedStudent.transactions?.length > 0 ? (
                                <table className="w-full text-xs font-bold text-left">
                                    <thead className="bg-slate-50 text-[9px] text-slate-400 uppercase">
                                        <tr>
                                            <th className="px-4 py-3">Pack</th>
                                            <th className="px-4 py-3">Montant</th>
                                            <th className="px-4 py-3 text-right">Date</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {selectedStudent.transactions.slice(0, 5).map(tx => (
                                            <tr key={tx.id}>
                                                <td className="px-4 py-3 text-slate-900">{tx.pack.name}</td>
                                                <td className="px-4 py-3 text-emerald-600">{tx.amountDa} DZD</td>
                                                <td className="px-4 py-3 text-right text-slate-400">{new Date(tx.createdAt).toLocaleDateString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <div className="p-8 text-center text-slate-400 text-xs font-bold bg-slate-50">Aucune transaction trouvée</div>
                            )}
                        </div>
                    </div>

                    {/* Recent Component - Recent Activity */}
                    <div className="space-y-4">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 flex items-center gap-2">
                            <TrendingUp size={14} /> Activité Récente (Attempts)
                        </h3>
                        <div className="grid grid-cols-1 gap-3">
                            {selectedStudent.attempts?.length > 0 ? (
                                selectedStudent.attempts.slice(0, 3).map(att => (
                                    <div key={att.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                                        <div>
                                            <p className="text-sm font-black text-slate-900">{att.chapter.name}</p>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase">{att.chapter.subject.name}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-black text-blue-600">{Math.round((att.totalScore / att.maxScore) * 100)}%</p>
                                            <p className="text-[9px] font-bold text-slate-400 uppercase">{new Date(att.startedAt).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="p-8 text-center text-slate-400 text-xs font-bold bg-slate-50 rounded-xl">Aucune activité enregistrée</div>
                            )}
                        </div>
                    </div>
                  </>
                ) : null}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 2. Delete Confirmation Modal */}
      <AnimatePresence>
        {isDeleteModalOpen && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => !deleteLoading && setIsDeleteModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 overflow-hidden"
            >
               <div className="flex flex-col items-center text-center gap-4">
                  <div className="w-16 h-16 bg-rose-50 text-rose-600 flex items-center justify-center rounded-2xl">
                     <AlertTriangle size={32} />
                  </div>
                  <div>
                     <h2 className="text-xl font-black text-slate-900">Supprimer l'étudiant ?</h2>
                     <p className="text-sm font-bold text-slate-500 mt-2 leading-relaxed">
                        Cette action est irréversible. Toutes les données de <span className="text-slate-900 font-black">{studentToDelete?.name}</span> seront définitivement effacées (Scores, Transactions, Crédits).
                     </p>
                  </div>
                  
                  <div className="flex w-full gap-3 mt-4">
                     <button
                       disabled={deleteLoading}
                       onClick={() => setIsDeleteModalOpen(false)}
                       className="flex-1 px-6 py-3 bg-slate-100 text-slate-600 rounded-xl text-sm font-black hover:bg-slate-200 transition-all disabled:opacity-50"
                     >
                        Annuler
                     </button>
                     <button
                       disabled={deleteLoading}
                       onClick={handleDeleteStudent}
                       className="flex-1 px-6 py-3 bg-rose-600 text-white rounded-xl text-sm font-black hover:bg-rose-700 shadow-lg shadow-rose-200 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                     >
                        {deleteLoading ? (
                            <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                        ) : (
                            <>Confirmer <ArrowRight size={16} /></>
                        )}
                     </button>
                  </div>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminStudents;
