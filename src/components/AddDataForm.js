import React, { useState } from 'react';

const AddDataForm = ({ onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    repo_name: '',
    percent: 0,
    keys_found: '',
    must_keys: '',
    bad_keys: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Process form data
    const newItem = {
      repo_name: formData.repo_name,
      data: {
        percent: parseFloat(formData.percent),
        links: [],
        keys_found: formData.keys_found.split(',').map(k => k.trim()).filter(k => k),
        must_keys: formData.must_keys.split(',').map(k => k.trim()).filter(k => k),
        bad_keys: formData.bad_keys.split(',').map(k => k.trim()).filter(k => k),
      },
      created: new Date().toString(),
      updated: new Date().toString(),
    };
    
    onSubmit(newItem);
  };

  return (
    <div className="add-form">
      <h3>Add New Repository</h3>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="repo_name">Repository Name:</label>
          <input
            type="text"
            id="repo_name"
            name="repo_name"
            value={formData.repo_name}
            onChange={handleInputChange}
            placeholder="user/repository"
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="percent">Percent:</label>
          <input
            type="number"
            id="percent"
            name="percent"
            min="0"
            max="100"
            step="0.01"
            value={formData.percent}
            onChange={handleInputChange}
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="keys_found">Keys Found (comma separated):</label>
          <input
            type="text"
            id="keys_found"
            name="keys_found"
            value={formData.keys_found}
            onChange={handleInputChange}
            placeholder="API_KEY|src/config.js, SECRET_KEY|src/auth.js"
          />
          <small>Format: KEY|PATH (comma separated)</small>
        </div>
        
        <div className="form-group">
          <label htmlFor="must_keys">Must Keys (comma separated):</label>
          <input
            type="text"
            id="must_keys"
            name="must_keys"
            value={formData.must_keys}
            onChange={handleInputChange}
            placeholder="API_KEY, SECRET_KEY"
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="bad_keys">Bad Keys (comma separated):</label>
          <input
            type="text"
            id="bad_keys"
            name="bad_keys"
            value={formData.bad_keys}
            onChange={handleInputChange}
            placeholder="PASSWORD, PRIVATE_KEY"
          />
        </div>
        
        <div className="form-actions">
          <button type="submit" className="submit-btn">Add Repository</button>
          <button type="button" className="cancel-btn" onClick={onCancel}>Cancel</button>
        </div>
      </form>
    </div>
  );
};

export default AddDataForm;