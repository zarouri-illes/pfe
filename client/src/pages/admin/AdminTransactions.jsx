import { useState, useEffect } from 'react';
import api from '../../api/client';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  History, 
  Search, 
  Filter, 
  ChevronRight,
  Download,
  User,
  Package,
  Calendar,
  CheckCircle2,
  Clock,
  XCircle,
  ArrowUpRight,
  TrendingUp,
  CreditCard,
  FileText
} from 'lucide-react';
import { Card, CardContent } from '../../components/ui/card';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/** Backend persists Chargily-paid rows as COMPLETED; keep filters aligned. */
const isSuccessfulTx = (status) => {
  const s = (status || '').toLowerCase();
  return s === 'success' || s === 'completed' || s === 'paid';
};

const AdminTransactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const res = await api('/api/admin/transactions');
      setTransactions(res.data || []);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status.toLowerCase()) {
      case 'success':
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-100">
            <CheckCircle2 size={12} />
            Succès
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-amber-100">
            <Clock size={12} />
            En attente
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-50 text-red-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-red-100">
            <XCircle size={12} />
            Échoué
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 bg-slate-100 text-slate-500 rounded-full text-[10px] font-black uppercase tracking-widest">
            {status}
          </span>
        );
    }
  };

  const filteredTransactions = transactions.filter(t => {
    const matchesSearch = 
      t.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
      t.user?.email?.toLowerCase().includes(search.toLowerCase()) ||
      t.chargilyId?.toLowerCase().includes(search.toLowerCase());
    
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'success' && isSuccessfulTx(t.status)) ||
      (statusFilter !== 'success' && t.status.toLowerCase() === statusFilter.toLowerCase());
    
    return matchesSearch && matchesStatus;
  });

  const exportToPDF = () => {
    const doc = new jsPDF();
    
    // Add Branding & Title
    doc.setFontSize(22);
    doc.setTextColor(30, 41, 59); // slate-800
    doc.text("BACPREP HUB", 14, 22);
    
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139); // slate-500
    doc.text("RAPPORT FINANCIER ADMINISTRATIF", 14, 28);
    doc.text(`Généré le: ${new Date().toLocaleString()}`, 14, 33);

    // Summary Stats
    const totalRev = filteredTransactions
      .filter((t) => isSuccessfulTx(t.status))
      .reduce((acc, curr) => acc + curr.amountDa, 0);

    doc.setFontSize(12);
    doc.setTextColor(30, 41, 59);
    doc.text(`Nombre de transactions: ${filteredTransactions.length}`, 14, 45);
    doc.text(`Revenu du filtre: ${totalRev} DA`, 14, 52);

    // Table
    const tableColumn = ["Date", "Utilisateur", "Pack", "Montant", "Credits", "Statut"];
    const tableRows = filteredTransactions.map(t => [
      new Date(t.createdAt).toLocaleDateString(),
      t.user?.name || 'Inconnu',
      t.pack?.name || 'N/A',
      `${t.amountDa} DA`,
      `+${t.creditsAdded}`,
      t.status.toUpperCase()
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 60,
      styles: { fontSize: 9, font: "helvetica" },
      headStyles: { fillColor: [37, 99, 235], textColor: [255, 255, 255] }, // blue-600
      alternateRowStyles: { fillColor: [248, 250, 252] },
    });

    doc.save(`bacprep-transactions-${new Date().getTime()}.pdf`);
  };

  const totalRevenue = transactions
    .filter((t) => isSuccessfulTx(t.status))
    .reduce((acc, curr) => acc + curr.amountDa, 0);

  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Historique des Transactions</h1>
          <nav className="flex items-center gap-2 mt-1.5 text-xs font-bold text-slate-400">
             <span>Admin</span>
             <ChevronRight size={12} />
             <span className="text-slate-600">Finances & Paiements</span>
          </nav>
        </div>
    
      </div>

      {/* Filters Area */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-2 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text"
            placeholder="Rechercher par utilisateur, email ou ID..."
            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all shadow-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        
        <div className="relative">
          <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <select 
            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20 appearance-none shadow-sm"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">Tous les Statuts</option>
            <option value="success">Succès</option>
            <option value="pending">En attente</option>
            <option value="failed">Échoué</option>
          </select>
        </div>

        <button 
          onClick={exportToPDF}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-white border border-slate-200 text-blue-600 rounded-xl text-sm font-black shadow-sm hover:bg-blue-50 transition-all border-dashed"
        >
          <FileText size={18} />
          Exporter PDF
        </button>
      </div>

      {/* Transactions Table */}
      <Card className="border-slate-200/60 shadow-sm rounded-lg overflow-hidden bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Utilisateur</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Pack / Crédits</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Montant</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Statut</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                [1,2,3,4,5].map(i => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan="5" className="px-6 py-6"><div className="h-4 bg-slate-100 rounded w-full"></div></td>
                  </tr>
                ))
              ) : filteredTransactions.length > 0 ? (
                filteredTransactions.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/50 transition-all group">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-indigo-50 text-indigo-600 flex items-center justify-center rounded-lg font-bold text-xs">
                          {t.user?.name?.[0]?.toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900 leading-tight">{t.user?.name}</p>
                          <p className="text-[10px] font-bold text-slate-400 truncate max-w-[150px]">{t.user?.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                       <div className="flex items-center gap-2">
                          <Package size={14} className="text-slate-400" />
                          <span className="text-sm font-bold text-slate-700">{t.pack?.name}</span>
                          <span className="text-xs font-black text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-md">+{t.creditsAdded}</span>
                       </div>
                    </td>
                    <td className="px-6 py-5">
                       <div className="flex flex-col">
                          <span className="text-sm font-black text-slate-900">{t.amountDa} DA</span>
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">ID: {t.chargilyId.slice(0, 8)}...</span>
                       </div>
                    </td>
                    <td className="px-6 py-5 text-center">
                      {getStatusBadge(t.status)}
                    </td>
                    <td className="px-6 py-5 text-right">
                       <div className="flex flex-col items-end">
                          <p className="text-xs font-bold text-slate-700">{new Date(t.createdAt).toLocaleDateString()}</p>
                          <p className="text-[10px] font-bold text-slate-400">{new Date(t.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                       </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="p-4 bg-slate-50 rounded-full text-slate-300">
                        <History size={48} />
                      </div>
                      <p className="text-slate-400 font-bold tracking-wide">Aucune transaction trouvée</p>
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

export default AdminTransactions;
