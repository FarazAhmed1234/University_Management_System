import React from 'react';
import { 
  LayoutDashboard, 
  BookOpen, 
  FileText, 
  BarChart3, 
  CalendarDays, 
  Bell,
  LogOut 
} from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import './StudentSidebarNavigation.css';

const StudentSidebarNavigation = ({ activeItem, onLogout }) => {
  const navigate = useNavigate();
  
  // Get student data from localStorage
  const student = JSON.parse(localStorage.getItem('student') || 'null');
  const userName = student?.name || 'Student';
  const profilePicture = student?.profile_picture;
  const initial = userName.charAt(0).toUpperCase();

  const handleLogout = () => {
    try {
      localStorage.removeItem('student');
      if (typeof onLogout === 'function') {
        onLogout();
      }
      navigate('/');
      window.location.reload();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const menuItems = [
    { name: 'Dashboard', path: '/studentdashboard', icon: LayoutDashboard },
    { name: 'My Courses', path: '/studentcourses', icon: BookOpen },
    { name: 'Assignments', path: '/studentassignments', icon: FileText },
    { name: 'Grades', path: '/studentgrades', icon: BarChart3 },
    { name: 'Attendance', path: '/studentattendance', icon: CalendarDays },
    { name: 'Schedule', path: '/studentschedule', icon: CalendarDays },
    { name: 'Notices', path: '/studentnotices', icon: Bell },
    { name: 'Resources', path: '/studentmaterials', icon: FileText },
  ];

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h1>EduConnect</h1>
      </div>
      
      <div className="user-profile">
        {profilePicture ? (
          <>
            <img 
              src={profilePicture}
              alt={`${userName}'s profile`}
              className="profile-picture"
              onError={(e) => {
                e.target.style.display = 'none';
                document.querySelector('.avatar').style.display = 'flex';
              }}
            />
            <div className="avatar" style={{ display: 'none' }}>{initial}</div>
          </>
        ) : (
          <div className="avatar">{initial}</div>
        )}
        <div className="user-info">
          <span className="username">{userName}</span>
          <span className="role">Student</span>
        </div>
      </div>

      <nav className="sidebar-menu">
        <ul>
          {menuItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                className={({ isActive }) => 
                  isActive || activeItem === item.name.toLowerCase() ? 'active' : ''
                }
                end
              >
                <item.icon className="menu-icon" />
                <span>{item.name}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="logout-container">
        <button 
          className="logout-button" 
          onClick={handleLogout}
          aria-label="Logout"
        >
          <LogOut className="menu-icon" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};

export default StudentSidebarNavigation;