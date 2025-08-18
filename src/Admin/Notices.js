import React, { useState, useEffect } from 'react';
import { Megaphone, Plus, Edit, Trash2, X, Check } from 'lucide-react';
import SidebarNavigation from './SidebarNavigation';
import './Notices.css';

const NoticeManagement = ({ userName, onLogout }) => {
  const [activeItem] = useState("Notices");
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingNotice, setEditingNotice] = useState(null);
  const [newNotice, setNewNotice] = useState({
    title: '',
    author: 'Academic Office',
    date: new Date().toISOString().split('T')[0],
    content: '',
    audience: 'All',
    importance: 'Important'
  });

  useEffect(() => {
    fetchNotices();
  }, []);

  const fetchNotices = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:8080/educonnect-backend/get_notices.php');
      const result = await response.json();
      if (!result.success) throw new Error(result.message);
      setNotices(result.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddNotice = async () => {
    try {
      const response = await fetch('http://localhost:8080/educonnect-backend/add_notice.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newNotice)
      });
      const result = await response.json();
      if (!result.success) throw new Error(result.message);
      fetchNotices();
      setShowAddForm(false);
      setNewNotice({ 
        title: '', 
        author: 'Academic Office', 
        date: new Date().toISOString().split('T')[0], 
        content: '', 
        audience: 'All', 
        importance: 'Important' 
      });
    } catch (err) {
      setError(err.message);
    }
  };

  const handleUpdateNotice = async () => {
    try {
      const response = await fetch('http://localhost:8080/educonnect-backend/update_notice.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingNotice)
      });
      const result = await response.json();
      if (!result.success) throw new Error(result.message);
      fetchNotices();
      setEditingNotice(null);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteNotice = async (id) => {
    if (!window.confirm('Are you sure you want to delete this notice?')) return;
    
    try {
      const response = await fetch('http://localhost:8080/educonnect-backend/delete_notice.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      const result = await response.json();
      if (!result.success) throw new Error(result.message);
      fetchNotices();
    } catch (err) {
      setError(err.message);
    }
  };

  const startEditing = (notice) => {
    setEditingNotice({ ...notice });
  };

  const cancelEditing = () => {
    setEditingNotice(null);
  };

  return (
    <div className="notice-management-layout">
      <SidebarNavigation activeItem={activeItem} userName={userName} onLogout={onLogout} />
      <div className="notice-main-content">
        <div className="notice-header">
          <h2>Notices & Announcements</h2>
          <button className="create-notice-btn" onClick={() => setShowAddForm(true)}>
            <Plus size={16} /> Create Notice
          </button>
        </div>

        {error && (
          <div className="error-message">
            {error}
            <button onClick={() => setError(null)}><X size={14} /></button>
          </div>
        )}

        {loading ? <p>Loading notices...</p> : (
          <div className="notice-list">
            {notices.map((notice) => (
              <div className="notice-card" key={notice.id}>
                {editingNotice?.id === notice.id ? (
                  <div className="edit-notice-form">
                    <input
                      type="text"
                      value={editingNotice.title}
                      onChange={(e) => setEditingNotice({...editingNotice, title: e.target.value})}
                    />
                    <textarea
                      value={editingNotice.content}
                      onChange={(e) => setEditingNotice({...editingNotice, content: e.target.value})}
                    />
                    <select 
                      value={editingNotice.importance}
                      onChange={(e) => setEditingNotice({...editingNotice, importance: e.target.value})}
                    >
                      <option value="Announcement">Announcement</option>
                      <option value="Important">Important</option>
                      <option value="Info">Info</option>
                      <option value="Meeting">Meeting</option>
                    </select>
                    <select 
                      value={editingNotice.audience}
                      onChange={(e) => setEditingNotice({...editingNotice, audience: e.target.value})}
                    >
                   <option value="All">All</option>
          <option value="Faculty">Faculty</option>
          <option value="Student">Student</option>
                    </select>
                    <div className="edit-actions">
                      <button onClick={handleUpdateNotice} className="save-btn">
                        <Check size={16} /> Save
                      </button>
                      <button onClick={cancelEditing} className="cancel-btn">
                        <X size={16} /> Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="notice-title">
                      <Megaphone size={18} className="notice-icon" /> {notice.title}
                    </div>
                    <div className="notice-meta">
                      <span>{notice.author}</span>
                      <span>{notice.date}</span>
                    </div>
                    <div className="notice-content">{notice.content}</div>
                    <div className="notice-tags">
                      <span className="tag important">{notice.importance}</span>
                      <span className="tag audience">{notice.audience}</span>
                    </div>
                    <div className="notice-actions">
                      <button onClick={() => startEditing(notice)} className="edit-btn">
                        <Edit size={16} />
                      </button>
                      <button onClick={() => handleDeleteNotice(notice.id)} className="delete-btn">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}

        {showAddForm && (
          <div className="modal-overlay">
            <div className="modal-content" style={{height: "446px"}}>
              <div className="modal-header">
                <h3>Create Notice</h3>
                <button onClick={() => setShowAddForm(false)}><X size={20} /></button>
              </div>
              <div className="modal-body" style={{marginTop: "25px", marginBottom: "20px"}}>
                <input
                  type="text"
                  placeholder="Title"
                  value={newNotice.title}
                  onChange={(e) => setNewNotice({ ...newNotice, title: e.target.value })}
                />
                <textarea
                  placeholder="Content"
                  value={newNotice.content}
                  onChange={(e) => setNewNotice({ ...newNotice, content: e.target.value })}
                />
                <select 
                  value={newNotice.importance} 
                  onChange={(e) => setNewNotice({ ...newNotice, importance: e.target.value })}
                >
                  <option value="Announcement">Announcement</option>
                  <option value="Important">Important</option>
                  <option value="Info">Info</option>
                  <option value="Meeting">Meeting</option>
                </select>
                <select 
                  value={newNotice.audience} 
                  onChange={(e) => setNewNotice({ ...newNotice, audience: e.target.value })}
                >
                  

                   <option value="All">All</option>
          <option value="Faculty">Faculty</option>
          <option value="Student">Student</option>
                </select>
              </div>
              <div className="modal-footer">
                <button onClick={() => setShowAddForm(false)}>Cancel</button>
                <button onClick={handleAddNotice}>Post Notice</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NoticeManagement;
