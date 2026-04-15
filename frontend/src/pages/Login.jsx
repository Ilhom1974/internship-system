import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api';

const ROLE_ROUTES = {
  student: '/dashboard',
  teacher: '/teacher',
  mentor: '/mentor',
  admin: '/admin',
};

const Login = ({ setUser }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await API.post('/login', { email, password });
      localStorage.setItem('token', res.data.token);
      const userRes = await API.get('/me');
      setUser(userRes.data);
      navigate(ROLE_ROUTES[userRes.data.role] || '/dashboard');
    } catch {
      setError("Email yoki parol xato!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-box">
        <h1>🎓 Amaliyot-LMS</h1>
        <p className="login-subtitle">Amaliyot boshqaruv axborot tizimi</p>

        {error && <div className="error-msg">{error}</div>}

        <form onSubmit={handleLogin}>
          <input
            type="email"
            placeholder="Email manzil"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
          <input
            type="password"
            placeholder="Parol"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
          <button type="submit" disabled={loading}>
            {loading ? 'Kirilmoqda...' : 'Tizimga kirish'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
