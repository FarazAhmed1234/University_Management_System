import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  BookOpen, 
  Building, 
  FileText, 
  CalendarDays, 
  Bell, 
  LogOut 
} from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import './SidebarNavigation.css';

const SidebarNavigation = ({ activeItem, onLogout, userName }) => {
  const navigate = useNavigate();
  const admin = JSON.parse(localStorage.getItem('admin') || 'null');
  const name = admin?.name || userName || 'Admin';
  const profilePicture = admin?.profile_picture;
  const initial = name.charAt(0).toUpperCase();

  const handleLogout = () => {
    try {
      localStorage.removeItem('admin');
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
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'User Management', path: '/user-management', icon: Users },
    { name: 'Course Management', path: '/course-management', icon: BookOpen },
    { name: 'Departments', path: '/departments', icon: Building },
    { name: 'Register', path: '/register', icon: FileText },
    { name: 'Timetables', path: '/timetables', icon: CalendarDays },
    { name: 'Notices', path: '/notices', icon: Bell },
  ];

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h1>EduConnect</h1>
      </div>
      
      <div className="user-profile">
        <div className="avatar">{initial}</div>
        <div className="user-info">
          <span className="username">{name}</span>
          <span className="role">Admin</span>
        </div>
      </div>
      
      <nav className="sidebar-menu">
        <ul>
          {menuItems.map((item, index) => (
            <li key={index}>
              <NavLink
                to={item.path}
                className={({ isActive }) => 
                  isActive || activeItem === item.name ? 'active' : ''
                }
              >
                <item.icon className="menu-icon" />
                <span>{item.name}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="logout-container">
        <button className="logout-button" onClick={handleLogout}>
          <LogOut className="menu-icon" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};

export default SidebarNavigation;