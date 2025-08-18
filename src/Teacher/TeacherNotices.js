import React, { useEffect, useState } from 'react';
import './TeacherNotices.css';
import TeacherSidebar from './TeacherSidebarNavigation';
import { Calendar, X } from 'lucide-react';

const TeacherNotices = () => {
  const [notices, setNotices] = useState([]);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const API = 'http://localhost:8080/educonnect-backend';
  const teacher = JSON.parse(localStorage.getItem('teacher'));
  const userName = teacher?.name;

  useEffect(() => {
    const fetchNotices = async () => {
      try {
        const res = await fetch(`${API}/teacher/get_notices.php`);
        const data = await res.json();

        if (!res.ok || !data.success) {
          throw new Error(data.message || 'Failed to fetch notices');
        }

        const filtered = data.notices.filter(
          (notice) => notice.audience === 'All' || notice.audience === 'Faculty'
        );

        setNotices(filtered);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNotices();
  }, [API]);

  const handleLogout = () => {
    localStorage.removeItem('teacher');
    window.location.href = '/';
  };

  return (
    <div className="teacher-dashboard">
      <TeacherSidebar active="notices" userName={userName} onLogout={handleLogout} />

      <main className="teacher-notices-main" style={{ marginLeft: '250px' }}>
        <div className="teacher-notices-header">
          <h1>Notices</h1>
        </div>

        {error && (
          <div className="teacher-error-alert">
            <span>{error}</span>
            <button onClick={() => setError(null)}><X size={16} /></button>
          </div>
        )}

        {isLoading ? (
          <div className="teacher-loading">
            <div className="teacher-spinner"></div>
            <p>Loading notices...</p>
          </div>
        ) : notices.length === 0 ? (
          <div className="teacher-empty-state">
            <p>No notices found for faculty</p>
          </div>
        ) : (
          <div className="teacher-notices-list">
            {notices.map((notice, index) => (
              <div key={index} className="teacher-notice-card">
                <h3 className="notice-title">{notice.title}</h3>
                <p className="notice-author">By: {notice.author}</p>
                <p className="notice-content">{notice.content}</p>
                <div className="notice-footer">
                  <span className="notice-audience">Audience: {notice.audience}</span>
                  <span className="notice-date">
                    <Calendar size={14} /> {notice.date}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default TeacherNotices;
