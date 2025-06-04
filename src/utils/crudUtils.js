export const addRepository = (tables, currentTable, newItem) => {
    const updatedTables = { ...tables };
    
    if (!updatedTables[currentTable]) {
      updatedTables[currentTable] = [];
    }
    
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
  };
  
  export const deleteRepository = (tables, currentTable, index) => {
    const updatedTables = { ...tables };
    
    if (updatedTables[currentTable] && Array.isArray(updatedTables[currentTable])) {
      updatedTables[currentTable] = updatedTables[currentTable].filter((_, i) => i !== index);
    }
    
    return updatedTables;
  };
  
  export const sortRepositoriesByPercent = (data, direction = 'descending') => {
    if (!data || data.length === 0) return [];
    
    const sortableData = [...data];
    
    sortableData.sort((a, b) => {
      if (direction === 'ascending') {
        return a.data.percent - b.data.percent;
      } else {
        return b.data.percent - a.data.percent;
      }
    });
    
    return sortableData;
  };
  
  export const sortRepositoriesByDate = (data, dateField, direction = 'descending') => {
    if (!data || data.length === 0) return [];
    if (!['created', 'updated', 'found'].includes(dateField)) return data;
    
    const sortableData = [...data];
    
    sortableData.sort((a, b) => {
      const dateA = new Date(a[dateField]);
      const dateB = new Date(b[dateField]);
      
      if (direction === 'ascending') {
        return dateA - dateB;
      } else {
        return dateB - dateA;
      }
    });
    
    return sortableData;
  };

  export const filterData = (tableData,filterPercentage) => {
    return tableData.filter(item => 
      item.data.percent >= filterPercentage
    );
  }