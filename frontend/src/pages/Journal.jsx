import { useState, useEffect } from 'react';
import API from '../api';

const Journal = ({ user }) => {
  const [content, setContent] = useState('');
  const [journals, setJournals] = useState([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const internshipId = user?.internship_id;

  useEffect(() => {
    if (!internshipId) { setLoading(false); return; }
    API.get(`/student/journals/${internshipId}`)
      .then(res => setJournals(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [internshipId]);

  const saveJournal = async () => {
    if (!content.trim()) return alert("Matn bo'sh bo'lmasin!");
    if (!internshipId) return alert("Amaliyot biriktirilmagan!");
    setSaving(true);
    try {
      await API.post('/journal', { internship_id: internshipId, content });
      alert('Kundalik saqlandi!');
      setContent('');
      const res = await API.get(`/student/journals/${internshipId}`);
      setJournals(res.data);
    } catch {
      alert('Xatolik yuz berdi!');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page">
      <h2 className="page-title">📖 Kundalik Hisobot</h2>

      {!internshipId ? (
        <div className="error-msg">
          Sizga amaliyot biriktirilmagan. Administrator bilan bog'laning.
        </div>
      ) : (
        <>
          {/* Yozish formasi */}
          <div className="card" style={{ marginBottom: 24 }}>
            <h3 style={{ margin: '0 0 12px', color: '#2c3e50', fontSize: 16 }}>
              Bugungi hisobotni yozing
            </h3>
            <textarea
              rows={6}
              style={{
                width: '100%',
                padding: '12px',
                border: '1.5px solid #e0e0e0',
                borderRadius: 8,
                fontSize: 14,
                resize: 'vertical',
                outline: 'none',
                boxSizing: 'border-box',
                fontFamily: 'inherit',
                lineHeight: 1.6,
              }}
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="Bugun bajargan ishlaringizni, o'rganganlaringizni yozing..."
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
              <span style={{ fontSize: 12, color: '#aaa' }}>{content.length} belgi</span>
              <button
                onClick={saveJournal}
                disabled={saving || !content.trim()}
                className="btn btn-success"
              >
                {saving ? 'Saqlanmoqda...' : '💾 Saqlash'}
              </button>
            </div>
          </div>

          {/* Yozuvlar tarixi */}
          <h3 style={{ color: '#2c3e50', margin: '0 0 12px', fontSize: 16 }}>
            📋 Oldingi yozuvlar ({journals.length} ta)
          </h3>

          {loading ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#7f8c8d' }}>
              <div className="spinner" style={{ margin: '0 auto 12px' }} />
              Yuklanmoqda...
            </div>
          ) : journals.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', color: '#7f8c8d', padding: 40 }}>
              Hali yozuvlar yo'q. Birinchi hisobotingizni yozing!
            </div>
          ) : (
            <div className="journal-list">
              {journals.map(j => (
                <div key={j.id} className="journal-entry">
                  <div className="date">
                    📅 {j.entry_date} &nbsp;·&nbsp;
                    {new Date(j.created_at).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <div className="text">{j.content}</div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Journal;
