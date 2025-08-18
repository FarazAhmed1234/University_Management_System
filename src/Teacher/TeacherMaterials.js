import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Search, X, Clock, Calendar, Edit, Trash2, Upload, 
  Video, Image, FileText, File, Link, Youtube, 
  Eye, Download, Share2, Loader2, ArrowLeft 
} from 'lucide-react';
import TeacherSidebar from './TeacherSidebarNavigation';
import './TeacherCourseManagement.css';
import './TeacherMaterials.css';

const TeacherCourseManagement = () => {
  // State for courses view
  const [searchTerm, setSearchTerm] = useState('');
  const [courses, setCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // State for materials view
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [materials, setMaterials] = useState([]);
  const [showMaterialForm, setShowMaterialForm] = useState(false);
  const [materialData, setMaterialData] = useState({
    id: '',
    course_code: '',
    title: '',
    description: '',
    file: null,
    file_type: 'document',
    url: '',
    due_date: '',
    file_path: null,
    file_size: 0,
    upload_date: new Date().toISOString(),
    downloads: 0
  });
  const [isEditMode, setIsEditMode] = useState(false);
  const [uploadStep, setUploadStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const API = process.env.REACT_APP_API_URL || 'http://localhost:8080/educonnect-backend';
  const teacher = JSON.parse(localStorage.getItem('teacher'));
  const teacherId = teacher?.teacher_id;
  const userName = teacher?.name;
  const userEmail = teacher?.email;

  const fileTypes = [
    { 
      type: 'document', 
      label: 'Document', 
      icon: <FileText size={20} />, 
      accept: '.pdf,.doc,.docx,.txt,.ppt,.pptx,.xls,.xlsx' 
    },
    { type: 'link', label: 'Web Link', icon: <Link size={20} /> },
    { type: 'youtube', label: 'YouTube Video', icon: <Youtube size={20} /> },
  ];

  // Helper functions
  const formatFileSize = (bytes) => {
    if (!bytes || isNaN(bytes)) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1) + ' ' + sizes[i]);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      const options = { year: 'numeric', month: 'short', day: 'numeric' };
      return new Date(dateString).toLocaleDateString(undefined, options);
    } catch {
      return 'Invalid date';
    }
  };

  // Fetch courses assigned to teacher
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

      if (!res.ok) throw new Error('Failed to fetch courses');
      const data = await res.json();
      
      if (!data.success) throw new Error(data.message || 'Failed to fetch courses');
      setCourses(data.courses || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [API, teacherId]);

  // Fetch materials for selected course
  const fetchMaterials = useCallback(async (courseCode) => {
    if (!teacherId || !courseCode) return;

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API}/teacher/get_materials.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          teacher_id: teacherId,
          course_code: courseCode 
        }),
      });

      if (!res.ok) throw new Error('Failed to fetch materials');
      const data = await res.json();
      
      if (!data.success) throw new Error(data.message || 'Failed to fetch materials');
      
      setMaterials(data.materials?.map(material => ({
        ...material,
        file_size: material.file_size || 0
      })) || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [API, teacherId]);

  useEffect(() => {
    if (selectedCourse) {
      fetchMaterials(selectedCourse.code);
    } else {
      fetchCourses();
    }
  }, [selectedCourse, fetchCourses, fetchMaterials]);

  // Filter functions
  const filteredCourses = useMemo(() => {
    if (!searchTerm.trim()) return courses;
    const term = searchTerm.toLowerCase();
    return courses.filter((course) =>
      course.name?.toLowerCase().includes(term) ||
      course.code?.toLowerCase().includes(term) ||
      course.department?.toLowerCase().includes(term)
    );
  }, [courses, searchTerm]);

  const filteredMaterials = useMemo(() => {
    if (!searchTerm.trim()) return materials;
    const term = searchTerm.toLowerCase();
    return materials.filter((material) =>
      material.title?.toLowerCase().includes(term) ||
      material.description?.toLowerCase().includes(term))
  
  }, [materials, searchTerm]);

  // Material form functions
  const validateURL = (url) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleSubmitMaterial = async () => {
    if (!materialData.course_code) {
      setError('Please select a course');
      return;
    }
    if (!materialData.title.trim()) {
      setError('Please enter a title');
      return;
    }

    if (materialData.file_type === 'link' || materialData.file_type === 'youtube') {
      if (!materialData.url.trim()) {
        setError('Please enter a URL');
        return;
      }
      if (!validateURL(materialData.url)) {
        setError('Please enter a valid URL (include http:// or https://)');
        return;
      }
    } else if (!materialData.file && !materialData.file_path) {
      setError('Please select a file to upload');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const formData = new FormData();
    formData.append('teacher_id', teacherId);
    formData.append('id', materialData.id || '');
    formData.append('course_code', materialData.course_code);
    formData.append('title', materialData.title);
    formData.append('description', materialData.description);
    formData.append('file_type', materialData.file_type);
    formData.append('url', materialData.url || '');
    formData.append('due_date', materialData.due_date || '');
    
    if (materialData.file) {
      formData.append('file', materialData.file);
    }

    try {
      const endpoint = isEditMode ? 'update_material' : 'create_material';
      const res = await fetch(`${API}/teacher/${endpoint}.php`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const result = await res.json();
      if (!result.success) throw new Error(result.message);

      setSuccessMessage(`Material ${isEditMode ? 'updated' : 'uploaded'} successfully!`);
      fetchMaterials(selectedCourse.code);
      resetMaterialForm();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setSuccessMessage(''), 3000);
    }
  };

  const handleDeleteMaterial = async (materialId) => {
    if (!window.confirm('Are you sure you want to permanently delete this material?')) return;

    try {
      const res = await fetch(`${API}/teacher/delete_material.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ material_id: materialId })
      });

      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const result = await res.json();
      if (!result.success) throw new Error(result.message);

      setSuccessMessage('Material deleted successfully!');
      fetchMaterials(selectedCourse.code);
    } catch (err) {
      setError(err.message);
    } finally {
      setTimeout(() => setSuccessMessage(''), 3000);
    }
  };

  const handleEditMaterial = (material) => {
    setMaterialData({
      id: material.id,
      course_code: material.course_code,
      title: material.title,
      description: material.description,
      file: null,
      file_type: material.file_type,
      url: material.url || '',
      due_date: material.due_date || '',
      file_path: material.file_path || null,
      file_size: material.file_size || 0,
      upload_date: material.upload_date || new Date().toISOString(),
      downloads: material.downloads || 0
    });
    setIsEditMode(true);
    setShowMaterialForm(true);
    setUploadStep(2);
    setError(null);
  };

  const resetMaterialForm = () => {
    setMaterialData({
      id: '',
      course_code: selectedCourse?.code || '',
      title: '',
      description: '',
      file: null,
      file_type: 'document',
      url: '',
      due_date: '',
      file_path: null,
      file_size: 0,
      upload_date: new Date().toISOString(),
      downloads: 0
    });
    setIsEditMode(false);
    setShowMaterialForm(false);
    setUploadStep(1);
    setError(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setMaterialData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.size > 50 * 1024 * 1024) {
      setError('File size exceeds 50MB limit');
      return;
    }
    setMaterialData(prev => ({
      ...prev,
      file: file,
      file_size: file?.size || 0,
      url: ''
    }));
  };

  const handleFileTypeSelect = (type) => {
    setMaterialData(prev => ({
      ...prev,
      file_type: type,
      file: null,
      url: type === 'link' || type === 'youtube' ? prev.url : ''
    }));
    setUploadStep(2);
    setError(null);
  };

  const handlePreviewMaterial = (material) => {
    if (material.file_type === 'link' || material.file_type === 'youtube') {
      window.open(material.url, '_blank');
      return;
    }

    if (!material.file_path) {
      setError('File not available for preview');
      return;
    }

    const fileUrl = `${API}/teacher/${material.file_path}`;
    window.open(fileUrl, '_blank');
  };

  const handleDownloadMaterial = (material) => {
    if (material.file_type === 'link' || material.file_type === 'youtube') {
      window.open(material.url, '_blank');
      return;
    }

    if (!material.file_path) {
      setError('File not available for download');
      return;
    }

    const fileUrl = `${API}/teacher/${material.file_path}`;
    const link = document.createElement('a');
    link.href = fileUrl;
    link.setAttribute('download', material.title || 'material');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleShareMaterial = async (material) => {
    try {
      const shareUrl = material.file_type === 'link' || material.file_type === 'youtube'
        ? material.url
        : `${API}/teacher/${material.file_path}`;

      if (navigator.share) {
        await navigator.share({
          title: material.title,
          text: material.description,
          url: shareUrl
        });
      } else {
        await navigator.clipboard.writeText(shareUrl);
        setSuccessMessage('Link copied to clipboard!');
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        setError('Failed to share material');
      }
    }
  };

  const renderFileIcon = (type) => {
    switch (type) {
      case 'document': return <FileText size={16} />;
      case 'video': return <Video size={16} />;
      case 'image': return <Image size={16} />;
      case 'link': return <Link size={16} />;
      case 'youtube': return <Youtube size={16} />;
      default: return <File size={16} />;
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('teacher');
    window.location.href = '/';
  };

  return (
    <div className="teacher-dashboard">
      <TeacherSidebar active="courses" userName={userName} onLogout={handleLogout} />

      <main className="teacher-course-management" style={{ marginLeft: '250px' }}>
        {/* Back button when viewing materials */}
        {selectedCourse && (
          <button 
            className="back-to-courses-btn"
            onClick={() => {
              setSelectedCourse(null);
              setSearchTerm('');
            }}
          >
            <ArrowLeft size={18} /> Back to Courses
          </button>
        )}

       <div className="teacher-course-header">
          <div>
            <h1>Course Materials</h1>
            <h3>Upload and manage learning materials</h3>
          </div>
        </div>

        {successMessage && <div className="success-message">{successMessage}</div>}
        {error && <div className="error-message">{error}</div>}

        {/* Search bar */}
        <div className="teacher-search-container">
          <div className="teacher-search-box">
            <Search size={18} className="teacher-search-icon" />
            <input
              type="text"
              placeholder={
                selectedCourse 
                  ? "Search materials by title or description..." 
                  : "Search courses by name, code, or department..."
              }
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              disabled={isLoading}
              className="teacher-search-input"
            />
          </div>

          {/* Upload button when viewing materials */}
          {selectedCourse && (
            <button 
              className="teacher-create-btn"
              onClick={() => {
                setMaterialData(prev => ({
                  ...prev,
                  course_code: selectedCourse.code
                }));
                setShowMaterialForm(true);
              }}
             style={{marginLeft: "828px" ,marginTop: "-48px"}}>
              <Upload size={18} /> Upload Material
            </button>
          )}
        </div>

        {/* Loading state */}
        {isLoading ? (
          <div className="teacher-loading">
            <Loader2 className="animate-spin" size={24} />
            <p>{selectedCourse ? 'Loading materials...' : 'Loading courses...'}</p>
          </div>
        ) : (
          <>
            {/* Courses View */}
            {!selectedCourse && (
              <>
                {filteredCourses.length === 0 ? (
                  <div className="teacher-empty-state">
                    <p>{searchTerm ? 'No matching courses found' : 'No courses assigned yet'}</p>
                    <button onClick={fetchCourses} className="teacher-refresh-btn">
                      Try Again
                    </button>
                  </div>
                ) : (
                  <div className="teacher-course-list">
                    {filteredCourses.map((course, index) => (
                      <div 
                        key={index} 
                        className="teacher-course-card"
                        onClick={() => setSelectedCourse(course)}
                      >
                        <div className="teacher-course-card-header">
                          <div>
                            <h3 className="teacher-course-title">{course.name}</h3>
                            <p className="teacher-course-code">{course.code}</p>
                          </div>
                        </div>

                   
                        <div className="teacher-course-details">
                          <div className="teacher-course-detail">
                            <Clock size={16} />
                            <span>Credit Hours: <strong>{course.credit_hours || 'N/A'}</strong></span>
                          </div>
                          <div className="teacher-course-detail">
                            <Calendar size={16} />
                            <span>Semester: <strong>{course.semester || 'N/A'}</strong></span>
                          </div>
                        </div>

                        <div className="teacher-course-footer">
                          <span className="teacher-course-department" style={{marginLeft: "-161px"}}>
                            {course.department || 'General'}
                          </span>
                          <button 
                            className="teacher-manage-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedCourse(course);
                            }}
                           style={{marginRight:"-150px"}}>
                            Manage Materials
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* Materials View */}
            {selectedCourse && (
              <>
                {filteredMaterials.length === 0 ? (
                  <div className="teacher-empty-state">
                    <p>
                      {searchTerm 
                        ? 'No matching materials found' 
                        : 'No materials uploaded for this course yet'}
                    </p>
                    <button 
                      className="teacher-refresh-btn"
                      onClick={() => fetchMaterials(selectedCourse.code)}
                    >
                      Refresh
                    </button>
                  </div>
                ) : (
                  <div className="materials-list">
                    {filteredMaterials.map((material) => (
                      <div key={material.id} className="material-card">
                        <div className="material-header">
                          <div className="material-type-icon">
                            {renderFileIcon(material.file_type)}
                          </div>
                          <div className="material-title-container">
                            <h3>{material.title}</h3>
                                                <span className="course-code">{material.course_code}</span>

                            <span className="material-date">
                              {formatDate(material.upload_date)}
                            </span>
                          </div>
                        </div>

                        <div className="material-details">
                          <p>{material.description || 'No description provided'}</p>
                          {material.url && (
                            <p className="material-url">
                              <a href={material.url} target="_blank" rel="noopener noreferrer">
                                {material.url}
                              </a>
                            </p>
                          )}
                        </div>

                        <div className="material-meta">
                          {material.file_size > 0 && (
                            <span>Size: {formatFileSize(material.file_size)}</span>
                          )}
                          {material.due_date && (
                            <span>Upload Date: {formatDate(material.due_date)}</span>
                          )}
                        </div>

                        <div className="material-actions">
                          <button onClick={() => handlePreviewMaterial(material)} title="Preview">
                            <Eye size={16} /> Preview
                          </button>
                          <button onClick={() => handlePreviewMaterial(material)} title="Download">
                            <Download size={16} /> Download
                          </button>
                          <button onClick={() => handleShareMaterial(material)} title="Share">
                            <Share2 size={16} /> Share
                          </button>
                          <button onClick={() => handleEditMaterial(material)} title="Edit">
                            <Edit size={16} /> Edit
                          </button>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteMaterial(material.id);
                            }} 
                            title="Delete"
                            className="delete-btn"
                          style={{width:"90px"}}>
                            <Trash2 size={16} /> Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* Material Upload/Edit Form Modal */}
        {showMaterialForm && (
          <div className="modal-overlay" onClick={(e) => {
            if (e.target.classList.contains('modal-overlay')) {
              resetMaterialForm();
            }
          }}>
            <div className="material-upload-form">
              <button className="close-form" onClick={resetMaterialForm}>
                <X size={24} />
              </button>
              <h2>{isEditMode ? 'Edit Material' : 'Upload New Material'}</h2>

              {/* Step 1: Select material type */}
              {uploadStep === 1 && (
                <div className="upload-step">
                  <h3>Select Material Type</h3>
                  <div className="file-type-options">
                    {fileTypes.map((fileType) => (
                      <div
                        key={fileType.type}
                        className={`file-type-option ${materialData.file_type === fileType.type ? 'selected' : ''}`}
                        onClick={() => handleFileTypeSelect(fileType.type)}
                      >
                        <div className="file-type-icon">{fileType.icon}</div>
                        <span>{fileType.label}</span>
                      </div>
                    ))}
                  </div>
                  <div className="form-actions">
                    <button type="button" className="secondary-btn" onClick={resetMaterialForm}>
                      Cancel
                    </button>
                    <button 
                      type="button" 
                      className="primary-btn" 
                      onClick={() => setUploadStep(2)}
                      disabled={!materialData.file_type}
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}

              {/* Step 2: Enter details */}
              {uploadStep === 2 && (
                <div className="upload-step">
                  <h3>Enter Material Details</h3>

                  <input
                    type="text"
                    name="title"
                    placeholder="Title*"
                    value={materialData.title}
                    onChange={handleInputChange}
                    required
                    className="form-input"
                  />

                  <textarea
                    name="description"
                    placeholder="Description (optional)"
                    value={materialData.description}
                    onChange={handleInputChange}
                    className="form-textarea"
                    rows="4"
                  ></textarea>

                  <div className="form-date-input">
                    <Calendar size={18} />
                    <input
                      type="date"
                      name="due_date"
                      placeholder="Available Until (optional)"
                      value={materialData.due_date}
                      onChange={handleInputChange}
                      className="form-input"
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>

                  {/* File/URL input based on type */}
                  {(materialData.file_type === 'link' || materialData.file_type === 'youtube') ? (
                    <div className="url-input-container">
                      {materialData.file_type === 'youtube' ? (
                        <Youtube size={20} className="url-icon" />
                      ) : (
                        <Link size={20} className="url-icon" />
                      )}
                      <input
                        type="url"
                        name="url"
                        placeholder={materialData.file_type === 'youtube' ? 'YouTube URL*' : 'Web URL*'}
                        value={materialData.url}
                        onChange={handleInputChange}
                        required
                        className="form-input"
                      />
                    </div>
                  ) : (
                    <div className="file-upload-container">
                      <label className="file-upload-label">
                        <Upload size={18} />
                        <span>
                          {isEditMode && materialData.file_path ? 
                            'Replace file (optional)' : 
                            `Choose ${materialData.file_type} file*`}
                        </span>
                        <input
                          type="file"
                          accept={fileTypes.find(t => t.type === materialData.file_type)?.accept}
                          onChange={handleFileChange}
                          className="file-upload-input"
                        />
                      </label>
                      {materialData.file && (
                        <div className="selected-file">
                          Selected: {materialData.file.name} ({formatFileSize(materialData.file.size)})
                        </div>
                      )}
                      {isEditMode && materialData.file_path && !materialData.file && (
                        <div className="current-file">
                          Current file: {materialData.file_path.split('/').pop()} 
                          {materialData.file_size > 0 && ` (${formatFileSize(materialData.file_size)})`}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="form-actions">
                    <button 
                      type="button" 
                      className="secondary-btn" 
                      onClick={() => setUploadStep(1)}
                    >
                      Back
                    </button>
                    <button 
                      type="button" 
                      className="primary-btn" 
                      onClick={handleSubmitMaterial}
                      disabled={isSubmitting || 
                        !materialData.title || 
                        ((materialData.file_type === 'link' || materialData.file_type === 'youtube') ? 
                          !materialData.url : 
                          !materialData.file && !materialData.file_path && !isEditMode)
                      }
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="animate-spin" size={18} />
                          {isEditMode ? 'Updating...' : 'Uploading...'}
                        </>
                      ) : isEditMode ? 'Update Material' : 'Upload Material'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default TeacherCourseManagement;