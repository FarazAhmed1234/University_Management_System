import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Search, X, Clock, Calendar, Download, FileText, Youtube, Eye } from 'lucide-react';
import StudentSidebar from './StudentSidebarNavigation';
import './StudentMaterials.css';

const StudentCourseManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [courses, setCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [materials, setMaterials] = useState([]);
  const [isMaterialsLoading, setIsMaterialsLoading] = useState(false);

  const API = 'http://educonnect.atwebpages.com/educonnect-backend';

  // Get student info from local storage
  const student = JSON.parse(localStorage.getItem('student'));
  const studentId = student?.student_id;
  const userName = student?.name;
  const userEmail = student?.email;

  const fetchCourses = useCallback(async () => {
    if (!studentId) {
      setError('Student not authenticated');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API}/student/get_courses.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_id: studentId }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to fetch enrolled courses');
      }

      setCourses(data.data?.courses || []);
    } catch (err) {
      console.error('Fetch Error:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [API, studentId]);

  const fetchMaterials = useCallback(async (courseCode) => {
    if (!courseCode) return;

    setIsMaterialsLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API}/student/get_materials.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ course_code: courseCode }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to fetch course materials');
      }

      setMaterials(data.data?.materials || []);
    } catch (err) {
      console.error('Fetch Error:', err);
      setError(err.message);
    } finally {
      setIsMaterialsLoading(false);
    }
  }, [API]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  const handleCourseClick = (course) => {
    setSelectedCourse(course);
    fetchMaterials(course.code);
  };

  const handleBackToCourses = () => {
    setSelectedCourse(null);
    setMaterials([]);
  };

  const handlePreviewMaterial = (material) => {
    if (material.file_type === 'link' || material.file_type === 'youtube') {
      window.open(material.url || material.file_path, '_blank', 'noopener,noreferrer');
      return;
    }

    if (!material.file_path) {
      alert('File not available for preview');
      return;
    }

    const fileUrl = `${API}/teacher/${material.file_path}`;
    const fileExt = material.file_path.split('.').pop().toLowerCase();

    // Files that can be opened directly in browser
    const viewableTypes = ['pdf', 'jpg', 'jpeg', 'png', 'gif', 'webp', 'mp4', 'webm', 'ogg', 'txt'];

    if (viewableTypes.includes(fileExt)) {
      window.open(fileUrl, '_blank', 'noopener,noreferrer');
    } else {
      alert('This file type cannot be previewed. Please download it instead.');
    }
  };

  const handleDownloadMaterial = (material) => {
    if (material.file_type === 'link' || material.file_type === 'youtube') {
      window.open(material.url || material.file_path, '_blank', 'noopener,noreferrer');
      return;
    }

    if (!material.file_path) {
      alert('File not available for download');
      return;
    }

    const link = document.createElement('a');
    link.href = `${API}/teacher/${material.file_path}`;
    link.target = '_blank';
    link.download = material.file_path.split('/').pop();
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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

  const getMaterialIcon = (type) => {
    switch (type) {
      case 'youtube':
        return <Youtube size={16} className="material-icon youtube-icon" />;
      case 'pdf':
        return <FileText size={16} className="material-icon pdf-icon" />;
      case 'doc':
      case 'docx':
        return <FileText size={16} className="material-icon doc-icon" />;
      case 'ppt':
      case 'pptx':
        return <FileText size={16} className="material-icon ppt-icon" />;
      case 'link':
        return <FileText size={16} className="material-icon link-icon" />;
      default:
        return <FileText size={16} className="material-icon" />;
    }
  };

  return (
    <div className="student-dashboard">
      <StudentSidebar active="courses" userName={userName} onLogout={handleLogout} />

      <main className="student-course-management" style={{ marginLeft: '250px' }}>
        {selectedCourse ? (
          <div className="student-materials-view">
            <button onClick={handleBackToCourses} className="student-back-btn">
              &larr; Back to Courses
            </button>
            
            <div className="student-course-header">
              <h1>{selectedCourse.name} - Materials</h1>
              <h3 style={{ marginTop: '5px', color: '#666' }}>
                Course Code: <strong>{selectedCourse.code}</strong> | Teacher: <strong>{selectedCourse.teacher || 'Not assigned'}</strong>
              </h3>
            </div>

            {isMaterialsLoading ? (
              <div className="student-loading">
                <div className="student-spinner"></div>
                <p>Loading course materials...</p>
              </div>
            ) : materials.length === 0 ? (
              <div className="student-empty-state">
                <p>No materials available for this course yet</p>
                <button onClick={() => fetchMaterials(selectedCourse.code)} className="student-refresh-btn">
                  Refresh Materials
                </button>
              </div>
            ) : (
              <div className="student-materials-list">
                <table className="student-materials-table">
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Type</th>
                      <th>Upload Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {materials.map((material, index) => (
                      <tr key={index}>
                        <td>
                          {getMaterialIcon(material.file_type || material.type)}
                          {material.title}
                        </td>
                        <td>{(material.file_type || material.type || 'file').toUpperCase()}</td>
                        <td>{new Date(material.upload_date).toLocaleDateString()}</td>
                        <td>
                          <div className="material-actions">
                            <button 
                              onClick={() => handlePreviewMaterial(material)}
                              className="student-preview-btn"
                            >
                              <Eye size={16} /> Preview
                            </button>
                            <button 
                              onClick={() => handleDownloadMaterial(material)}
                              className="student-download-btn"
                            >
                              <Download size={16} /> Download
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : (
          <>
            <div className="student-course-header">
              <h1>Learning Resources</h1>

              
            </div>

            {error && (
              <div className="student-error-alert">
                <span>{error}</span>
                <button onClick={() => setError(null)}><X size={16} /></button>
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
              <div className="student-course-list">
                {filteredCourses.map((course, index) => (
                  <div 
                    key={index} 
                    className="student-course-card" 
                    style={{ width: '410px', height: '228px', cursor: 'pointer' }}
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

                    <div className="student-course-footer">
                      <span className="student-course-department">{course.department || 'General'}</span><br />
                      <span className="student-course-teacher">Teacher: {course.teacher || 'Not assigned'}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default StudentCourseManagement;