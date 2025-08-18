import React, { useEffect, useState } from 'react';
import axios from 'axios';
import TeacherSidebarNavigation from './TeacherSidebarNavigation';
import "./TeacherDashboard.css";

const TeacherDashboard = ({ onLogout }) => {
  const [teacherData, setTeacherData] = useState({
    name: '',
    totalClasses: 0,
    loading: true
  });

  useEffect(() => {
    const teacher = JSON.parse(localStorage.getItem('teacher'));
    if (teacher) {
      setTeacherData(prev => ({ ...prev, name: teacher.name, loading: false }));
      
      // Fetch additional data if needed
      axios.post("http://localhost/educonnect-backend/teacher/get_teacher_name.php", {
        teacher_name: teacher.name
      })
      .then(res => {
        if (res.data) {
          setTeacherData(prev => ({
            ...prev,
            totalClasses: res.data.total || 0
          }));
        }
      })
      .catch(err => console.error("Error fetching teacher data:", err));
    }
  }, []);

  return (
    <div className="teacher-dashboard-container">
      <TeacherSidebarNavigation
        activeItem="Dashboard"
        onLogout={onLogout}
      />

      <div className="dashboard-content">
        <div className="dashboard-header">
          <h1 className="dashboard-title">Teacher Dashboard</h1>
          <div className="academic-year">Academic Year 2024-25</div>
        </div>

        <div className="welcome-section">
          <h2>Welcome back, {teacherData.name}</h2>
          <p>Ready to inspire minds today?</p>
        </div>

    
        
      </div>
    </div>
  );
};

export default TeacherDashboard;