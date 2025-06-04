import React, { useState, useEffect, useMemo } from 'react';
import './App.css';
import GitTable from './components/GitTable';
import RepoStats from './components/RepoStats';
import StatsPanel from './components/StatsPanel';
import ButtonPanel from './components/ButtonPanel';
import TableSelector from './components/TableSelector';
import AddDataForm from './components/AddDataForm';
import { PieChart, Pie, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { addRepository, deleteRepository } from './utils/crudUtils';

function App() {
  const [tables, setTables] = useState({});
  const [currentTable, setCurrentTable] = useState('default');
  const [stats, setStats] = useState({
    totalRepos: 0,
    analyzedRepos: 0,
    notAnalyzedRepos: 0
  });
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const [filterPercentage, setFilterPercentage] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

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

  const filteredData = useMemo(() => {
    const tableData = tables[currentTable] || [];
    return tableData.filter(item => 
      item.data.percent >= filterPercentage
    );
  }, [tables, currentTable, filterPercentage]);

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredData, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  const pieChartData = [
    { name: 'Analyzed', value: stats.analyzedRepos },
    { name: 'Not Analyzed', value: stats.notAnalyzedRepos }
  ];

  const barChartData = filteredData.map(item => ({
    name: item.repo_name,
    percent: item.data.percent
  }));

  const lineChartData = filteredData.map(item => ({
    name: item.repo_name,
    percent: item.data.percent
  }));

  const handleTableSwitch = (tableName) => {
    setCurrentTable(tableName);
    setCurrentPage(1);
  };

  const handleAddData = (newItem) => {
    setTables(prevTables => addRepository(prevTables, currentTable, newItem));

    setShowAddForm(false);
  };

  const handleEditData = (editedItem) => {
    setTables(prevTables => {
      const updatedTables = { ...prevTables };
      
      updatedTables[currentTable] = updatedTables[currentTable].map(item => 
        item.created === editingItem.created ? 
        {
          ...editedItem,
          created: editingItem.created,
          updated: new Date().toISOString(),
          found: editingItem.found
        } : item
      );
      
      return updatedTables;
    });

    setEditingItem(null);
  };

  const handleDeleteData = (index) => {
    setTables(prevTables => deleteRepository(prevTables, currentTable, index));
  };
  
  if (!tables[currentTable]) {
    return <div>Loading...</div>;
  }

  return (
    <div className="App" style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      <h2>Git Crawler</h2>
      <div className="filter-container" style={{ 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center', 
        margin: '40px 0',
        padding: '15px',
        backgroundColor: '#f4f4f4',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          width: '100%', 
          justifyContent: 'center' 
        }}>
          <label htmlFor="percentFilter" style={{ 
            marginRight: '15px', 
            fontWeight: 'bold',
            color: '#333'
          }}>
            Filter Repositories by Percentage:
          </label>
          <input 
            id="percentFilter"
            type="range" 
            min="0" 
            max="100" 
            value={filterPercentage}
            onChange={(e) => setFilterPercentage(Number(e.target.value))}
            style={{ 
              width: '300px',
              accentColor: '#007bff'
            }}
          />
          <span style={{ 
            marginLeft: '15px', 
            fontWeight: 'bold',
            color: '#007bff',
            width: '50px',
            textAlign: 'center'
          }}>
            {filterPercentage}%
          </span>
        </div>
      </div>

      {/* Charts Container */}
      <div className="charts-container" style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        marginBottom: '60px',
        height: '300px'
      }}>
        <div style={{ width: '30%', height: '100%' }}>
          <h3>Repos Analysis</h3>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieChartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#4CAF50"
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
        
        <div style={{ width: '30%', height: '100%' }}>
          <h3>Repo Percentages</h3>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="percent" fill="#4CAF50" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={{ width: '30%', height: '100%' }}>
          <h3>Repository Percentages</h3>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={lineChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="percent" stroke="#4CAF50" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      <div style={{ height: '100px' }}></div>
      
      <div>
        <RepoStats 
          data={filteredData}
        />
      </div>

      <div>
        <StatsPanel 
          rowCount={filteredData.length}
          stats={stats}
        />
      </div>

      <div>
        <ButtonPanel 
          onAddClick={() => setShowAddForm(true)}
          jobsUrl={`${window.location.origin}/${window.location.pathname.split('/')[1]}/jobs`}
        />
      </div>

      <TableSelector 
        tables={Object.keys(tables)}
        currentTable={currentTable}
        onTableSelect={handleTableSwitch}
      />

      {editingItem && (
        <div className="edit-form" style={{ 
          margin: '20px 0', 
          padding: '20px', 
          border: '1px solid #ccc', 
          borderRadius: '8px' 
        }}>
          <h3>Edit Repository</h3>
          <form onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const editedItem = {
              repo_name: formData.get('repo_name'),
              data: {
                percent: Number(formData.get('percent')),
                links: formData.get('links').split(',').map(link => link.trim()),
                keys_found: formData.get('keys_found').split(',').map(key => key.trim()),
                must_keys: formData.get('must_keys').split(',').map(key => key.trim()),
                bad_keys: formData.get('bad_keys').split(',').map(key => key.trim())
              }
            };
            handleEditData(editedItem);
          }}>
            <div style={{ marginBottom: '10px' }}>
              <label>Repository Name:</label>
              <input 
                name="repo_name" 
                defaultValue={editingItem.repo_name} 
                required 
                style={{ width: '100%', padding: '5px' }}
              />
            </div>
            <div style={{ marginBottom: '10px' }}>
              <label>Percentage:</label>
              <input 
                name="percent" 
                type="number" 
                step="0.01"
                min="0" 
                max="100" 
                defaultValue={editingItem.data.percent} 
                required 
                style={{ width: '100%', padding: '5px' }}
              />
            </div>
            <div style={{ marginBottom: '10px' }}>
              <label>Links (comma-separated):</label>
              <input 
                name="links" 
                defaultValue={editingItem.data.links.join(', ')} 
                style={{ width: '100%', padding: '5px' }}
              />
            </div>
            <div style={{ marginBottom: '10px' }}>
              <label>Keys Found (comma-separated):</label>
              <input 
                name="keys_found" 
                defaultValue={editingItem.data.keys_found.join(', ')} 
                style={{ width: '100%', padding: '5px' }}
              />
            </div>
            <div style={{ marginBottom: '10px' }}>
              <label>Must Keys (comma-separated):</label>
              <input 
                name="must_keys" 
                defaultValue={editingItem.data.must_keys.join(', ')} 
                style={{ width: '100%', padding: '5px' }}
              />
            </div>
            <div style={{ marginBottom: '10px' }}>
              <label>Bad Keys (comma-separated):</label>
              <input 
                name="bad_keys" 
                defaultValue={editingItem.data.bad_keys.join(', ')} 
                style={{ width: '100%', padding: '5px' }}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <button type="submit" style={{ padding: '10px 20px', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '4px' }}>
                Save Changes
              </button>
              <button 
                type="button" 
                onClick={() => setEditingItem(null)}
                style={{ padding: '10px 20px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '4px' }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {showAddForm && (
        <div className="form-container">
          <AddDataForm 
            onSubmit={handleAddData}
            onCancel={() => setShowAddForm(false)}
          />
        </div>
      )}

      <GitTable 
        data={paginatedData}
        onDelete={handleDeleteData}
        onEdit={(item) => setEditingItem(item)}
      />

      <div className="pagination" style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        margin: '40px 0' 
      }}>
        <button 
          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
          disabled={currentPage === 1}
          style={{
            padding: '8px 16px',
            margin: '0 10px',
            backgroundColor: currentPage === 1 ? '#cccccc' : '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
          }}
        >
          Previous
        </button>
        <span style={{ margin: '0 10px', alignSelf: 'center' }}>
          Page {currentPage} of {totalPages}
        </span>
        <button 
          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
          disabled={currentPage === totalPages}
          style={{
            padding: '8px 16px',
            margin: '0 10px',
            backgroundColor: currentPage === totalPages ? '#cccccc' : '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: currentPage === totalPages ? 'not-allowed' : 'pointer'
          }}
        >
          Next
        </button>
      </div>
    </div>
  );
}

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
          keys_found: ['AI GPT|config/prod.js'],
          must_keys: ['AI GPT'],
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