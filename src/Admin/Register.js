import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import SidebarNavigation from './SidebarNavigation';
import './Register.css';

const Register = ({ userName, onLogout }) => {
  const [activeItem] = useState("Register");
  const [studentId, setStudentId] = useState('');
  const [studentData, setStudentData] = useState(null);
  const [semester, setSemester] = useState('');
  const [courses, setCourses] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [registeredCourses, setRegisteredCourses] = useState([]);
  const [totalCredits, setTotalCredits] = useState(0);

  useEffect(() => {
    if (studentId && semester) {
      fetchRegisteredCourses();
    }
  }, [studentId, semester]);

  const fetchStudentData = async () => {
    if (!studentId) {
      setError('Please enter a student ID');
      return;
    }

    setLoading(true);
    setError('');
    setStudentData(null);
    setCourses([]);
    setSemester('');
    setRegisteredCourses([]);
    setTotalCredits(0);

    try {
      const response = await fetch(
        `httpshttp://educonnect.atwebpages.com/educonnect-backend/get_student.php?student_id=${studentId}`
      );
      const data = await response.json();

      if (data.status === 'success') {
        setStudentData(data.data);
      } else {
        setError(data.message || 'Failed to fetch student data');
      }
    } catch (err) {
      setError(err.message || 'Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  const fetchSemesterCourses = async () => {
    if (!semester || !studentId) {
      setError('Please select a semester');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(
        `httpshttp://educonnect.atwebpages.com/educonnect-backend/get_semester.php?student_id=${studentId}&semester=${semester}`
      );
      const data = await response.json();

      if (data.status === 'success') {
        setCourses(data.data);
      } else {
        setCourses([]);
        setError(data.message || 'No courses available for this semester');
      }
    } catch (err) {
      setError(err.message || 'Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  const fetchRegisteredCourses = async () => {
    if (!studentId || !semester) return;

    setLoading(true);
    setError('');

    try {
      const response = await fetch(
        `httpshttp://educonnect.atwebpages.com/educonnect-backend/get_registered_courses.php?student_id=${studentId}&semester=${semester}`
      );
      const data = await response.json();

      if (data.status === 'success') {
        setRegisteredCourses(data.data);
        setTotalCredits(data.total_credits || 0);
      } else {
        setRegisteredCourses([]);
        setTotalCredits(0);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch registered courses');
    } finally {
      setLoading(false);
    }
  };

  const registerCourse = async (course) => {
    if (!studentData || !semester) {
      setError('Student data or semester not loaded');
      return;
    }

    // Check if already registered
    if (registeredCourses.some(rc => rc.course_code === course.code)) {
      setError('You have already registered for this course');
      return;
    }

    // Check credit limit (assuming max 17 credits)
    if (totalCredits + course.credit_hours < 17) {
      setError('Cannot register - credit limit exceeded (max 17 credits)');
      return;
    }

    // Validate teacher_id exists
    if (!course.teacher_id) {
      setError('Teacher information is missing for this course');
      return;
    }

    setLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      const response = await fetch(
        'httpshttp://educonnect.atwebpages.com/educonnect-backend/register_course.php',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            student_id: studentId,
            student_name: studentData.name,
            department: studentData.department,
            semester: semester,
            course_code: course.code,
            course_name: course.name,
            teacher_id: course.teacher_id, // Ensure this is included
            teacher_name: course.teacher_name,
            credit_hours: course.credit_hours
          })
        }
      );

      const data = await response.json();

      if (data.status === 'success') {
        setSuccessMessage('Course registered successfully!');
        // Refresh the registered courses list
        await fetchRegisteredCourses();
        // Refresh available courses
        await fetchSemesterCourses();
      } else {
        setError(data.message || 'Failed to register course');
      }
    } catch (err) {
      setError(err.message || 'Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-container">
      <SidebarNavigation activeItem={activeItem} userName={userName} onLogout={onLogout} />

      <main className="register-content" style={{marginLeft: "289px"}}>
        <div className="user-header">
          <h2>Course Registration</h2>
        </div>

        <section className="search-section card">
          <h3>Search Student</h3>
          <div className="input-group">
            <input
              type="text"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              placeholder="Enter Student ID"
              disabled={loading}
            />
            <button
              onClick={fetchStudentData}
              disabled={loading || !studentId}
              className="primary-btn"
            >
              {loading ? 'Loading...' : 'Search'}
            </button>
          </div>
        </section>

        {error && <div className="alert error">{error}</div>}
        {successMessage && <div className="alert success">{successMessage}</div>}

        {studentData && (
          <section className="student-details card">
            <div className="section-header">
              <h3>Student Details</h3>
            </div>
            <table className="details-table">
              <tbody>
                <tr><th>Student ID</th><td>{studentData.student_id}</td></tr>
                <tr><th>Name</th><td>{studentData.name}</td></tr>
                <tr><th>Email</th><td>{studentData.email}</td></tr>
                <tr><th>Department</th><td>{studentData.department}</td></tr>
                <tr><th>Year</th><td>{studentData.joinDate}</td></tr>
              </tbody>
            </table>

            <div className="semester-section">
              <h4>View Courses by Semester</h4>
              <div className="input-group">
                <select
                  value={semester}
                  onChange={(e) => setSemester(e.target.value)}
                  disabled={loading}
                >
                  <option value="">Select Semester</option>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                    <option key={sem} value={sem}>Semester {sem}</option>
                  ))}
                </select>
                <button
                  onClick={fetchSemesterCourses}
                  disabled={loading || !semester}
                  className="primary-btn"
                >
                  {loading ? 'Loading...' : 'Get Courses'}
                </button>
              </div>
            </div>

            {registeredCourses.length > 0 && (
              <div className="registered-courses-section">
                <div className="section-header">
                  <h4>Registered Courses (Semester {semester}) - Total Credits: {totalCredits}/17</h4>
                </div>
                <div className="table-container">
                  <table className="courses-table">
                    <thead>
                      <tr>
                        <th>Course Code</th>
                        <th>Course Name</th>
                        <th>Instructor</th>
                        <th>Credits</th>
                      </tr>
                    </thead>
                    <tbody>
                      {registeredCourses.map((course, index) => (
                        <tr key={index}>
                          <td>{course.course_code}</td>
                          <td>{course.course_name}</td>
                          <td>{course.teacher_name}</td>
                          <td>{course.credit_hours}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {courses.length > 0 && (
              <div className="courses-section">
                <div className="section-header">
                  <h4>Available Courses (Semester {semester})</h4>
                </div>
                <div className="table-container">
                  <table className="courses-table">
                    <thead>
                      <tr>
                        <th>Course Code</th>
                        <th>Course Name</th>
                        <th>Department</th>
                        <th>Instructor</th>
                        <th>Credits</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {courses.map((course, index) => (
                        <tr key={index}>
                          <td>{course.code}</td>
                          <td>{course.name}</td>
                          <td>{course.department}</td>
                          <td>{course.teacher_name}</td>
                          <td>{course.credit_hours}</td>
                          <td>
                            <button
                              onClick={() => registerCourse(course)}
                              disabled={loading || registeredCourses.some(rc => rc.course_code === course.code)}
                              className="register-btn"
                            >
                              {registeredCourses.some(rc => rc.course_code === course.code)  ? '✓ Registered' : 'Register'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
};

Register.propTypes = {
  userName: PropTypes.string.isRequired,
  onLogout: PropTypes.func.isRequired
};

export default Register;