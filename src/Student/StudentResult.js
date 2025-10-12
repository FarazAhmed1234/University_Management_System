import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Search, X, Clock, Calendar, BookOpen, GraduationCap, Layers, Calculator, Download, Save } from 'lucide-react';
import StudentSidebar from './StudentSidebarNavigation';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import './StudentResult.css';

const StudentCourseManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [courses, setCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [marks, setMarks] = useState([]);
  const [isLoadingMarks, setIsLoadingMarks] = useState(false);
  const [quizzes, setQuizzes] = useState([]);
  const [quizMarks, setQuizMarks] = useState([]);
  const [lockedResults, setLockedResults] = useState([]);

  const [isLoadingQuizzes, setIsLoadingQuizzes] = useState(false);
  const [assignments, setAssignments] = useState([]);
  const [isLoadingAssignments, setIsLoadingAssignments] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null);

  // Helper for default max marks
  const getMaxMarks = (assignmentType) => {
    switch (assignmentType.toLowerCase()) {
      case "midterm": return 20;
      case "final": return 50;
      case "c.p": return 10;
      default: return 100;
    }
  };

  // Calculate grade based on percentage
  const calculateGrade = (percentage) => {
    if (percentage >= 86) return 'A';
    if (percentage >= 82) return 'A-';
    if (percentage >= 78) return 'B+';
    if (percentage >= 74) return 'B';
    if (percentage >= 70) return 'B-';
    if (percentage >= 66) return 'C+';
    if (percentage >= 62) return 'C';
    if (percentage >= 58) return 'C-';
    if (percentage >= 54) return 'D+';
    if (percentage >= 50) return 'D';
    return 'F';
  };

  // API base URL
  const API = process.env.REACT_APP_API_URL || 'http://educonnect.atwebpages.com/educonnect-backend';

  // Student info
  const student = JSON.parse(localStorage.getItem('student'));
  const studentId = student?.student_id;
  const userName = student?.name;
  const userEmail = student?.email;

  // Fetch courses
  const fetchCourses = useCallback(async () => {
    if (!studentId) {
      setError('Student not authenticated');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API}/student/getcourses.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_id: studentId }),
        credentials: 'include'
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Failed to fetch enrolled courses');

      setCourses(data.data?.courses || []);
    } catch (err) {
      console.error('Fetch Error:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [API, studentId]);

  // Fetch marks
  const fetchMarks = useCallback(async (courseCode) => {
    if (!studentId || !courseCode) return;

    setIsLoadingMarks(true);
    setError(null);

    try {
      const res = await fetch(`${API}/student/get_marks.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_id: studentId, course_code: courseCode }),
        credentials: 'include'
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Failed to fetch marks');

      setMarks(data.data?.marks || []);
    } catch (err) {
      console.error('Fetch Marks Error:', err);
      setError(err.message);
    } finally {
      setIsLoadingMarks(false);
    }
  }, [API, studentId]);

  // Fetch quizzes
  const fetchQuizzes = useCallback(async (courseCode) => {
    if (!studentId || !courseCode) return;

    setIsLoadingQuizzes(true);
    setError(null);

    try {
      const res = await fetch(`${API}/student/get_quizzes.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ course_code: courseCode }),
        credentials: 'include'
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Failed to fetch quizzes');

      setQuizzes(data.data?.quizzes || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoadingQuizzes(false);
    }
  }, [API, studentId]);

  // Fetch quiz marks
  const fetchQuizMarks = useCallback(async (courseCode) => {
    if (!studentId || !courseCode) return;

    try {
      const res = await fetch(`${API}/student/get_quiz_marks.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_id: studentId, course_code: courseCode }),
        credentials: 'include'
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Failed to fetch quiz marks');

      setQuizMarks(data.data?.quiz_marks || []);
    } catch (err) {
      setError(err.message);
    }
  }, [API, studentId]);

  const calculateGPA = (percentage) => {
    if (percentage >= 86) return 4.0;
    if (percentage >= 82) return 3.7;
    if (percentage >= 78) return 3.3;
    if (percentage >= 74) return 3.0;
    if (percentage >= 70) return 2.7;
    if (percentage >= 66) return 2.3;
    if (percentage >= 62) return 2.0;
    if (percentage >= 58) return 1.7;
    if (percentage >= 54) return 1.3;
    if (percentage >= 50) return 1.0;
    return 0.0;
  };

  // Fetch assignments
  const fetchAssignments = useCallback(async (courseCode) => {
    setIsLoadingAssignments(true);
    try {
      const res = await fetch(`${API}/student/student_get_assignments.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_id: studentId, course_code: courseCode })
      });
      const data = await res.json();
      if (data.success) setAssignments(data.data.assignments || []);
    } catch (err) {
      setError("Failed to fetch assignments");
    } finally {
      setIsLoadingAssignments(false);
    }
  }, [API, studentId]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  const handleCourseClick = (course) => {
    setSelectedCourse(course);
    fetchMarks(course.code);
    fetchQuizzes(course.code);
    fetchQuizMarks(course.code);
    fetchAssignments(course.code);
  };

  const filteredCourses = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return courses.filter((course) =>
      course.name?.toLowerCase().includes(term) ||
      course.code?.toLowerCase().includes(term) ||
      course.department?.toLowerCase().includes(term) ||
      course.teacher?.toLowerCase().includes(term)
    );
  }, [courses, searchTerm]);

  const handleLogout = () => {
    localStorage.removeItem('student');
    window.location.href = '/';
  };


