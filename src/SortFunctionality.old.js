import React from 'react';
import { render, screen, fireEvent, within, waitFor } from '@testing-library/react';
import App from './App';

// Mock fetch calls and provide mock data
global.fetch = jest.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve({
      // Return mock data that matches the structure expected by the app
      default: [
        {
          repo_name: 'user/repo1',
          data: {
            percent: 85.5,
            keys_found: ['KEY1|path1'],
            must_keys: ['KEY1'],
            bad_keys: []
          },
          created: '2023-04-15T10:30:00',
          updated: '2023-05-20T14:22:00',
          found: '2023-04-15T11:45:00'
        },
        {
          repo_name: 'user/repo2',
          data: {
            percent: 65.2,
            keys_found: ['KEY2|path2'],
            must_keys: ['KEY2'],
            bad_keys: []
          },
          created: '2023-03-10T08:15:00',
          updated: '2023-06-05T09:30:00',
          found: '2023-03-10T11:20:00'
        }
      ]
    })
  })
);

// Use extended timeout for tests
jest.setTimeout(10000);

beforeEach(() => {
  fetch.mockClear();
});

// Helper function to get all repository rows in current sort order
const getRepositoryRows = () => {
  const table = screen.getByRole('table');
  const tbody = table.querySelector('tbody');
  if (!tbody) {
    throw new Error('Could not find tbody element in the table');
  }
  const rows = within(tbody).getAllByRole('row');
  if (rows.length === 0) {
    throw new Error('No rows found in the table body');
  }
  return rows;
};

// Helper function to get text content from a specific cell in a row
const getCellText = (row, cellIndex) => {
  const cells = within(row).getAllByRole('cell');
  return cells[cellIndex].textContent;
};

// Helper function to get percent value from a row
const getPercentFromRow = (row) => {
  const text = getCellText(row, 0); // Percent column is at index 0
  // Extract the number from text which might include '%' symbol
  const match = text.match(/(\d+(\.\d+)?)/);
  if (match && match[1]) {
    return parseFloat(match[1]);
  }
  return 0; // Default value if parsing fails
};

describe('Sort Functionality', () => {
  test('initially sorts by percent in descending order', async () => {
    render(<App />);
    
    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText(/user\/repo1/i)).toBeInTheDocument();
    });
    
    // Get rows
    const rows = getRepositoryRows();
    
    // First row should have higher percent than second row
    const firstRowPercent = getPercentFromRow(rows[0]);
    const secondRowPercent = getPercentFromRow(rows[1]);
    
    expect(firstRowPercent).toBeGreaterThan(secondRowPercent);
  });
  
  test('sorts by percent in ascending/descending order when percent header is clicked', async () => {
    render(<App />);
    
    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText(/user\/repo1/i)).toBeInTheDocument();
    });
    
    // Get initial rows and percents
    const initialRows = getRepositoryRows();
    const initialFirstPercent = getPercentFromRow(initialRows[0]);
    const initialSecondPercent = getPercentFromRow(initialRows[1]);
    
    // We expect initial sort to be descending (higher percent first)
    expect(initialFirstPercent).toBeGreaterThan(initialSecondPercent);
    
    // Find and click the percent column header
    const allHeaders = screen.getAllByRole('columnheader');
    const percentHeader = allHeaders[0]; // First column should be percent
    fireEvent.click(percentHeader);
    
    // Wait for sort to complete
    await waitFor(() => {
      const newRows = getRepositoryRows();
      const newFirstPercent = getPercentFromRow(newRows[0]);
      const newSecondPercent = getPercentFromRow(newRows[1]);
      
      // After clicking, order should be ascending (lower percent first)
      expect(newFirstPercent).toBeLessThan(newSecondPercent);
    });
    
    // Click again to reverse sort
    fireEvent.click(percentHeader);
    
    // Wait for sort to complete
    await waitFor(() => {
      const newRows = getRepositoryRows();
      const newFirstPercent = getPercentFromRow(newRows[0]);
      const newSecondPercent = getPercentFromRow(newRows[1]);
      
      // After second click, order should be descending again
      expect(newFirstPercent).toBeGreaterThan(newSecondPercent);
    });
  });
});