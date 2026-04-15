import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Circle } from 'react-leaflet';
import API from '../api';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Leaflet default icon xatosini tuzatish
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const Dashboard = ({ user }) => {
  const [position, setPosition] = useState(null);
  const [company, setCompany] = useState(null);
  const [status, setStatus] = useState({ msg: '', color: 'gray' });
  const [score, setScore] = useState(null);
  const [activeTab, setActiveTab] = useState('map'); // 'map' | 'score'

  useEffect(() => {
    // GPS kuzatuv
    const watchId = navigator.geolocation.watchPosition(
      pos => setPosition([pos.coords.latitude, pos.coords.longitude]),
      err => console.error('Geolocation xatosi:', err),
      { enableHighAccuracy: true }
    );

    // Biriktirilgan korxonani olish
    if (user.internship_id) {
      API.get(`/internship/${user.internship_id}/company`)
        .then(res => setCompany(res.data))
        .catch(() => {});

      API.get(`/student/score/${user.internship_id}`)
        .then(res => setScore(res.data))
        .catch(() => {});
    }

    return () => navigator.geolocation.clearWatch(watchId);
  }, [user.internship_id]);

  const handleCheckIn = async () => {
    if (!position) return alert('Geolokatsiya aniqlanmadi. Biroz kuting.');
    if (!user.internship_id) return alert('Sizga amaliyot biriktirilmagan!');
    try {
      const res = await API.post('/check-in', {
        internship_id: user.internship_id,
        lat: position[0],
        lng: position[1],
      });
      setStatus({
        msg: res.data.verified
          ? `✅ Tasdiqlandi! (${company?.name})`
          : `❌ Hududdan tashqari! Masofa: ${res.data.distance} m`,
        color: res.data.verified ? 'green' : 'red',
      });
      // Ballni yangilash
      const scoreRes = await API.get(`/student/score/${user.internship_id}`);
      setScore(scoreRes.data);
    } catch {
      setStatus({ msg: 'Serverda xatolik yuz berdi!', color: 'red' });
    }
  };

  return (
    <div className="page">
      <h2 className="page-title">Xush kelibsiz, {user.full_name}!</h2>

      {!user.internship_id && (
        <div className="error-msg" style={{ marginBottom: 20 }}>
          Sizga hali amaliyot biriktirilmagan. Administrator bilan bog'laning.
        </div>
      )}

      {/* Tab tugmalari */}
      <div className="admin-tabs" style={{ marginBottom: 20 }}>
        <button
          className={`tab-btn ${activeTab === 'map' ? 'active' : ''}`}
          onClick={() => setActiveTab('map')}
        >📍 GPS Monitoring</button>
        <button
          className={`tab-btn ${activeTab === 'score' ? 'active' : ''}`}
          onClick={() => setActiveTab('score')}
        >📊 Ballim</button>
      </div>

      {/* GPS xarita va check-in */}
      {activeTab === 'map' && (
        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
          <div style={{ flex: '2 1 400px' }}>
            {position ? (
              <MapContainer
                center={position}
                zoom={16}
                style={{ height: 450, borderRadius: 12 }}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://openstreetmap.org">OpenStreetMap</a>'
                />
                <Marker position={position} />
                {company && (
                  <Circle
                    center={[company.latitude, company.longitude]}
                    radius={company.radius_meters}
                    pathOptions={{ color: status.color === 'green' ? '#27ae60' : status.color === 'red' ? '#e74c3c' : '#3498db', fillOpacity: 0.15 }}
                  />
                )}
              </MapContainer>
            ) : (
              <div className="card" style={{ height: 450, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7f8c8d' }}>
                <div>
                  <div className="spinner" style={{ margin: '0 auto 16px' }} />
                  <p>Geolokatsiya aniqlanmoqda...</p>
                </div>
              </div>
            )}
          </div>

          <div className="card" style={{ flex: '1 1 250px' }}>
            <h3 style={{ margin: '0 0 16px', color: '#2c3e50' }}>Monitoring Kontrol</h3>

            {company && (
              <div style={{ marginBottom: 14, padding: '10px 14px', background: '#f0f7ff', borderRadius: 8, fontSize: 14 }}>
                <b>🏢 Korxona:</b> {company.name}<br />
                <span style={{ color: '#7f8c8d' }}>Radius: {company.radius_meters} m</span>
              </div>
            )}

            {position && (
              <div style={{ marginBottom: 14, padding: '10px 14px', background: '#f0faf5', borderRadius: 8, fontSize: 13, color: '#555' }}>
                📍 {position[0].toFixed(5)}, {position[1].toFixed(5)}
              </div>
            )}

            <p style={{ fontSize: 14, marginBottom: 14 }}>
              Holat:{' '}
              <b style={{ color: status.color }}>
                {status.msg || 'Kutilmoqda...'}
              </b>
            </p>

            <button
              onClick={handleCheckIn}
              className="checkin-btn"
              disabled={!position || !user.internship_id}
            >
              📍 Check-in (Tasdiqlash)
            </button>

            <button
              onClick={() => setActiveTab('score')}
              className="btn btn-blue btn-full"
              style={{ padding: 12 }}
            >
              📊 Ballimni ko'rish
            </button>
          </div>
        </div>
      )}

      {/* Ball ko'rinishi */}
      {activeTab === 'score' && (
        <div className="card" style={{ maxWidth: 500 }}>
          <h3 style={{ margin: '0 0 20px', color: '#2c3e50' }}>📊 Mening Ballim</h3>
          {score ? (
            <>
              <div className="score-grid">
                <div className="score-item">
                  <div className="label">📍 Davomat</div>
                  <div className="value">{score.attendance_score}</div>
                  <div style={{ fontSize: 11, color: '#999', marginTop: 4 }}>
                    {score.verified_days}/{score.total_days} kun
                  </div>
                </div>
                <div className="score-item">
                  <div className="label">📖 Kundalik</div>
                  <div className="value">{score.journal_score}</div>
                  <div style={{ fontSize: 11, color: '#999', marginTop: 4 }}>
                    {score.journal_count} yozuv
                  </div>
                </div>
                <div className="score-item">
                  <div className="label">🏢 Mentor</div>
                  <div className="value">
                    {score.mentor_graded ? score.mentor_score : '—'}
                  </div>
                  <div style={{ fontSize: 11, color: '#999', marginTop: 4 }}>
                    {score.mentor_graded ? 'baholangan' : 'kutilmoqda'}
                  </div>
                </div>
              </div>
              <div className="score-final">
                <div className="label">YAKUNIY BALL (D×0.3 + K×0.3 + M×0.4)</div>
                <div className="value">{score.final_score}</div>
              </div>
            </>
          ) : (
            <p style={{ color: '#7f8c8d', textAlign: 'center' }}>
              {user.internship_id ? 'Ma\'lumot yuklanmoqda...' : 'Amaliyot biriktirilmagan'}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