const fetchLockedResults = useCallback(async () => {
  if (!studentId) return;

  try {
 

    const res = await fetch(`${API}/student/get_locked_results.php`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ student_id: studentId }), // studentId from React state/props
  credentials: 'include'
});


    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const data = await res.json();

    if (!data.success) throw new Error(data.message || 'Failed to fetch locked results');

    setLockedResults(data.data?.results || []);
  } catch (err) {
    console.error('Fetch Locked Results Error:', err);
    setError(err.message);
  }
}, [API, studentId]);

// Call this in useEffect
useEffect(() => {
  fetchCourses();
  fetchLockedResults(); // Add this line
}, [fetchCourses, fetchLockedResults]);

// Update the calculateResults function


const calculateResults = useMemo(() => {
  if (lockedResults.length === 0) return { gpa: 0.0, cgpa: 0.0 };

  let totalPointsCGPA = 0;
  let totalCreditsCGPA = 0;

  let totalPointsGPA = 0;
  let totalCreditsGPA = 0;

  const currentSemester = selectedCourse?.semester || '';

  lockedResults.forEach(result => {
    const gradePoint = parseFloat(result.gpa) || 0;
    const credits = parseInt(result.credits_earned) || 0; // ✅ use credits_earned

    // CGPA
    totalPointsCGPA += gradePoint * credits;
    totalCreditsCGPA += credits;

    // GPA for current semester
    if (result.semester === currentSemester) {
      totalPointsGPA += gradePoint * credits;
      totalCreditsGPA += credits;
    }
  });

  return {
    gpa: totalCreditsGPA ? (totalPointsGPA / totalCreditsGPA).toFixed(2) : 0.0,
    cgpa: totalCreditsCGPA ? (totalPointsCGPA / totalCreditsCGPA).toFixed(2) : 0.0
  };
}, [lockedResults, selectedCourse]);


  const totalCourses = courses.length;
  const totalCredits = courses.reduce((sum, c) => sum + (parseInt(c.credits) || 0), 0);

  // Calculate course grade and GPA for selected course
  const calculateCourseResults = useMemo(() => {
    if (!selectedCourse) return { percentage: 0, grade: 'N/A', gradePoint: 0 };

    // Calculate weighted components
    let totalWeighted = 0;

    // Quizzes (10%)
    const totalQuizzes = quizzes.reduce((sum, q) => sum + (Number(q.total_points) || 0), 0);
    const obtainedQuizzes = quizzes.reduce((sum, q) => {
      const result = quizMarks.find(m => m.quiz_no === q.quiz_no);
      return sum + (Number(result?.marks) || 0);
    }, 0);
    if (totalQuizzes > 0) totalWeighted += (obtainedQuizzes / totalQuizzes) * 10;

    // Assignments (10%)
    const totalAssignments = assignments.reduce((sum, a) => sum + (Number(a.points) || 0), 0);
    const obtainedAssignments = assignments.reduce((sum, a) => sum + (Number(a.take_point) || 0), 0);
    if (totalAssignments > 0) totalWeighted += (obtainedAssignments / totalAssignments) * 10;

    // Other marks (midterm, final, c.p)
    marks.forEach(mark => {
      const maxMarks = mark.total || getMaxMarks(mark.assignment_type);
      const obtained = Number(mark.marks) || 0;
      let weight = 0;
      
      if (mark.assignment_type.toLowerCase() === "midterm") weight = 20;
      if (mark.assignment_type.toLowerCase() === "final") weight = 50;
      if (mark.assignment_type.toLowerCase() === "c.p") weight = 10;
      
      if (maxMarks > 0 && weight > 0) {
        totalWeighted += (obtained / maxMarks) * weight;
      }
    });

    const weightedScore = parseFloat(totalWeighted.toFixed(2));
    const grade = calculateGrade(weightedScore);

    let gradePoint = 0;
    switch (grade) {
      case 'A': gradePoint = 4.0; break;
      case 'A-': gradePoint = 3.7; break;
      case 'B+': gradePoint = 3.3; break;
      case 'B': gradePoint = 3.0; break;
      case 'B-': gradePoint = 2.7; break;
      case 'C+': gradePoint = 2.3; break;
      case 'C': gradePoint = 2.0; break;
      case 'C-': gradePoint = 1.7; break;
      case 'D+': gradePoint = 1.3; break;
      case 'D': gradePoint = 1.0; break;
      default: gradePoint = 0.0;
    }

    return {
      percentage: weightedScore,
      grade,
      gradePoint
    };
  }, [selectedCourse, quizzes, quizMarks, assignments, marks]);

  const saveResultsToDatabase = async () => {
    if (!selectedCourse || !studentId) return;

    try {
      // Prepare components data in the new structure
      const components = {
        quiz: {
          total: quizzes.reduce((sum, q) => sum + (Number(q.total_points) || 0), 0),
          obtained: quizzes.reduce((sum, q) => {
            const result = quizMarks.find(m => m.quiz_no === q.quiz_no);
            return sum + (Number(result?.marks) || 0);
          }, 0),
          weighted: quizzes.reduce((sum, q) => {
            const result = quizMarks.find(m => m.quiz_no === q.quiz_no);
            const total = Number(q.total_points) || 0;
            const obtained = Number(result?.marks) || 0;
            return total > 0 ? sum + (obtained / total * 10) : sum;
          }, 0).toFixed(2)
        },
        assignment: {
          total: assignments.reduce((sum, a) => sum + (Number(a.points) || 0), 0),
          obtained: assignments.reduce((sum, a) => sum + (Number(a.take_point) || 0), 0),
          weighted: assignments.reduce((sum, a) => {
            const total = Number(a.points) || 0;
            const obtained = Number(a.take_point) || 0;
            return total > 0 ? sum + (obtained / total * 10) : sum;
          }, 0).toFixed(2)
        },
        midterm: {
          total: marks.find(m => m.assignment_type.toLowerCase() === "midterm")?.total || 20,
          obtained: Number(marks.find(m => m.assignment_type.toLowerCase() === "midterm")?.marks) || 0,
          weighted: (() => {
            const mark = marks.find(m => m.assignment_type.toLowerCase() === "midterm");
            const total = mark?.total || 20;
            const obtained = Number(mark?.marks) || 0;
            return total > 0 ? (obtained / total * 20).toFixed(2) : "0.00";
          })()
        },
        final: {
          total: marks.find(m => m.assignment_type.toLowerCase() === "final")?.total || 50,
          obtained: Number(marks.find(m => m.assignment_type.toLowerCase() === "final")?.marks) || 0,
          weighted: (() => {
            const mark = marks.find(m => m.assignment_type.toLowerCase() === "final");
            const total = mark?.total || 50;
            const obtained = Number(mark?.marks) || 0;
            return total > 0 ? (obtained / total * 50).toFixed(2) : "0.00";
          })()
        },
        cp: {
          total: marks.find(m => m.assignment_type.toLowerCase() === "c.p")?.total || 10,
          obtained: Number(marks.find(m => m.assignment_type.toLowerCase() === "c.p")?.marks) || 0,
          weighted: (() => {
            const mark = marks.find(m => m.assignment_type.toLowerCase() === "c.p");
            const total = mark?.total || 10;
            const obtained = Number(mark?.marks) || 0;
            return total > 0 ? (obtained / total * 10).toFixed(2) : "0.00";
          })()
        }
      };

      // Prepare request body
      const requestBody = {
        student_id: studentId,
        student_name: userName,
        course_code: selectedCourse.code,
        course_name: selectedCourse.name,
        semester: selectedCourse.semester,
        percentage: calculateCourseResults.percentage,
        grade: calculateCourseResults.grade,
        gpa: calculateCourseResults.gradePoint,
        credits: selectedCourse.credits || 3,
        components
      };

      // Send to backend
      const response = await fetch(`${API}/student/save_results.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
        credentials: 'include'
      });

      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.message || 'Failed to save results');

      setSaveStatus({ success: true, message: 'Results saved and locked successfully' });
      setTimeout(() => setSaveStatus(null), 3000);
    } catch (error) {
      console.error('Save Error:', error);
      setSaveStatus({ success: false, message: error.message });
      setTimeout(() => setSaveStatus(null), 3000);
    }
  };

  const downloadTranscript = async () => {
    if (!selectedCourse) return;

    try {
      // Dynamically import both jspdf and jspdf-autotable
      const { jsPDF } = await import('jspdf');
      await import('jspdf-autotable');
      
      // Initialize jsPDF with landscape orientation for better layout
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // Add university/school logo (if available)
      // doc.addImage(logo, 'PNG', 15, 10, 30, 15);

      // Title with better styling
      doc.setFontSize(20);
      doc.setTextColor(33, 37, 41); // Dark gray
      doc.setFont('helvetica', 'bold');
      doc.text('OFFICIAL ACADEMIC TRANSCRIPT', 105, 25, { align: 'center' });
      
      // Divider line
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.5);
      doc.line(20, 30, 190, 30);

      // Student Information Section
      doc.setFontSize(14);
      doc.setTextColor(41, 128, 185); // Blue
      doc.text('STUDENT INFORMATION', 20, 40);
      
      doc.setFontSize(11);
      doc.setTextColor(0, 0, 0); // Black
      doc.setFont('helvetica', 'normal');
      
      // Student details in two columns
      const studentDetails = [
        { label: 'Full Name:', value: userName },
        { label: 'Student ID:', value: studentId },
        { label: 'Email:', value: userEmail },
        { label: 'Program:', value: selectedCourse.department || 'N/A' },
        { label: 'Academic Year:', value: new Date().getFullYear() },
        { label: 'Date Issued:', value: new Date().toLocaleDateString() }
      ];

      // First column
      studentDetails.slice(0, 3).forEach((detail, index) => {
        doc.text(`${detail.label}`, 20, 50 + (index * 7));
        doc.text(`${detail.value}`, 50, 50 + (index * 7));
      });

      // Second column
      studentDetails.slice(3).forEach((detail, index) => {
        doc.text(`${detail.label}`, 110, 50 + (index * 7));
        doc.text(`${detail.value}`, 140, 50 + (index * 7));
      });

      // Course Information Section
      doc.setFontSize(14);
      doc.setTextColor(41, 128, 185);
      doc.text('COURSE INFORMATION', 20, 80);
      
      doc.setFontSize(11);
      doc.setTextColor(0, 0, 0);
      
      const courseDetails = [
        { label: 'Course Code:', value: selectedCourse.code },
        { label: 'Course Title:', value: selectedCourse.name },
        { label: 'Credit Hours:', value: selectedCourse.credits },
        { label: 'Semester:', value: selectedCourse.semester },
        { label: 'Instructor:', value: selectedCourse.teacher || 'N/A' }
      ];

      courseDetails.forEach((detail, index) => {
        doc.text(`${detail.label}`, 20, 90 + (index * 7));
        doc.text(`${detail.value}`, 50, 90 + (index * 7));
      });

      // Grade Breakdown Section with improved table styling
      doc.setFontSize(14);
      doc.setTextColor(41, 128, 185);
      doc.text('GRADE BREAKDOWN', 20, 130);
      
      const headers = [
        { title: 'Component', dataKey: 'component' },
        { title: 'Total', dataKey: 'total' },
        { title: 'Obtained', dataKey: 'obtained' },
        { title: 'Percentage', dataKey: 'percentage' },
        { title: 'Weight', dataKey: 'weight' },
        { title: 'Weighted', dataKey: 'weighted' }
      ];

      const tableData = [];

      // Add quizzes data
      const totalQuizzes = quizzes.reduce((sum, q) => sum + (Number(q.total_points) || 0), 0);
      const obtainedQuizzes = quizzes.reduce((sum, q) => {
        const result = quizMarks.find(m => m.quiz_no === q.quiz_no);
        return sum + (Number(result?.marks) || 0);
      }, 0);
      const quizPercentage = totalQuizzes > 0 ? ((obtainedQuizzes / totalQuizzes) * 100).toFixed(2) : 0;
      const quizWeighted = (quizPercentage / 100 * 10).toFixed(2);
      
      tableData.push({
        component: 'Quizzes',
        total: totalQuizzes,
        obtained: obtainedQuizzes,
        percentage: `${quizPercentage}%`,
        weight: '10%',
        weighted: quizWeighted
      });

      // Add assignments data
      const totalAssignments = assignments.reduce((sum, a) => sum + (Number(a.points) || 0), 0);
      const obtainedAssignments = assignments.reduce((sum, a) => sum + (Number(a.take_point) || 0), 0);
      const assignmentPercentage = totalAssignments > 0 ? ((obtainedAssignments / totalAssignments) * 100).toFixed(2) : 0;
      const assignmentWeighted = (assignmentPercentage / 100 * 10).toFixed(2);
      
      tableData.push({
        component: 'Assignments',
        total: totalAssignments,
        obtained: obtainedAssignments,
        percentage: `${assignmentPercentage}%`,
        weight: '10%',
        weighted: assignmentWeighted
      });

      // Add other marks
      marks.forEach(mark => {
        const maxMarks = mark.total || getMaxMarks(mark.assignment_type);
        const obtained = Number(mark.marks) || 0;
        const percentage = ((obtained / maxMarks) * 100).toFixed(2);
        let weight = 0;
        if (mark.assignment_type.toLowerCase() === "midterm") weight = 20;
        if (mark.assignment_type.toLowerCase() === "final") weight = 50;
        if (mark.assignment_type.toLowerCase() === "c.p") weight = 10;
        const weighted = (percentage / 100 * weight).toFixed(2);
        
        tableData.push({
          component: mark.assignment_type,
          total: maxMarks,
          obtained: obtained,
          percentage: `${percentage}%`,
          weight: `${weight}%`,
          weighted: weighted
        });
      });

      // Add final score
      tableData.push({
        component: 'TOTAL WEIGHTED SCORE',
        total: '',
        obtained: '',
        percentage: '',
        weight: '',
        weighted: `${calculateCourseResults.percentage}%`
      });

      // Generate table with improved styling
      doc.autoTable({
        startY: 135,
        head: [headers.map(h => h.title)],
        body: tableData.map(row => headers.map(h => row[h.dataKey])),
        theme: 'grid',
        headStyles: {
          fillColor: [41, 128, 185],
          textColor: 255,
          fontStyle: 'bold',
          halign: 'center'
        },
        columnStyles: {
          0: { fontStyle: 'bold' },
          1: { halign: 'center' },
          2: { halign: 'center' },
          3: { halign: 'center' },
          4: { halign: 'center' },
          5: { halign: 'center', fontStyle: 'bold' }
        },
        styles: {
          fontSize: 10,
          cellPadding: 3,
          overflow: 'linebreak'
        },
        margin: { top: 135 },
        didDrawPage: (data) => {
          // Footer on each page
          doc.setFontSize(8);
          doc.setTextColor(150);
          doc.text('Official Transcript - ' + userName, 105, 285, { align: 'center' });
        }
      });

      // Final Results Section with emphasis
      const finalY = doc.lastAutoTable?.finalY || 135;
      
      doc.setFontSize(14);
      doc.setTextColor(41, 128, 185);
      doc.text('FINAL RESULTS', 20, finalY + 20);
      
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      
      // Highlighted final results
      doc.setFillColor(241, 248, 255);
      doc.rect(20, finalY + 25, 170, 30, 'F');
      
      doc.text(`Final Percentage:`, 25, finalY + 35);
      doc.setFont('helvetica', 'bold');
      doc.text(`${calculateCourseResults.percentage}%`, 70, finalY + 35);
      
      doc.setFont('helvetica', 'normal');
      doc.text(`Final Grade:`, 25, finalY + 45);
      doc.setFont('helvetica', 'bold');
      doc.text(`${calculateCourseResults.grade}`, 70, finalY + 45);
      
      doc.setFont('helvetica', 'normal');
      doc.text(`Grade Points:`, 110, finalY + 45);
      doc.setFont('helvetica', 'bold');
      doc.text(`${calculateCourseResults.gradePoint}`, 150, finalY + 45);

      
    doc.text('Generated by EduConnect Student Portal', 105, 290, { align: 'center' });
    

      // Save PDF with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      doc.save(`${userName.replace(/\s+/g, '_')}_${selectedCourse.code}_Transcript_${timestamp}.pdf`);
    } catch (error) {
      console.error('Error generating transcript:', error);
      setError('Failed to generate transcript. Please try again.');
    }
  };

  return (
    <div className="student-dashboard">
      <StudentSidebar active="courses" userName={userName} onLogout={handleLogout} />

      <main className="student-course-management" style={{ marginLeft: '250px' }}>
        <div className="student-course-header">
          <h1>Academic Results</h1>
          <h3 style={{ marginTop: '5px', color: '#666' }}>
            Complete overview of your academic performance
          </h3>
        </div>

        {/* Stats Section */}
        <div className="student-stats-container">
          <div className="student-stat-card">
            <Calculator size={28} className="student-stat-icon" />
            <div>
              <h2>{calculateResults.gpa}</h2>
              <p>GPA</p>
            </div>
          </div>

          <div className="student-stat-card">
            <GraduationCap size={28} className="student-stat-icon" />
            <div>
              <h2>{calculateResults.cgpa}</h2>
              <p>CGPA</p>
            </div>
          </div>

          <div className="student-stat-card">
            <BookOpen size={28} className="student-stat-icon" />
            <div>
              <h2>{totalCourses}</h2>
              <p>Total Courses</p>
            </div>
          </div>

          <div className="student-stat-card">
            <Layers size={28} className="student-stat-icon" />
            <div>
              <h2>{totalCredits}</h2>
              <p>Credit Hours</p>
            </div>
          </div>
        </div>

        {error && (
          <div className="student-error-alert">
            <span>{error}</span>
            <button onClick={() => setError(null)}><X size={16} /></button>
          </div>
        )}

        {saveStatus && (
          <div className={`student-save-alert ${saveStatus.success ? 'success' : 'error'}`}>
            <span>{saveStatus.message}</span>
          </div>
        )}

        <div className="student-search-container">
          <div className="student-search-box">
            <Search size={18} className="student-search-icon" />
            <input
              type="text"
              placeholder="Search courses by name, code, department, or teacher..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              disabled={isLoading}
              className="student-search-input"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="student-loading">
            <div className="student-spinner"></div>
            <p>Loading enrolled courses...</p>
          </div>
        ) : filteredCourses.length === 0 ? (
          <div className="student-empty-state">
            <p>{searchTerm ? 'No matching courses found' : 'No courses enrolled yet'}</p>
            <button onClick={fetchCourses} className="student-refresh-btn">Try Again</button>
          </div>
        ) : (
          <>
            <div className="student-course-list">
              {filteredCourses.map((course, index) => (
                <div
                  key={index}
                  className={`student-course-card ${selectedCourse?.code === course.code ? 'selected' : ''}`}
                  style={{ width: '380px', height: '240px' }}
                  onClick={() => handleCourseClick(course)}
                >
                  <div className="student-course-card-header">
                    <div>
                      <h3 className="student-course-title">{course.name}</h3>
                      <p className="student-course-code">{course.code}</p>
                    </div>
                  </div>

                  <div className="student-course-details">
                    <div className="student-course-detail">
                      <Clock size={16} />
                      <span>Credit Hours: <strong>{course.credits || 'N/A'}</strong></span>
                    </div>
                    <div className="student-course-detail">
                      <Calendar size={16} />
                      <span>Semester: <strong>{course.semester || 'N/A'}</strong></span>
                    </div>
                  </div>

                  <div className="student-course-footer" style={{ marginTop: "5px" }}>
                    <span className="student-course-department">{course.department || 'General'}</span><br />
                    <span className="student-course-teacher">Teacher: {course.teacher || 'Not assigned'}</span>
                  </div>
                </div>
              ))}
            </div>

            {selectedCourse && (
              <>
                {/* Marks Section */}
                <div className="student-marks-container">
                  <div className="transcript-header">
                    <h3>Marks for {selectedCourse.name} ({selectedCourse.code})</h3>
                    <div>
                      <button 
                        onClick={saveResultsToDatabase}
                        className="save-results-btn"
                      >
                        <Save size={16} /> Save Results
                      </button>
                      <button 
                        onClick={downloadTranscript}
                        className="download-transcript-btn"
                      >
                        <Download size={16} /> Download Transcript
                      </button>
                    </div>
                  </div>

                  {/* Quizzes */}
                  <h4>Quizzes (10%)</h4>
                  {isLoadingQuizzes ? (
                    <div className="student-loading">
                      <div className="student-spinner"></div>
                      <p>Loading quizzes...</p>
                    </div>
                  ) : quizzes.length === 0 ? (
                    <p>No quizzes available for this course</p>
                  ) : (
                    <table className="student-quiz-table">
                      <thead>
                        <tr>
                          <th>Quiz No</th>
                          <th>Title</th>
                          <th>Total Points</th>
                          <th>Points</th>
                          <th>Percentage</th>
                        </tr>
                      </thead>
                      <tbody>
                        {quizzes.map((quiz, index) => {
                          const result = quizMarks.find(q => q.quiz_no === quiz.quiz_no);
                          return (
                            <tr key={index}>
                              <td>{quiz.quiz_no}</td>
                              <td>{quiz.title}</td>
                              <td>{quiz.total_points}</td>
                              <td>{result?.marks ?? '-'}</td>
                              <td>{result?.percentage ? result.percentage + "%" : '-'}</td>
                            </tr>
                          );
                        })}

                        {/* Totals Row */}
                        <tr style={{ fontWeight: "bold", background: "#f0f0f0" }}>
                          <td colSpan="2">Total</td>
                          <td>
                            {quizzes.reduce((sum, quiz) => sum + (Number(quiz.total_points) || 0 ), 0)}
                          </td>
                          <td>
                            {quizzes.reduce((sum, quiz) => {
                              const result = quizMarks.find(q => q.quiz_no === quiz.quiz_no);
                              return sum + (Number(result?.marks) || 0);
                            }, 0)}
                          </td>
                          <td>
                            {(() => {
                              const totalPoints = quizzes.reduce((sum, quiz) => sum + (Number(quiz.total_points) || 0 ), 0);
                              const studentPoints = quizzes.reduce((sum, quiz) => {
                                const result = quizMarks.find(q => q.quiz_no === quiz.quiz_no);
                                return sum + (Number(result?.marks) || 0);
                              }, 0);
                              return totalPoints > 0 ? ((studentPoints / totalPoints) * 100).toFixed(2) + "%" : "-";
                            })()}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  )}

                  {/* Assignments */}
                  <h4>Assignments (10%)</h4>
                  {isLoadingAssignments ? (
                    <p>Loading assignments...</p>
                  ) : (
                    <table>
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>Title</th>
                          <th>Total Points</th>
                          <th>Points</th>
                          <th>Percentage</th>
                        </tr>
                      </thead>
                      <tbody>
                        {assignments.length === 0 ? (
                          <tr>
                            <td colSpan="5">No assignments found</td>
                          </tr>
                        ) : (
                          <>
                            {assignments.map((a, i) => (
                              <tr key={i}>
                                <td>{a.assignment_id}</td>
                                <td>{a.title}</td>
                                <td>{a.points}</td>
                                <td>{a.take_point ?? '-'}</td>
                                <td>{a.percentage ? a.percentage + "%" : '-'}</td>
                              </tr>
                            ))}

                            {/* Totals Row */}
                            <tr style={{ fontWeight: "bold", background: "#f0f0f0" }}>
                              <td colSpan="2">Total</td>
                              <td>
                                {assignments.reduce((sum, a) => sum + (Number(a.points) || 0), 0)}
                              </td>
                              <td>
                                {assignments.reduce((sum, a) => sum + (Number(a.take_point) || 0), 0)}
                              </td>
                              <td>
                                {(() => {
                                  const totalPoints = assignments.reduce((sum, a) => sum + (Number(a.points) || 0), 0);
                                  const studentPoints = assignments.reduce((sum, a) => sum + (Number(a.take_point) || 0), 0);
                                  return totalPoints > 0 ? ((studentPoints / totalPoints) * 100).toFixed(2) + "%" : "-";
                                })()}
                              </td>
                            </tr>
                          </>
                        )}
                      </tbody>
                    </table>
                  )}

                  {/* Other Marks */}
                  {isLoadingMarks ? (
                    <div className="student-loading">
                      <div className="student-spinner"></div>
                      <p>Loading marks...</p>
                    </div>
                  ) : marks.length === 0 ? (
                    <p>No marks available for this course</p>
                  ) : (
                    <div className="results-cards-container">
                      {marks.map((mark, index) => {
                        const maxMarks = mark.total || getMaxMarks(mark.assignment_type);
                        const percentage = ((mark.marks / maxMarks) * 100).toFixed(0);

                        return (
                          <div key={index} className={`result-card card-${index}`}>
                            <div className="result-header">
                              <span>{mark.assignment_type} ({mark.weight || ''}{maxMarks}%)</span>
                            </div>
                            <div className="result-body">
                              <h2>{mark.marks}/{maxMarks}</h2>
                              <span className="percentage">{percentage}%</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <div className="student-grade-breakdown">
                    <h3>Grade Breakdown</h3>
                    
                    <table className="student-breakdown-table">
                      <thead>
                        <tr>
                          <th>Component</th>
                          <th>Total Marks</th>
                          <th>Obtained Marks</th>
                          <th>Percentage</th>
                          <th>Weight</th>
                          <th>Weighted Points</th>
                        </tr>
                      </thead>
                      <tbody>
                        {/* Quizzes Row */}
                        <tr>
                          <td>Quizzes</td>
                          <td>{quizzes.reduce((sum, q) => sum + (Number(q.total_points) || 0), 0)}</td>
                          <td>{quizzes.reduce((sum, q) => {
                            const result = quizMarks.find(m => m.quiz_no === q.quiz_no);
                            return sum + (Number(result?.marks) || 0);
                          }, 0)}</td>
                          <td>
                            {(() => {
                              const total = quizzes.reduce((sum, q) => sum + (Number(q.total_points) || 0), 0);
                              const obtained = quizzes.reduce((sum, q) => {
                                const result = quizMarks.find(m => m.quiz_no === q.quiz_no);
                                return sum + (Number(result?.marks) || 0);
                              }, 0);
                              return total > 0 ? ((obtained / total) * 100).toFixed(2) + "%" : "-";
                            })()}
                          </td>
                          <td>10%</td>
                          <td>
                            {(() => {
                              const total = quizzes.reduce((sum, q) => sum + (Number(q.total_points) || 0), 0);
                              const obtained = quizzes.reduce((sum, q) => {
                                const result = quizMarks.find(m => m.quiz_no === q.quiz_no);
                                return sum + (Number(result?.marks) || 0 );
                              }, 0);
                              return total > 0 ? (((obtained / total) * 10)).toFixed(2) : "0.00";
                            })()}
                          </td>
                        </tr>

                        {/* Assignments Row */}
                        <tr>
                          <td>Assignments</td>
                          <td>{assignments.reduce((sum, a) => sum + (Number(a.points) || 0), 0)}</td>
                          <td>{assignments.reduce((sum, a) => sum + (Number(a.take_point) || 0), 0)}</td>
                          <td>
                            {(() => {
                              const total = assignments.reduce((sum, a) => sum + (Number(a.points) || 0), 0);
                              const obtained = assignments.reduce((sum, a) => sum + (Number(a.take_point) || 0), 0);
                              return total > 0 ? ((obtained / total) * 100).toFixed(2) + "%" : "-";
                            })()}
                          </td>
                          <td>10%</td>
                          <td>
                            {(() => {
                              const total = assignments.reduce((sum, a) => sum + (Number(a.points) || 0), 0);
                              const obtained = assignments.reduce((sum, a) => sum + (Number(a.take_point) || 0), 0);
                              return total > 0 ? (((obtained / total) * 10)).toFixed(2) : "0.00";
                            })()}
                          </td>
                        </tr>

                        {/* Other Marks (Midterm / Final etc.) */}
                        {marks.map((mark, index) => {
                          const maxMarks = mark.total || getMaxMarks(mark.assignment_type);
                          const obtained = Number(mark.marks) || 0;
                          const percentage = ((obtained / maxMarks) * 100).toFixed(2);

                          let weight = 0;
                          if (mark.assignment_type.toLowerCase() === "midterm") weight = 20;
                          if (mark.assignment_type.toLowerCase() === "final") weight = 50;
                          if (mark.assignment_type.toLowerCase() === "c.p") weight = 10;

                          const weightedPoints = (maxMarks > 0) ? ((obtained / maxMarks) * weight).toFixed(2) : "0.00";

                          return (
                            <tr key={index}>
                              <td>{mark.assignment_type}</td>
                              <td>{maxMarks}</td>
                              <td>{obtained}</td>
                              <td>{percentage}%</td>
                              <td>{weight}%</td>
                              <td>{weightedPoints}</td>
                            </tr>
                          );
                        })}

                        {/* Final Row */}
                        <tr style={{ fontWeight: "bold", background: "#f8f8f8" }}>
                          <td colSpan="5">Final Weighted Score</td>
                          <td>{calculateCourseResults.percentage}%</td>
                        </tr>
                      </tbody>
                    </table>

                    {/* Result Cards */}
                    <div className="student-result-cards" style={{gap:"30px"}}>
                      <div className="student-result-card" style={{width:"250px"}}>
                        <h4>Percentage</h4>
                        <p>{calculateCourseResults.percentage}%</p>
                      </div>

                      <div className="student-result-card">
                        <h4>Grade</h4>
                        <p>{calculateCourseResults.grade}</p>
                      </div>
                      
                      <div className="student-result-card">
                        <h4>GPA</h4>
                        <p>{calculateCourseResults.gradePoint}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default StudentCourseManagement;