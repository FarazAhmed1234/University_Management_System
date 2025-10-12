import React, { useEffect, useState } from 'react';
import './StudentNotices.css';
import StudentSidebar from './StudentSidebarNavigation';
import { Calendar, X } from 'lucide-react';

const StudentNotices = () => {
  const [notices, setNotices] = useState([]);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const API = 'http://educonnect.atwebpages.com/educonnect-backend';
  const student = JSON.parse(localStorage.getItem('student'));
  const userName = student?.name;

  useEffect(() => {
    const fetchNotices = async () => {
      try {
        const res = await fetch(`${API}/student/get_notices.php`);
        const data = await res.json();

        if (!res.ok || !data.success) {
          throw new Error(data.message || 'Failed to fetch notices');
        }

        const filtered = data.notices.filter(
          (notice) => notice.audience === 'All' || notice.audience === 'Student'
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
    localStorage.removeItem('student');
    window.location.href = '/';
  };

  return (
    <div className="student-dashboard">
      <StudentSidebar active="notices" userName={userName} onLogout={handleLogout} />

      <main className="student-notices-main" style={{ marginLeft: '250px' }}>
        <div className="student-notices-header">
          <h1>Notices</h1>
        </div>

        {error && (
          <div className="student-error-alert">
            <span>{error}</span>
            <button onClick={() => setError(null)}><X size={16} /></button>
          </div>
        )}

        {isLoading ? (
          <div className="student-loading">
            <div className="student-spinner"></div>
            <p>Loading notices...</p>
          </div>
        ) : notices.length === 0 ? (
          <div className="student-empty-state">
            <p>No notices found for students</p>
          </div>
        ) : (
          <div className="student-notices-list">
            {notices.map((notice, index) => (
              <div key={index} className="student-notice-card">
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

export default StudentNotices;