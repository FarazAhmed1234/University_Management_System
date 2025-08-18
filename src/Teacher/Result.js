import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Search, X, Clock, Calendar, ChevronLeft, Plus, CheckCircle } from 'lucide-react';
import TeacherSidebar from './TeacherSidebarNavigation';
import './TeacherGrades.css';
import './Result.css';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const API = 'http://localhost:8080/educonnect-backend';

const TeacherCourseManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [courses, setCourses] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [filteredAssignments, setFilteredAssignments] = useState([]);
  const [registeredStudents, setRegisteredStudents] = useState([]);
  const [selectedCourseCode, setSelectedCourseCode] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeAssignmentType, setActiveAssignmentType] = useState('Quiz');
  const [selectedQuiz, setSelectedQuiz] = useState(null);

  const teacher = JSON.parse(localStorage.getItem('teacher'));
  const teacherId = teacher?.teacher_id;
  const userName = teacher?.name;

  const fetchCourses = useCallback(async () => {
    if (!teacherId) {
      setError('Teacher not authenticated');
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API}/teacher/get_courses.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teacher_id: teacherId }),
      });
      if (!res.ok) throw new Error('Network error');
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Failed to fetch courses');
      setCourses(data.courses || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch courses');
    } finally {
      setIsLoading(false);
    }
  }, [teacherId]);

  const fetchAssignments = async (courseCode, type = activeAssignmentType) => {
    try {
      setIsLoading(true);
      setError(null);
      setSelectedQuiz(null);

      if (type === "Quiz") {
        const res = await fetch(`${API}/teacher/get_quizzes.php`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ course_code: courseCode }),
        });
        if (!res.ok) throw new Error("Network error");
        const data = await res.json();
        if (!data.success) throw new Error(data.message || "Failed to fetch quizzes");
        setAssignments(data.quizzes || []);
        setFilteredAssignments(data.quizzes || []);
        setSelectedCourseCode(courseCode);
        return;
      }

      if (type === "Results") {
        await fetchResults(courseCode);
        return;
      }

      const res = await fetch(`${API}/teacher/get_assignment.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ course_code: courseCode }),
      });
      if (!res.ok) throw new Error("Network error");
      const data = await res.json();
      if (!data.success) throw new Error(data.message || "Failed to fetch assignments");
      setAssignments(data.assignments || []);
      filterAssignmentsByType(data.assignments || [], type);
      setSelectedCourseCode(courseCode);

      if (['Midterm', 'Final', 'C.P'].includes(type)) {
        await fetchRegisteredStudents(courseCode);
      } else {
        setRegisteredStudents([]);
      }
    } catch (err) {
      setError(err.message || "Failed to fetch assignments");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRegisteredStudents = async (courseCode) => {
    try {
      const res = await fetch(`${API}/teacher/get_registered_students.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ course_code: courseCode }),
      });
      if (!res.ok) throw new Error('Network error');
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Failed to fetch students');
      setRegisteredStudents(data.students || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch registered students');
    }
  };

  const filterAssignmentsByType = (list, type) => {
    let filtered = [];
    switch (type) {
      case 'Final': filtered = list.filter(a => a.type === 'Final'); break;
      case 'Midterm': filtered = list.filter(a => a.type === 'Midterm'); break;
      case 'Quiz': filtered = list.filter(a => a.type === 'Quiz'); break;
      case 'C.P': filtered = list.filter(a => a.type === 'C.P'); break;
      case 'Assignments':
      default: filtered = list.filter(a => a.type === 'Assignment' || !a.type); break;
    }
    setFilteredAssignments(filtered);
  };

  const fetchResults = async (courseCode) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const res = await fetch(`${API}/teacher/get_results.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ course_code: courseCode }),
      });
      
      if (!res.ok) throw new Error('Network error');
      const data = await res.json();
      
      if (!data.success) throw new Error(data.message || 'Failed to fetch results');
      
      setAssignments([]);
      setFilteredAssignments(data.data || []);
      setSelectedCourseCode(courseCode);
      
    } catch (err) {
      setError(err.message || 'Failed to fetch results');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAssignmentTypeChange = async (type) => {
    setActiveAssignmentType(type);
    setSelectedQuiz(null);
    if (selectedCourseCode) {
      await fetchAssignments(selectedCourseCode, type);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('teacher');
    window.location.href = '/';
  };

  const filteredCoursesList = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return courses.filter(course =>
      (course.name || '').toLowerCase().includes(term) ||
      (course.code || '').toLowerCase().includes(term) ||
      (course.department || '').toLowerCase().includes(term)
    );
  }, [courses, searchTerm]);

  useEffect(() => { fetchCourses(); }, [fetchCourses]);

  return (
    <div className="teacher-dashboard">
      <TeacherSidebar active="courses" userName={userName} onLogout={handleLogout} />
      <main className="teacher-course-management">
        <div className="teacher-course-header">
          <h1>Grade Management</h1>
          <h5>Review and grade student submissions</h5>
        </div>

        {error && (
          <div className="teacher-error-alert">
            <span>{error}</span>
            <button onClick={() => setError(null)}><X size={16} /></button>
          </div>
        )}

        {isLoading ? (
          <div className="teacher-loading">
            <div className="teacher-spinner"></div>
            <p>Loading...</p>
          </div>
        ) : selectedCourseCode ? (
          <AssignmentsView
            selectedCourseCode={selectedCourseCode}
            activeAssignmentType={activeAssignmentType}
            handleAssignmentTypeChange={handleAssignmentTypeChange}
            registeredStudents={registeredStudents}
            setRegisteredStudents={setRegisteredStudents}
            assignments={filteredAssignments}
            selectedQuiz={selectedQuiz}
            setSelectedQuiz={setSelectedQuiz}
            onBack={() => {
              setSelectedCourseCode(null);
              setRegisteredStudents([]);
              setFilteredAssignments([]);
              setSelectedQuiz(null);
            }}
            refreshAssignments={() => {
              if (activeAssignmentType === 'Results') {
                fetchResults(selectedCourseCode);
              } else {
                fetchAssignments(selectedCourseCode, activeAssignmentType);
              }
            }}
            error={error}
            setError={setError}
          />
        ) : filteredCoursesList.length === 0 ? (
          <EmptyState searchTerm={searchTerm} fetchCourses={fetchCourses} />
        ) : (
          <CourseList
            filteredCourses={filteredCoursesList}
            fetchAssignments={fetchAssignments}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            isLoading={isLoading}
          />
        )}
      </main>
    </div>
  );
};

const AssignmentsView = ({
  selectedCourseCode,
  activeAssignmentType,
  handleAssignmentTypeChange,
  registeredStudents,
  setRegisteredStudents,
  assignments,
  selectedQuiz,
  setSelectedQuiz,
  onBack,
  refreshAssignments,
  error,
  setError
}) => {
  const [marksData, setMarksData] = useState([]);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState(null);
  const [localError, setLocalError] = useState(null);
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [newQuiz, setNewQuiz] = useState({
    quizNo: '',
    title: '',
    totalPoints: 10,
    dueDate: ''
  });
  const [messageTimeout, setMessageTimeout] = useState(null);
  const [isFading, setIsFading] = useState(false);
const handleDownloadPDF = () => {
  if (activeAssignmentType !== 'Results' || assignments.length === 0) return;

  const doc = new jsPDF();
  
  // Title and header
  doc.setFontSize(18);
  doc.setTextColor(33, 37, 41); // Dark gray
  doc.text(`Course Results - ${selectedCourseCode}`, 105, 15, { align: 'center' });
  
  doc.setFontSize(10);
  doc.setTextColor(108, 117, 125); // Gray
  doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 105, 22, { align: 'center' });
  
  // Calculate statistics
  const gradeDistribution = {
    'A': 0,
    'A-': 0,
    'B+': 0,
    'B': 0,
    'B-': 0,
    'C+': 0,
    'C': 0,
    'C-': 0,
    'D+': 0,
    'D': 0,
    'F': 0
  };
  
  let totalGPA = 0;
  let totalStudents = assignments.length;
  
  assignments.forEach(result => {
    gradeDistribution[result.final_grade]++;
    totalGPA += parseFloat(result.gpa) || 0;
  });
  
  const averageGPA = totalStudents > 0 ? (totalGPA / totalStudents).toFixed(2) : 0;
  
  // Grade distribution table
  doc.setFontSize(12);
  doc.setTextColor(33, 37, 41);
  doc.text('Grade Distribution', 14, 35);
  
  const gradeTableData = [];
  Object.entries(gradeDistribution).forEach(([grade, count]) => {
    if (count > 0) {
      const percentage = ((count / totalStudents) * 100).toFixed(1);
      gradeTableData.push([grade, count, `${percentage}%`]);
    }
  });
  
  doc.autoTable({
    startY: 40,
    head: [['Grade', 'Students', 'Percentage']],
    body: gradeTableData,
    margin: { left: 14 },
    styles: {
      fontSize: 10,
      cellPadding: 3,
      overflow: 'linebreak',
      textColor: [33, 37, 41]
    },
    headStyles: {
      fillColor: [41, 128, 185],
      textColor: 255,
      fontStyle: 'bold'
    },
    alternateRowStyles: {
      fillColor: [248, 249, 250]
    }
  });
  
  // Summary statistics
  const statsY = doc.lastAutoTable.finalY + 10;
  doc.setFontSize(12);
  doc.text('Summary Statistics', 14, statsY);
  
  doc.setFontSize(10);
  doc.text(`Total Students: ${totalStudents}`, 14, statsY + 8);
  doc.text(`Average GPA: ${averageGPA}`, 14, statsY + 16);
  
  // Detailed results table
  doc.addPage();
  doc.setFontSize(16);
  doc.text(`Detailed Results - ${selectedCourseCode}`, 105, 15, { align: 'center' });
  
  // Table data
  const headers = [
    { header: 'Student ID', dataKey: 'student_id' },
    { header: 'Student Name', dataKey: 'student_name' },
    { header: 'Quiz (%)', dataKey: 'quiz_weighted' },
    { header: 'Assignments (%)', dataKey: 'assignment_weighted' },
    { header: 'Midterm (%)', dataKey: 'midterm_weighted' },
    { header: 'Final (%)', dataKey: 'final_weighted' },
    { header: 'CP (%)', dataKey: 'cp_weighted' },
    { header: 'Total (%)', dataKey: 'total_percentage' },
    { header: 'Grade', dataKey: 'final_grade' },
    { header: 'GPA', dataKey: 'gpa' }  ];
  
  const data = assignments.map(result => ({
    student_id: result.student_id,
    student_name: result.student_name,
    quiz_weighted: result.quiz_weighted,
    assignment_weighted: result.assignment_weighted,
    midterm_weighted: result.midterm_weighted,
    final_weighted: result.final_weighted,
    cp_weighted: result.cp_weighted,
    total_percentage: result.total_percentage,
    final_grade: result.final_grade,
    gpa: result.gpa  }));
  
  // AutoTable with improved styling
  doc.autoTable({
    startY: 25,
    columns: headers,
    body: data,
    margin: { left: 14, right: 14 },
    styles: {
      fontSize: 8,
      cellPadding: 2,
      overflow: 'linebreak',
      textColor: [33, 37, 41],
      valign: 'middle'
    },
    headerStyles: {
      fillColor: [41, 128, 185],
      textColor: 255,
      fontStyle: 'bold',
      halign: 'center'
    },
    columnStyles: {
      student_id: { cellWidth: 20 },
      student_name: { cellWidth: 30 },
      quiz_weighted: { halign: 'right' },
      assignment_weighted: { halign: 'right' },
      midterm_weighted: { halign: 'right' },
      final_weighted: { halign: 'right' },
      cp_weighted: { halign: 'right' },
      total_percentage: { halign: 'right' },
      final_grade: { halign: 'center' },
      gpa: { halign: 'right' },
    },
    alternateRowStyles: {
      fillColor: [248, 249, 250]
    },
    didDrawCell: (data) => {
      // Highlight cells with failing grades
      if (data.column.dataKey === 'final_grade' && data.cell.raw === 'F') {
        doc.setFillColor(220, 53, 69); // Red
        doc.rect(data.cell.x, data.cell.y, data.cell.width, data.cell.height, 'F');
        doc.setTextColor(255, 255, 255);
      }
      // Highlight cells with A grades
      if (data.column.dataKey === 'final_grade' && data.cell.raw === 'A') {
        doc.setFillColor(40, 167, 69); // Green
        doc.rect(data.cell.x, data.cell.y, data.cell.width, data.cell.height, 'F');
        doc.setTextColor(255, 255, 255);
      }
    }
  });
  
  // Footer
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(108, 117, 125);
    doc.text(`Page ${i} of ${pageCount}`, 105, doc.internal.pageSize.height - 10, { align: 'center' });
  }
  
  // Save the PDF
  doc.save(`Course_Results_${selectedCourseCode}_${new Date().toISOString().slice(0,10)}.pdf`);
};
  const showSuccessMessage = (message) => {
    if (messageTimeout) {
      clearTimeout(messageTimeout);
      setIsFading(false);
    }
    
    setSaveMessage(message);
    
    const timeout = setTimeout(() => {
      setIsFading(true);
      
      const removeTimeout = setTimeout(() => {
        setSaveMessage(null);
        setIsFading(false);
      }, 300);
      
      setMessageTimeout(removeTimeout);
    }, 4700);
    
    setMessageTimeout(timeout);
  };

  useEffect(() => {
    return () => {
      if (messageTimeout) {
        clearTimeout(messageTimeout);
      }
    };
  }, [messageTimeout]);

  const getTotalForType = (type) => {
    if (type === 'Final') return 50;
    if (type === 'Midterm') return 20;
    if (type === 'C.P') return 10;
    if (selectedQuiz) return selectedQuiz.total_points || 10;
    return 0;
  };

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

  const handleDeleteQuiz = async (quizId) => {
    if (!window.confirm('Are you sure you want to delete this quiz? This action cannot be undone.')) return;

    try {
      setSaving(true);
      setLocalError(null);
      
      const res = await fetch(`${API}/teacher/delete_quiz.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quiz_id: quizId }),
      });

      const data = await res.json();
      
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to delete quiz');
      }

      showSuccessMessage('Quiz deleted successfully!');
      refreshAssignments();
    } catch (err) {
      setLocalError(err.message || 'Failed to delete quiz');
    } finally {
      setSaving(false);
    }
  };

  const handleQuizClick = async (quiz) => {
    setSelectedQuiz(quiz);
    try {
      const res = await fetch(`${API}/teacher/get_registered_students.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ course_code: selectedCourseCode }),
      });
      if (!res.ok) throw new Error('Network error');
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Failed to fetch students');
      setRegisteredStudents(data.students || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch registered students');
    }
  };

  const fetchQuizMarks = async (quizId) => {
    try {
      const res = await fetch(`${API}/teacher/get_quiz_marks.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quiz_id: quizId }),
      });
      if (!res.ok) throw new Error('Network error');
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Failed to fetch quiz marks');
      return data.marks || [];
    } catch (err) {
      console.error('Error fetching quiz marks', err);
      return [];
    }
  };

  useEffect(() => {
    if (!selectedQuiz && !['Midterm', 'Final', 'C.P'].includes(activeAssignmentType)) {
      setMarksData([]);
      return;
    }

    const initializeMarksData = async () => {
      const total = getTotalForType(activeAssignmentType);
      const initialMarks = registeredStudents.map(s => ({
        student_id: s.student_id,
        student_name: s.student_name,
        marks: '',
        percentage: '',
        grade: '',
        total: total
      }));

      if (selectedQuiz) {
        const savedMarks = await fetchQuizMarks(selectedQuiz.quiz_id);
        const updatedMarks = initialMarks.map(item => {
          const saved = savedMarks.find(m => m.student_id === item.student_id);
          if (saved) {
            return {
              ...item,
              marks: String(saved.marks),
              percentage: String(saved.percentage),
              grade: saved.grade
            };
          }
          return item;
        });
        setMarksData(updatedMarks);
      } else {
        const fetchSavedMarks = async () => {
          try {
            const res = await fetch(`${API}/teacher/get_saved_marks.php`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                course_code: selectedCourseCode,
                type: activeAssignmentType
              }),
            });
            const data = await res.json();
            if (!data.success) return;

            setMarksData(prev =>
              prev.map(item => {
                const saved = data.marks.find(m => m.student_id === item.student_id);
                if (saved) {
                  return {
                    ...item,
                    marks: String(saved.marks),
                    percentage: String(saved.percentage),
                    grade: saved.grade
                  };
                }
                return item;
              })
            );
          } catch (err) {
            console.error('Error fetching saved marks', err);
          }
        };

        setMarksData(initialMarks);
        fetchSavedMarks();
      }
    };

    initializeMarksData();
  }, [registeredStudents, activeAssignmentType, selectedCourseCode, selectedQuiz]);

  const handleMarksChange = (id, value) => {
    setMarksData(prev =>
      prev.map(item => {
        if (item.student_id === id) {
          if (value === '') {
            return { ...item, marks: '', percentage: '', grade: '' };
          }
          let num = Number(value);
          if (Number.isNaN(num)) num = 0;
          if (num < 0) num = 0;
          if (num > item.total) num = item.total;
          const percentage = item.total > 0 ? (num / item.total) * 100 : 0;
          return { 
            ...item, 
            marks: String(num), 
            percentage: percentage.toFixed(2), 
            grade: calculateGrade(percentage) 
          };
        }
        return item;
      })
    );
  };

  const handleSaveMarks = async () => {
    const atLeastOne = marksData.some(m => m.marks !== '');
    if (!atLeastOne) {
      setLocalError('Enter marks for at least one student before saving.');
      return;
    }

    try {
      setSaving(true);
      setLocalError(null);

      const payload = selectedQuiz 
        ? {
            quiz_id: selectedQuiz.quiz_id,
            course_code: selectedCourseCode,
            marks: marksData
              .filter(m => m.marks !== '' && m.marks !== null)
              .map(m => ({
                student_id: m.student_id,
                marks: Number(m.marks),
                percentage: m.percentage ? Number(m.percentage) : null,
                grade: m.grade || null
              }))
          }
        : {
            course_code: selectedCourseCode,
            type: activeAssignmentType,
            marks: marksData
              .filter(m => m.marks !== '' && m.marks !== null)
              .map(m => ({
                student_id: m.student_id,
                marks: Number(m.marks),
                percentage: m.percentage ? Number(m.percentage) : null,
                grade: m.grade || null
              }))
          };

      const endpoint = selectedQuiz 
        ? 'save_quiz_marks.php' 
        : 'save_marks.php';

      const res = await fetch(`${API}/teacher/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to save marks');
      }

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.message || 'Failed to save marks');
      }

      showSuccessMessage('Marks saved successfully!');
      
      if (selectedQuiz) {
        const savedMarks = await fetchQuizMarks(selectedQuiz.quiz_id);
        const updatedMarks = marksData.map(item => {
          const saved = savedMarks.find(m => m.student_id === item.student_id);
          if (saved) {
            return {
              ...item,
              marks: String(saved.marks),
              percentage: String(saved.percentage),
              grade: saved.grade
            };
          }
          return item;
        });
        setMarksData(updatedMarks);
      }
      
    } catch (err) {
      setLocalError(err.message || 'Failed to save marks');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateQuiz = async () => {
    if (!newQuiz.quizNo || !newQuiz.title) {
      setLocalError('Quiz number and title are required');
      return;
    }

    try {
      setSaving(true);
      setLocalError(null);

      const res = await fetch(`${API}/teacher/create_quiz.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          course_code: selectedCourseCode,
          quiz_no: newQuiz.quizNo,
          title: newQuiz.title,
          total_points: newQuiz.totalPoints,
          due_date: newQuiz.dueDate
        }),
      });

      const data = await res.json();
      
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to create quiz');
      }

      showSuccessMessage('Quiz created successfully!');
      
      setTimeout(() => {
        setShowQuizModal(false);
        setNewQuiz({
          quizNo: '',
          title: '',
          totalPoints: 10,
          dueDate: ''
        });
        refreshAssignments();
      }, 2000);

    } catch (err) {
      setLocalError(err.message || 'Failed to create quiz');
    } finally {
      setSaving(false);
    }
  };

  const getAssignmentTypeLabel = (type) => {
    switch (type) {
      case 'Assignments': return 'Assignments';
      case 'Quiz': return selectedQuiz ? ` ${selectedQuiz.quiz_no} - ${selectedQuiz.title}` : 'Quizzes';
      case 'Final': return 'Final Exams';
      case 'Midterm': return 'Midterm Exams';
      case 'C.P': return 'Class Projects';
      case 'Results': return 'Course Results';
      default: return 'Assignments';
    }
  };

  const handleBackToQuizzes = () => {
    setSelectedQuiz(null);
  };

  return (
    <div className="assignment-section">
      <div className="assignment-header">
        <h2>{getAssignmentTypeLabel(activeAssignmentType)} - {selectedCourseCode}</h2>
        {selectedQuiz ? (
          <button className="back-btn" onClick={handleBackToQuizzes}>
            <ChevronLeft size={16} /> Back to Quizzes
          </button>
        ) : (
          <button className="back-btn" onClick={onBack}>
            <ChevronLeft size={16} /> Back
          </button>
        )}
      </div>

      {!selectedQuiz && (
        <div className="assignment-type-filter">
          {['Quiz', 'Final', 'Midterm', 'C.P', 'Results'].map(type => (
            <button
              key={type}
              className={activeAssignmentType === type ? 'active' : ''}
              onClick={() => handleAssignmentTypeChange(type)}
            >
              {type}
            </button>
          ))}
        </div>
      )}

      {localError && (
        <div className="teacher-error-alert" style={{ marginTop: 8 }}>
          <span>{localError}</span>
          <button onClick={() => setLocalError(null)}><X size={12} /></button>
        </div>
      )}

      {saveMessage && (
        <div className={`teacher-success-alert ${isFading ? 'fade-out' : ''}`} style={{ marginTop: 8 }}>
          <span>
            <CheckCircle size={16} style={{ marginRight: 8 }} />
            {saveMessage}
          </span>
          <button onClick={() => {
            setSaveMessage(null);
            setIsFading(false);
            if (messageTimeout) clearTimeout(messageTimeout);
          }}>
            <X size={12} />
          </button>
        </div>
      )}

      {activeAssignmentType === 'Results' ? (
        <div className="results-container">
          <div className="results-header">
            <h3>Student Course Results</h3>
            <button 
              className="download-pdf-btn"
              onClick={handleDownloadPDF}
              disabled={assignments.length === 0}
            >
              Download PDF
            </button>
          </div>
          {assignments.length === 0 ? (
            <p>No results found for this course.</p>
          ) : (
            <div className="results-table-container">
              <table className="results-table">
                <thead>
                  <tr>
                    <th>Student ID</th>
                    <th>Student Name</th>
                    <th>Course Code</th>
                    <th>Course Name</th>
                    <th>Semester</th>
                    <th>Quiz (%)</th>
                    <th>Assignments (%)</th>
                    <th>Midterm (%)</th>
                    <th>Final (%)</th>
                    <th>CP (%)</th>
                    <th>Total (%)</th>
                    <th>Grade</th>
                    <th>GPA</th>
                    <th>Credits</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {assignments.map(result => (
                    <tr key={`${result.student_id}-${result.course_code}`}>
                      <td>{result.student_id}</td>
                      <td>{result.student_name}</td>
                      <td>{result.course_code}</td>
                      <td>{result.course_name}</td>
                      <td>{result.semester}</td>
                      <td>{result.quiz_weighted}</td>
                      <td>{result.assignment_weighted}</td>
                      <td>{result.midterm_weighted}</td>
                      <td>{result.final_weighted}</td>
                      <td>{result.cp_weighted}</td>
                      <td>{result.total_percentage}</td>
                      <td>{result.final_grade}</td>
                      <td>{result.gpa}</td>
                      <td>{result.credits_earned}</td>
                      <td>{result.locked === "1" ? "Locked" : "Unlocked"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : activeAssignmentType === 'Quiz' && !selectedQuiz && (
        <div className="quiz-actions">
          <span className="quiz-total">Total Marks: 10</span>
          <button 
            className="add-quiz-btn"
            onClick={() => {
              setShowQuizModal(true);
              setLocalError(null);
              setSaveMessage(null);
            }}
          >
            <Plus size={16} /> Add New Quiz
          </button>
        </div>
      )}

      {activeAssignmentType === 'Quiz' && !selectedQuiz && (
        <div className="quiz-list">
          {assignments.length > 0 ? (
            <ul>
              {assignments.map(q => (
                <li key={q.quiz_id} onClick={() => handleQuizClick(q)}>
                  <div className="quiz-info">
                    <strong>{q.quiz_no}</strong> - {q.title} (Points: {q.total_points})
                    <span className="quiz-date">
                      {new Date(q.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <button 
                    className="delete-quiz-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteQuiz(q.quiz_id);
                    }}
                    disabled={saving}
                  >
                    Delete
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p>No quizzes found for this course.</p>
          )}
        </div>
      )}

      {(selectedQuiz || ['Midterm', 'Final', 'C.P'].includes(activeAssignmentType)) && (
        <div className="marks-container">
          <h3>Total Marks: {getTotalForType(activeAssignmentType)}</h3>
          {marksData.length === 0 ? (
            <p>No registered students for this course.</p>
          ) : (
            <>
              <div className="marks-table-container">
                <table className="marks-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Name</th>
                      <th>Marks</th>
                      <th>Percentage</th>
                      <th>Grade</th>
                    </tr>
                  </thead>
                  <tbody>
                    {marksData.map(s => (
                      <tr key={s.student_id}>
                        <td>{s.student_id}</td>
                        <td>{s.student_name}</td>
                        <td>
                          <input
                            type="number"
                            value={s.marks}
                            placeholder="0"
                            min="0"
                            max={s.total}
                            onChange={(e) => handleMarksChange(s.student_id, e.target.value)}
                          />
                        </td>
                        <td>{s.percentage || ''}</td>
                        <td>{s.grade || ''}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="marks-actions">
                <button 
                  className="save-btn" 
                  onClick={handleSaveMarks} 
                  disabled={saving}
                >
                  {saving ? 'Saving...' : `Save ${selectedQuiz ? 'Quiz' : activeAssignmentType} Marks`}
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {showQuizModal && (
        <div className="modal-overlay">
          <div className="quiz-modal">
            <div className="modal-header">
              <h3>Create New Quiz</h3>
              <button onClick={() => {
                setShowQuizModal(false);
                setLocalError(null);
                setSaveMessage(null);
              }}><X size={16} /></button>
            </div>
            <div className="modal-body" style={{marginTop:"9px", marginBottom:"5px"}}>
              {localError && (
                <div className="teacher-error-alert" style={{ margin: '10px 0' }}>
                  <span>{localError}</span>
                </div>
              )}
              {saveMessage && (
                <div className="teacher-success-alert" style={{ margin: '10px 0' }}>
                  <span>{saveMessage}</span>
                </div>
              )}
              <div className="form-group">
                <label>Quiz Number</label>
                <input
                  type="text"
                  value={newQuiz.quizNo}
                  onChange={(e) => setNewQuiz({...newQuiz, quizNo: e.target.value})}
                  placeholder="e.g., Quiz 1"
                />
              </div>
              <div className="form-group">
                <label>Quiz Title</label>
                <input
                  type="text"
                  value={newQuiz.title}
                  onChange={(e) => setNewQuiz({...newQuiz, title: e.target.value})}
                  placeholder="Enter quiz title"
                />
              </div>
              <div className="form-group">
                <label>Total Points</label>
                <input
                  type="number"
                  value={newQuiz.totalPoints}
                  onChange={(e) => setNewQuiz({...newQuiz, totalPoints: e.target.value})}
                  min="10"
                  max="10"
                />
              </div>
            </div>
            <div className="modal-footer">
              <button 
                className="cancel-btn"
                onClick={() => {
                  setShowQuizModal(false);
                  setLocalError(null);
                  setSaveMessage(null);
                }}
              >
                Cancel
              </button>
              <button 
                className="save-btn"
                onClick={handleCreateQuiz}
                disabled={saving}
              >
                {saving ? 'Creating...' : 'Create Quiz'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const EmptyState = ({ searchTerm, fetchCourses }) => (
  <div className="teacher-empty-state">
    <p>{searchTerm ? 'No matching courses found' : 'No courses assigned yet'}</p>
    <button onClick={fetchCourses} className="teacher-refresh-btn">Try Again</button>
  </div>
);

const CourseList = ({ filteredCourses, fetchAssignments, searchTerm, setSearchTerm, isLoading }) => (
  <>
    <div className="teacher-search-container">
      <div className="teacher-search-box">
        <Search size={18} className="teacher-search-icon" />
        <input
          type="text"
          placeholder="Search courses..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          disabled={isLoading}
        />
      </div>
    </div>
    <div className="teacher-course-list">
      {filteredCourses.map(course => (
        <div key={course.code} className="teacher-course-card" onClick={() => fetchAssignments(course.code)}>
          <div className="teacher-course-card-header">
            <h3>{course.name}</h3>
            <p className="teacher-course-code">{course.code}</p>
          </div>
          <div className="teacher-course-details">
            <div><Clock size={16} /> Credit Hours: <strong>{course.credit_hours || 'N/A'}</strong></div>
            <div><Calendar size={16} /> Semester: <strong>{course.semester || 'N/A'}</strong></div>
          </div>
          <div className="teacher-course-footer">
            <span>{course.department || 'General'}</span>
          </div>
        </div>
      ))}
    </div>
  </>
);

export default TeacherCourseManagement;