import { useState, useEffect } from 'react';
import API from '../api';

const MentorPanel = ({ user }) => {
  const [students, setStudents] = useState([]);
  const [grades, setGrades] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(null); // internship_id of saving item

  const fetchStudents = () => {
    setLoading(true);
    API.get(`/mentor/students/${user.id}`)
      .then(res => {
        setStudents(res.data);
        // Mavjud baholarni inputs ga yuklash
        const initial = {};
        res.data.forEach(s => {
          if (s.mentor_score !== null) initial[s.internship_id] = s.mentor_score;
        });
        setGrades(initial);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchStudents(); }, [user.id]);

  const submitGrade = async (internshipId) => {
    const score = grades[internshipId];
    if (score === undefined || score === '') return alert("Ball kiriting (0-100)");
    const num = Number(score);
    if (isNaN(num) || num < 0 || num > 100) return alert("Ball 0 dan 100 gacha bo'lishi kerak!");
    setSaving(internshipId);
    try {
      await API.put(`/mentor/grade/${internshipId}`, { score: num });
      alert(`Baho saqlandi: ${num}`);
      fetchStudents();
    } catch {
      alert('Xatolik yuz berdi!');
    } finally {
      setSaving(null);
    }
  };

  return (
    <div className="page">
      <h2 className="page-title">🏢 Mentor: {user.full_name}</h2>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 32, fontWeight: 700, color: '#2c3e50' }}>{students.length}</div>
          <div style={{ color: '#7f8c8d', fontSize: 14 }}>Biriktirilgan talabalar</div>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 32, fontWeight: 700, color: '#27ae60' }}>
            {students.filter(s => s.mentor_score !== null).length}
          </div>
          <div style={{ color: '#7f8c8d', fontSize: 14 }}>Baholangan</div>
        </div>
      </div>

      <div className="card">
        <h3 style={{ margin: '0 0 16px', color: '#2c3e50', fontSize: 16 }}>
          Talabalarni baholash (0–100 ball)
        </h3>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#7f8c8d' }}>
            <div className="spinner" style={{ margin: '0 auto 12px' }} />
            Yuklanmoqda...
          </div>
        ) : students.length === 0 ? (
          <p style={{ color: '#7f8c8d', textAlign: 'center', padding: 40 }}>
            Sizga hali talabalar biriktirilmagan.
          </p>
        ) : (
          students.map(s => (
            <div key={s.internship_id} className="grade-row">
              <div className="info">
                <h4>{s.student_name}</h4>
                <p>
                  📍 {s.verified_days} kun davomat &nbsp;·&nbsp;
                  📖 {s.journal_count} kundalik &nbsp;·&nbsp;
                  {s.mentor_score !== null
                    ? <span className="status-ok">✅ Baho: {s.mentor_score}</span>
                    : <span className="status-wait">⏳ Baholanmagan</span>
                  }
                </p>
              </div>
              <div className="controls">
                <input
                  type="number"
                  min="0"
                  max="100"
                  className="grade-input"
                  placeholder="0–100"
                  value={grades[s.internship_id] ?? ''}
                  onChange={e => setGrades({ ...grades, [s.internship_id]: e.target.value })}
                />
                <button
                  className="btn btn-success"
                  disabled={saving === s.internship_id}
                  onClick={() => submitGrade(s.internship_id)}
                >
                  {saving === s.internship_id ? '...' : 'Saqlash'}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default MentorPanel;
