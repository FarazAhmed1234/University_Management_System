import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Search, Plus, Edit, Trash2, Check, X, Users } from 'lucide-react';
import SidebarNavigation from './SidebarNavigation';
import './CourseManagement.css';

const CourseManagement = ({ userName, onLogout }) => {
  // State management
  const [activeItem] = useState('Course Management');
  const [searchTerm, setSearchTerm] = useState('');
  const [courses, setCourses] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [assignedTeachers, setAssignedTeachers] = useState({});
  const [showAddForm, setShowAddForm] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedTeacher, setSelectedTeacher] = useState('');
  const [newCourse, setNewCourse] = useState({ 
    name: '', code: '', department: '', credit_hours: '', semester: '', description: '' 
  });
  const [editingId, setEditingId] = useState(null);
  const [editCourseData, setEditCourseData] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const API = 'http://localhost:8080/educonnect-backend';

  // Enhanced fetch function with error handling
  const fetchData = useCallback(async (endpoint) => {
    setIsLoading(true);
    setError(null);
    try {
      const resp = await fetch(`${API}/${endpoint}`);
      
      if (!resp.ok) {
        const errorData = await resp.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${resp.status}`);
      }

      const contentType = resp.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error(`Expected JSON but got ${contentType}`);
      }

      const json = await resp.json();
      return json.data || json;
    } catch (e) {
      setError(`Failed to load ${endpoint}: ${e.message}`);
      console.error(`Error in ${endpoint}:`, e);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load all data
  const loadAll = useCallback(async () => {
    try {
      const [coursesData, depsData, teachersData] = await Promise.all([
        fetchData('get_courses.php'),
        fetchData('get_departments.php'),
        fetchData('get_teachers.php')
      ]);

      setDepartments(depsData.map(d => d.name || d));
      setTeachers(teachersData);
      setCourses(coursesData);

      // Build teacher assignments map with proper teacher names
      const assignmentsMap = {};
      coursesData.forEach(course => {
        const assignments = course.assigned_teachers || [];
        // Enhance assignments with full teacher names
        const enhancedAssignments = assignments.map(assignment => {
          const teacher = teachersData.find(t => t.id === assignment.id || t.id === assignment.teacher_id);
          return {
            ...assignment,
            name: teacher ? 
              (teacher.name || `${teacher.first_name} ${teacher.last_name}`) : 
              'Unknown Teacher'
          };
        });
        assignmentsMap[course.id] = enhancedAssignments;
      });
      setAssignedTeachers(assignmentsMap);
    } catch (e) {
      setError('Failed to load initial data: ' + e.message);
    }
  }, [fetchData]);

  useEffect(() => { loadAll(); }, [loadAll]);

  // API request handler
  const request = async (endpoint, body) => {
    setIsLoading(true);
    setError(null);
    try {
      const resp = await fetch(`${API}/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (!resp.ok) {
        const errorData = await resp.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${resp.status}`);
      }

      const json = await resp.json();
      if (!json.success) {
        throw new Error(json.message || 'Operation failed');
      }
      
      await loadAll();
      return json;
    } catch (e) {
      setError(e.message);
      throw e;
    } finally {
      setIsLoading(false);
    }
  };

  // Filtered data
  const filteredTeachers = useMemo(() => {
    return selectedCourse 
      ? teachers.filter(t => t.department === selectedCourse.department) 
      : [];
  }, [teachers, selectedCourse]);

  const filteredCourses = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return courses.filter(c =>
      c.name.toLowerCase().includes(term) ||
      c.code.toLowerCase().includes(term) ||
      c.department.toLowerCase().includes(term)
    );
  }, [courses, searchTerm]);

  // Handlers
  const handleAssignTeacher = async () => {
    if (!selectedTeacher) {
      setError('Please select a teacher');
      return;
    }

    // Frontend validation for duplicate assignment
    const currentAssignments = assignedTeachers[selectedCourse.id] || [];
    const teacherObj = teachers.find(t => t.id === selectedTeacher);
    
    if (!teacherObj) {
      setError('Selected teacher not found');
      return;
    }

    const teacherName = teacherObj.name || `${teacherObj.first_name} ${teacherObj.last_name}`;

    if (currentAssignments.some(t => t.id === selectedTeacher || t.teacher_id === selectedTeacher)) {
      setError(`${teacherName} is already assigned to this course`);
      return;
    }

    try {
      await request('assign_course.php', { 
        course_id: selectedCourse.id, 
        teacher_id: selectedTeacher 
      });
      setShowAssignModal(false);
      setSelectedTeacher('');
    } catch (e) {
      // Error handled by request()
    }
  };

  const handleUnassignTeacher = async (courseId, teacherId) => {
    if (window.confirm('Are you sure you want to unassign this teacher?')) {
      await request('unassign_course.php', {
        course_id: courseId,
        teacher_id: teacherId
      });
    }
  };

  // Render
  return (
    <div className="course-management">
      <SidebarNavigation activeItem={activeItem} userName={userName} onLogout={onLogout} />
      
      <div className="course-management__main">
        <header className="course-management__header">
          <h2>Course Management</h2>
        </header>

        {error && (
          <div className="alert alert--error">
            {error}
            <button onClick={() => setError(null)} className="alert__close">
              <X size={16}/>
            </button>
          </div>
        )}

        <div className="course-management__controls">
          <div className="search">
            <Search size={18} className="search__icon"/>
            <input
              type="text"
              placeholder="Search courses..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              disabled={isLoading}
              className="search__input"
            />
          </div>
          <button
            onClick={() => setShowAddForm(true)}
            disabled={isLoading}
            className="btn btn--primary"
          >
            <Plus size={16} className="btn__icon"/>
            Add Course
          </button>
        </div>

        <div className="courses-grid">
          {filteredCourses.map(course => (
            <CourseCard
              key={course.id}
              course={course}
              editingId={editingId}
              editCourseData={editCourseData}
              setEditCourseData={setEditCourseData}
              isLoading={isLoading}
              departments={departments}
              assignedTeachers={assignedTeachers[course.id] || []}
              onEditStart={() => {
                setEditingId(course.id);
                setEditCourseData({...course});
              }}
              onEditSave={() => request('update_course.php', editCourseData).then(() => setEditingId(null))}
              onEditCancel={() => setEditingId(null)}
              onDelete={() => {
                if (window.confirm(`Delete ${course.name}?`)) {
                  request('delete_course.php', { id: course.id });
                }
              }}
              onAssignTeacher={() => {
                setSelectedCourse(course);
                setSelectedTeacher('');
                setShowAssignModal(true);
              }}
              onUnassignTeacher={handleUnassignTeacher}
            />
          ))}
        </div>

        {/* Modals */}
        <CourseModal
          show={showAddForm}
          title="Add Course"
          onClose={() => setShowAddForm(false)}
          onSave={() => {
            if (!newCourse.name || !newCourse.code || !newCourse.department || !newCourse.credit_hours) {
              return setError('Please fill all mandatory fields');
            }
            request('add_course.php', newCourse).then(() => {
              setShowAddForm(false);
              setNewCourse({ name: '', code: '', department: '', credit_hours: '', semester: '', description: '' });
            });
          }}
          fields={[
            { label: 'Course Name*', name: 'name', type: 'text', required: true },
            { label: 'Code*', name: 'code', type: 'text', required: true },
            { label: 'Department*', name: 'department', type: 'select', options: departments, required: true },
            { label: 'Credit Hours*', name: 'credit_hours', type: 'number', required: true },
            { label: 'Semester', name: 'semester', type: 'text' },
            { label: 'Description', name: 'description', type: 'textarea' }
          ]}
          data={newCourse}
          setData={setNewCourse}
          isLoading={isLoading}
        />

        <AssignTeacherModal
          show={showAssignModal}
          course={selectedCourse}
          teachers={filteredTeachers}
          assignedTeachers={assignedTeachers[selectedCourse?.id] || []}
          selectedTeacher={selectedTeacher}
          onTeacherSelect={setSelectedTeacher}
          onClose={() => setShowAssignModal(false)}
          onSave={handleAssignTeacher}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
};

// Component for individual course cards
const CourseCard = ({ 
  course, 
  editingId,
  editCourseData,
  setEditCourseData,
  isLoading,
  departments,
  assignedTeachers,
  onEditStart,
  onEditSave,
  onEditCancel,
  onDelete,
  onAssignTeacher,
  onUnassignTeacher
}) => {
  const isEditing = editingId === course.id;

  return (
    <div className="course-card">
      <div className="course-card__header">
        <h3 className="course-card__title">
          {isEditing ? (
            <input
              value={editCourseData.name}
              onChange={e => setEditCourseData({...editCourseData, name: e.target.value})}
              className="form-input"
              disabled={isLoading}
            />
          ) : course.name}
        </h3>
        <div className="course-card__actions">
          {isEditing ? (
            <>
              <Check size={18} onClick={onEditSave} className="icon-btn icon-btn--confirm" />
              <X size={18} onClick={onEditCancel} className="icon-btn icon-btn--cancel" />
            </>
          ) : (
            <>
              <Edit size={18} onClick={onEditStart} className="icon-btn icon-btn--edit" />
              <Trash2 size={18} onClick={onDelete} className="icon-btn icon-btn--delete" />
            </>
          )}
        </div>
      </div>

      <div className="course-card__details">
        <DetailRow 
          label="Code:" 
          value={isEditing ? (
            <input
              value={editCourseData.code}
              onChange={e => setEditCourseData({...editCourseData, code: e.target.value})}
              className="form-input"
              disabled={isLoading}
            />
          ) : course.code}
        />

        <DetailRow 
          label="Dept:" 
          value={isEditing ? (
            <select
              value={editCourseData.department}
              onChange={e => setEditCourseData({...editCourseData, department: e.target.value})}
              className="form-select"
              disabled={isLoading}
            >
              <option value="">Select</option>
              {departments.map((d,i) => (
                <option key={i} value={d}>{d}</option>
              ))}
            </select>
          ) : course.department}
        />

        <DetailRow 
          label="Credit Hrs:" 
          value={isEditing ? (
            <input
              type="number"
              value={editCourseData.credit_hours}
              onChange={e => setEditCourseData({...editCourseData, credit_hours: e.target.value})}
              className="form-input"
              disabled={isLoading}
            />
          ) : course.credit_hours}
        />

        <DetailRow 
          label="Semester:" 
          value={isEditing ? (
            <input
              value={editCourseData.semester}
              onChange={e => setEditCourseData({...editCourseData, semester: e.target.value})}
              className="form-input"
              disabled={isLoading}
            />
          ) : course.semester}
        />

        <DetailRow 
          label="Description:" 
          value={isEditing ? (
            <textarea
              value={editCourseData.description}
              onChange={e => setEditCourseData({...editCourseData, description: e.target.value})}
              className="form-textarea"
              disabled={isLoading}
            />
          ) : course.description}
        />

        <DetailRow 
          
        />
      </div>

      <button 
        className="btn btn--secondary"
        onClick={onAssignTeacher}
        disabled={isLoading}
       style={{marginLeft:"84px", marginTop:"-13px", marginBottom:"30px"}}>
        <Users size={16} className="btn__icon"/>
        {assignedTeachers.length > 0 ? 'Add Teacher' : 'Assign Teacher'}
      </button>
    </div>
  );
};

// Reusable components
const DetailRow = ({ label, value }) => (
  <div className="detail-row">
    <span className="detail-row__label">{label}</span>
    <span className="detail-row__value">{value}</span>
  </div>
);

const CourseModal = ({ 
  show, 
  title, 
  onClose, 
  onSave, 
  fields, 
  data, 
  setData, 
  isLoading 
}) => {
  if (!show) return null;

  return (
    <div className="modal">
      <div className="modal__content">
        <header className="modal__header">
          <h3>{title}</h3>
          <button onClick={onClose} className="modal__close">
            <X size={20}/>
          </button>
        </header>
        <div className="modal__body">
          <div className="modal__form">
            {fields.map(field => (
              <div key={field.name} className="form-group">
                <label className="form-label">{field.label}</label>
                {field.type === 'select' ? (
                  <select
                    value={data[field.name] || ''}
                    onChange={e => setData({...data, [field.name]: e.target.value})}
                    className="form-select"
                    disabled={isLoading}
                    required={field.required}
                  >
                    <option value="">Select</option>
                    {field.options.map((opt, i) => (
                      <option key={i} value={opt}>{opt}</option>
                    ))}
                  </select>
                ) : field.type === 'textarea' ? (
                  <textarea
                    value={data[field.name] || ''}
                    onChange={e => setData({...data, [field.name]: e.target.value})}
                    className="form-textarea"
                    disabled={isLoading}
                  />
                ) : (
                  <input
                    type={field.type}
                    value={data[field.name] || ''}
                    onChange={e => setData({...data, [field.name]: e.target.value})}
                    className="form-input"
                    disabled={isLoading}
                    required={field.required}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
        <footer className="modal__footer">
          <button className="btn btn--outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </button>
          <button className="btn btn--primary" onClick={onSave} disabled={isLoading}>
            Save
          </button>
        </footer>
      </div>
    </div>
  );
};

const AssignTeacherModal = ({ 
  show, 
  course, 
  teachers, 
  assignedTeachers,
  selectedTeacher, 
  onTeacherSelect, 
  onClose, 
  onSave, 
  isLoading 
}) => {
  if (!show || !course) return null;

  // Helper function to get teacher name
  const getTeacherName = (teacher) => {
    return teacher.name || `${teacher.first_name} ${teacher.last_name}`;
  };

  // Check if teacher is already assigned
  const isAlreadyAssigned = (teacherId) => {
    return assignedTeachers.some(t => t.id === teacherId || t.teacher_id === teacherId);
  };

  return (
    <div className="modal">
      <div className="modal__content">
        <header className="modal__header">
          <h3>Assign Teacher to {course.name}</h3>
          <button onClick={onClose} className="modal__close">
            <X size={20}/>
          </button>
        </header>
        <div className="modal__body">
          <div className="modal__form">
            <div className="form-group">
              <label className="form-label">Department: {course.department}</label>
            </div>
            <div className="form-group">
              {teachers.length > 0 ? (
                <select
                  value={selectedTeacher}
                  onChange={e => onTeacherSelect(e.target.value)}
                  className="form-select"
                  disabled={isLoading}
                >
                  <option value="">Select a teacher</option>
                  {teachers.map(teacher => {
                    const assigned = isAlreadyAssigned(teacher.id);
                    return (
                      <option 
                        key={teacher.id} 
                        value={teacher.id}
                        disabled={assigned}
                        className={assigned ? 'disabled-option' : ''}
                      >
                        {getTeacherName(teacher)} ({teacher.email})
                        {assigned && ' (Already assigned)'}
                      </option>
                    );
                  })}
                </select>
              ) : (
                <p className="form-message">No teachers available in this department.</p>
              )}
            </div>
            
            {/* Show currently assigned teachers */}
            {assignedTeachers.length > 0 && (
              <div className="current-assignments">
                <h4>Currently Assigned Teachers:</h4>
                <ul className="assigned-teachers-list">
                  {assignedTeachers.map(teacher => (
                    <li key={teacher.id} className="assigned-teacher-item">
                      {getTeacherName(teacher)} ({teacher.email})
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
        <footer className="modal__footer">
          <button className="btn btn--outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </button>
          <button 
            className="btn btn--primary" 
            onClick={onSave} 
            disabled={isLoading || !selectedTeacher || isAlreadyAssigned(selectedTeacher)}
          >
            Assign Teacher
          </button>
        </footer>
      </div>
    </div>
  );
};

export default CourseManagement;