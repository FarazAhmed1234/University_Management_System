import React, { useState } from 'react';
import './AdminLogin.css';
import { useNavigate } from 'react-router-dom';

const AdminLogin = ({ onBack, onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async () => {
    if (email && password) {
      try {
        const response = await fetch('http://localhost:8080/educonnect-backend/admin_login.php', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, password }),
        });

        const data = await response.json();

        if (data.success) {
          localStorage.setItem('admin', JSON.stringify({
            name: data.name,
            id: data.id,
            email: data.email
          }));
          
          onLogin();
          navigate('/dashboard');
        } else {
          alert(data.message || 'Invalid credentials');
        }
      } catch (error) {
        console.error('Fetch error:', error);
        alert('Server error: Failed to connect to backend.');
      }
    } else {
      alert('Please enter both email and password.');
    }
  };

  return (
    <>
      <div className="admin-login-container">
        <h1 className="portal-heading"  onClick={onBack}>🎓 EduConnect Portal</h1>
        <button className="top-right-button" onClick={onBack}>Back to Home</button>

        <div className="admin-login-card">
          <div className="admin-icon1">
            <span className="shield-icon">🛡️</span>
          </div>
          <h2>Administrator Login</h2>
          <p>Access the complete system management dashboard</p>

          <label>Email Address</label>
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <label>Password</label>
          <div className="password-input-wrapper">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <span
              className="password-toggle-icon"
              onClick={() => setShowPassword(!showPassword)}
              title={showPassword ? 'Hide Password' : 'Show Password'}
            >
              {showPassword ? '🙈' : '👁️'}
            </span>
          </div>

          <button onClick={handleSubmit}>Sign In</button>
        </div>
      </div>

      <footer className="footer">
        <h3>EduConnect Portal</h3>
        <p>Empowering education through technology.</p>
      </footer>
    </>
  );
};

export default AdminLogin;