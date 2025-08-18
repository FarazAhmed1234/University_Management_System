import React, { useState, useEffect } from 'react';
import { Users, BookOpen, GraduationCap, Calendar, AlertCircle } from "lucide-react";
import SidebarNavigation from './SidebarNavigation';
import "./AdminDashboard.css";

const AdminDashboard = ({ userName, onLogout }) => {
  const [activeItem, setActiveItem] = useState("Dashboard");
  const [stats, setStats] = useState([
    { title: "Total Students", value: "Loading...", icon: Users, color: "blue-icon", bg: "blue-bg" },
    { title: "Total Teachers", value: "Loading...", icon: GraduationCap, color: "green-icon", bg: "green-bg" },
    { title: "Courses", value: "Loading...", icon: BookOpen, color: "purple-icon", bg: "purple-bg" },
    { title: "Departments", value: "Loading...", icon: Calendar, color: "orange-icon", bg: "orange-bg" },
  ]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const response = await fetch("http://localhost:8080/educonnect-backend/count.php");
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (!data.success) {
          throw new Error("Failed to fetch counts");
        }

        setStats([
          { ...stats[0], value: data.students.count.toString() },
          { ...stats[1], value: data.teachers.count.toString() },
          { ...stats[2], value: data.courses.count.toString() },
          { ...stats[3], value: data.departments.count.toString() }
        ]);
        
        setLoading(false);
      } catch (error) {
        console.error("Fetch error:", error);
        setError(error.message);
        setStats(prevStats => prevStats.map(stat => 
          ({ ...stat, value: "Error" })
        ));
        setLoading(false);
      }
    };

    fetchCounts();
  }, []);

  const handleNavigation = (path) => {
    const itemName = path.split('-').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
    setActiveItem(itemName);
  };

  return (
    <div className="admin-layout">
      <SidebarNavigation
        activeItem={activeItem}
        onNavigate={handleNavigation}
        userName={userName}
        onLogout={onLogout}
      />

      <div className="admin-content" style={{    marginLeft: "277px"}}>
        <div className="dashboard-header">
          <h1>Admin Dashboard</h1>
        </div>

        {error && (
          <div className="error-message">
            <AlertCircle size={16} style={{ marginRight: '8px' }} />
            {error}
          </div>
        )}

        <div className="welcome-banner">
          <h2>Welcome back, Administrator</h2>
          <p>Here's what's happening at your university today.</p>
        </div>

        <div className="stats-grid">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={index} className={`stat-card ${loading ? 'loading' : ''}`}>
                <div className="stat-card-content">
                  <div className="stat-card-inner">
                    <div>
                      <p className="stat-title">{stat.title}</p>
                      <p className="stat-value" style={{marginLeft:"100px"}}>
                        {loading ? (
                          <span className="loading-dots" >
                            <span>.</span><span>.</span><span>.</span>
                          </span>
                        ) : stat.value}
                      </p>
                    </div>
                    <div className={`stat-icon-container ${stat.bg}`}>
                      <Icon className={`stat-icon ${stat.color}`} />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;