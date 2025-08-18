import React, { useState } from 'react';
import './App.css';
import AdminLogin from './Login/AdminLogin';
import TeacherLogin from './Login/TeacherLogin';
import StudentLogin from './Login/StudentLogin';
import AdminDashboard from './Admin/AdminDashboard';

const Dashboard = () => {
  const [selectedRole, setSelectedRole] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState('');
  const [userName, setUserName] = useState('');

  const handleLogin = (role, name) => {
    setUserRole(role);
    setUserName(name);
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUserRole('');
    setUserName('');
    setSelectedRole(null);
  };

  const handleRoleSelection = (role) => {
    setSelectedRole(role);
  };

  const handleBackToHome = () => {
    setSelectedRole(null);
  };

  if (isLoggedIn) {
    if (userRole === 'admin') {
      return <AdminDashboard userName={userName} onLogout={handleLogout} />;
    }

    return (
      <div className="page-background container">
        <h2>Welcome {userName} ({userRole})</h2>
        <button className="btn-outline" onClick={handleLogout}>Logout</button>
      </div>
    );
  }

  if (selectedRole === 'admin') {
    return <AdminLogin onBack={handleBackToHome} onLogin={handleLogin} />;
  }

  if (selectedRole === 'teacher') {
    return <TeacherLogin onBack={handleBackToHome} onLogin={handleLogin} />;
  }

  if (selectedRole === 'student') {
    return <StudentLogin onBack={handleBackToHome} onLogin={handleLogin} />;
  }

  return (
    <div className="page-background">
      <header className="header">
        <img
          src="https://img.icons8.com/fluency/96/graduation-cap.png"
          alt="EduConnect Logo"
          className="logo-image"
        />
        <h1 className="header-title">EduConnect Portal</h1>
        <span className="badge">University Management System</span>
      </header>

      <section className="hero">
        <h2>
          Welcome to Your <br /><span>Digital Campus</span>
        </h2>
        <p>
          Connect, learn, and excel with our university management platform.
          Designed for administrators, teachers, and students to collaborate seamlessly.
        </p>

        <section className="card-section">
          <div className="role-card admin-hover" onClick={() => handleRoleSelection('admin')}>
            <div className="role-icon admin-icon">🛡️</div>
            <h3>Administrator</h3>
            <p>Complete system management and oversight</p>
            <ul>
              <li>Manage users and permissions</li>
              <li>Oversee courses and departments</li>
              <li>Generate reports and analytics</li>
              <li>System configuration</li>
            </ul>
          </div>

          <div className="role-card teacher-hover" onClick={() => handleRoleSelection('teacher')}>
            <div className="role-icon teacher-icon">👨‍🏫</div>
            <h3>Teacher</h3>
            <p>Educate and evaluate student progress</p>
            <ul>
              <li>Create and manage courses</li>
              <li>Upload materials and assignments</li>
              <li>Grade student submissions</li>
              <li>Track student progress</li>
            </ul>
          </div>

          <div className="role-card student-hover" onClick={() => handleRoleSelection('student')}>
            <div className="role-icon student-icon" style={{    width: "60px" , height: "60px"
   , margin: "0 auto 1rem"
   , borderRadius: "50%"
   , fontSize: "32px"
    , lineHeight: "60px"}}>📘</div>
            <h3>Student</h3>
            <p>Access courses and track your learning journey</p>
            <ul>
              <li>View enrolled courses</li>
              <li>Submit assignments</li>
              <li>Check grades and progress</li>
              <li>Access learning materials</li>
            </ul>
          </div>
        </section>
      </section>

      <footer className="footer">
        <h3>EduConnect Portal</h3>
        <p>Empowering education through technology.</p>
      </footer>
    </div>
  );
};

export default Dashboard;