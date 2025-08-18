import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Search, X, Clock, Calendar } from 'lucide-react';
import TeacherSidebar from './TeacherSidebarNavigation';
import './TeacherCourseManagement.css';

const TeacherCourseManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [courses, setCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const API = 'http://localhost:8080/educonnect-backend';

  // ✅ Get teacher info from local storage
  const teacher = JSON.parse(localStorage.getItem('teacher'));
  const teacherId = teacher?.teacher_id;
  const userName = teacher?.name;
  const userEmail = teacher?.email;


  
  const fetchCourses = useCallback(async () => {
    if (!teacherId) {
      setError('Teacher not authenticated');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API}/teacher/get_courses.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teacher_id: teacher.teacher_id }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to fetch courses');
      }

      setCourses(data.courses || []);
    } catch (err) {
      console.error('Fetch Error:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [API, teacherId]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  const filteredCourses = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return courses.filter((course) =>
      course.name?.toLowerCase().includes(term) ||
      course.code?.toLowerCase().includes(term) ||
      course.department?.toLowerCase().includes(term)
    );
  }, [courses, searchTerm]);

  const handleLogout = () => {
    localStorage.removeItem('teacher');
    window.location.href = '/';
  };

  return (
    <div className="teacher-dashboard">
      <TeacherSidebar active="courses" userName={userName} onLogout={handleLogout} />

      <main className="teacher-course-management" style={{ marginLeft: '250px' }}>
        <div className="teacher-course-header">
          <h1>Course Management</h1>
         
          <h3 style={{ marginTop: '5px', color: '#666' }}>
            Teacher ID: <strong>{teacherId || 'N/A'}</strong> | Email: <strong>{userEmail || 'N/A'}</strong>
          </h3>
        </div>

        {error && (
          <div className="teacher-error-alert">
            <span>{error}</span>
            <button onClick={() => setError(null)}><X size={16} /></button>
          </div>
        )}

        <div className="teacher-search-container">
          <div className="teacher-search-box">
            <Search size={18} className="teacher-search-icon" />
            <input
              type="text"
              placeholder="Search courses by name, code, or department..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              disabled={isLoading}
              className="teacher-search-input"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="teacher-loading">
            <div className="teacher-spinner"></div>
            <p>Loading courses...</p>
          </div>
        ) : filteredCourses.length === 0 ? (
          <div className="teacher-empty-state">
            <p>{searchTerm ? 'No matching courses found' : 'No courses assigned yet'}</p>
            <button onClick={fetchCourses} className="teacher-refresh-btn">Try Again</button>
          </div>
        ) : (
          <div className="teacher-course-list">
            {filteredCourses.map((course, index) => (
              <div key={index} className="teacher-course-card" style={{ width: '410px', height: '290px' }}>
                <div className="teacher-course-card-header">
                  <div>
                    <h3 className="teacher-course-title">{course.name}</h3>
                    <p className="teacher-course-code">{course.code}</p>
                  </div>
                </div>

                <p className="teacher-course-description">{course.description || 'No description available'}</p>

                <div className="teacher-course-details">
                  <div className="teacher-course-detail">
                    <Clock size={16} />
                    <span>Credit Hours: <strong>{course.credit_hours || 'N/A'}</strong></span>
                  </div>
                  <div className="teacher-course-detail">
                    <Calendar size={16} />
                    <span>Semester: <strong>{course.semester || 'N/A'}</strong></span>
                  </div>
                </div>

                <div className="teacher-course-footer">
                  <span className="teacher-course-department" style={{marginLeft:"-150px"}}>{course.department || 'General'}</span>
                  <button className="teacher-manage-btn" style={{marginRight:"-70px"}}>Manage Course</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default TeacherCourseManagement;
