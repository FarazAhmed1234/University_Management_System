import React, { useEffect, useState } from 'react';
import axios from 'axios';
import StudentSidebar from './StudentSidebarNavigation';
import './StudentTimeTable.css';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const StudentTimetable = () => {
    const [timetable, setTimetable] = useState({
        loading: true,
        data: [],
        error: null
    });
    const [userName, setUserName] = useState('');
    const [studentId, setStudentId] = useState('');

    const handleLogout = () => {
        localStorage.removeItem('student');
        window.location.href = '/student-login';
    };

    const fetchTimetable = async (studentId) => {
        setTimetable(prev => ({ ...prev, loading: true, error: null }));

        try {
            const response = await axios.post(
                "http://localhost:8080/educonnect-backend/student/get_student_timetable.php",
                { student_id: studentId },
                { headers: { 'Content-Type': 'application/json' } }
            );

            if (response.data && response.data.success) {
                setTimetable({
                    loading: false,
                    data: response.data.timetable || [],
                    error: null
                });
            } else {
                throw new Error(response.data?.message || "Failed to fetch timetable");
            }
        } catch (error) {
            setTimetable({
                loading: false,
                data: [],
                error: error.message
            });
        }
    };

    useEffect(() => {
        const student = JSON.parse(localStorage.getItem('student'));
        if (student && student.student_id) {
            setStudentId(student.student_id);
            setUserName(student.name || '');
            fetchTimetable(student.student_id);
        } else {
            setTimetable(prev => ({
                ...prev,
                loading: false,
                error: "Student information not found"
            }));
        }
    }, []);

    const handleRetry = () => {
        if (studentId) {
            fetchTimetable(studentId);
        }
    };

    const formatTime = (timeString) => {
        if (!timeString) return '';
        const time = new Date(`1970-01-01T${timeString}Z`);
        return time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const groupByDay = (timetableData) => {
        const daysOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
        const grouped = {};

        daysOrder.forEach(day => {
            grouped[day] = [];
        });

        timetableData.forEach(item => {
            if (grouped[item.day]) {
                grouped[item.day].push(item);
            }
        });

        daysOrder.forEach(day => {
            grouped[day].sort((a, b) => a.start_time.localeCompare(b.start_time));
        });

        return daysOrder.map(day => ({
            day,
            classes: grouped[day]
        }));
    };

 const downloadTimetablePDF = () => {
    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm'
    });

    // Color scheme
    const primaryColor = '#2c3e50';  // Dark blue-gray for headings
    const secondaryColor = '#7f8c8d';  // Gray for secondary text
    const accentColor = '#3498db';  // Blue for accents
    const lightGray = '#f5f5f5';  // For alternate rows

    // Add header
    doc.setFontSize(18);
    doc.setTextColor(primaryColor);
    doc.setFont('helvetica', 'bold');
    doc.text('ACADEMIC TIMETABLE', 105, 20, { align: 'center' });

    // School/University name (optional)
    doc.setFontSize(12);
    doc.text('EduConnect University', 105, 28, { align: 'center' });

    // Student information
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(secondaryColor);
    
    doc.text(`Student: ${userName}`, 20, 38);
    doc.text(`ID: ${studentId}`, 20, 43);
    
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    const today = new Date().toLocaleDateString('en-US', options);
    doc.text(`Generated: ${today}`, 160, 43, { align: 'right' });

    // Prepare data
    const daysData = groupByDay(timetable.data);
    const tableData = [];

    daysData.forEach(dayData => {
        if (dayData.classes.length > 0) {
            dayData.classes.forEach(classItem => {
                tableData.push([
                    dayData.day,
                    classItem.course_name || classItem.course_code,
                    formatTime(classItem.start_time) + ' - ' + formatTime(classItem.end_time),
                    classItem.venue,
                    classItem.block || '-'
                ]);
            });
        } else {
            tableData.push([dayData.day, 'No classes scheduled', '', '', '']);
        }
    });

    // Add the table
    doc.autoTable({
        startY: 50,
        head: [['Day', 'Course', 'Time', 'Venue', 'Block']],
        body: tableData,
        theme: 'grid',
        headStyles: {
            fillColor: primaryColor,
            textColor: 255,
            fontStyle: 'bold',
        
        },
        bodyStyles: {
            textColor: primaryColor,
            fontSize: 9
        },
        alternateRowStyles: {
            fillColor: lightGray
        },
        styles: {
            cellPadding: 4,
            fontSize: 6,
            valign: 'middle',
            lineColor: 200,
            lineWidth: 0.2
        },
        columnStyles: {
            0: { cellWidth: 35, fontStyle: 'bold' },
            1: { cellWidth: 55 },
            2: { cellWidth: 30 },
            3: { cellWidth: 40 },
            4: { cellWidth: 20 }
        },
        margin: { left: 15, right: 15 }
    });

    // Footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(secondaryColor);
        doc.text('Official Document - Do not modify', 105, 287, { align: 'center' });
        doc.text(`Page ${i} of ${pageCount}`, 190, 287, { align: 'right' });
    }

    // Save PDF
    doc.save(`${userName.replace(/\s+/g, '_')}_Timetable_${today.replace(/\s+/g, '_')}.pdf`);
};


    if (timetable.loading) {
        return (
            <div className="timetable-container-with-sidebar">
                <StudentSidebar active="timetable" userName={userName} onLogout={handleLogout} />
                <div className="timetable-loading">
                    <div className="spinner"></div>
                    <p>Loading timetable...</p>
                </div>
            </div>
        );
    }

    if (timetable.error) {
        return (
            <div className="timetable-container-with-sidebar">
                <StudentSidebar active="timetable" userName={userName} onLogout={handleLogout} />
                <div className="timetable-error">
                    <p>Error: {timetable.error}</p>
                    <button onClick={handleRetry}>Retry</button>
                </div>
            </div>
        );
    }

    return (
        <div className="timetable-container-with-sidebar">
            <StudentSidebar active="timetable" userName={userName} onLogout={handleLogout} />
            <div className="teacher-timetable-container">
                <div className="timetable-header">
                    <h2>My Weekly Timetable</h2>
                    <button 
                        onClick={downloadTimetablePDF} 
                        className="download-timetable-btn"
                    >
                        Download Timetable (PDF)
                    </button>
                </div>
                <div className="timetable-grid">
                    {groupByDay(timetable.data).map((dayData) => (
                        <div key={dayData.day} className="timetable-day">
                            <h3>{dayData.day}</h3>
                            {dayData.classes.length > 0 ? (
                                <div className="classes-list">
                                    {dayData.classes.map((classItem, index) => (
                                        <div key={`${dayData.day}-${index}`} className="class-item">
                                            <div className="class-time">
                                                {formatTime(classItem.start_time)} - {formatTime(classItem.end_time)}
                                            </div>
                                            <div className="class-details">
                                                <div className="class-subject">
                                                    {classItem.course_name || classItem.course_code}
                                                </div>
                                                <div className="class-info">
                                                    <span className="class-venue">Venue: {classItem.venue}</span>
                                                    <span className="class-block">Block: {classItem.block}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="no-classes">No classes scheduled</div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default StudentTimetable;