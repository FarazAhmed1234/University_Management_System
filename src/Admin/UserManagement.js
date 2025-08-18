import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit, Trash2, X, Check, ChevronDown, ChevronUp, User, Image } from 'lucide-react';
import SidebarNavigation from './SidebarNavigation';
import './UserManagement.css';

const UserManagement = ({ userName, onLogout }) => {
  // State management
  const [activeItem] = useState("User Management");
  const [searchTerm, setSearchTerm] = useState("");
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newUser, setNewUser] = useState({ 
    name: '', 
    email: '', 
    password: '',
    role: 'student', 
    program: 'BS', 
    semester: 'Spring',
    department: '',
    joinDate: new Date().toISOString().split('T')[0],
    profile_picture: null
  });
  const [editUserId, setEditUserId] = useState(null);
  const [editUserData, setEditUserData] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);

  // Constants
  const roleOptions = [ 'teacher', 'student'];
  const programOptions = ['BS', 'MS', 'PhD'];
  const semesterOptions = ['Spring',  'Fall'];

  // Fetch data on component mount
  useEffect(() => {
    fetchUsers();
    fetchDepartments();
  }, []);

  // API call to fetch users
  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('http://localhost:8080/educonnect-backend/get_users.php');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch users');
      }

      setUsers(result.data);
    } catch (err) {
      console.error('Fetch users error:', err);
      setError(err.message);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  // API call to fetch departments
  const fetchDepartments = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('http://localhost:8080/educonnect-backend/get_departments.php');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch departments');
      }

      setDepartments(result.data);
    } catch (err) {
      console.error('Fetch departments error:', err);
      setError(err.message);
      setDepartments([]);
    } finally {
      setLoading(false);
    }
  };

  // Handle image upload
  const handleImageUpload = (e, isNewUser = true) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.match('image.*')) {
      setError('Please select an image file (JPEG, PNG, GIF)');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setError('Image size must be less than 2MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewImage(reader.result);
      if (isNewUser) {
        setNewUser({...newUser, profile_picture: file});
      } else {
        setEditUserData({...editUserData, profile_picture: file});
      }
    };
    reader.readAsDataURL(file);
  };

  // Add new user
  const handleAddUser = async () => {
    if (!newUser.name || !newUser.email || !newUser.password) {
      setError('Name, email, and password are required');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('name', newUser.name);
      formData.append('email', newUser.email);
      formData.append('password', newUser.password);
      formData.append('role', newUser.role);
      formData.append('program', newUser.program);
      formData.append('semester', newUser.semester);
      formData.append('department', newUser.department);
      formData.append('joinDate', newUser.joinDate);
      
      if (newUser.profile_picture) {
        formData.append('profile_picture', newUser.profile_picture);
      }

      const response = await fetch('http://localhost:8080/educonnect-backend/add_user.php', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.message || 'Failed to add user');
      }

      await fetchUsers();
      setShowAddForm(false);
      setNewUser({ 
        name: '', 
        email: '', 
        password: '',
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
      console.error('Add user error:', err);
      setError(err.message);
    }
  };

  // Update existing user
  const handleUpdateUser = async () => {
    if (!editUserData || !editUserData.name || !editUserData.email) {
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
      
      if (editUserData.profile_picture) {
        if (editUserData.profile_picture instanceof File) {
          formData.append('profile_picture', editUserData.profile_picture);
        } else if (typeof editUserData.profile_picture === 'string') {
          formData.append('existing_profile_picture', editUserData.profile_picture);
        }
      }

      const response = await fetch('http://localhost:8080/educonnect-backend/update_user.php', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.message || 'Failed to update user');
      }

      await fetchUsers();
      setEditUserId(null);
      setEditUserData(null);
      setPreviewImage(null);
      setError(null);
    } catch (err) {
      console.error('Update user error:', err);
      setError(err.message);
    }
  };

  // Delete user
  const handleDeleteUser = async (id) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    
    try {
      const response = await fetch('http://localhost:8080/educonnect-backend/delete_user.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.message || 'Failed to delete user');
      }

      await fetchUsers();
      setError(null);
    } catch (err) {
      console.error('Delete user error:', err);
      setError(err.message);
    }
  };

  // Sorting functionality
  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Filter and sort users
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

  // Helper functions
  const renderSortIcon = (key) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === 'asc' ? 
      <ChevronUp size={14} className="sort-icon" /> : 
      <ChevronDown size={14} className="sort-icon" />;
  };

  const renderProfilePicture = (user) => {
    if (editUserId === user.id && previewImage) {
      return <img src={previewImage} alt="Preview" className="profile-pic" />;
    }
    if (user.profile_picture) {
      return <img src={`http://localhost:8080/educonnect-backend/uploads/${user.profile_picture}`} alt={user.name} className="profile-pic" />;
    }
    return <div className="profile-pic default"><User size={24} /></div>;
  };

  return (
    <div className="user-management-layout">
      <SidebarNavigation activeItem={activeItem} userName={userName} onLogout={onLogout} />

      <div className="user-main-content">
        <div className="user-header">
          <h2>User Management</h2>
        </div>

        {error && (
          <div className="error-message">
            {error}
            <button onClick={() => setError(null)} className="error-close">
              <X size={16} />
            </button>
          </div>
        )}

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

        {loading ? (
          <div className="loading-overlay">
            <div className="loading-spinner"></div>
            <span>Loading users...</span>
          </div>
        ) : (
          <div className="user-table-container">
            <table className="user-table">
              <thead>
                <tr>
                  <th>Photo</th>
                  <th onClick={() => handleSort('id')}>ID {renderSortIcon('id')}</th>
                  <th onClick={() => handleSort('name')}>Name {renderSortIcon('name')}</th>
                  <th onClick={() => handleSort('email')}>Email {renderSortIcon('email')}</th>
                  <th onClick={() => handleSort('role')}>Role {renderSortIcon('role')}</th>
                  <th onClick={() => handleSort('program')}>Program {renderSortIcon('program')}</th>
                  <th onClick={() => handleSort('semester')}>Semester {renderSortIcon('semester')}</th>
                  <th onClick={() => handleSort('department')}>Department {renderSortIcon('department')}</th>
                  <th onClick={() => handleSort('joinDate')}>Join Date {renderSortIcon('joinDate')}</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedUsers.length > 0 ? (
                  sortedUsers.map(user => (
                    <tr key={user.id} className="user-row">
                      <td>
                        {renderProfilePicture(user)}
                        {editUserId === user.id && (
                          <div className="image-upload">
                            <label htmlFor={`edit-image-${user.id}`}>
                              <Image size={14} /> Change
                            </label>
                            <input 
                              id={`edit-image-${user.id}`}
                              type="file" 
                              accept="image/*"
                              onChange={(e) => handleImageUpload(e, false)}
                              style={{display: 'none'}}
                            />
                          </div>
                        )}
                      </td>
                      <td>{user.id}</td>
                      <td>
                        {editUserId === user.id ? (
                          <input 
                            value={editUserData?.name || ''} 
                            onChange={e => setEditUserData({ ...editUserData, name: e.target.value })} 
                          />
                        ) : (
                          <div className="user-name">
                            {user.name}
                            {user.role === 'admin' && <span className="badge admin">Admin</span>}
                          </div>
                        )}
                      </td>
                      <td>
                        {editUserId === user.id ? (
                          <input 
                            type="email"
                            value={editUserData?.email || ''} 
                            onChange={e => setEditUserData({ ...editUserData, email: e.target.value })} 
                          />
                        ) : (
                          <a href={`mailto:${user.email}`}>{user.email}</a>
                        )}
                      </td>
                      <td>
                        {editUserId === user.id ? (
                          <select
                            value={editUserData?.role || 'student'}
                            onChange={e => setEditUserData({ ...editUserData, role: e.target.value })}
                          >
                            {roleOptions.map(option => (
                              <option key={option} value={option}>{option}</option>
                            ))}
                          </select>
                        ) : (
                          <span className={`role ${user.role}`}>{user.role}</span>
                        )}
                      </td>
                      <td>
                        {editUserId === user.id ? (
                          <select
                            value={editUserData?.program || 'BS'}
                            onChange={e => setEditUserData({ ...editUserData, program: e.target.value })}
                          >
                            {programOptions.map(option => (
                              <option key={option} value={option}>{option}</option>
                            ))}
                          </select>
                        ) : (
                          <span className="program">{user.program}</span>
                        )}
                      </td>
                      <td>
                        {editUserId === user.id ? (
                          <select
                            value={editUserData?.semester || 'Spring'}
                            onChange={e => setEditUserData({ ...editUserData, semester: e.target.value })}
                          >
                            {semesterOptions.map(option => (
                              <option key={option} value={option}>{option}</option>
                            ))}
                          </select>
                        ) : (
                          <span className="semester">{user.semester}</span>
                        )}
                      </td>
                      <td>
                        {editUserId === user.id ? (
                          <select
                            value={editUserData?.department || ''}
                            onChange={e => setEditUserData({ ...editUserData, department: e.target.value })}
                          >
                            <option value="">Select department</option>
                            {departments.map(dept => (
                              <option key={dept.id} value={dept.name}>{dept.name}</option>
                            ))}
                          </select>
                        ) : (
                          user.department || 'N/A'
                        )}
                      </td>
                      <td>
                        {editUserId === user.id ? (
                          <input 
                            type="date"
                            value={editUserData?.joinDate || new Date().toISOString().split('T')[0]} 
                            onChange={e => setEditUserData({ ...editUserData, joinDate: e.target.value })} 
                          />
                        ) : (
                          user.joinDate || 'N/A'
                        )}
                      </td>
                      <td className="actions">
                        {editUserId === user.id ? (
                          <>
                            <button className="btn-save" onClick={handleUpdateUser}>
                              <Check size={16} /> Save
                            </button>
                            <button className="btn-cancel" onClick={() => {
                              setEditUserId(null);
                              setEditUserData(null);
                              setPreviewImage(null);
                            }}>
                              <X size={16} /> Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <button 
                              className="btn-edit" 
                              onClick={() => { 
                                setEditUserId(user.id); 
                                setEditUserData({...user});
                                setPreviewImage(null);
                              }}
                            >
                              <Edit size={16} />
                            </button>
                            <button 
                              className="btn-delete" 
                              onClick={() => handleDeleteUser(user.id)}
                            >
                              <Trash2 size={16} />
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="10" className="no-results">
                      No users found {searchTerm && `matching "${searchTerm}"`}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {showAddForm && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <h3>Add New User</h3>
                <button 
                  className="modal-close" 
                  onClick={() => {
                    setShowAddForm(false);
                    setPreviewImage(null);
                  }}
                >
                  <X size={20} />
                </button>
              </div>
              <div className="modal-body" style={{marginTop: "0px"}}>
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
                        style={{display: 'none'}}
                      />
                    </div>
                  </div>
                </div>
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
                    placeholder="Enter email address"
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
                      required
                    >
                      {roleOptions.map(option => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Program *</label>
                    <select
                      value={newUser.program}
                      onChange={e => setNewUser({ ...newUser, program: e.target.value })}
                      required
                    >
                      {programOptions.map(option => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Semester *</label>
                    <select
                      value={newUser.semester}
                      onChange={e => setNewUser({ ...newUser, semester: e.target.value })}
                      required
                    >
                      {semesterOptions.map(option => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Department</label>
                    <select
                      value={newUser.department}
                      onChange={e => setNewUser({ ...newUser, department: e.target.value })}
                    >
                      <option value="">Select Department</option>
                      {departments.map(dept => (
                        <option key={dept.id} value={dept.name}>{dept.name}</option>
                      ))}
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
                <button 
                  className="btn-cancel"
                  onClick={() => {
                    setShowAddForm(false);
                    setPreviewImage(null);
                  }}
                >
                  Cancel
                </button>
                <button 
                  className="btn-primary" 
                  onClick={handleAddUser}
                >
                  Save User
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserManagement;