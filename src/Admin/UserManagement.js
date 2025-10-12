import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit, Trash2, X, Check, ChevronDown, ChevronUp, User, Image } from 'lucide-react';
import SidebarNavigation from './SidebarNavigation';
import './UserManagement.css';

const UserManagement = ({ userName, onLogout }) => {
  const [activeItem] = useState("User Management");
  const [searchTerm, setSearchTerm] = useState("");
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    showPassword: false,
    role: 'student',
    program: 'BS',
    semester: 'Spring',
    department: '',
    joinDate: new Date().toISOString().split('T')[0],
    profile_picture: null
  });
  const [editUserId, setEditUserId] = useState(null);
  const [editUserData, setEditUserData] = useState(null);
  const [showEditPassword, setShowEditPassword] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);

  const roleOptions = ['teacher', 'student'];
  const programOptions = ['BS', 'MS', 'PhD'];
  const semesterOptions = ['Spring', 'Fall'];

  useEffect(() => {
    fetchUsers();
    fetchDepartments();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('http://educonnect.atwebpages.com/educonnect-backend/get_users.php');
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const result = await response.json();
      if (!result.success) throw new Error(result.error || 'Failed to fetch users');
      setUsers(result.data);
    } catch (err) {
      setError(err.message || 'Failed to load users');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await fetch('http://educonnect.atwebpages.com/educonnect-backend/get_departments.php');
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const result = await response.json();
      if (!result.success) throw new Error(result.error || 'Failed to fetch departments');
      setDepartments(result.data);
    } catch (err) {
      setError(err.message || 'Failed to load departments');
      setDepartments([]);
    }
  };

  const handleImageUpload = (e, isNewUser = true) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.match('image.*')) return setError('Please select a valid image file (JPEG, PNG, GIF)');
    if (file.size > 2 * 1024 * 1024) return setError('Image must be smaller than 2MB');

    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewImage(reader.result);
      if (isNewUser) {
        setNewUser(prev => ({ ...prev, profile_picture: file }));
      } else {
        setEditUserData(prev => ({ ...prev, profile_picture: file }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAddUser = async () => {
    if (!newUser.name || !newUser.email || !newUser.password) {
      setError('Name, email, and password are required');
      return;
    }

    try {
      const formData = new FormData();
      Object.entries(newUser).forEach(([key, value]) => {
        if (key === "profile_picture" && value instanceof File) {
          formData.append(key, value);
        } else if (key !== "showPassword" && value) {
          formData.append(key, value);
        }
      });

      const response = await fetch('http://educonnect.atwebpages.com/educonnect-backend/add_user.php', {
        method: 'POST',
        body: formData
      });

      const text = await response.text();
      let result;
      try {
        result = JSON.parse(text);
      } catch {
        throw new Error('Invalid response from server:\n' + text);
      }

      if (!result.success) throw new Error(result.message || 'Failed to add user');

      await fetchUsers();
      setShowAddForm(false);
      setNewUser({
        name: '',
        email: '',
        password: '',
        showPassword: false,
        role: 'student',
        program: 'BS',
        semester: 'Spring',
        department: '',
        joinDate: new Date().toISOString().split('T')[0],
        profile_picture: null
      });
      setPreviewImage(null);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to add user');
    }
  };

  const handleUpdateUser = async () => {
    if (!editUserData?.name || !editUserData?.email) {
      setError('Name and email are required');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('id', editUserData.id);
      formData.append('name', editUserData.name);
      formData.append('email', editUserData.email);
      formData.append('role', editUserData.role);
      formData.append('program', editUserData.program);
      formData.append('semester', editUserData.semester);
      formData.append('department', editUserData.department);
      formData.append('joinDate', editUserData.joinDate);

      if (editUserData.password) {
        formData.append('password', editUserData.password);
      }

      if (editUserData.profile_picture instanceof File) {
        formData.append('profile_picture', editUserData.profile_picture);
      } else if (typeof editUserData.profile_picture === 'string') {
        formData.append('existing_profile_picture', editUserData.profile_picture);
      }

      const response = await fetch('http://educonnect.atwebpages.com/educonnect-backend/update_user.php', {
        method: 'POST',
        body: formData
      });

      const text = await response.text();
      let result;
      try {
        result = JSON.parse(text);
      } catch {
        throw new Error('Invalid response from server:\n' + text);
      }

      if (!result.success) throw new Error(result.message || 'Failed to update user');

      await fetchUsers();
      setEditUserId(null);
      setEditUserData(null);
      setPreviewImage(null);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to update user');
    }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      const response = await fetch('http://educonnect.atwebpages.com/educonnect-backend/delete_user.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      const result = await response.json();
      if (!result.success) throw new Error(result.message || 'Failed to delete user');
      await fetchUsers();
    } catch (err) {
      setError(err.message || 'Failed to delete user');
    }
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const filteredUsers = users.filter(user =>
    Object.values(user).some(value =>
      value?.toString().toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const sortedUsers = [...filteredUsers].sort((a, b) => {
    if (sortConfig.key) {
      if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
      if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
    }
    return 0;
  });

  const renderSortIcon = (key) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === 'asc' ? (
      <ChevronUp size={14} className="sort-icon" />
    ) : (
      <ChevronDown size={14} className="sort-icon" />
    );
  };

  const renderProfilePicture = (user) => {
    if (editUserId === user.id && previewImage) {
      return <img src={previewImage} alt="Preview" className="profile-pic" />;
    }
    if (user.profile_picture) {
      return <img src={`http://educonnect.atwebpages.com/educonnect-backend/uploads/${user.profile_picture}`} alt={user.name} className="profile-pic" />;
    }
    return <div className="profile-pic default"><User size={24} /></div>;
  };

  return (
    <div className="user-management-layout">
      <SidebarNavigation activeItem={activeItem} userName={userName} onLogout={onLogout} />
      <div className="user-main-content">
        <div className="user-header"><h2>User Management</h2></div>

       

        <div className="user-actions">
          <div className="user-search">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              disabled={loading}
            />
          </div>
          <button
            className="add-user-button"
            onClick={() => setShowAddForm(true)}
            disabled={loading}
          >
            <Plus size={16} /> Add User
          </button>
        </div>

        {/* Table */}
        <div className="user-table-container">
          <table className="user-table">
            <thead>
              <tr>
                <th>Photo</th>
                <th>ID {renderSortIcon('id')}</th>
                <th>Name {renderSortIcon('name')}</th>
                <th>Email {renderSortIcon('email')}</th>
                <th>Password</th>
                <th>Role</th>
                <th>Program</th>
                <th>Semester</th>
                <th>Department</th>
                <th>Join Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedUsers.length > 0 ? (
                sortedUsers.map(user => (
                  <tr key={user.id}>
                    <td>{renderProfilePicture(user)}</td>
                    <td>{user.id}</td>
                    <td>
                      {editUserId === user.id ? (
                        <input value={editUserData?.name || ''} onChange={e => setEditUserData({ ...editUserData, name: e.target.value })} />
                      ) : user.name}
                    </td>
                    <td>
                      {editUserId === user.id ? (
                        <input type="email" value={editUserData?.email || ''} onChange={e => setEditUserData({ ...editUserData, email: e.target.value })} />
                      ) : (
                        <a href={`mailto:${user.email}`}>{user.email}</a>
                      )}
                    </td>
                    <td>
                      {editUserId === user.id ? (
                        <div className="password-wrapper">
                          <input
                            type={showEditPassword ? "text" : "password"}
                            placeholder="Enter new password"
                            value={editUserData?.password || ''}
                            onChange={e => setEditUserData({ ...editUserData, password: e.target.value })}
                          />
                          <button
                            type="button"
                            className="toggle-password"
                            onClick={() => setShowEditPassword(!showEditPassword)}
                          >
                            {showEditPassword ? "Hide" : "Show"}
                          </button>
                        </div>
                      ) : (
                        <span>••••••</span>
                      )}
                    </td>
                    <td>
                      {editUserId === user.id ? (
                        <select value={editUserData?.role || 'student'} onChange={e => setEditUserData({ ...editUserData, role: e.target.value })}>
                          {roleOptions.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                      ) : user.role}
                    </td>
                    <td>{editUserId === user.id ? (
                      <select value={editUserData?.program} onChange={e => setEditUserData({ ...editUserData, program: e.target.value })}>
                        {programOptions.map(p => <option key={p} value={p}>{p}</option>)}
                      </select>
                    ) : user.program}</td>
                    <td>{editUserId === user.id ? (
                      <select value={editUserData?.semester} onChange={e => setEditUserData({ ...editUserData, semester: e.target.value })}>
                        {semesterOptions.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    ) : user.semester}</td>
                    <td>{editUserId === user.id ? (
                      <select value={editUserData?.department} onChange={e => setEditUserData({ ...editUserData, department: e.target.value })}>
                        <option value="">Select department</option>
                        {departments.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
                      </select>
                    ) : user.department}</td>
                    <td>{editUserId === user.id ? (
                      <input type="date" value={editUserData?.joinDate} onChange={e => setEditUserData({ ...editUserData, joinDate: e.target.value })} />
                    ) : user.joinDate}</td>
                    <td className="actions">
                      {editUserId === user.id ? (
                        <>
                          <button className="btn-save" onClick={handleUpdateUser}><Check size={16} /> Save</button>
                          <button className="btn-cancel" onClick={() => { setEditUserId(null); setEditUserData(null); }}> <X size={16} /> Cancel </button>
                        </>
                      ) : (
                        <>
                          <button className="btn-edit" onClick={() => { setEditUserId(user.id); setEditUserData({ ...user }); }}> <Edit size={16} /> </button>
                          <button className="btn-delete" onClick={() => handleDeleteUser(user.id)}> <Trash2 size={16} /> </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="11" className="no-results">No users found</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Add User Modal */}
        {showAddForm && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <h3>Add New User</h3>

                <button className="modal-close" onClick={() => { setShowAddForm(false); setPreviewImage(null); }}>
                  <X size={20} />
                </button>
              </div>


              <div className="modal-body" style={{marginTop: "37px"}}>
                <div className="form-group profile-picture-upload">
                  <label>Profile Picture</label>
                  <div className="image-upload-container">
                    {previewImage ? (
                      <img src={previewImage} alt="Preview" className="profile-pic" />
                    ) : (
                      <div className="profile-pic default"><User size={24} /></div>
                    )}
                    <div className="image-upload">
                      <label htmlFor="profile-image">
                        <Image size={14} /> Choose Image
                      </label>
                      <input
                        id="profile-image"
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageUpload(e)}
                        style={{ display: 'none' }}
                      />
                    </div>
                  </div>
                </div>

               {error && (
          <div className="error-message">
            {String(error)}
            <button onClick={() => setError(null)} className="error-close"><X size={16} /></button>
          </div>
        )}
                <div className="form-group">
                  <label>Full Name *</label>
                  <input
                    type="text"
                    placeholder="Enter full name"
                    value={newUser.name}
                    onChange={e => setNewUser({ ...newUser, name: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Email *</label>
                  <input
                    type="email"
                    placeholder="Enter email"
                    value={newUser.email}
                    onChange={e => setNewUser({ ...newUser, email: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Password *</label>
                  <input
                    type="password"
                    placeholder="Enter password"
                    value={newUser.password}
                    onChange={e => setNewUser({ ...newUser, password: e.target.value })}
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Role *</label>
                    <select
                      value={newUser.role}
                      onChange={e => setNewUser({ ...newUser, role: e.target.value })}
                    >
                      {roleOptions.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Program *</label>
                    <select
                      value={newUser.program}
                      onChange={e => setNewUser({ ...newUser, program: e.target.value })}
                    >
                      {programOptions.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Semester *</label>
                    <select
                      value={newUser.semester}
                      onChange={e => setNewUser({ ...newUser, semester: e.target.value })}
                    >
                      {semesterOptions.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Department *</label>
                    <select
                      value={newUser.department}
                      onChange={e => setNewUser({ ...newUser, department: e.target.value })}
                    >
                      <option value="">Select department</option>
                      {departments.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label>Join Date *</label>
                  <input
                    type="date"
                    value={newUser.joinDate}
                    onChange={e => setNewUser({ ...newUser, joinDate: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button className="btn-cancel" onClick={() => setShowAddForm(false)}>Cancel</button>
                <button className="btn-save" onClick={handleAddUser}>Save User</button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default UserManagement;
