import React, { useState, useEffect } from 'react';
import { Search, X, Clock, Users, Calendar, Save, Download } from 'lucide-react';
import TeacherSidebar from './TeacherSidebarNavigation';
import './TeacherAddendance.css';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const TeacherCourseManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [courses, setCourses] = useState([]);
  const [students, setStudents] = useState({});
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [attendanceSubmitted, setAttendanceSubmitted] = useState(false);
  const [showReportOptions, setShowReportOptions] = useState(false);
  const [reportType, setReportType] = useState('complete');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const API = 'http://localhost:8080/educonnect-backend';
  const teacher = JSON.parse(localStorage.getItem('teacher'));
  const teacherId = teacher?.teacher_id;
  const userName = teacher?.name;
  const currentDate = new Date();

  const fetchCourses = async () => {
    try {
      const response = await fetch(`${API}/teacher/get_courses.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teacher_id: teacherId })
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.message);
      setCourses(data.courses || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStudents = async (courseCode, courseId) => {
    try {
      const response = await fetch(`${API}/teacher/get_course_students.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teacher_id: teacherId,
          course_code: courseCode,
          course_id: courseId
        })
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.message);

      setStudents(prev => ({ ...prev, [courseCode]: data.students || [] }));

      const attendanceCheck = await checkAttendanceSubmitted(courseCode);
      setAttendanceSubmitted(attendanceCheck);

      const simulatedAttendance = (data.students || []).map(s => ({
        student_id: s.student_id,
        student_name: s.name || s.student_name || 'Unknown Student',
        status: attendanceCheck ? 'Submitted' : 'Absent',
        time: '--:--',
        course_id: courseId,
        course_code: courseCode
      }));
      setAttendance(simulatedAttendance);
    } catch (err) {
      setError(`Failed to load students for ${courseCode}: ${err.message}`);
    }
  };

  const checkAttendanceSubmitted = async (courseCode) => {
    try {
      const response = await fetch(`${API}/teacher/check_attendance.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teacher_id: teacherId,
          course_code: courseCode,
          date: currentDate.toISOString().split('T')[0]
        })
      });
      const data = await response.json();
      return data.exists || false;
    } catch (err) {
      console.error('Error checking attendance:', err);
      return false;
    }
  };

  const handleCourseSelect = async (course) => {
    setSelectedCourse(course);
    setSaveSuccess(false);
    setError(null);
    if (!students[course.code]) {
      await fetchStudents(course.code, course.id);
    } else {
      const attendanceCheck = await checkAttendanceSubmitted(course.code);
      setAttendanceSubmitted(attendanceCheck);

      const existingStudents = students[course.code];
      const simulatedAttendance = existingStudents.map(s => ({
        student_id: s.student_id,
        student_name: s.name || s.student_name || 'Unknown Student',
        status: attendanceCheck ? 'Submitted' : 'Absent',
        time: '--:--',
        course_id: course.id,
        course_code: course.code
      }));
      setAttendance(simulatedAttendance);
    }
  };

  const handleStatusChange = (studentId, newStatus) => {
    if (attendanceSubmitted) return;

    const now = new Date();
    setAttendance(prev =>
      prev.map(record =>
        record.student_id === studentId
          ? {
            ...record,
            status: newStatus,
            time:
              newStatus === 'Absent'
                ? '--:--'
                : `${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`
          }
          : record
      )
    );
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const handleSaveAttendance = async () => {
    if (!selectedCourse || !attendance.length || attendanceSubmitted) return;

    try {
      setIsSaving(true);
      setError(null);

      const formattedDate = currentDate.toISOString().split('T')[0];

      const response = await fetch(`${API}/teacher/save_attendance.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        },
        body: JSON.stringify({
          teacher_id: teacherId,
          teacher_name: userName,
          course_code: selectedCourse.code,
          course_name: selectedCourse.name,
          date: formattedDate,
          attendance_records: attendance
            .filter(record => record.status !== 'Submitted')
            .map(record => ({
              student_id: record.student_id,
              student_name: record.student_name,
              status: record.status,
              time: record.time
            }))
        })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        if (data.message.includes('already been recorded')) {
          setAttendanceSubmitted(true);
        }
        throw new Error(data.message || 'Failed to save attendance');
      }

      setAttendanceSubmitted(true);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);

      setAttendance(prev =>
        prev.map(record => ({
          ...record,
          status: 'Submitted'
        }))
      );
    } catch (err) {
      setError(err.message);
      console.error('Error saving attendance:', err);
    } finally {
      setIsSaving(false);
    }
  };



 const generatePDFReport = async (type) => {
  if (!selectedCourse) return;

  try {
    let reportData = [];

    if (type === 'complete') {
      const response = await fetch(`${API}/teacher/get_complete_attendance.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teacher_id: teacherId,
          course_code: selectedCourse.code
        })
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.message);
      reportData = data.records || [];
    } else {
      const response = await fetch(`${API}/teacher/get_monthly_attendance.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teacher_id: teacherId,
          course_code: selectedCourse.code,
          month: selectedMonth,
          year: selectedYear
        })
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.message);
      reportData = data.records || [];
    }

    // Create new PDF document
    const doc = new jsPDF('landscape');
    
    // Add logo or institution name
    doc.setFontSize(20);
    doc.setTextColor(40, 53, 147);
    doc.setFont('helvetica', 'bold');
    doc.text('EduConnect', 14, 20);
    
    // Add report title
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text(`${selectedCourse.name} Attendance Report`, 14, 30);
    
    // Add course details
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text(`Course Code: ${selectedCourse.code}`, 14, 38);
    doc.text(`Department: ${selectedCourse.department || 'Computer Science'}`, 14, 45);
    
    // Add report type and date
    const reportDate = new Date();
    doc.text(`Report Type: ${type === 'complete' ? 'Complete Records' : `Monthly (${new Date(selectedYear, selectedMonth-1).toLocaleString('default', { month: 'long' })} ${selectedYear})`}`, 200, 38);
    doc.text(`Generated on: ${reportDate.toLocaleDateString()} at ${reportDate.toLocaleTimeString()}`, 200, 45);
    
    // Add teacher information
    doc.text(`Teacher: ${userName} (ID: ${teacherId})`, 14, 52);
    
    // Summary statistics
    const presentCount = reportData.filter(r => r.status === 'Present').length;
    const absentCount = reportData.filter(r => r.status === 'Absent').length;
    const lateCount = reportData.filter(r => r.status === 'Late').length;
    const totalRecords = reportData.length;
    
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text('Summary:', 14, 65);
    
    // Summary table
    doc.autoTable({
      startY: 70,
      head: [['Present', 'Absent', 'Late', 'Total Records']],
      body: [[presentCount, absentCount, lateCount, totalRecords]],
      theme: 'grid',
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: 255,
        fontStyle: 'bold'
      },
      bodyStyles: {
        textColor: [0, 0, 0],
        fontSize: 12
      },
      margin: { left: 14 }
    });
    
    // Main attendance table
    const headers = [
      ['No.', 'Student ID', 'Student Name', 'Date', 'Status', 'Time', 'Remarks']
    ];
    
    const body = reportData.map((record, index) => [
      index + 1,
      record.student_id,
      record.student_name,
      record.date || 'N/A',
      record.status,
      record.time || '--:--',
      record.remarks || 'N/A'
    ]);
    
    // Add main table
    doc.autoTable({
      startY: 90,
      head: headers,
      body: body,
      theme: 'striped',
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: 255,
        fontStyle: 'bold',
        halign: 'center'
      },

      
      columnStyles: {
        0: { cellWidth: 15, halign: 'center' }, // No.
        1: { cellWidth: 40, halign: 'center' }, // Student ID
        2: { cellWidth: 40 }, // Name
        3: { cellWidth: 30, halign: 'center' }, // Date
        4: { cellWidth: 25, halign: 'center' }, // Status
        5: { cellWidth: 25, halign: 'center' }, // Time
        6: { cellWidth: 'auto' } // Remarks
      },
      styles: {
        fontSize: 10,
        cellPadding: 3,
        overflow: 'linebreak'
      },
      didDrawCell: (data) => {
        // Color status cells based on their value
        if (data.column.index === 4 && data.cell.raw) {
          const status = data.cell.raw;
          const colors = {
            'Present': [46, 125, 50],
            'Absent': [198, 40, 40],
            'Late': [249, 168, 37],
            'Submitted': [93, 64, 55]
          };
          
          if (colors[status]) {
            doc.setFillColor(...colors[status]);
            doc.rect(data.cell.x, data.cell.y, data.cell.width, data.cell.height, 'F');
            doc.setTextColor(255, 255, 255);
            doc.text(status, data.cell.x + data.cell.width / 2, data.cell.y + data.cell.height / 2 + 2, {
              align: 'center'
            });
          }
        }
      },
      margin: { left: 14, right: 14 }
    });
    
    // Add footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(10);
      doc.setTextColor(150, 150, 150);
      doc.text(`Page ${i} of ${pageCount}`, doc.internal.pageSize.width - 30, doc.internal.pageSize.height - 10);
      doc.text('EduConnect - Attendance Management System', 14, doc.internal.pageSize.height - 10);
    }
    
    // Save the PDF
    doc.save(`Attendance_${selectedCourse.code}_${type === 'complete' ? 'Complete' : `${selectedMonth}_${selectedYear}`}.pdf`);
  } catch (err) {
    setError(`Failed to generate report: ${err.message}`);
  }
};



  const handleDownloadReport = () => {
    generatePDFReport(reportType);
    setShowReportOptions(false);
  };

  const filteredCourses = courses.filter(course =>
    course.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredAttendance = attendance.filter(record =>
    statusFilter === 'All Status' || record.status === statusFilter
  );

  useEffect(() => {
    fetchCourses();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('teacher');
    window.location.href = '/';
  };

  const attendanceStats = selectedCourse && {
    total: students[selectedCourse.code]?.length || 0,
    present: attendance.filter(r => r.status === 'Present').length,
    absent: attendance.filter(r => r.status === 'Absent').length,
    late: attendance.filter(r => r.status === 'Late').length,
    submitted: attendance.filter(r => r.status === 'Submitted').length,
    rate: Math.round(
      (attendance.filter(r => r.status !== 'Absent' && r.status !== 'Submitted').length /
        attendance.length) * 100
    ) || 0
  };

  return (
    <div className="teacher-dashboard">
      <TeacherSidebar active="attendance" userName={userName} onLogout={handleLogout} />

      <main className="teacher-attendance-management" style={{ marginLeft: "300px" }}>
        <div className="header1" style={{ width: "1060px" }}>
          <h1 style={{ marginBottom: "60px" }}>Class Attendance Management</h1>
        </div>

        {error && (
          <div className="error-alert">
            <span>{error}</span>
            <button onClick={() => setError(null)}><X size={16} /></button>
          </div>
        )}

        {saveSuccess && (
          <div className="success-alert">
            <span>Attendance saved successfully!</span>
          </div>
        )}

        <div className="course-selection">
          <div className="course-cards">
            {filteredCourses.map(course => (
              <div
                key={course.id}
                className={`course-card ${selectedCourse?.id === course.id ? 'active' : ''}`}
                onClick={() => handleCourseSelect(course)}
              >
                <h3>{course.code}</h3>
                <p className="course-name">{course.name}</p>
                <div className="course-stats">
                  <div>
                    <Users size={16} />
                    <span>Total: {course.total_students || students[course.code]?.length || 0}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {selectedCourse && (
          <div className="attendance-details" style={{ width: "983px" }}>
            <div className="course-info-header">
              <div>
                <h2>{selectedCourse.code} - {selectedCourse.name}</h2>
                <p>
                  {selectedCourse.department || 'Computer Science'}
                  <br />
                  Total Students: {selectedCourse.total_students || students[selectedCourse.code]?.length || 0}
                </p>
              </div>
              <div className="date-section">
                <div className="current-date">
                  <Calendar size={16} /> {formatDate(currentDate)}
                </div>
                <div className="attendance-stats">
                  {attendanceSubmitted ? (
                    <span className="stat-submitted">Attendance Submitted</span>
                  ) : (
                    <>
                      <span className="stat-present">Present: {attendanceStats.present}</span>
                      <span className="stat-absent">Absent: {attendanceStats.absent}</span>
                      <span className="stat-late">Late: {attendanceStats.late}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="attendance-controls">

            

              <div className="download-report-container">
                <button
                  className="download-report-btn"
                  onClick={() => setShowReportOptions(!showReportOptions)}
                  style={{height:"40px", marginTop:"10px"}}
                >
                  <Download size={16} style={{ marginRight: '8px' }} />
                  Download PDF Report
                </button>
                {showReportOptions && (
                  <div className="report-options-dropdown">
                    <div className="report-type-selector">
                      <label>
                        <input
                          type="radio"
                          name="reportType"
                          value="complete"
                          checked={reportType === 'complete'}
                          onChange={() => setReportType('complete')}
                        />
                        Complete Records
                      </label>
                      <label>
                        <input
                          type="radio"
                          name="reportType"
                          value="monthly"
                          checked={reportType === 'monthly'}
                          onChange={() => setReportType('monthly')}
                        />
                        Monthly Report
                      </label>
                    </div>

                    {reportType === 'monthly' && (
                      <div className="month-selector">
                        <select
                          value={selectedMonth}
                          onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                        >
                          {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                            <option key={month} value={month}>
                              {new Date(2000, month - 1, 1).toLocaleString('default', { month: 'long' })}
                            </option>
                          ))}
                        </select>
                        <select
                          value={selectedYear}
                          onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                        >
                          {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map(year => (
                            <option key={year} value={year}>{year}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    <button
                      className="generate-report-btn"
                      onClick={handleDownloadReport}
                    >
                      Generate Report
                    </button>
                  </div>
                )}
              </div>

  <div className="status-filter">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  disabled={attendanceSubmitted}
                  style={{ marginLeft: "454px", marginTop: "13px" }}
                >
                  <option>All Status</option>
                  <option>Present</option>
                  <option>Absent</option>
                  <option>Late</option>
                  <option>Submitted</option>
                </select>
              </div>
              <button
                className={`save-attendance-btn ${attendanceSubmitted ? 'submitted' : ''}`}
                onClick={handleSaveAttendance}
                disabled={!attendance.length || isSaving || attendanceSubmitted}
                style={{ width: "159px", height: "41px", borderRadius: "8px", marginTop: "10px" }}
              >
                {attendanceSubmitted ? 'Submitted' :
                  isSaving ? 'Saving...' : (
                    <>
                      <Save size={16} style={{ marginRight: '8px' }} />
                      Save Attendance
                    </>
                  )
                }
              </button>
            </div>

            <div className="attendance-table-container">
              <table className="attendance-table">
                <thead>
                  <tr>
                    <th>Student ID</th>
                    <th>Name</th>
                    <th>Time</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAttendance.length > 0 ? (
                    filteredAttendance.map(record => (
                      <tr key={`${record.student_id}-${record.course_id}`}>
                        <td>{record.student_id}</td>
                        <td>{record.student_name}</td>
                        <td>
                          <Clock size={14} /> {record.time}
                        </td>
                        <td>
                          <span className={`status-badge ${record.status.toLowerCase()}`}>
                            {record.status}
                          </span>
                        </td>
                        <td className="status-actions">
                          {attendanceSubmitted ? (
                            <span className="locked">Locked</span>
                          ) : (
                            <>
                              <button
                                className={record.status === 'Present' ? 'active' : ''}
                                onClick={() => handleStatusChange(record.student_id, 'Present')}
                              >
                                Present
                              </button>
                              <button
                                className={record.status === 'Absent' ? 'active' : ''}
                                onClick={() => handleStatusChange(record.student_id, 'Absent')}
                              >
                                Absent
                              </button>
                              <button
                                className={record.status === 'Late' ? 'active' : ''}
                                onClick={() => handleStatusChange(record.student_id, 'Late')}
                              >
                                Late
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="no-records">
                        {statusFilter === 'All Status'
                          ? 'No attendance records found'
                          : `No students with ${statusFilter} status`}
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

export default TeacherCourseManagement;