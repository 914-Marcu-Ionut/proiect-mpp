import React, { useState } from 'react';
import { sortRepositoriesByPercent } from '../utils/crudUtils';

const GitTable = ({ data, onDelete, onEdit }) => {
  const [sortConfig, setSortConfig] = useState({
    key: 'percent',
    direction: 'descending'
  });

  const handleSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };
  

  const getSortedData = () => {
    if (!data || data.length === 0) return [];    
    return sortRepositoriesByPercent(data, sortConfig.direction);
  };
 
  const sortedData = getSortedData();

  return (
    <div className="table-container">
      <table id="dataTable">
        <thead>
          <tr>
            <th className="column-percent" onClick={() => handleSort('percent')}>
              Percent {sortConfig.key === 'percent' && (sortConfig.direction === 'ascending' ? '↑' : '↓')}
            </th>
            <th className="column-git-link">Git Link</th>
            <th className="column-links">Links</th>
            <th className="column-keys-found">Keys Found</th>
            <th className="column-must-keys">Must Keys</th>
            <th className="column-bad-keys">Bad Keys</th>
            <th className="column-created" >
              Created 
            </th>
            <th className="column-last-updated">
              Last updated 
            </th>
            <th className="column-found" >
              Found 
            </th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {sortedData.map((item, index) => (
            <tr key={`${item.repo_name}-${index}`}>
              <td>{item.data.percent.toFixed(2)}%</td>
              <td>
                <a 
                  href={`https://github.com/${item.repo_name}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  {item.repo_name}
                </a>
              </td>
              <td>?</td>
              <td>
                {item.data.keys_found.map((keyInfo, idx) => (
                  <span 
                    key={idx} 
                    className="key-item"
                  >
                    {keyInfo.split('|')[0]} {' '}
                  </span>
                ))}
              </td>
              <td>{item.data.must_keys.join(', ')}</td>
              <td>{item.data.bad_keys.join(', ')}</td>
              <td>{item.created.split('T')[0]}</td>
              <td>{item.updated.split('T')[0]}</td>
              <td>{item.found ? item.found.split('T')[0] : '?'}</td>
              <td>
                <button 
                  className="edit-btn"
                  onClick={() => onEdit(item)}
                  style={{
                    marginRight: '5px',
                    backgroundColor: '#ffc107',
                    color: 'white',
                    border: 'none',
                    padding: '5px 10px',
                    borderRadius: '3px'
                  }}
                >
                  Edit
                </button>
                <button 
                  className="delete-btn"
                  onClick={() => onDelete(index)}
                  style={{
                    backgroundColor: '#dc3545',
                    color: 'white',
                    border: 'none',
                    padding: '5px 10px',
                    borderRadius: '3px'
                  }}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default GitTable;