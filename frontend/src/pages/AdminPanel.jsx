import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import API from '../api';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

function MapClickHandler({ onPick }) {
  useMapEvents({ click: e => onPick(e.latlng) });
  return null;
}

const ROLE_LABELS = { student: 'Talaba', teacher: "O'qituvchi", mentor: 'Mentor', admin: 'Admin' };
const ROLE_CLASSES = { student: 'role-student', teacher: 'role-teacher', mentor: 'role-mentor', admin: 'role-admin' };

const AdminPanel = () => {
  const [tab, setTab] = useState('users');

  // Foydalanuvchilar
  const [users, setUsers] = useState([]);
  const [newUser, setNewUser] = useState({ full_name: '', email: '', password: '', role: 'student' });

  // Korxonalar
  const [companies, setCompanies] = useState([]);
  const [comp, setComp] = useState({ name: '', lat: null, lng: null, radius: 200 });

  // Amaliyot bog'lash
  const [assign, setAssign] = useState({ student_id: '', teacher_id: '', company_id: '', mentor_id: '' });

  useEffect(() => {
    API.get('/admin/users').then(r => setUsers(r.data)).catch(() => {});
    API.get('/admin/companies').then(r => setCompanies(r.data)).catch(() => {});
  }, []);

  const handleAddUser = async (e) => {
    e.preventDefault();
    try {
      const res = await API.post('/admin/users', newUser);
      alert(`✅ ${res.data.message} (ID: ${res.data.id})`);
      setNewUser({ full_name: '', email: '', password: '', role: 'student' });
      const r = await API.get('/admin/users');
      setUsers(r.data);
    } catch (err) {
      alert('❌ ' + (err.response?.data?.message || 'Xatolik'));
    }
  };

  const handleAddCompany = async (e) => {
    e.preventDefault();
    if (!comp.lat || !comp.lng) return alert('Xaritadan joylashuvni tanlang!');
    try {
      const res = await API.post('/admin/companies', comp);
      alert(`✅ ${res.data.message} (ID: ${res.data.id})`);
      setComp({ name: '', lat: null, lng: null, radius: 200 });
      const r = await API.get('/admin/companies');
      setCompanies(r.data);
    } catch (err) {
      alert('❌ ' + (err.response?.data?.message || 'Xatolik'));
    }
  };

  const handleAssign = async (e) => {
    e.preventDefault();
    try {
      const res = await API.post('/admin/assign', assign);
      alert(`✅ ${res.data.message}`);
      setAssign({ student_id: '', teacher_id: '', company_id: '', mentor_id: '' });
    } catch (err) {
      alert('❌ ' + (err.response?.data?.message || 'ID-larni tekshiring'));
    }
  };

  const students  = users.filter(u => u.role === 'student');
  const teachers  = users.filter(u => u.role === 'teacher');
  const mentors   = users.filter(u => u.role === 'mentor');

  return (
    <div className="page">
      <h2 className="page-title">⚙️ Admin Boshqaruv Paneli</h2>

      {/* Statistika */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'Talabalar', count: students.length, color: '#27ae60' },
          { label: "O'qituvchilar", count: teachers.length, color: '#3498db' },
          { label: 'Mentorlar', count: mentors.length, color: '#e67e22' },
          { label: 'Korxonalar', count: companies.length, color: '#9b59b6' },
        ].map(item => (
          <div key={item.label} className="card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: item.color }}>{item.count}</div>
            <div style={{ fontSize: 13, color: '#7f8c8d' }}>{item.label}</div>
          </div>
        ))}
      </div>

      {/* Tab navigatsiya */}
      <div className="admin-tabs">
        {[
          ['users', '👥 Foydalanuvchilar'],
          ['companies', '🏢 Korxonalar'],
          ['assign', '🔗 Amaliyot bog\'lash'],
        ].map(([key, label]) => (
          <button
            key={key}
            className={`tab-btn ${tab === key ? 'active' : ''}`}
            onClick={() => setTab(key)}
          >{label}</button>
        ))}
      </div>

      {/* ─── Foydalanuvchilar tab ─── */}
      {tab === 'users' && (
        <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: 20, alignItems: 'start' }}>
          <div className="card">
            <h3 style={{ margin: '0 0 16px', fontSize: 16, color: '#2c3e50' }}>Yangi foydalanuvchi</h3>
            <form onSubmit={handleAddUser} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div className="form-group">
                <label>F.I.O</label>
                <input className="form-input" placeholder="To'liq ismi" value={newUser.full_name}
                  onChange={e => setNewUser({ ...newUser, full_name: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input className="form-input" type="email" placeholder="email@example.com" value={newUser.email}
                  onChange={e => setNewUser({ ...newUser, email: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Parol</label>
                <input className="form-input" type="password" placeholder="Parol" value={newUser.password}
                  onChange={e => setNewUser({ ...newUser, password: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Rol</label>
                <select className="form-input" value={newUser.role}
                  onChange={e => setNewUser({ ...newUser, role: e.target.value })}>
                  <option value="student">Talaba</option>
                  <option value="teacher">O'qituvchi</option>
                  <option value="mentor">Mentor</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <button type="submit" className="btn btn-success btn-full" style={{ marginTop: 4 }}>
                + Yaratish
              </button>
            </form>
          </div>

          <div className="card">
            <h3 style={{ margin: '0 0 16px', fontSize: 16, color: '#2c3e50' }}>
              Foydalanuvchilar ro'yxati ({users.length} ta)
            </h3>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>F.I.O</th>
                    <th>Email</th>
                    <th>Rol</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id}>
                      <td style={{ color: '#aaa' }}>{u.id}</td>
                      <td><b>{u.full_name}</b></td>
                      <td style={{ color: '#7f8c8d' }}>{u.email}</td>
                      <td>
                        <span className={`role-chip ${ROLE_CLASSES[u.role] || ''}`}>
                          {ROLE_LABELS[u.role] || u.role}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─── Korxonalar tab ─── */}
      {tab === 'companies' && (
        <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: 20, alignItems: 'start' }}>
          <div className="card">
            <h3 style={{ margin: '0 0 12px', fontSize: 16, color: '#2c3e50' }}>Yangi korxona</h3>
            <div style={{ height: 220, borderRadius: 8, overflow: 'hidden', marginBottom: 12 }}>
              <MapContainer center={[39.65, 66.96]} zoom={12} style={{ height: '100%' }}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <MapClickHandler onPick={ll => setComp(c => ({ ...c, lat: ll.lat, lng: ll.lng }))} />
                {comp.lat && <Marker position={[comp.lat, comp.lng]} />}
              </MapContainer>
            </div>
            <form onSubmit={handleAddCompany} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div className="form-group">
                <label>Korxona nomi</label>
                <input className="form-input" placeholder="Masalan: Texnopark" value={comp.name}
                  onChange={e => setComp({ ...comp, name: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Koordinata (xaritadan tanlang)</label>
                <input className="form-input" readOnly
                  value={comp.lat ? `${comp.lat.toFixed(5)}, ${comp.lng.toFixed(5)}` : 'Tanlang...'}
                  style={{ background: '#f8f9fa', color: '#555' }} />
              </div>
              <div className="form-group">
                <label>Radius (metr)</label>
                <input className="form-input" type="number" min={50} max={2000} value={comp.radius}
                  onChange={e => setComp({ ...comp, radius: Number(e.target.value) })} />
              </div>
              <button type="submit" className="btn btn-success btn-full">+ Saqlash</button>
            </form>
          </div>

          <div className="card">
            <h3 style={{ margin: '0 0 16px', fontSize: 16, color: '#2c3e50' }}>
              Korxonalar ({companies.length} ta)
            </h3>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr><th>ID</th><th>Nomi</th><th>Kenglik</th><th>Uzunlik</th><th>Radius</th></tr>
                </thead>
                <tbody>
                  {companies.map(c => (
                    <tr key={c.id}>
                      <td style={{ color: '#aaa' }}>{c.id}</td>
                      <td><b>{c.name}</b></td>
                      <td>{c.latitude.toFixed(4)}</td>
                      <td>{c.longitude.toFixed(4)}</td>
                      <td>{c.radius_meters} m</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─── Amaliyot bog'lash tab ─── */}
      {tab === 'assign' && (
        <div style={{ display: 'grid', gridTemplateColumns: '420px 1fr', gap: 20, alignItems: 'start' }}>
          <div className="card">
            <h3 style={{ margin: '0 0 16px', fontSize: 16, color: '#2c3e50' }}>Amaliyotni bog'lash</h3>
            <form onSubmit={handleAssign} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div className="form-group">
                <label>Talaba</label>
                <select className="form-input" value={assign.student_id}
                  onChange={e => setAssign({ ...assign, student_id: e.target.value })} required>
                  <option value="">— Tanlang —</option>
                  {students.map(u => (
                    <option key={u.id} value={u.id}>[{u.id}] {u.full_name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>O'qituvchi</label>
                <select className="form-input" value={assign.teacher_id}
                  onChange={e => setAssign({ ...assign, teacher_id: e.target.value })} required>
                  <option value="">— Tanlang —</option>
                  {teachers.map(u => (
                    <option key={u.id} value={u.id}>[{u.id}] {u.full_name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Korxona</label>
                <select className="form-input" value={assign.company_id}
                  onChange={e => setAssign({ ...assign, company_id: e.target.value })} required>
                  <option value="">— Tanlang —</option>
                  {companies.map(c => (
                    <option key={c.id} value={c.id}>[{c.id}] {c.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Mentor (ixtiyoriy)</label>
                <select className="form-input" value={assign.mentor_id}
                  onChange={e => setAssign({ ...assign, mentor_id: e.target.value })}>
                  <option value="">— Mentorsiz —</option>
                  {mentors.map(u => (
                    <option key={u.id} value={u.id}>[{u.id}] {u.full_name}</option>
                  ))}
                </select>
              </div>
              <button type="submit" className="btn btn-primary btn-full" style={{ marginTop: 4 }}>
                🔗 Bog'lash
              </button>
            </form>
          </div>

          <div className="card">
            <h3 style={{ margin: '0 0 12px', fontSize: 16, color: '#2c3e50' }}>Yo'riqnoma</h3>
            <p style={{ fontSize: 14, color: '#555', lineHeight: 1.8 }}>
              <b>Tartib:</b><br />
              1. Avval <b>Foydalanuvchilar</b> tabida talaba, o'qituvchi va mentor yarating.<br />
              2. <b>Korxonalar</b> tabida xaritadan korxona joylashuvini tanlang va saqlang.<br />
              3. Shu tabda talabani o'qituvchi va korxonaga bog'lang.<br /><br />
              <b>Eslatma:</b> Bir talabaga faqat bitta aktiv amaliyot biriktirilishi mumkin.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
