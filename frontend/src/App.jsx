import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import API from './api';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Journal from './pages/Journal';
import TeacherStats from './pages/TeacherStats';
import MentorPanel from './pages/MentorPanel';
import AdminPanel from './pages/AdminPanel';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { setLoading(false); return; }
    API.get('/me')
      .then(res => setUser(res.data))
      .catch(() => localStorage.clear())
      .finally(() => setLoading(false));
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    setUser(null);
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
        <p>Yuklanmoqda...</p>
      </div>
    );
  }

  const roleHome = {
    student: '/dashboard',
    teacher: '/teacher',
    mentor: '/mentor',
    admin: '/admin',
  };

  return (
    <Router>
      <div className="app-layout">
        <nav className="navbar">
          <div className="navbar-brand">🎓 Amaliyot-LMS</div>

          <div className="navbar-links">
            {user?.role === 'student' && (
              <>
                <Link to="/dashboard" className="nav-link">📍 Monitoring</Link>
                <Link to="/journal" className="nav-link">📖 Kundalik</Link>
              </>
            )}
            {user?.role === 'teacher' && (
              <Link to="/teacher" className="nav-link">📊 O'qituvchi Paneli</Link>
            )}
            {user?.role === 'mentor' && (
              <Link to="/mentor" className="nav-link">🏢 Mentor Paneli</Link>
            )}
            {user?.role === 'admin' && (
              <Link to="/admin" className="nav-link">⚙️ Admin Panel</Link>
            )}
          </div>

          <div className="navbar-user">
            {user ? (
              <>
                <span className="user-badge">
                  {{student:'👨‍🎓', teacher:'👨‍🏫', mentor:'🏢', admin:'👤'}[user.role] || '👤'}
                  {' '}{user.full_name}
                </span>
                <button onClick={handleLogout} className="btn-logout">Chiqish</button>
              </>
            ) : (
              <Link to="/" className="nav-link">Kirish</Link>
            )}
          </div>
        </nav>

        <main className="main-content">
          <Routes>
            <Route path="/" element={
              user ? <Navigate to={roleHome[user.role] || '/dashboard'} /> : <Login setUser={setUser} />
            } />
            <Route path="/dashboard" element={
              user?.role === 'student' ? <Dashboard user={user} /> : <Navigate to="/" />
            } />
            <Route path="/journal" element={
              user?.role === 'student' ? <Journal user={user} /> : <Navigate to="/" />
            } />
            <Route path="/teacher" element={
              user?.role === 'teacher' ? <TeacherStats user={user} /> : <Navigate to="/" />
            } />
            <Route path="/mentor" element={
              user?.role === 'mentor' ? <MentorPanel user={user} /> : <Navigate to="/" />
            } />
            <Route path="/admin" element={
              user?.role === 'admin' ? <AdminPanel /> : <Navigate to="/" />
            } />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
