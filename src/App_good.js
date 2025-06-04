import React, { useState, useEffect } from 'react';
import './App.css';
import GitTable from './components/GitTable';
import StatsPanel from './components/StatsPanel';
import ButtonPanel from './components/ButtonPanel';
import TableSelector from './components/TableSelector';
import AddDataForm from './components/AddDataForm';

function App() {
  const [tables, setTables] = useState({});
  const [currentTable, setCurrentTable] = useState('default');
  const [stats, setStats] = useState({
    totalRepos: 0,
    analyzedRepos: 0,
    notAnalyzedRepos: 0
  });
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
    
      const data = await mockFetchData();
      const stats = await mockFetchStats();
      
      setTables(data);
      setStats({
        totalRepos: stats.total_repos,
        analyzedRepos: stats.analyzed,
        notAnalyzedRepos: stats.not_analyzed
      });
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const handleTableSwitch = (tableName) => {
    setCurrentTable(tableName);
  };

  const handleAddData = (newItem) => {
    setTables(prevTables => {
      const updatedTables = { ...prevTables };
      
      if (!updatedTables[currentTable]) {
        updatedTables[currentTable] = [];
      }
      
      // Add new item to current table
      updatedTables[currentTable] = [
        ...updatedTables[currentTable], 
        {
          ...newItem,
          created: new Date().toISOString(),
          updated: new Date().toISOString(),
          found: new Date().toISOString()
        }
      ];
      
      return updatedTables;
    });

    setShowAddForm(false);
  };

  const handleDeleteData = (index) => {
    setTables(prevTables => {
      const updatedTables = { ...prevTables };
      
      // Remove item at specified index
      updatedTables[currentTable] = updatedTables[currentTable].filter((_, i) => i !== index);
      
      return updatedTables;
    });
  };

  return (
    <div className="App">
      <h2>Git Crawler</h2>

      <StatsPanel 
        rowCount={tables[currentTable]?.length || 0}
        stats={stats}
      />

      <ButtonPanel 
        onAddClick={() => setShowAddForm(true)}
        jobsUrl={`${window.location.origin}/${window.location.pathname.split('/')[1]}/jobs`}
      />

      <TableSelector 
        tables={Object.keys(tables)}
        currentTable={currentTable}
        onTableSelect={handleTableSwitch}
      />

      {showAddForm && (
        <div className="form-container">
          <AddDataForm 
            onSubmit={handleAddData}
            onCancel={() => setShowAddForm(false)}
          />
        </div>
      )}

      <GitTable 
        data={tables[currentTable] || []}
        onDelete={handleDeleteData}
      />
    </div>
  );
}

// Mock data functions (would be replaced by real API calls)
const mockFetchData = async () => {
  return {
    'default': [
      {
        repo_name: 'user/repo1',
        data: {
          percent: 85.5,
          links: ['https://example.com'],
          keys_found: ['API_KEY|src/config.js', 'SECRET_KEY|src/auth.js'],
          must_keys: ['API_KEY'],
          bad_keys: ['PASSWORD'],
        },
        created: '2023-04-15T10:30:00',
        updated: '2023-05-20T14:22:00',
        found: '2023-04-15T11:45:00'
      },
      {
        repo_name: 'user/repo2',
        data: {
          percent: 65.2,
          links: ['https://example.org'],
          keys_found: ['DB_PASS|db/config.js'],
          must_keys: ['API_KEY', 'DB_PASS'],
          bad_keys: [],
        },
        created: '2023-03-10T08:15:00',
        updated: '2023-06-05T09:30:00',
        found: '2023-03-10T11:20:00'
      }
    ],
    'ai': [
      {
        repo_name: 'user/ai-repo',
        data: {
          percent: 92.7,
          links: ['https://ai.project.com'],
          keys_found: ['PROD_API_KEY|config/prod.js'],
          must_keys: ['PROD_API_KEY'],
          bad_keys: [],
        },
        created: '2023-02-05T12:45:00',
        updated: '2023-05-18T16:30:00',
        found: '2023-02-06T09:10:00'
      }
    ]
  };
};

const mockFetchStats = async () => {
  return {
    total_repos: 150,
    analyzed: 100,
    not_analyzed: 50
  };
};

export default App;