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
import './TeacherSidebarNavigation.css';

const TeacherSidebarNavigation = ({ activeItem, onLogout }) => {
  const navigate = useNavigate();
  
  // Safely get teacher data from localStorage
  const teacher = JSON.parse(localStorage.getItem('teacher') || 'null');
  const userName = teacher?.name || 'Teacher';
  const initial = userName.charAt(0).toUpperCase();

  const handleLogout = () => {
    try {
      // Clear teacher data from localStorage
      localStorage.removeItem('teacher');
      
      // Call the onLogout callback if provided
      if (typeof onLogout === 'function') {
        onLogout();
      }
      
      // Navigate to home page
      navigate('/');
      window.location.reload(); // Ensure complete refresh
    } catch (error) {
      console.error('Logout error:', error);
      // Optionally show error to user
    }
  };

  const menuItems = [
    { name: 'Dashboard', path: '/teacherdashboard', icon: LayoutDashboard },
    { name: 'My Courses', path: '/teachercourses', icon: BookOpen },
    { name: 'Assignments', path: '/teacherassignments', icon: FileText },
    { name: 'Submissions', path: '/teachergrades', icon: FileText },

    { name: 'Grades', path: '/result', icon: BarChart3 },
    { name: 'Attendance', path: '/teacheraddendance', icon: CalendarDays },
    { name: 'Schedule', path: '/teacherschedule', icon: CalendarDays },
    { name: 'Notices', path: '/teachernotices', icon: Bell },
    { name: 'Materials', path: '/teachermaterials', icon: FileText },
  ];

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h1>EduConnect</h1>
      </div>
      
      <div className="user-profile">
        <div className="avatar">{initial}</div>
        <div className="user-info">
          <span className="username">{userName}</span>
          <span className="role">Teacher</span>
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

export default TeacherSidebarNavigation;