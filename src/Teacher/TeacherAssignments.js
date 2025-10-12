import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Search, X, Clock, Calendar, Edit, Trash2, UploadCloud, FileText, AlertCircle, ChevronLeft } from 'lucide-react';
import TeacherSidebar from './TeacherSidebarNavigation';
import './TeacherAssignments.css';

const TeacherCourseManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [courses, setCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAssignmentForm, setShowAssignmentForm] = useState(false);
  const [assignments, setAssignments] = useState([]);
  const [assignmentData, setAssignmentData] = useState({
    id: '',
    course_code: '',
    title: '',
    due_date: '',
    points: '',
    description: '',
    file: null,
    file_path: ''
  });
  const [isEditMode, setIsEditMode] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [fileError, setFileError] = useState('');
  const [selectedCourse, setSelectedCourse] = useState(null);

  const API = 'http://educonnect.atwebpages.com/educonnect-backend';
  const teacher = JSON.parse(localStorage.getItem('teacher'));
  const teacherId = teacher?.teacher_id;
  const userName = teacher?.name;
  const userEmail = teacher?.email;

  // Fetch courses
  const fetchCourses = useCallback(async () => {
    if (!teacherId) {
      setError('Teacher not authenticated');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const coursesRes = await fetch(`${API}/teacher/get_courses.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teacher_id: teacherId }),
      });
      const coursesData = await coursesRes.json();
      if (!coursesRes.ok || !coursesData.success) throw new Error(coursesData.message || 'Failed to fetch courses');
      setCourses(coursesData.courses || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [API, teacherId]);

  // Fetch assignments for a specific course
  const fetchAssignments = useCallback(async (courseCode) => {
    if (!teacherId || !courseCode) return;

    setIsLoading(true);
    setError(null);

    try {
      const assignmentsRes = await fetch(`${API}/teacher/get_assignments.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          teacher_id: teacherId,
          course_code: courseCode 
        }),
      });
      const assignmentsData = await assignmentsRes.json();
      if (!assignmentsRes.ok || !assignmentsData.success) throw new Error(assignmentsData.message || 'Failed to fetch assignments');
      setAssignments(assignmentsData.assignments || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [API, teacherId]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  const filteredCourses = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return courses.filter((course) =>
      course.name?.toLowerCase().includes(term) ||
      course.code?.toLowerCase().includes(term) ||
      course.department?.toLowerCase().includes(term)
    );
  }, [courses, searchTerm]);

  const filteredAssignments = useMemo(() => {
    if (!selectedCourse) return [];
    const term = searchTerm.toLowerCase();
    return assignments.filter((assignment) =>
      assignment.title?.toLowerCase().includes(term) ||
      assignment.description?.toLowerCase().includes(term)
    );
  }, [assignments, searchTerm, selectedCourse]);

  const handleCourseSelect = (course) => {
    setSelectedCourse(course);
    fetchAssignments(course.code);
  };

  const handleBackToCourses = () => {
    setSelectedCourse(null);
    setAssignments([]);
    setSearchTerm('');
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    
    if (!file) return;
    
    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setFileError('File size must be less than 5MB');
      return;
    }
    
    // Validate file type
    const validTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    if (!validTypes.includes(file.type)) {
      setFileError('Only PDF, JPEG, and PNG files are allowed');
      return;
    }
    
    setFileError('');
    setAssignmentData(prev => ({
      ...prev,
      file
    }));
  };

  const handleSubmitAssignment = async () => {
    if (fileError) {
      alert('Please fix file errors before submitting');
      return;
    }

    const formData = new FormData();
    Object.entries(assignmentData).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        formData.append(key, value);
      }
    });
    formData.append('teacher_id', teacherId);

    try {
      const xhr = new XMLHttpRequest();
      
      // Progress tracking
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(progress);
        }
      };

      const promise = new Promise((resolve, reject) => {
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(xhr.response);
          } else {
            reject(new Error(xhr.statusText));
          }
        };
        xhr.onerror = () => reject(new Error('Upload failed'));
      });

      xhr.open('POST', isEditMode 
        ? `${API}/teacher/update_assignment.php`
        : `${API}/teacher/create_assignment.php`);
      xhr.send(formData);

      const result = await promise;
      const data = JSON.parse(result);
      
      if (!data.success) throw new Error(data.message);
      
      alert(`Assignment ${isEditMode ? 'updated' : 'created'} successfully!`);
      fetchAssignments(selectedCourse.code);
      resetForm();
      setUploadProgress(0);
    } catch (err) {
      alert(`Upload failed: ${err.message}`);
      setUploadProgress(0);
    }
  };

  const handleDeleteAssignment = async (assignmentId) => {
    if (!window.confirm('Are you sure you want to delete this assignment?')) return;

    try {
      const res = await fetch(`${API}/teacher/delete_assignment.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          assignment_id: assignmentId,
          teacher_id: teacherId 
        }),
      });
      const result = await res.json();
      if (!result.success) throw new Error(result.message);
      
      alert('Assignment deleted successfully!');
      fetchAssignments(selectedCourse.code);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleEditAssignment = (assignment) => {
    setAssignmentData({
      id: assignment.id,
      course_code: assignment.course_code,
      title: assignment.title,
      due_date: assignment.due_date,
      points: assignment.points,
      description: assignment.description,
      file: null,
      file_path: assignment.file_path
    });
    setIsEditMode(true);
    setShowAssignmentForm(true);
  };

  const resetForm = () => {
    setAssignmentData({
      id: '',
      course_code: selectedCourse ? selectedCourse.code : '',
      title: '',
      due_date: '',
      points: '',
      description: '',
      file: null,
      file_path: ''
    });
    setIsEditMode(false);
    setShowAssignmentForm(false);
    setFileError('');
    setUploadProgress(0);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setAssignmentData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCloseModal = (e) => {
    if (e.target.classList.contains('modal-overlay')) {
      resetForm();
    }
  };

  return (
    <div className="teacher-dashboard">
      <TeacherSidebar active="courses" userName={userName} onLogout={() => localStorage.clear()} />
      <main className="teacher-course-management" style={{ marginLeft: '250px' }}>
        {selectedCourse ? (
          // Assignments view
          <>
            <div className="teacher-course-header">
        
              <div>
                <h1>{selectedCourse.name} Assignments</h1>
                <h3 style={{ marginTop: '5px', color: '#666' }}>
                  Course Code: {selectedCourse.code} | Manage and track student assignments
                </h3>
              </div>
              <button 
                className="teacher-create-btn" 
                onClick={() => {
                  setAssignmentData(prev => ({
                    ...prev,
                    course_code: selectedCourse.code
                  }));
                  setShowAssignmentForm(true);
                }}
              >
                Create Assignment
              </button>
            </div>

            <div className="search-filter-container">
              <div className="search-bar">
                <Search className="search-icon" size={18} />
                <input
                  type="text"
                  placeholder="Search assignments..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{marginLeft:"15px"}} 
                />
                {searchTerm && (
                  <button className="clear-search" onClick={() => setSearchTerm('')}>
                    <X size={16} />
                  </button>


                )}
                
              </div>

                    <button onClick={handleBackToCourses} className="back-button" style={{width:"163px", height:"46px"}}>
                <ChevronLeft size={20} /> Back to Courses
              </button>
            </div>

            {isLoading && <div className="loading-indicator">Loading...</div>}
            {error && <div className="error-message">{error}</div>}

            {!isLoading && !error && assignments.length === 0 && (
              <div className="empty-state">
                <p>No assignments created yet for this course. Click "Create Assignment" to get started.</p>
              </div>
            )}

            {filteredAssignments.length > 0 && (
              <div className="assignments-list">
                {filteredAssignments.map((assignment) => (
                  <div key={assignment.id} className="assignment-card">
                    <div className="assignment-header">
                      <h3>{assignment.title}</h3>
                      <div>
                        <button 
                          className="edit-btn" 
                          onClick={() => handleEditAssignment(assignment)}
                          style={{width:"50px"}}
                        >
                          <Edit size={20} />
                        </button>
                        <button 
                          className="delete-btn" 
                          onClick={() => handleDeleteAssignment(assignment.id)}
                          style={{width:"50px"}}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                    <div className="assignment-details">
                      <p>{assignment.description}</p>
                      <div className="assignment-meta">
                        <span className="points" >{assignment.points} points</span>
                        <span className="due-date">
                          <Calendar size={14} /> Due: {new Date(assignment.due_date).toLocaleDateString()}
                        </span>
                      </div>
                      {assignment.file_path && (
                        <div className="assignment-file" style={{marginLeft:"-550px", marginTop:"70px"}}>
                          <a 
                            href={`${API}/uploads/${assignment.file_path}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                          >
                            Download Attached File
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          // Courses view
          <>
            <div className="teacher-course-header">
              <div>
                <h1>My Assignments</h1>
                <h3 style={{ marginTop: '5px', color: '#666' }}>
Manage and track student assignments                </h3>
              </div>
            </div>

            <div className="search-filter-container">
              <div className="search-bar">
                <Search className="search-icon" size={18} />
                <input
                  type="text"
                  placeholder="Search courses by name, code, or department..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                 style={{marginLeft:"15px"}}/>
                {searchTerm && (
                  <button className="clear-search" onClick={() => setSearchTerm('')}>
                    <X size={16} />
                  </button>
                )}
              </div>
            </div>

            {isLoading && <div className="loading-indicator">Loading courses...</div>}
            {error && <div className="error-message">{error}</div>}

            {!isLoading && !error && courses.length === 0 && (
              <div className="empty-state">
                <p>No courses assigned to you yet.</p>
              </div>
            )}

            {filteredCourses.length > 0 && (
              <div className="courses-list">
                {filteredCourses.map((course) => (
                  <div 
                    key={course.code} 
                    className="course-card"
                    onClick={() => handleCourseSelect(course)}
                  >
                    <div className="course-header">
                      <h3>{course.name}</h3>
                      <span className="course-code">{course.code}</span>
                    </div>
                    <div className="course-footer">
                      <div className="course-meta">
                        <span><Clock size={16} /><span>Credit Hours: <strong>{course.credit_hours || 'N/A'}</strong></span></span>
                        <span><Calendar size={16} /><span>Semester: <strong>{course.semester || 'N/A'}</strong></span></span>
                      </div>
                      <span className="course-department">{course.department}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}


          </>
        )}

        {/* Assignment Form Modal */}
        {showAssignmentForm && (
          <div className="modal-overlay" onClick={handleCloseModal}>
            <div className="assignment-form">
              <h2>{isEditMode ? 'Edit Assignment' : 'Create New Assignment'}</h2>
              
              <input 
                type="text" 
                name="title"
                placeholder="Assignment Title" 
                value={assignmentData.title}
                onChange={handleInputChange}
                required
              />
              
              <input 
                type="date" 
                name="due_date"
                value={assignmentData.due_date}
                onChange={handleInputChange}
                required
              />
              
              <input 
                type="number" 
                name="points"
                placeholder="Points" 
                value={assignmentData.points}
                onChange={handleInputChange}
                min="0"
                required
              />
              
              <textarea 
                name="description"
                placeholder="Description" 
                value={assignmentData.description}
                onChange={handleInputChange}
                required
              ></textarea>
              
              <div className="file-upload-section">
                <label className="file-upload-label">
                  <div className="upload-icon-container">
                    <UploadCloud size={24} className="upload-icon" />
                    <span>Upload File </span>
                  </div>
                  <input 
                    type="file" 
                    onChange={handleFileChange}
                    className="file-input"
                  />
                </label>
                
                {assignmentData.file && (
                  <div className="file-info">
                    <FileText size={16} className="file-icon" />
                    <div>
                      <div className="file-name">{assignmentData.file.name}</div>
                      <div className="file-size">{(assignmentData.file.size / 1024).toFixed(2)} KB</div>
                    </div>
                    <X 
                      size={16} 
                      className="remove-file" 
                      onClick={() => setAssignmentData(prev => ({...prev, file: null}))}
                    />
                  </div>
                )}
                
                {isEditMode && assignmentData.file_path && !assignmentData.file && (
                  <div className="file-info existing-file">
                    <FileText size={16} className="file-icon" />
                    <div>
                      <div className="file-name">{assignmentData.file_path.split('/').pop()}</div>
                      <div className="file-note">(Existing file - upload new to replace)</div>
                    </div>
                  </div>
                )}
                
                {fileError && (
                  <div className="error-text">
                    <AlertCircle size={16} />
                    <span>{fileError}</span>
                  </div>
                )}
                
                {uploadProgress > 0 && uploadProgress < 100 && (
                  <div className="progress-container">
                    <div className="progress-bar" style={{ width: `${uploadProgress}%` }}></div>
                    <div className="progress-text">{uploadProgress}%</div>
                  </div>
                )}
              </div>
              <div className="form-actions">
                <button type="button" onClick={resetForm}>
                  Cancel
                </button>
                <button type="submit" onClick={handleSubmitAssignment}>
                  {isEditMode ? 'Update Assignment' : 'Submit Assignment'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default TeacherCourseManagement;