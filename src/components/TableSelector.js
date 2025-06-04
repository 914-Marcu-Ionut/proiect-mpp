import React from 'react';

const TableSelector = ({ tables, currentTable, onTableSelect }) => {
  if (!tables || tables.length === 0) {
    return null;
  }
  
  return (
    <div id="switchTable" className="button-container">
      {tables.map(tableName => (
        <button 
          key={tableName}
          onClick={() => onTableSelect(tableName)}
          className={currentTable === tableName ? 'active' : ''}
        >
          {tableName}
        </button>
      ))}
    </div>
  );
};

export default TableSelector;