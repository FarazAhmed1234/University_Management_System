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
    start_time: '',
    end_time: '',
    venue: '',
    lecturer: '',
    teacher_id: '',
    block: 'A'
  });
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState({ courses: true, timetable: true });
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // ✅ Fixed time slots
  const timeSlots = [
    { start: "09:00", end: "10:30" },
    { start: "10:30", end: "12:00" },
    { start: "12:00", end: "13:30" },
    { start: "13:30", end: "15:00" },
    { start: "15:00", end: "16:30" }
  ];

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
      const response = await fetch('http://educonnect.atwebpages.com/educonnect-backend/fetch_courses.php');
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
      const response = await fetch('http://educonnect.atwebpages.com/educonnect-backend/get_timetable.php');
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
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!validateForm()) return;

    try {
      const endpoint = isEditing 
        ? 'http://educonnect.atwebpages.com/educonnect-backend/update_timetable.php'
        : 'http://educonnect.atwebpages.com/educonnect-backend/add_timetable.php';
      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      if (!data.success) throw new Error(data.message || 'Failed to save timetable entry');

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
      const response = await fetch('http://educonnect.atwebpages.com/educonnect-backend/delete_timetable.php', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ id })
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.message || 'Failed to delete timetable entry');
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
      start_time: '',
      end_time: '',
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
        
        {/* Header */}
        <div className="timetable-header-section">
          <h1 className="timetable-header">Timetable Management</h1>
          <p className="timetable-subtitle">Manage class schedules and room assignments</p>
          <div className="search-container">
            <input
              type="text"
              placeholder="Search timetable..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              disabled={isLoading}
              className="search-input"
            />
          </div>
          <div className="subheader-section">
            <button 
              className="timetable-add-button"  
              style={{color: "black"}}
              onClick={() => {
                resetForm();
                setShowModal(true);
                setError(null);
                setSuccessMessage('');
              }}
            >
              <Plus size={16} className="button-icon" /> Add New Schedule
            </button>
          </div>
        </div>

        {/* Errors and Success */}
        {error && (
          <div className="timetable-error">
            <p>{error}</p>
            <button onClick={() => setError(null)} className="error-close"><X size={18} /></button>
          </div>
        )}
        {successMessage && (
          <div className="timetable-success">
            <p>{successMessage}</p>
            <button onClick={() => setSuccessMessage('')} className="success-close"><X size={18} /></button>
          </div>
        )}

        {/* Timetable entries */}
        <div className="timetable-entries">
          {filteredEntries.length === 0 ? (
            <p className="timetable-empty">No timetable entries found.</p>
          ) : (
            <div className="timetable-grid">
              {filteredEntries.map((entry) => (
                <div key={entry.id} className="timetable-card">
                  <div className="card-body">
                    <h3 className="card-title">{entry.course_name || entry.course_code}</h3>
                    <p className="card-lecturer">{entry.lecturer}</p>
                    <p>{entry.day}</p>
                    <p>{entry.start_time} - {entry.end_time}</p>
                    <p>Block {entry.block} ({entry.venue})</p>
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
                      <Edit size={14} /> Edit
                    </button>
                    <button 
                      className="card-delete"
                      onClick={() => handleDeleteEntry(entry.id)}
                    >
                      <Trash2 size={14} /> Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal */}
        {showModal && (
          <div className="timetable-modal-overlay">
            <div className="timetable-modal">
              <div className="modal-header">
                <h2>{isEditing ? 'Edit Schedule' : 'Add New Schedule'}</h2>
                <button className="modal-close" onClick={() => { setShowModal(false); resetForm(); }}>
                  <X size={20} />
                </button>
              </div>

              <form className="timetable-form" onSubmit={handleSubmit}>
                
                {/* Course */}
                <div className="form-group">
                  <label>Course *</label>
                  <select
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

                {/* Lecturer */}
                <div className="form-group">
                  <label>Lecturer *</label>
                  <input type="text" name="lecturer" value={formData.lecturer} readOnly />
                </div>

                {/* Teacher ID */}
                <div className="form-group">
                  <label>Teacher ID *</label>
                  <input type="text" name="teacher_id" value={formData.teacher_id} readOnly />
                </div>

                {/* Day */}
                <div className="form-group">
                  <label>Day *</label>
                  <select
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

                {/* Time slot dropdown ✅ */}
                <div className="form-group">
                  <label>Time Slot *</label>
                  <select
                    name="time_slot"
                    value={formData.start_time && formData.end_time ? `${formData.start_time}-${formData.end_time}` : ""}
                    onChange={(e) => {
                      const [start, end] = e.target.value.split("-");
                      setFormData(prev => ({ ...prev, start_time: start, end_time: end }));
                    }}
                    required
                  >
                    <option value="">Select Time Slot</option>
                    {timeSlots.map((slot, idx) => (
                      <option key={idx} value={`${slot.start}-${slot.end}`}>
                        {slot.start} - {slot.end}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Block */}
                <div className="form-group">
                  <label>Block *</label>
                  <select
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

                {/* Venue */}
                <div className="form-group">
                  <label>Class *</label>
                  <input type="text" name="venue" value={formData.venue} onChange={handleInputChange} required />
                </div>

                <div className="form-buttons">
                  <button type="button" className="form-cancel" onClick={() => { setShowModal(false); resetForm(); }}>
                    Cancel
                  </button>
                  <button type="submit" className="form-submit">
                    <Check size={16} /> {isEditing ? 'Update Schedule' : 'Add Schedule'}
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
