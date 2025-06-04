import React from 'react';

const StatsPanel = ({ rowCount, stats }) => {
  return (
    <div className="stats">
      <p>Total number of repositories: {rowCount}</p>
      <p>Total repos in database: {stats.totalRepos}</p>
      <p>Repos analyzed: {stats.analyzedRepos}</p>
      <p>Repos not analyzed: {stats.notAnalyzedRepos}</p>
    </div>
  );
};

export default StatsPanel;