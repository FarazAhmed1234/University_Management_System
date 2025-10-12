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
            orientation: 'landscape',
            unit: 'mm',
            format: 'a4'
        });

        // Colors
        const primaryColor = '#2c3e50';
        const secondaryColor = '#7f8c8d';
        const lightGray = '#f5f5f5';

        // Header
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(primaryColor);
        doc.text('ACADEMIC TIMETABLE', 148, 15, { align: 'center' });

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(secondaryColor);
        doc.text('EduConnect University', 148, 22, { align: 'center' });

        // Student info
        doc.setTextColor(primaryColor);
        doc.text(`Student: ${userName}`, 15, 32);
        doc.text(`ID: ${studentId}`, 15, 37);

        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        const today = new Date().toLocaleDateString('en-US', options);
        doc.text(`Generated: ${today}`, 280, 37, { align: 'right' });

        // Group timetable data by day
        const daysData = groupByDay(timetable.data);

        // Define time periods (9 AM to 5 PM)
        const timePeriods = [
            { period: 'Period 1', start: '09:00', end: '10:30' },
            { period: 'Period 2', start: '10:30', end: '12:00' },
            { period: 'Period 3', start: '12:00', end: '13:30' },
            { period: 'Period 4', start: '13:00', end: '14:30' },
            { period: 'Period 5', start: '15:00', end: '16:30' },
        
        ];

        // Prepare table data
        const tableData = [];
        
        // Add header row
        const headerRow = ['Day', ...timePeriods.map(p => `${p.period}\n${p.start}-${p.end}`)];
        tableData.push(headerRow);

        // Add data rows for each day
        daysData.forEach(dayData => {
            const row = [dayData.day];
            
            timePeriods.forEach(timePeriod => {
                // Find if there's a class in this time period
                const classItem = dayData.classes.find(c => {
                    const classStart = c.start_time.substring(0, 5); // Get HH:MM part
                    return classStart === timePeriod.start;
                });
                
                if (classItem) {
                    row.push(
                        `${classItem.course_name || classItem.course_code} \n ${classItem.venue || ''} (Block:${classItem.block || ''}) \n ${classItem.lecturer || ''}`

                    );
                
                } else {
                    row.push('-');
                }
            });
            
            tableData.push(row);
        });

        // Create the table
        doc.autoTable({
            startY: 45,
            head: [tableData[0]],
            body: tableData.slice(1),
            theme: 'grid',
            styles: {
                fontSize: 8,
                valign: 'middle',
                halign: 'center',
                cellPadding: 2,
                minCellHeight: 10
            },
            headStyles: {
                fillColor: primaryColor,
                textColor: 255,
                fontStyle: 'bold'
            },
            alternateRowStyles: {
                fillColor: lightGray
            },
            columnStyles: {
                0: { cellWidth: 20, fontStyle: 'bold' } // Day column
                // Other columns will auto-size
            }
        });

        // Footer
        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(secondaryColor);
            doc.text('Official Document - Do not modify', 148, 200, { align: 'center' });
            doc.text(`Page ${i} of ${pageCount}`, 285, 200, { align: 'right' });
        }

        // Save file
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