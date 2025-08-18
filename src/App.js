import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './Dashboard';
import AdminDashboard from './Admin/AdminDashboard';
import UserManagement from './Admin/UserManagement';
import Departments from './Admin/Departments';
import CourseManagement from './Admin/CourseManagement';
import TimetableManagement from './Admin/TimetableManagement';
import Notices from './Admin/Notices';
import Register from './Admin/Register';
import TeacherDashboard from './Teacher/TeacherDashboard';
import TeacherCourseManagement from './Teacher/TeacherCourseManagement';
import TeacherNotices from './Teacher/TeacherNotices';
import TeacherTimeTable from './Teacher/TeacherTimeTable';
import TeacherAddendance from './Teacher/TeacherAddendance';
import TeacherAssignments from './Teacher/TeacherAssignments';
import TeacherMaterials from './Teacher/TeacherMaterials';
import TeacherGrades from './Teacher/TeacherGrades';
import Result from './Teacher/Result';



import StudentDashboard from './Student/StudentDashboard';
import StudentCourseManagement from './Student/StudentCourseManagement';
import StudentNotices from './Student/StudentNotices';
import StudentTimeTable from './Student/StudentTimeTable';
import StudentAddendance from './Student/StudentAddendance';
import StudentAssignments from './Student/StudentAssignments';
import StudentMaterials from './Student/StudentMaterials';

import StudentResult from './Student/StudentResult';



function App() {
  const [teacherData, setTeacherData] = useState(null);

  const handleLogin = (data) => {
    setTeacherData(data);
  };

  const handleLogout = () => {
    setTeacherData(null);
  };

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/dashboard" element={<AdminDashboard />} />
        <Route path="/user-management" element={<UserManagement />} />
        <Route path="/departments" element={<Departments />} />
        <Route path="/course-management" element={<CourseManagement />} />
        <Route path="/timetables" element={<TimetableManagement />} />
        <Route path="/notices" element={<Notices />} />
        <Route path="/register" element={<Register />} />


        <Route path="/teacherdashboard" element={<TeacherDashboard />} />
        <Route path="/teachercourses" element={<TeacherCourseManagement
          userName={JSON.parse(localStorage.getItem("teacher"))?.name}
          userEmail={JSON.parse(localStorage.getItem("teacher"))?.email}
          userID={JSON.parse(localStorage.getItem("teacher"))?.teacher_id}
          onLogout={handleLogout}
        />
        }
        />

        <Route path="/teachernotices" element={<TeacherNotices />} />

        <Route path="/teacherschedule" element={<TeacherTimeTable />} />
        <Route path="/teacheraddendance" element={<TeacherAddendance />} />
        <Route path="/teacherassignments" element={<TeacherAssignments />} />
        <Route path="/teachermaterials" element={<TeacherMaterials />} />
                <Route path="/result" element={<Result />} />




        <Route path="/studentdashboard" element={<StudentDashboard />} />
        <Route
          path="/studentcourses"
          element={
            <StudentCourseManagement
              userName={JSON.parse(localStorage.getItem("student"))?.name }
              userEmail={JSON.parse(localStorage.getItem("student"))?.email}
              userID={JSON.parse(localStorage.getItem("student"))?.student_id}
              onLogout={handleLogout}
            />
          }
        />


        <Route path="/studentnotices" element={<StudentNotices />} />
        <Route path="/studentschedule" element={<StudentTimeTable />} />
        <Route path="/studentattendance" element={<StudentAddendance />} />

        <Route path="/studentassignments" element={<StudentAssignments />} />
        <Route path="/studentmaterials" element={<StudentMaterials />} />
        <Route path="/teachergrades" element={<TeacherGrades />} />

        <Route path="/studentgrades" element={<StudentResult />} />




        


      </Routes>

    </Router>
  );
}

export default App;