import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Search, X, Clock, Calendar, ChevronLeft, FileText, Save } from 'lucide-react';
import TeacherSidebar from './TeacherSidebarNavigation';
import './TeacherGrades.css';

const TeacherCourseManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [courses, setCourses] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [filteredAssignments, setFilteredAssignments] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [selectedCourseCode, setSelectedCourseCode] = useState(null);
  const [viewingAssignmentId, setViewingAssignmentId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingSubmission, setEditingSubmission] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [activeAssignmentType, setActiveAssignmentType] = useState('Assignments');

  const API = 'http://localhost:8080/educonnect-backend';
  const teacher = JSON.parse(localStorage.getItem('teacher'));
  const teacherId = teacher?.teacher_id;
  const userName = teacher?.name;

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

  const fetchCourses = useCallback(async () => {
    if (!teacherId) {
      setError('Teacher not authenticated');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API}/teacher/get_courses.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teacher_id: teacherId }),
      });

      if (!response.ok) throw new Error('Network response was not ok');

      const data = await response.json();
      if (!data.success) throw new Error(data.message || 'Failed to fetch courses');

      setCourses(data.courses || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [API, teacherId]);

  const fetchAssignments = async (courseCode) => {
    try {
      setIsLoading(true);
      const response = await fetch(`${API}/teacher/get_assignment.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ course_code: courseCode }),
      });

      if (!response.ok) throw new Error('Network response was not ok');

      const data = await response.json();
      if (!data.success) throw new Error(data.message || 'Failed to fetch assignments');

      setAssignments(data.assignments || []);
      filterAssignmentsByType(data.assignments || [], activeAssignmentType);
      setSelectedCourseCode(courseCode);
      setViewingAssignmentId(null);
      setSubmissions([]);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const filterAssignmentsByType = (assignmentsList, type) => {
    let filtered = [];
    if (type === 'Quiz') {
      filtered = assignmentsList.filter(a => a.type === 'Quiz');
    } else {
      filtered = assignmentsList.filter(a => a.type === 'Assignment' || !a.type);
    }
    setFilteredAssignments(filtered);
  };

  const handleAssignmentTypeChange = (type) => {
    setActiveAssignmentType(type);
    filterAssignmentsByType(assignments, type);
  };

  const handleViewSubmissions = async (assignmentId) => {
    try {
      setIsLoading(true);
      setViewingAssignmentId(assignmentId);

      const response = await fetch(`${API}/teacher/get_submission.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignment_id: assignmentId }),
      });

      if (!response.ok) throw new Error('Network response was not ok');

      const data = await response.json();
      if (!data.success) throw new Error(data.message || 'Failed to fetch submissions');

      setSubmissions(data.submissions || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };
