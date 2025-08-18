import React, { useEffect, useState } from 'react';
import axios from 'axios';
import StudentSidebarNavigation from './StudentSidebarNavigation';
import "./StudentDashboard.css";

const StudentDashboard = ({ onLogout }) => {
  const [studentData, setStudentData] = useState({
    name: '',
    loading: true,
    error: null
  });

  useEffect(() => {
    const fetchStudentData = async () => {
      try {
        const student = JSON.parse(localStorage.getItem('student'));
        if (!student || !student.student_id) {
          throw new Error('Student data not found');
        }

        // First try to get name from localStorage
        if (student.name) {
          setStudentData({
            name: student.name,
            loading: false,
            error: null
          });
          return;
        }

        // Fallback to API if name not in localStorage
        const response = await axios.post(
          'http://localhost:8080/educonnect-backend/student/get_student_data.php',
          { student_id: student.student_id }
        );

        if (response.data.success) {
          setStudentData({
            name: response.data.name,
            loading: false,
            error: null
          });
          // Update localStorage with the name
          localStorage.setItem('student', JSON.stringify({
            ...student,
            name: response.data.name
          }));
        } else {
          throw new Error(response.data.message || 'Failed to fetch student data');
        }
      } catch (error) {
        console.error('Error:', error);
        setStudentData(prev => ({
          ...prev,
          loading: false,
          error: error.message
        }));
      }
    };

    fetchStudentData();
  }, []);

  return (
    <div className="student-dashboard-container">
      <StudentSidebarNavigation
        activeItem="Dashboard"
        onLogout={onLogout}
      />

      <div className="dashboard-content">
        <div className="dashboard-header">
          <h1 className="dashboard-title">Student Dashboard</h1>
        </div>

        {studentData.loading ? (
          <div className="loading-message">Loading...</div>
        ) : studentData.error ? (
          <div className="error-message">Error: {studentData.error}</div>
        ) : (
          <div className="welcome-section">
            <h2>Welcome Back, {studentData.name}</h2>
            <h5>Stay focused!</h5>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentDashboard;