import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit, Trash2, Check, X } from 'lucide-react';
import SidebarNavigation from './SidebarNavigation';
import './TimetableManagement.css';

const TimetableManagement = ({ userName, onLogout }) => {
  const [activeItem] = useState("Timetable");
  const [entries, setEntries] = useState([]);
  const [formData, setFormData] = useState({
    id: '',
    course_code: '',
    day: 'Monday',
    start_time: '09:00',
    end_time: '10:30',
    venue: '',
    lecturer: '',
    teacher_id: '',
    block: 'A'
  });
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState({
    courses: true,
    timetable: true
  });
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        await Promise.all([fetchCourses(), fetchTimetableEntries()]);
      } catch (error) {
        setError('Failed to load initial data');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const fetchCourses = async () => {
    try {
      setLoading(prev => ({ ...prev, courses: true }));
      const response = await fetch('http://localhost:8080/educonnect-backend/fetch_courses.php');
      
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      const data = await response.json();
      if (!data.success) throw new Error(data.message || 'Failed to fetch courses');
      
      setCourses(data.data);
    } catch (error) {
      console.error('Fetch courses error:', error);
      setError(error.message);
    } finally {
      setLoading(prev => ({ ...prev, courses: false }));
    }
  };

  const fetchTimetableEntries = async () => {
    try {
      setLoading(prev => ({ ...prev, timetable: true }));
      const response = await fetch('http://localhost:8080/educonnect-backend/get_timetable.php');
      
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      const data = await response.json();
      if (!data.success) throw new Error(data.message || 'Failed to fetch timetable');
      
      setEntries(data.data);
    } catch (error) {
      console.error('Fetch timetable error:', error);
      setError(error.message);
    } finally {
      setLoading(prev => ({ ...prev, timetable: false }));
    }
  };

  const handleCourseChange = (e) => {
    const courseCode = e.target.value;
    const selected = courses.find(course => course.code === courseCode);
    setSelectedCourse(selected);
    
    setFormData({
      ...formData,
      course_code: courseCode,
      lecturer: selected?.teacher_name || '',
      teacher_id: selected?.teacher_id || ''
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    const requiredFields = ['course_code', 'day', 'start_time', 'end_time', 'venue', 'lecturer', 'teacher_id', 'block'];
    const missingFields = requiredFields.filter(field => !formData[field]);
    
    if (missingFields.length > 0) {
      setError(`Missing required fields: ${missingFields.join(', ')}`);
      return false;
    }
    
    if (formData.start_time >= formData.end_time) {
      setError('End time must be after start time');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    
    if (!validateForm()) return;
    
    try {
      const endpoint = isEditing 
        ? 'http://localhost:8080/educonnect-backend/update_timetable.php'
        : 'http://localhost:8080/educonnect-backend/add_timetable.php';
      
      const response = await fetch(endpoint, {
        method: isEditing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      const data = await response.json();
      
      if (!response.ok || !data.success) {
        throw new Error(data.message || `Failed to ${isEditing ? 'update' : 'add'} timetable entry`);
      }
      
      setSuccessMessage(`Timetable entry ${isEditing ? 'updated' : 'added'} successfully!`);
      await fetchTimetableEntries();
      resetForm();
      setShowModal(false);
    } catch (error) {
      console.error('Submit error:', error);
      setError(error.message);
    }
  };

  const handleDeleteEntry = async (id) => {
    if (!window.confirm('Are you sure you want to delete this timetable entry?')) return;
    
    try {
      const response = await fetch('http://localhost:8080/educonnect-backend/delete_timetable.php', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      
      const data = await response.json();
      
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to delete timetable entry');
      }
      
      setSuccessMessage('Timetable entry deleted successfully!');
      await fetchTimetableEntries();
    } catch (error) {
      console.error('Delete error:', error);
      setError(error.message);
    }
  };

  const resetForm = () => {
    setFormData({
      id: '',
      course_code: '',
      day: 'Monday',
      start_time: '09:00',
      end_time: '10:30',
      venue: '',
      lecturer: '',
      teacher_id: '',
      block: 'A'
    });
    setSelectedCourse(null);
    setIsEditing(false);
  };

  // Filter entries based on search term
  const filteredEntries = entries.filter(entry => 
    entry.course_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entry.course_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entry.lecturer?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entry.venue?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Render loading state
  if (loading.courses || loading.timetable) {
    return (
      <div className="timetable-container">
        <SidebarNavigation activeItem={activeItem} userName={userName} onLogout={onLogout} />
        <div className="timetable-main-content">
          <div className="loading-overlay">
            <div className="loading-spinner"></div>
            <p>Loading timetable data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="timetable-container">
      <SidebarNavigation activeItem={activeItem} userName={userName} onLogout={onLogout} />

      <div className="timetable-main-content">
        <div className="timetable-header-section">
          <h1 className="timetable-header">Timetable Management</h1>
          <p className="timetable-subtitle">Manage class schedules and room assignments</p>
          
          <div className="search-container">
            <div className="search-input-wrapper">
              <Search size={18} className="search-icon" />
              <input
                type="text"
                placeholder="Search timetable..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                disabled={isLoading}
               style={{marginLeft:"20px"}}/>
            </div>
          </div>

          <div className="divider-line"></div>

          <div className="subheader-section">
            <button 
              className="timetable-add-button"
              onClick={() => {
                resetForm();
                setShowModal(true);
                setError(null);
                setSuccessMessage('');
              }}
             style={{marginTop: "-126px" , marginLeft: "824px"}}>
              <Plus size={16} className="button-icon" />
              Add New Schedule
            </button>
          </div>
        </div>

        {error && (
          <div className="timetable-error">
            <p>{error}</p>
            <button onClick={() => setError(null)} className="error-close">
              <X size={18} />
            </button>
          </div>
        )}
        
        {successMessage && (
          <div className="timetable-success">
            <p>{successMessage}</p>
            <button onClick={() => setSuccessMessage('')} className="success-close">
              <X size={18} />
            </button>
          </div>
        )}

        <div className="timetable-entries">
          {filteredEntries.length === 0 ? (
            <p className="timetable-empty">No timetable entries found{searchTerm ? ` matching "${searchTerm}"` : ''}.</p>
          ) : (
            <div className="timetable-grid" style={{marginLeft: "340px" ,gap: "20px", width: "518px" , display:"inline-grid"}}>
              {filteredEntries.map((entry) => (
                <div key={entry.id} className="timetable-card" style={{marginLeft:"-250px", marginRight:"53px"}}>
                  <div className="card-body">
                    <h3 className="card-title">{entry.course_name || entry.course_code}</h3>
                    <hr /> <br />
                    <div className="card-info">
                      <p className="card-lecturer">{entry.lecturer || 'Not assigned'}</p>
                      <p className="card-day">{entry.day} (Block {entry.block})</p>
                    </div>
                    <div className="card-time-info">
                      <p className="card-time">{entry.start_time} - {entry.end_time}</p>
                      <p className="card-venue">{entry.venue || 'No venue specified'}</p>
                    </div>
                    
                  </div>
                  <div className="card-actions">
                    <button 
                      className="card-edit"
                      onClick={() => {
                        setSelectedCourse(courses.find(c => c.code === entry.course_code));
                        setFormData({
                          id: entry.id,
                          course_code: entry.course_code,
                          day: entry.day,
                          start_time: entry.start_time,
                          end_time: entry.end_time,
                          venue: entry.venue,
                          lecturer: entry.lecturer,
                          teacher_id: entry.teacher_id,
                          block: entry.block
                        });
                        setIsEditing(true);
                        setShowModal(true);
                      }}
                    >
                      <Edit size={14} className="action-icon" /> Edit
                    </button>
                    <button 
                      className="card-delete"
                      onClick={() => handleDeleteEntry(entry.id)}
                    >
                      <Trash2 size={14} className="action-icon" /> Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {showModal && (
          <div className="timetable-modal-overlay">
            <div className="timetable-modal">
              <div className="modal-header">
                <h2>{isEditing ? 'Edit Schedule' : 'Add New Schedule'}</h2>
                <button 
                  className="modal-close" 
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                >
                  <X size={20} />
                </button>
              </div>
              
              <form className="timetable-form" onSubmit={handleSubmit}>
                <div className="form-group">
                  <label htmlFor="course-select">Course *</label>
                  <select
                    id="course-select"
                    name="course_code"
                    value={formData.course_code}
                    onChange={handleCourseChange}
                    required
                  >
                    <option value="">Select Course</option>
                    {courses.map((course) => (
                      <option key={course.code} value={course.code}>
                        {course.name} ({course.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="lecturer-input">Lecturer *</label>
                  <input
                    id="lecturer-input"
                    name="lecturer"
                    type="text"
                    value={formData.lecturer}
                    onChange={handleInputChange}
                    required
                    readOnly={!!selectedCourse}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="teacher-id-input">Teacher ID *</label>
                  <input
                    id="teacher-id-input"
                    name="teacher_id"
                    type="text"
                    value={formData.teacher_id}
                    onChange={handleInputChange}
                    required
                    readOnly={!!selectedCourse}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="day-select">Day *</label>
                  <select
                    id="day-select"
                    name="day"
                    value={formData.day}
                    onChange={handleInputChange}
                    required
                  >
                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map(day => (
                      <option key={day} value={day}>{day}</option>
                    ))}
                  </select>
                </div>

                <div className="time-inputs">
                  <div className="form-group">
                    <label htmlFor="start-time">Start Time *</label>
                    <input
                      id="start-time"
                      name="start_time"
                      type="time"
                      value={formData.start_time}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="end-time">End Time *</label>
                    <input
                      id="end-time"
                      name="end_time"
                      type="time"
                      value={formData.end_time}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="block-select">Block *</label>
                  <select
                    id="block-select"
                    name="block"
                    value={formData.block}
                    onChange={handleInputChange}
                    required
                  >
                    {['A', 'B', 'C', 'D'].map(block => (
                      <option key={block} value={block}>Block {block}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="venue-input">Class *</label>
                  <input
                    id="venue-input"
                    name="venue"
                    type="text"
                    value={formData.venue}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-buttons">
                  <button 
                    type="button" 
                    className="form-cancel" 
                    onClick={() => {
                      setShowModal(false);
                      resetForm();
                    }}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="form-submit">
                    <Check size={16} className="button-icon" />
                    {isEditing ? 'Update Schedule' : 'Add Schedule'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TimetableManagement;