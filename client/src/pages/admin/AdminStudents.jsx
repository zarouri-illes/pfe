import { useState, useEffect } from 'react';
import api from '../../api/client';
import { motion } from 'framer-motion';
import { 
  Users, 
  Search, 
  ChevronRight,
  TrendingUp,
  Mail,
  Calendar,
  CreditCard,
  UserCheck,
  FileText
} from 'lucide-react';
import { Card, CardContent } from '../../components/ui/card';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const AdminStudents = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

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
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = students.filter(s => {
    return s.name?.toLowerCase().includes(search.toLowerCase()) ||
    s.email?.toLowerCase().includes(search.toLowerCase())
  });

  const exportStudentsPDF = () => {
    const doc = new jsPDF();
    
    // Branding & Title
    doc.setFontSize(22);
    doc.setTextColor(30, 41, 59);
    doc.text("BACPREP HUB", 14, 22);
    
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text("RÉPERTOIRE OFFICIEL DES ÉTUDIANTS", 14, 28);
    doc.text(`Généré le: ${new Date().toLocaleString()}`, 14, 33);

    // Summary
    doc.setFontSize(12);
    doc.setTextColor(30, 41, 59);
    doc.text(`Total Étudiants: ${filteredStudents.length}`, 14, 45);

    // Table Data
    const tableColumn = ["ID", "Nom", "Email", "Solde (Crédits)", "Date d'inscription"];
    const tableRows = filteredStudents.map(s => [
      s.id,
      s.name,
      s.email,
      `${s.creditBalance} CR`,
      new Date(s.createdAt).toLocaleDateString('fr-FR')
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 55,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [37, 99, 235], textColor: [255, 255, 255] },
      alternateRowStyles: { fillColor: [248, 250, 252] },
    });

    doc.save(`bacprep-etudiants-${new Date().getTime()}.pdf`);
  };

  const totalStudents = students.length;
  const avgCredits = Math.round(students.reduce((acc, curr) => acc + curr.creditBalance, 0) / (totalStudents || 1));

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
            placeholder="Rechercher un étudiant par nom ou email..."
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
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Solde Crédits</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Inscrit le</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                [1,2,3,4,5].map(i => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan="4" className="px-6 py-6"><div className="h-4 bg-slate-100 rounded w-full"></div></td>
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
                       <div className="inline-flex flex-col items-center">
                          <span className={`px-4 py-1 rounded-full text-xs font-black border transition-all ${
                            student.creditBalance > 10 ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'
                          }`}>
                            {student.creditBalance} Crédits
                          </span>
                       </div>
                    </td>
                    <td className="px-6 py-5 text-right">
                       <div className="flex flex-col items-end">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                             <Calendar size={12} className="text-slate-400" />
                             <span>{new Date(student.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                          </div>
                          <p className="text-[10px] font-black text-slate-400 uppercase mt-0.5">Membre depuis</p>
                       </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="p-4 bg-slate-50 rounded-full text-slate-300">
                        <Users size={48} />
                      </div>
                      <p className="text-slate-400 font-bold tracking-wide">Aucun étudiant trouvé</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default AdminStudents;
