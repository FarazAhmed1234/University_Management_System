import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Search, X, Calendar, ChevronDown, ChevronUp, FileText, Eye, Upload, Download } from 'lucide-react';
import StudentSidebar from './StudentSidebarNavigation';
import './StudentAssignments.css';

const StudentAssignments = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [courses, setCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedCourse, setExpandedCourse] = useState(null);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [submissionFile, setSubmissionFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState(null);
  const [fileInputKey, setFileInputKey] = useState(Date.now());

  const API = 'http://educonnect.atwebpages.com/educonnect-backend';
  const student = JSON.parse(localStorage.getItem('student'));
  const studentId = student?.student_id;
  const userName = student?.name;

  const isAssignmentPastDue = (dueDate) => {
    if (!dueDate) return false;
    try {
      const due = new Date(dueDate);
      const now = new Date();
      return now > due;
    } catch {
      return false;
    }
  };

  const fetchCoursesWithAssignments = useCallback(async () => {
    if (!studentId) {
      setError('Student not authenticated');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    setSubmissionSuccess(null);

    try {
      // Fetch enrolled courses
      const coursesRes = await fetch(`${API}/student/get_course.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_id: studentId }),
      });

      if (!coursesRes.ok) throw new Error(`HTTP error! status: ${coursesRes.status}`);
      const coursesData = await coursesRes.json();
      
      if (!coursesData.success) throw new Error(coursesData.message || 'Failed to fetch enrolled courses');

      const enrolledCourses = coursesData.data?.courses || [];

      // Fetch assignments for each course with submission status
      const coursesWithAssignments = await Promise.all(
        enrolledCourses.map(async (course) => {
          const assignmentsRes = await fetch(`${API}/student/get_assignments.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              course_code: course.code,
              student_id: studentId
            }),
          });

          if (!assignmentsRes.ok) throw new Error(`HTTP error! status: ${assignmentsRes.status}`);
          const assignmentsData = await assignmentsRes.json();
          
          return {
            ...course,
            assignments: assignmentsData.success ? assignmentsData.assignments || [] : [],
          };
        })
      );

      setCourses(coursesWithAssignments);
    } catch (err) {
      console.error('Fetch Error:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [API, studentId]);

  useEffect(() => {
    fetchCoursesWithAssignments();
  }, [fetchCoursesWithAssignments]);

  const filteredCourses = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return courses.filter((course) =>
      course.name?.toLowerCase().includes(term) ||
      course.code?.toLowerCase().includes(term) ||
      course.department?.toLowerCase().includes(term) ||
      course.teacher?.toLowerCase().includes(term)
    );
  }, [courses, searchTerm]);

  const toggleCourseExpand = (courseCode) => {
    setExpandedCourse(expandedCourse === courseCode ? null : courseCode);
    setSelectedAssignment(null);
  };

  const handleViewAssignment = (assignment) => {
    setSelectedAssignment(selectedAssignment?.id === assignment.id ? null : assignment);
    setSubmissionFile(null);
    setFileInputKey(Date.now());
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const allowedTypes = ['pdf', 'doc', 'docx', 'txt', 'zip', 'png', 'jpg', 'jpeg'];
      const fileExt = file.name.split('.').pop().toLowerCase();
      
      if (!allowedTypes.includes(fileExt)) {
        setError('Invalid file type. Please upload: ' + allowedTypes.join(', '));
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        setError('File size exceeds 10MB limit');
        return;
      }

      setSubmissionFile(file);
      setError(null);
    }
  };

  const handleSubmitAssignment = async (assignmentId) => {
    if (!studentId) {
      setError('Student not authenticated - please login again');
      return;
    }

    if (!assignmentId || !submissionFile) {
      setError(!submissionFile ? 'Please select a file to upload' : 'Invalid assignment data');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const formData = new FormData();
    formData.append('student_id', studentId);
    formData.append('assignment_id', assignmentId);
    formData.append('submission_file', submissionFile);

    try {
      const response = await fetch(`${API}/student/submit_assignment.php`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      
      if (!response.ok || !data.success) {
        throw new Error(data.message || `Submission failed with status ${response.status}`);
      }

      setSubmissionSuccess('Assignment submitted successfully!');
      setSubmissionFile(null);
      setFileInputKey(Date.now());
      fetchCoursesWithAssignments();
    } catch (err) {
      console.error('Submission Error:', err);
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'No date specified';
    try {
      const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
      return new Date(dateString).toLocaleDateString(undefined, options);
    } catch {
      return dateString;
    }
  };

  const handleDownloadAssignment = (filePath) => {
    if (!filePath) {
      setError('No file available for download');
      return;
    }
    window.open(`${API}/uploads/${filePath}`, '_blank');
  };

  const handleDownloadSubmission = (filePath) => {
    if (!filePath) {
      setError('No file available for download');
      return;
    }
    window.open(`${API}/student/uploads/${studentId}/${filePath}`, '_blank');
  };

  const renderPointsEarned = (assignment) => {
    if (!assignment.is_submitted || assignment.take_point === null) return null;
    
    return (
      <div className="points-earned">
        <span className="points-label">Points Earned:</span>
        <span className="points-value">
          {assignment.take_point} / {assignment.max_points}
        </span>
        {assignment.percentage !== null && (
          <span className="points-percentage">
            ({assignment.percentage}%)
          </span>
        )}
      </div>
    );
  };

  const renderFeedbackSection = (assignment) => {
    if (!assignment.is_submitted) return null;
    
    return (
      <div className="feedback-section">
        <h6>Feedback:</h6>
        {assignment.take_point !== null && (
          <p className="feedback-item">
            <strong>Points:</strong> {assignment.take_point}/{assignment.max_points}
            {assignment.percentage !== null && (
              <span> ({assignment.percentage}%)</span>
            )}
          </p>
        )}
        {assignment.grade && (
          <p className="feedback-item" >
            <strong>Grade:</strong> {assignment.grade}
          </p>
        )}
        {assignment.feedback && (
          <p className="feedback-item">
            <strong>Comments:</strong> {assignment.feedback}
          </p>
        )}
      </div>
    );
  };

  const handleLogout = () => {
    localStorage.removeItem('student');
    window.location.href = '/';
  };

  return (
    <div className="student-dashboard">
      <StudentSidebar active="assignments" userName={userName} onLogout={handleLogout} />

      <main className="student-assignments-container">
        <div className="student-assignments-header">
          <h1>My Assignments</h1>
          <p>View and submit your course assignments</p>
        </div>

        {error && (
          <div className="alert error">
            <span>{error}</span>
            <button onClick={() => setError(null)}><X size={16} /></button>
          </div>
        )}

        {submissionSuccess && (
          <div className="alert success">
            <span>{submissionSuccess}</span>
            <button onClick={() => setSubmissionSuccess(null)}><X size={16} /></button>
          </div>
        )}

        <div className="search-container">
          <div className="search-box">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              placeholder="Search courses by name, code, department, or teacher..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              disabled={isLoading}
            />
          </div>
        </div>

        {isLoading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading your courses and assignments...</p>
          </div>
        ) : filteredCourses.length === 0 ? (
          <div className="empty-state">
            <p>{searchTerm ? 'No matching courses found' : 'No courses enrolled yet'}</p>
            <button onClick={fetchCoursesWithAssignments} className="refresh-btn">
              Refresh Data
            </button>
          </div>
        ) : (
          <div className="courses-list">
            {filteredCourses.map((course) => (
              <div key={course.code} className="course-card">
                <div className="course-header" onClick={() => toggleCourseExpand(course.code)}>
                  <div className="course-info">
                    <h3>{course.name}</h3>
                    <div className="course-meta">
                      <span className="code">{course.code}</span>
                      <span className="teacher">{course.teacher || 'Teacher not assigned'}</span>
                      <span className="credits">{course.credits || 0} credits</span>
                    </div>
                  </div>
                  <button className="expand-btn">
                    {expandedCourse === course.code ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </button>
                </div>

                {expandedCourse === course.code && (
                  <div className="assignments-section">
                    <h4>Assignments ({course.assignments.length})</h4>
                    
                    {course.assignments.length === 0 ? (
                      <p className="no-assignments">No assignments for this course yet.</p>
                    ) : (
                      <div className="assignments-list">
                        {course.assignments.map((assignment) => (
                          <div key={assignment.id} className={`assignment-item ${selectedAssignment?.id === assignment.id ? 'expanded' : ''}`}>
                            <div className="assignment-header">
                              <FileText size={16} className="assignment-icon" />
                              <div className="assignment-title-container">
                                <h5 className="assignment-title">
                                  {assignment.title}
                                  {isAssignmentPastDue(assignment.due_date) ? (
                                    <span className="past-due-badge">Past Due</span>
                                  ) : assignment.is_submitted ? (
                                    <span className="submitted-badge">Submitted</span>
                                  ) : (
                                    <span className="pending-badge">Pending</span>
                                  )}
                                </h5>
                                <div className="assignment-meta">
                                  <span className="due-date">
                                    <Calendar size={14} /> Due: {formatDate(assignment.due_date)}
                                  </span>
                                  <span className="points">{assignment.max_points} points</span>
                                  {assignment.grade && (
                                    <span className="grade" style={{marginLeft: "246px" , width: "77px" , height: "42px" , marginTop: "11px"}}>Grade: {assignment.grade}</span>
                                  )}
                                  {renderPointsEarned(assignment)}
                                </div>
                              </div>
                              
                              <div className="assignment-actions">
                                <button
                                  onClick={() => handleViewAssignment(assignment)}
                                  className="view-btn"
                                >
                                  <Eye size={16} /> {selectedAssignment?.id === assignment.id ? 'Hide' : 'View'}
                                </button>

                                {assignment.file_path && (
                                  <button
                                    onClick={() => handleDownloadAssignment(assignment.file_path)}
                                    className="download-btn"
                                  >
                                    <Download size={16} /> Assignment
                                  </button>
                                )}
                              </div>
                            </div>

                            {selectedAssignment?.id === assignment.id && (
                              <div className="assignment-details">
                                <div className="assignment-description">
                                  <h6>Description:</h6>
                                  <p>{assignment.description || 'No description provided'}</p>
                                </div>

                                <div className="submission-status">
                                  <h6>Submission Status:</h6>
                                  {assignment.is_submitted ? (
                                    <div className="submitted-info">
                                      <p className="submitted-text">
                                        ✅ Submitted on {formatDate(assignment.submitted_at)}
                                      </p>
                                      {assignment.submission_file && (
                                        <button
                                          onClick={() => handleDownloadSubmission(assignment.submission_file)}
                                          className="download-btn"
                                        >
                                          <Download size={16} /> My Submission
                                        </button>
                                      )}
                                    </div>
                                  ) : (
                                    <p className="not-submitted">❌ Not submitted yet</p>
                                  )}
                                  {renderFeedbackSection(assignment)}
                                </div>

                                <div className="submission-section">
                                  <h6>Submit Your Work:</h6>
                                  {isAssignmentPastDue(assignment.due_date) ? (
                                    <p className="deadline-message">⏰ Submission closed – deadline has passed.</p>
                                  ) : assignment.is_submitted ? (
                                    <p className="resubmit-message">
                                      You can resubmit until the deadline.
                                    </p>
                                  ) : null}

                                  {!isAssignmentPastDue(assignment.due_date) && (
                                    <div className="file-upload-container">
                                      <input
                                        key={`${fileInputKey}-${assignment.id}`}
                                        type="file"
                                        id={`file-upload-${assignment.id}`}
                                        onChange={handleFileChange}
                                        accept=".pdf,.doc,.docx,.txt,.zip,.png,.jpg,.jpeg"
                                      />
                                      <label htmlFor={`file-upload-${assignment.id}`} className="file-upload-label">
                                        <Upload size={16} />
                                        {submissionFile?.name || 'Choose File'}
                                      </label>
                                      {submissionFile && (
                                        <button
                                          onClick={() => {
                                            setSubmissionFile(null);
                                            setFileInputKey(Date.now());
                                          }}
                                          className="clear-btn"
                                        >
                                          <X size={16} />
                                        </button>
                                      )}
                                      <button
                                        onClick={() => handleSubmitAssignment(assignment.id)}
                                        disabled={!submissionFile || isSubmitting}
                                        className="submit-btn"
                                      >
                                        {isSubmitting ? 'Submitting...' : assignment.is_submitted ? 'Resubmit' : 'Submit'}
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default StudentAssignments;