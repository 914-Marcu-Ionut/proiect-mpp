import React from 'react';

const ButtonPanel = ({ onAddClick, jobsUrl }) => {
  return (
    <div className="button-container">
      <button onClick={() => window.location.href = jobsUrl}>
        Job list
      </button>
      <button onClick={onAddClick} className="add-button">
        Add New Repository
      </button>
    </div>
  );
};

export default ButtonPanel;