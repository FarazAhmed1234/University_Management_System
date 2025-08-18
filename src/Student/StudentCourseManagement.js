import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Search, X, Clock, Calendar } from 'lucide-react';
import StudentSidebar from './StudentSidebarNavigation';
import './StudentCourseManagement.css';

const StudentCourseManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [courses, setCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const API = 'http://localhost:8080/educonnect-backend';

  // Get student info from local storage
  const student = JSON.parse(localStorage.getItem('student'));
  const studentId = student?.student_id;
  const userName = student?.name;
  const userEmail = student?.email;

  const fetchCourses = useCallback(async () => {
    if (!studentId) {
      setError('Student not authenticated');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API}/student/get_courses.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_id: studentId }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to fetch enrolled courses');
      }

      // Match the PHP response structure
      setCourses(data.data?.courses || []);
    } catch (err) {
      console.error('Fetch Error:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [API, studentId]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  

  const filteredCourses = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return courses.filter((course) =>
      course.name?.toLowerCase().includes(term) ||
      course.code?.toLowerCase().includes(term) ||
      course.department?.toLowerCase().includes(term) ||
      course.teacher?.toLowerCase().includes(term)
    );
  }, [courses, searchTerm]);

  const handleLogout = () => {
    localStorage.removeItem('student');
    window.location.href = '/';
  };

  return (
    <div className="student-dashboard">
      <StudentSidebar active="courses" userName={userName} onLogout={handleLogout} />

      <main className="student-course-management" style={{ marginLeft: '250px' }}>
        <div className="student-course-header">
          <h1>My Enrolled Courses</h1>
          <h3 style={{ marginTop: '5px', color: '#666' }}>
            Student ID: <strong>{studentId || 'N/A'}</strong> | Email: <strong>{userEmail || 'N/A'}</strong>
          </h3>
        </div>

        {error && (
          <div className="student-error-alert">
            <span>{error}</span>
            <button onClick={() => setError(null)}><X size={16} /></button>
          </div>
        )}

        <div className="student-search-container">
          <div className="student-search-box">
            <Search size={18} className="student-search-icon" />
            <input
              type="text"
              placeholder="Search courses by name, code, department, or teacher..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              disabled={isLoading}
              className="student-search-input"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="student-loading">
            <div className="student-spinner"></div>
            <p>Loading enrolled courses...</p>
          </div>
        ) : filteredCourses.length === 0 ? (
          <div className="student-empty-state">
            <p>{searchTerm ? 'No matching courses found' : 'No courses enrolled yet'}</p>
            <button onClick={fetchCourses} className="student-refresh-btn">Try Again</button>
          </div>
        ) : (
          <div className="student-course-list">
            {filteredCourses.map((course, index) => (
              <div key={index} className="student-course-card" style={{ width: '410px', height: '290px' }}>
                <div className="student-course-card-header">
                  <div>
                    <h3 className="student-course-title">{course.name}</h3>
                    <p className="student-course-code">{course.code}</p>
                  </div>
                </div>

                <p className="student-course-description">{course.description || 'No description available'}</p>

                <div className="student-course-details">
                  <div className="student-course-detail">
                    <Clock size={16} />
                    <span>Credit Hours: <strong>{course.credits || 'N/A'}</strong></span>
                  </div>
                  <div className="student-course-detail">
                    <Calendar size={16} />
                    <span>Semester: <strong>{course.semester || 'N/A'}</strong></span>
                  </div>
                </div>

                <div className="student-course-footer">
                  <span className="student-course-department">{course.department || 'General'}</span><br />
                  <span className="student-course-teacher">Teacher: {course.teacher || 'Not assigned'}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default StudentCourseManagement;