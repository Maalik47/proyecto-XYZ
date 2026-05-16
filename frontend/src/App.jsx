import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Teams from './pages/Teams';
import Tasks from './pages/Tasks';
import Calendar from './pages/Calendar';
import Chat from './pages/Chat';
import Files from './pages/Files';
import AdminUsers from './pages/AdminUsers';
import AdminDashboard from './pages/AdminDashboard';
import Profile from './pages/Profile';
import TeamTasks from './pages/TeamTasks';
import './App.css';

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading"></div>;
  return user ? children : <Navigate to="/login" />;
};

const HomeRedirect = () => {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading"></div>;
  if (!user) return <Navigate to="/login" />;
  
  if (user.role === 'admin') {
    return <Navigate to="/admin/dashboard" />;
  }
  return <Navigate to="/teams" />;
};

const App = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<HomeRedirect />} />
          <Route path="/dashboard" element={
            <PrivateRoute>
              <Navbar />
              <main className="main-content">
                <Dashboard />
              </main>
            </PrivateRoute>
          } />
          <Route path="/teams" element={
            <PrivateRoute>
              <Navbar />
              <main className="main-content">
                <Teams />
              </main>
            </PrivateRoute>
          } />
          <Route path="/teams/:teamId/tasks" element={
            <PrivateRoute>
              <Navbar />
              <main className="main-content">
                <TeamTasks />
              </main>
            </PrivateRoute>
          } />
          <Route path="/calendar" element={
            <PrivateRoute>
              <Navbar />
              <main className="main-content">
                <Calendar />
              </main>
            </PrivateRoute>
          } />
          <Route path="/chat" element={
            <PrivateRoute>
              <Navbar />
              <main className="main-content">
                <Chat />
              </main>
            </PrivateRoute>
          } />
          <Route path="/files" element={
            <PrivateRoute>
              <Navbar />
              <main className="main-content">
                <Files />
              </main>
            </PrivateRoute>
          } />
          <Route path="/profile" element={
            <PrivateRoute>
              <Navbar />
              <main className="main-content">
                <Profile />
              </main>
            </PrivateRoute>
          } />
          <Route path="/admin/users" element={
            <PrivateRoute>
              <Navbar />
              <main className="main-content">
                <AdminUsers />
              </main>
            </PrivateRoute>
          } />
          <Route path="/admin/dashboard" element={
            <PrivateRoute>
              <Navbar />
              <main className="main-content">
                <AdminDashboard />
              </main>
            </PrivateRoute>
          } />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
