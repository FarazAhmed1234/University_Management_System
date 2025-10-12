import React, { useState } from 'react';
import './StudentLogin.css';
import { useNavigate } from 'react-router-dom';

const StudentLogin = ({ onBack, onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async () => {
    if (email && password) {
      try {
        const res = await fetch('http://localhost:8080/educonnect-backend/student/student_login.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });

        const data = await res.json();

        if (data.success) {
          localStorage.setItem('student', JSON.stringify({
            name: data.name,
            student_id: data.student_id,
            email: data.email,
            class_id: data.class_id // Added class_id which is typically relevant for students
          }));

          onLogin();
          navigate('/studentdashboard');
        } else {
          alert(data.message || 'Invalid credentials');
        }
      } catch (err) {
        console.error('Fetch error:', err);
        alert('Server error: Failed to connect to backend.');
      }
    } else {
      alert('Please enter both email and password.');
    }
  };

  return (
    <>
      <div className="student-login-container">
        <h1 className="portal-heading"  onClick={onBack}>🎓 EduConnect Portal</h1>
        <button className="top-right-button" onClick={onBack}>Back to Home</button>

        <div className="student-login-card">
          <div className="student-icon">
            <span className="book-icon">📘</span>
          </div>
          <h2>Student Login</h2>
          <p>Access your learning dashboard and course materials</p>

          <label>Email Address</label>
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />

          <label>Password</label>
          <div className="password-input-wrapper">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter your password"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
            <span
              className="password-toggle-icon"
              onClick={() => setShowPassword(!showPassword)}
              title={showPassword ? 'Hide Password' : 'Show Password'}
            >
              {showPassword ? '🙈' : '👁️'}
            </span>
          </div>

          <button onClick={handleLogin}>Sign In</button>
        </div>
      </div>

      <footer className="footer">
        <h3>EduConnect Portal</h3>
        <p>Empowering education through technology.</p>
      </footer>
    </>
  );
};

export default StudentLogin;