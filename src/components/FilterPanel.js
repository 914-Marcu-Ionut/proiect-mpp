import React from 'react';

const FilterPanel = ({ filterPercentage, onFilterChange }) => {
  return (
    <div className="filter-panel" style={{ 
      display: 'flex', 
      alignItems: 'center', 
      margin: '10px 0',
      padding: '10px',
      background: '#f0f0f0',
      borderRadius: '5px'
    }}>
      <input 
        id="percentFilter"
        type="range" 
        min="0" 
        max="100" 
        value={filterPercentage}
        onChange={(e) => onFilterChange(e)}
        style={{ flexGrow: 1, marginRight: '10px' ,width: '300px',accentColor: '#4CAF50'}}
      />
      <span style={{color:"#4CAF50"}}>{filterPercentage}%</span>
    </div>
  );
};

export default FilterPanel;