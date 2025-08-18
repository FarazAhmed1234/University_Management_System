import React, { useState, useEffect } from 'react';
import { Search, Calendar, BookOpen, Percent, Check, X, Clock, Download } from 'lucide-react';
import StudentSidebar from './StudentSidebarNavigation';
import './StudentAddendance.css';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const StudentAttendance = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [attendanceData, setAttendanceData] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const student = JSON.parse(localStorage.getItem('student'));
  const studentId = student?.student_id;
  const userName = student?.name;

  const API = 'http://localhost:8080/educonnect-backend';

  const fetchAttendance = async () => {
    try {
      const response = await fetch(`${API}/student/get_attendance.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_id: studentId })
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.message);
      setAttendanceData(data.attendance || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredCourses = attendanceData.filter(course =>
    course.course_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.course_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const handleLogout = () => {
    localStorage.removeItem('student');
    window.location.href = '/';
  };

const downloadAttendanceReport = () => {
  if (!selectedCourse) return;
  
  try {
    const doc = new jsPDF('l', 'mm', 'a4');
    
    // Convert all values to strings before adding to PDF
    const stringify = (value) => value?.toString() || '-';

    // Header
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(33, 97, 140);
    doc.text(`${stringify(selectedCourse.course_code)} - ${stringify(selectedCourse.course_name)}`, 
            105, 20, { align: 'center' });

    // Student Info
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80);
    
    const infoLines = [
      `Student: ${stringify(userName)}`,
      `ID: ${stringify(studentId)}`,
      `Generated: ${new Date().toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })}`
    ];
    
    infoLines.forEach((line, i) => doc.text(line, 20, 35 + (i * 6)));

    // Summary Section
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('ATTENDANCE SUMMARY', 105, 65, { align: 'center' });

    // Convert all summary values to strings
    const summaryData = [
      { label: 'Total Classes', value: stringify(selectedCourse.total_classes) },
      { label: 'Present', value: stringify(selectedCourse.present) },
      { label: 'Late', value: stringify(selectedCourse.late) },
      { label: 'Absent', value: stringify(selectedCourse.absent) },
      { label: 'Percentage', value: `${stringify(selectedCourse.attendance_percentage)}%` }
    ];

    // Table data with all values converted to strings
    const tableData = selectedCourse.records.map(record => [
      record.date ? new Date(record.date).toLocaleDateString('en-US') : '-',
      stringify(record.status).toUpperCase()
    ]);

    // Create table
    doc.autoTable({
      startY: 80,
      head: [['Date', 'Status']],
      body: tableData,
      headStyles: {
        fillColor: [33, 97, 140],
        textColor: 255,
        fontStyle: 'bold'
      },
      styles: {
        fontSize: 10,
        cellPadding: 4,
        overflow: 'linebreak'
      }
    });

    doc.save(`${stringify(selectedCourse.course_code)}_attendance.pdf`);
  } catch (error) {
    console.error('Error generating PDF:', error);
    alert('Failed to generate attendance report. Please try again.');
  }
};
  useEffect(() => {
    fetchAttendance();
  }, []);

  return (
    <div className="student-dashboard">
      <StudentSidebar active="attendance" userName={userName} onLogout={handleLogout} />

      <main className="student-attendance-view" style={{marginLeft: "261px"}}>
        <div className="header1" style={{width:"960px"}}>
          <h1 style={{marginBottom:"60px"}}>My Attendance Records</h1>
        </div>

        {error && (
          <div className="error-alert">
            <span>{error}</span>
            <button onClick={() => setError(null)}><X size={16} /></button>
          </div>
        )}

        <div className="attendance-overview">
          <div className="search-box">
            <Search size={18} />
            <input
              type="text"
              placeholder="Search courses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="course-cards">
            {filteredCourses.map(course => (
              <div
                key={course.course_code}
                className={`course-card ${selectedCourse?.course_code === course.course_code ? 'active' : ''}`}
                onClick={() => setSelectedCourse(course)}
              >
                <h3>{course.course_code}</h3>
                <p className="course-name">{course.course_name}</p>
                <div className="attendance-percentage">
                  <Percent size={16} />
                  <span>{course.attendance_percentage}%</span>
                </div>
                <div className="attendance-stats">
                  <span className="present"><Check size={14} /> {course.present}</span>
                  <span className="absent"><X size={14} /> {course.absent}</span>
                  <span className="late"><Clock size={14} /> {course.late}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {selectedCourse && (
          <div className="attendance-details" style={{width:"1030px"}}>
            <div className="course-info-header">
              <div>
                <h2>{selectedCourse.course_code} - {selectedCourse.course_name}</h2>
                <p>
                  Overall Attendance: {selectedCourse.attendance_percentage}%
                  <br />
                  Total Classes: {selectedCourse.total_classes} | 
                  Present: {selectedCourse.present} | 
                  Late: {selectedCourse.late} | 
                  Absent: {selectedCourse.absent}
                </p>
              </div>
              <div className="action-buttons">
                <button 
                  className="download-report-btn"
                  onClick={downloadAttendanceReport}
                >
                  <Download size={16} /> Download PDF Report
                </button>
                <button 
                  className="close-details-btn" 
                  onClick={() => setSelectedCourse(null)}
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="attendance-table-container">
              <table className="attendance-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedCourse.records.length > 0 ? (
                    selectedCourse.records.map((record, index) => (
                      <tr key={index}>
                        <td>
                          <Calendar size={14} /> {formatDate(record.date)}
                        </td>
                        <td>
                          <span className={`status-badge ${record.status.toLowerCase()}`}>
                            {record.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="2" className="no-records">
                        No attendance records found for this course
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default StudentAttendance;