import { BrowserRouter, Routes, Route, Link, Navigate, Outlet } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import Landing from './pages/Landing';
import Register from './pages/Register';
import Login from './pages/Login';
import ProtectedRoute from './components/ProtectedRoute';
import AdminLayout from './components/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminExams from './pages/admin/AdminExams';

function NotFound() {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center text-center px-4">
      <h1 className="text-4xl font-bold mb-4">404 - Page Introuvable</h1>
      <p className="text-gray-500 mb-6">La page que vous recherchez n'existe pas.</p>
      <Link to="/" className="text-blue-600 underline">Retourner à l'accueil</Link>
    </div>
  );
}

function UserLayout() {
  return (
    <>
      <Navbar />
      <Outlet />
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50 font-sans">
        <Routes>
          {/* User Routes with Navbar */}
          <Route element={<UserLayout />}>
            <Route path="/" element={<Landing />} />
            <Route path="/register" element={<Register />} />
            <Route path="/login" element={<Login />} />
            <Route path="*" element={<NotFound />} />
          </Route>
          
          {/* Admin Routes (No Global Navbar) */}
          <Route element={<ProtectedRoute adminOnly />}>
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="exams" element={<AdminExams />} />
              <Route path="questions" element={<div className="p-8"><h1 className="text-2xl font-bold">Gestion des Questions (À venir)</h1></div>} />
              <Route path="packs" element={<div className="p-8"><h1 className="text-2xl font-bold">Gestion des Packs (À venir)</h1></div>} />
            </Route>
          </Route>
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
