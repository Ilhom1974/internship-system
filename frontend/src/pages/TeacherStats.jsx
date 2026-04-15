import { useState, useEffect } from 'react';
import API from '../api';

const TeacherStats = ({ user }) => {
  const [students, setStudents] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get(`/teacher/stats/${user.id}`)
      .then(res => setStudents(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user.id]);

  const loadAnalysis = async (student) => {
    try {
      const res = await API.get(`/student/score/${student.internship_id}`);
      setSelected(res.data);
    } catch {
      alert("Ma'lumot topilmadi");
    }
  };

  return (
    <div className="page">
      <h2 className="page-title">📊 O'qituvchi: {user.full_name}</h2>

      <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 1fr' : '1fr', gap: 20 }}>
        {/* Talabalar ro'yxati */}
        <div className="card">
          <h3 style={{ margin: '0 0 16px', fontSize: 16, color: '#2c3e50' }}>
            Biriktirilgan talabalar ({students.length} ta)
          </h3>

          {loading ? (
            <div style={{ textAlign: 'center', padding: 40 }}>
              <div className="spinner" style={{ margin: '0 auto 12px' }} />
              <p style={{ color: '#7f8c8d' }}>Yuklanmoqda...</p>
            </div>
          ) : students.length === 0 ? (
            <p style={{ color: '#7f8c8d', textAlign: 'center', padding: 40 }}>
              Sizga biriktirilgan talabalar yo'q.
            </p>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Talaba</th>
                    <th>Korxona</th>
                    <th>Davomat</th>
                    <th>Kundalik</th>
                    <th>Mentor</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {students.map(s => (
                    <tr key={s.internship_id}>
                      <td><b>{s.student_name}</b></td>
                      <td style={{ color: '#7f8c8d', fontSize: 13 }}>{s.company_name}</td>
                      <td>
                        <span style={{ fontWeight: 600, color: s.verified_days > 0 ? '#27ae60' : '#aaa' }}>
                          {s.verified_days} kun
                        </span>
                      </td>
                      <td>
                        <span style={{ fontWeight: 600, color: s.journal_count > 0 ? '#3498db' : '#aaa' }}>
                          {s.journal_count} ta
                        </span>
                      </td>
                      <td>
                        {s.mentor_score !== null
                          ? <span className="status-ok">{s.mentor_score}</span>
                          : <span className="status-wait">—</span>
                        }
                      </td>
                      <td>
                        <button
                          className="btn btn-primary"
                          style={{ padding: '5px 12px', fontSize: 13 }}
                          onClick={() => loadAnalysis(s)}
                        >
                          Tahlil
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Tanlangan talaba tahlili */}
        {selected && (
          <div className="card" style={{ border: '2px solid #27ae60' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: 16, color: '#2c3e50' }}>
                Tahlil: {selected.student_name}
              </h3>
              <button className="btn btn-danger" style={{ padding: '4px 10px', fontSize: 13 }}
                onClick={() => setSelected(null)}>✕</button>
            </div>

            <div className="score-grid">
              <div className="score-item">
                <div className="label">📍 Davomat</div>
                <div className="value">{selected.attendance_score}</div>
                <div style={{ fontSize: 11, color: '#999', marginTop: 4 }}>
                  {selected.verified_days}/{selected.total_days} kun
                </div>
              </div>
              <div className="score-item">
                <div className="label">📖 Kundalik</div>
                <div className="value">{selected.journal_score}</div>
                <div style={{ fontSize: 11, color: '#999', marginTop: 4 }}>
                  {selected.journal_count} yozuv
                </div>
              </div>
              <div className="score-item">
                <div className="label">🏢 Mentor</div>
                <div className="value">
                  {selected.mentor_graded ? selected.mentor_score : '—'}
                </div>
                <div style={{ fontSize: 11, color: '#999', marginTop: 4 }}>
                  {selected.mentor_graded ? 'baholangan' : 'kutilmoqda'}
                </div>
              </div>
            </div>

            <div className="score-final">
              <div className="label">YAKUNIY BALL (D×0.3 + K×0.3 + M×0.4)</div>
              <div className="value">{selected.final_score}</div>
            </div>

            {!selected.mentor_graded && (
              <p style={{ marginTop: 12, fontSize: 13, color: '#e67e22', textAlign: 'center' }}>
                ⚠️ Mentor bahosi kiritilmagan — yakuniy ball to'liq emas
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TeacherStats;
