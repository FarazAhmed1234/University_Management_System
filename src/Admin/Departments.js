import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit, Trash2, Check, X } from 'lucide-react';
import SidebarNavigation from './SidebarNavigation';
import './Departments.css';

const DepartmentManagement = ({ userName, onLogout }) => {
  const [activeItem] = useState('Departments');
  const [searchTerm, setSearchTerm] = useState('');
  const [departments, setDepartments] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newDepartment, setNewDepartment] = useState({
    name: '',
    code: '',
    description: '',
    head: ''
  });
  const [editingId, setEditingId] = useState(null);
  const [editHeadValue, setEditHeadValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchDepartments = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('httpshttp://educonnect.atwebpages.com/educonnect-backend/getDepartments.php');
      if (!response.ok) throw new Error('Failed to fetch departments');
      
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Invalid response format');
      }
      
      const data = await response.json();
      setDepartments(data);
    } catch (err) {
      console.error('Fetch error:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  const handleAddDepartment = async () => {
    if (!newDepartment.name || !newDepartment.code || !newDepartment.head) {
      setError('Please fill in all required fields');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('httpshttp://educonnect.atwebpages.com/educonnect-backend/add_department.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newDepartment)
      });
      
      if (!response.ok) throw new Error('Failed to add department');
      
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      
      await fetchDepartments();
      setShowAddForm(false);
      setNewDepartment({ name: '', code: '', description: '', head: '' });
    } catch (err) {
      console.error('Add department error:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteDepartment = async (id) => {
    if (!window.confirm('Are you sure you want to delete this department?')) return;

    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('httpshttp://educonnect.atwebpages.com/educonnect-backend/delete_department.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      
      if (!response.ok) throw new Error('Failed to delete department');
      
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      
      await fetchDepartments();
    } catch (err) {
      console.error('Delete department error:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const startEditing = (id, currentHead) => {
    setEditingId(id);
    setEditHeadValue(currentHead || '');
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditHeadValue('');
    setError(null);
  };

  const saveEditing = async (id) => {
    if (!editHeadValue.trim()) {
      setError('Department Head cannot be empty');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('httpshttp://educonnect.atwebpages.com/educonnect-backend/update_department_head.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, head: editHeadValue })
      });
      
      if (!response.ok) throw new Error('Failed to update department head');
      
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      
      setDepartments(departments.map(dept =>
        dept.id === id ? { ...dept, head: editHeadValue } : dept
      ));
      setEditingId(null);
    } catch (err) {
      console.error('Update department head error:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredDepartments = departments.filter(dept => {
    const term = searchTerm.toLowerCase();
    return (
      dept.name?.toLowerCase().includes(term) ||
      dept.code?.toLowerCase().includes(term) ||
      dept.head?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="department-management-layout">
      <SidebarNavigation activeItem={activeItem} userName={userName} onLogout={onLogout} />

      <div className="department-main-content">
        <div className="department-header">
          <h2>Department Management</h2>
        </div>

        {error && (
          <div className="error-message">
            {error}
            <button onClick={() => setError(null)} className="error-close">
              <X size={16} />
            </button>
          </div>
        )}

        {isLoading && (
          <div className="loading-overlay">
            <div className="loading-spinner"></div>
            <span>Loading...</span>
          </div>
        )}

        <div className="department-actions">
          <div className="department-search">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              placeholder="Search department..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              disabled={isLoading}
            />
          </div>
          <button 
            className="add-department-button" 
            onClick={() => setShowAddForm(true)}
            disabled={isLoading}
          >
            <Plus size={16} /> Add Department
          </button>
        </div>

        {filteredDepartments.length === 0 ? (
          <div className="no-results">
            {departments.length === 0 ? 'Loading departments...' : 'No departments found'}
          </div>
        ) : (
          <div className="department-grid">
            {filteredDepartments.map((dept) => (
              <div key={dept.id} className="department-card">
                <div className="department-card-header">
                  <h3>{dept.name || 'No Name'}</h3>
                  <div className="department-actions-icons">
                    {editingId === dept.id ? (
                      <>
                        <Check
                          size={18}
                          className="action-icon save-icon"
                          onClick={() => saveEditing(dept.id)}
                          disabled={isLoading}
                        />
                        <X
                          size={18}
                          className="action-icon cancel-icon"
                          onClick={cancelEditing}
                          disabled={isLoading}
                        />
                      </>
                    ) : (
                      <>
                        <Edit
                          size={18}
                          className="action-icon edit-icon"
                          onClick={() => startEditing(dept.id, dept.head)}
                          disabled={isLoading}
                        />
                        <Trash2
                          size={18}
                          className="action-icon delete-icon"
                          onClick={() => handleDeleteDepartment(dept.id)}
                          disabled={isLoading}
                        />
                      </>
                    )}
                  </div>
                </div>
                <div className="department-details">
                  <p><strong>Code:</strong> {dept.code || 'N/A'}</p>
                  <p><strong>Description:</strong> {dept.description || 'N/A'}</p>
                  <p className="department-head">
                    <strong>Department Head:</strong>
                    {editingId === dept.id ? (
                      <input
                        type="text"
                        value={editHeadValue}
                        onChange={(e) => setEditHeadValue(e.target.value)}
                        className="edit-head-input"
                        autoFocus
                        disabled={isLoading}
                      />
                    ) : (
                      <span>{dept.head || 'No Head Assigned'}</span>
                    )}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {showAddForm && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <h3>Add New Department</h3>
                <button
                  onClick={() => !isLoading && setShowAddForm(false)}
                  disabled={isLoading}
                  className="modal-close"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="modal-body" style={{marginTop: "29px", marginBottom:"20px"}}>
                <div className="form-group">
                  <label>Department Name *</label>
                  <input
                    type="text"
                    placeholder="Enter department name"
                    value={newDepartment.name}
                    onChange={e => setNewDepartment({ ...newDepartment, name: e.target.value })}
                    required
                    disabled={isLoading}
                  />
                </div>
                <div className="form-group">
                  <label>Department Code *</label>
                  <input
                    type="text"
                    placeholder="Enter department code"
                    value={newDepartment.code}
                    onChange={e => setNewDepartment({ ...newDepartment, code: e.target.value })}
                    required
                    disabled={isLoading}
                  />
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    placeholder="Enter description"
                    value={newDepartment.description}
                    onChange={e => setNewDepartment({ ...newDepartment, description: e.target.value })}
                    disabled={isLoading}
                    rows="3"
                  style={{width:"430px"}} />
                </div>
                <div className="form-group">
                  <label>Department Head *</label>
                  <input
                    type="text"
                    placeholder="Enter head name"
                    value={newDepartment.head}
                    onChange={e => setNewDepartment({ ...newDepartment, head: e.target.value })}
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button
                  className="btn-cancel"
                  onClick={() => !isLoading && setShowAddForm(false)}
                  disabled={isLoading}
                >
                  Cancel
                </button>
                <button
                  className="btn-primary"
                  onClick={handleAddDepartment}
                  disabled={isLoading}
                >
                  {isLoading ? 'Saving...' : 'Save Department'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DepartmentManagement;