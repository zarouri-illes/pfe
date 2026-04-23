import { BrowserRouter, Routes, Route, Link, Navigate, Outlet } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import Landing from './pages/Landing';
import Register from './pages/Register';
import Login from './pages/Login';
import ProtectedRoute from './components/ProtectedRoute';
import AdminLayout from './components/AdminLayout';
import StudentLayout from './components/StudentLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminExams from './pages/admin/AdminExams';
import AdminQuestions from './pages/admin/AdminQuestions';
import AdminPacks from './pages/admin/AdminPacks';
import AdminTransactions from './pages/admin/AdminTransactions';
import AdminStudents from './pages/admin/AdminStudents';
import Credits from './pages/Credits';
import Dashboard from './pages/Dashboard';
import ExamLibrary from './pages/ExamLibrary';
import QuizSelect from './pages/QuizSelect';
import QuizActive from './pages/QuizActive';
import QuizResults from './pages/QuizResults';
import { ChatbotWidget } from './components/ChatbotWidget';
import PaymentSuccess from './pages/PaymentSuccess';
import PaymentFail from './pages/PaymentFail';

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
      <ChatbotWidget />
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50 font-sans">
        <Routes>
          {/* Public Routes with Navbar */}
          <Route element={<UserLayout />}>
            <Route path="/" element={<Landing />} />
            <Route path="/register" element={<Register />} />
            <Route path="/login" element={<Login />} />
            <Route path="*" element={<NotFound />} />
          </Route>
          
          {/* Student Portal (With Sidebar) */}
          <Route element={<ProtectedRoute />}>
            <Route element={<StudentLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/exams" element={<ExamLibrary />} />
              <Route path="/quiz" element={<QuizSelect />} />
              <Route path="/quiz/:attemptId" element={<QuizActive />} />
              <Route path="/quiz/:attemptId/results" element={<QuizResults />} />
              <Route path="/credits" element={<Credits />} />
              <Route path="/payment-success" element={<PaymentSuccess />} />
              <Route path="/payment-fail" element={<PaymentFail />} />
            </Route>
          </Route>

          {/* Admin Routes (With Sidebar) */}
          <Route element={<ProtectedRoute adminOnly />}>
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="exams" element={<AdminExams />} />
              <Route path="questions" element={<AdminQuestions />} />
              <Route path="packs" element={<AdminPacks />} />
              <Route path="transactions" element={<AdminTransactions />} />
              <Route path="students" element={<AdminStudents />} />
            </Route>
          </Route>
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