const handleUpdateSubmission = async (submissionId, updatedData) => {
  setIsUpdating(true);
  setError(null);

  try {
    // Validate points
    const points = parseFloat(updatedData.take_point);
    if (isNaN(points)) {
      throw new Error('Points must be a valid number');
    }

    const response = await fetch(`${API}/teacher/updateSubmission.php`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: submissionId,
        take_point: points,
        feedback: updatedData.feedback || ''
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to update submission');
    }

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || 'Update failed');
    }

    setSubmissions(prev =>
      prev.map(sub =>
        sub.id === submissionId
          ? {
              ...sub,
              take_point: data.submission.take_point,
              feedback: data.submission.feedback,
              percentage: data.submission.percentage,
              grade: data.submission.grade,
              updated_at: data.submission.updated_at
            }
          : sub
      )
    );
    
    setEditingSubmission(null);
    return true;
  } catch (err) {
    setError(err.message);
    return false;
  } finally {
    setIsUpdating(false);
  }
};

  const handleCancelAssignments = () => {
    setSelectedCourseCode(null);
    setAssignments([]);
    setFilteredAssignments([]);
    setViewingAssignmentId(null);
    setSubmissions([]);
    setActiveAssignmentType('Assignments');
  };

  const handleCloseSubmissions = () => {
    setViewingAssignmentId(null);
    setSubmissions([]);
  };

  const handleLogout = () => {
    localStorage.removeItem('teacher');
    window.location.href = '/';
  };

  const filteredCourses = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return courses.filter(course =>
      course.name?.toLowerCase().includes(term) ||
      course.code?.toLowerCase().includes(term) ||
      course.department?.toLowerCase().includes(term)
    );
  }, [courses, searchTerm]);

  useEffect(() => { fetchCourses(); }, [fetchCourses]);

  return (
    <div className="teacher-dashboard">
      <TeacherSidebar active="courses" userName={userName} onLogout={handleLogout} />

      <main className="teacher-course-management">
        <div className="teacher-course-header">
          <h1> View Submissions</h1>
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
        ) : viewingAssignmentId ? (
          <SubmissionsView
            submissions={submissions}
            assignments={assignments}
            viewingAssignmentId={viewingAssignmentId}
            editingSubmission={editingSubmission}
            setEditingSubmission={setEditingSubmission}
            handleUpdateSubmission={handleUpdateSubmission}
            handleCloseSubmissions={handleCloseSubmissions}
            isUpdating={isUpdating}
            API={API}
            calculateGrade={calculateGrade}
          />
        ) : selectedCourseCode ? (
          <AssignmentsView
            assignments={filteredAssignments}
            selectedCourseCode={selectedCourseCode}
            handleViewSubmissions={handleViewSubmissions}
            handleCancelAssignments={handleCancelAssignments}
            API={API}
            activeAssignmentType={activeAssignmentType}
            handleAssignmentTypeChange={handleAssignmentTypeChange}
          />
        ) : filteredCourses.length === 0 ? (
          <EmptyState searchTerm={searchTerm} fetchCourses={fetchCourses} />
        ) : (
          <CourseList
            filteredCourses={filteredCourses}
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

const SubmissionsView = ({
  submissions,
  assignments,
  viewingAssignmentId,
  editingSubmission,
  setEditingSubmission,
  handleUpdateSubmission,
  handleCloseSubmissions,
  isUpdating,
  API,
  calculateGrade
}) => {
  const assignment = assignments.find(a => a.id === viewingAssignmentId);
  const maxPoints = parseFloat(assignment?.points) || 100;

  const handlePointsChange = (submission, value) => {
    const points = parseFloat(value);
    if (isNaN(points)) return;

    const percentage = maxPoints > 0 ? (points / maxPoints) * 100 : 0;
    const grade = calculateGrade(percentage);

    setEditingSubmission({
      ...submission,
      take_point: points,
      percentage,
      grade
    });
  };

  return (
    <div className="submissions-section">
      <div className="submissions-header">
        <h2>Submissions for {assignment?.title || 'Assignment'}</h2>
        <p>Max Points: {maxPoints}</p>
        <button onClick={handleCloseSubmissions} className="back-button">
          <ChevronLeft size={16} /> Back to Assignments
        </button>
      </div>

      {submissions.length === 0 ? (
        <p>No submissions found for this assignment.</p>
      ) : (
        <div className="submissions-table-container">
          <table className="submissions-table">
            <thead>
              <tr>
                <th>Student ID</th>
                <th>Student Name</th>
                <th>Points</th>
                <th>Percentage</th>
                <th>Grade</th>
                <th>Feedback</th>
                <th>File</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {submissions.map((submission) => {
                const isEditing = editingSubmission?.id === submission.id;
                const currentData = isEditing ? editingSubmission : submission;
                const percentage = maxPoints > 0 ? Math.round((currentData.take_point / maxPoints) * 100) : 0;
                const grade = currentData.grade || calculateGrade(percentage);

                return (
                  <tr key={submission.id}>
                    <td>{submission.student_id}</td>
                    <td>{submission.student_name || 'N/A'}</td>
                    <td>
                      <input
                        type="number"
                        value={currentData.take_point || ''}
                        onChange={(e) => handlePointsChange(submission, e.target.value)}
                        placeholder="0"
                        min="0"
                        max={maxPoints}
                        step="0.1"
                        disabled={isUpdating}
                      />
                    </td>
                    <td>{percentage}%</td>
                    <td>{grade}</td>
                    <td>
                      <input
                        type="text"
                        value={currentData.feedback || ''}
                        onChange={(e) => setEditingSubmission({
                          ...(editingSubmission || submission),
                          feedback: e.target.value
                        })}
                        placeholder="Add feedback..."
                        disabled={isUpdating}
                      />
                    </td>
                    <td>
                      {submission.file_path && (
                        <a
                          href={`${API}/student/uploads/${submission.student_id}/${submission.file_path}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="download-link"
                        >
                          <FileText size={16} /> View
                        </a>
                      )}
                    </td>
                    <td>
                      {isEditing ? (
                        <button
                          onClick={() => handleUpdateSubmission(submission.id, {
                            take_point: editingSubmission.take_point,
                            feedback: editingSubmission.feedback
                          })}
                          disabled={isUpdating}
                          className="save-btn"
                        >
                          {isUpdating ? 'Saving...' : <><Save size={14} /> Save</>}
                        </button>
                      ) : (
                        <button
                          onClick={() => setEditingSubmission(submission)}
                          disabled={isUpdating}
                          className="edit-btn"
                        >
                          Edit
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

const AssignmentsView = ({ assignments, selectedCourseCode, handleViewSubmissions, handleCancelAssignments, API, activeAssignmentType, handleAssignmentTypeChange }) => {
  const getAssignmentTypeLabel = (type) => {
    switch (type) {
      case 'Assignments': return 'Assignments';
      default: return 'Assignments';
    }
  };

  return (
    <div className="assignment-section">
      <div className="assignment-header">
        <h2>{getAssignmentTypeLabel(activeAssignmentType)} for <span className="course-code">{selectedCourseCode}</span></h2>
        <button onClick={handleCancelAssignments} className="back-button">
          <ChevronLeft size={16} /> Back to Courses
        </button>
      </div>

  

      {assignments.length === 0 ? (
        <p>No {getAssignmentTypeLabel(activeAssignmentType).toLowerCase()} found for this course.</p>
      ) : (
        <div className="assignment-list">
          {assignments.map((assignment) => (
            <div key={assignment.id} className="assignment-card">
              <h4>{assignment.title}</h4>
              <p>{assignment.description}</p>
              <div className="assignment-details">
                <p><strong>Type:</strong> {assignment.type || 'Assignment'}</p>
                <p><strong>Due Date:</strong> {new Date(assignment.due_date).toLocaleDateString()}</p>
                <p><strong>Points:</strong> {assignment.points}</p>
              </div>
              {assignment.file_path && (
                <a href={`${API}/uploads/${assignment.file_path}`} target="_blank" rel="noopener noreferrer" className="attachment-link">
                  <FileText size={14} /> Download Attachment
                </a>
              )}
              <button onClick={() => handleViewSubmissions(assignment.id)}>
                <FileText size={14} /> View Submissions
              </button>
            </div>
          ))}
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
        <input type="text" placeholder="Search courses..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} disabled={isLoading} />
      </div>
    </div>

    <div className="teacher-course-list">
      {filteredCourses.map((course) => (
        <div key={course.code} className="teacher-course-card" onClick={() => fetchAssignments(course.code)}>
          <div className="teacher-course-card-header">
            <h3>{course.name}</h3>
            <p className="teacher-course-code">{course.code}</p>
          </div>
          <div className="teacher-course-details">
            <div><Clock size={16} /><span>Credit Hours: <strong>{course.credit_hours || 'N/A'}</strong></span></div>
            <div><Calendar size={16} /><span>Semester: <strong>{course.semester || 'N/A'}</strong></span></div>
          </div>
          <div className="teacher-course-footer" style={{backgroundColor:"#e6f4ea", width: "140px"}}>
            <span>{course.department || 'General'}</span>
          </div>
        </div>
      ))}
    </div>
  </>
);

export default TeacherCourseManagement;
