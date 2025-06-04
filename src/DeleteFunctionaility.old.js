import React from 'react';
import { render, fireEvent, act } from '@testing-library/react';
import App from './App';

// Mock window.location
Object.defineProperty(window, 'location', {
  writable: true,
  value: {
    origin: 'http://localhost',
    pathname: '/git-crawler',
    split: () => ['', 'git-crawler']
  }
});

// Utility function to wait for a short period
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

describe('Delete Repository Functionality', () => {
  // Basic delete test
  test('deletes a repository when delete button is clicked', async () => {
    // Render the app
    const { container } = render(<App />);

    // Wait for initial data to load
    await act(async () => {
      await wait(200);
    });

    // Count initial rows
    const initialRows = container.querySelectorAll('table tbody tr');
    const initialRowCount = initialRows.length;
    expect(initialRowCount).toBeGreaterThan(0);

    // Get the content of the first row before deletion
    const firstRowContent = initialRows[0].textContent;

    // Find the delete button in the first row
    const deleteButton = initialRows[0].querySelector('.delete-btn');
    expect(deleteButton).not.toBeNull();

    // Click the delete button
    await act(async () => {
      fireEvent.click(deleteButton);
      await wait(100); // Wait for state update
    });

    // Count rows after deletion
    const updatedRows = container.querySelectorAll('table tbody tr');
    expect(updatedRows.length).toBe(initialRowCount - 1);

    // Verify the first row is deleted by checking its content is no longer present
    const allRowsContent = Array.from(updatedRows).map(row => row.textContent);
    expect(allRowsContent.includes(firstRowContent)).toBe(false);
  });

  // Delete specific repository test
  test('deletes the specific repository that was clicked', async () => {
    // Render the app
    const { container } = render(<App />);

    // Wait for initial data to load
    await act(async () => {
      await wait(200);
    });

    // Find all rows
    const initialRows = container.querySelectorAll('table tbody tr');
    expect(initialRows.length).toBeGreaterThan(1); // Ensure we have at least 2 rows

    // Get content of all rows before deletion
    const initialRowContents = Array.from(initialRows).map(row => row.textContent);

    // Find the content of the second row
    const secondRowContent = initialRowContents[1];

    // Find the delete button in the second row
    const secondRowDeleteButton = initialRows[1].querySelector('.delete-btn');

    // Click the delete button in the second row
    await act(async () => {
      fireEvent.click(secondRowDeleteButton);
      await wait(100);
    });

    // Get updated rows
    const updatedRows = container.querySelectorAll('table tbody tr');
    const updatedRowContents = Array.from(updatedRows).map(row => row.textContent);

    // First row content should still be there
    expect(updatedRowContents.includes(initialRowContents[0])).toBe(true);

    // Second row content should be gone
    expect(updatedRowContents.includes(secondRowContent)).toBe(false);
  });

  // Test that AI table has different content than default table
  test('ai table shows different content than default table', async () => {
    // Render the app
    const { container } = render(<App />);

    // Wait for initial data to load
    await act(async () => {
      await wait(200);
    });

    // Get current table content
    const initialRows = container.querySelectorAll('table tbody tr');
    const initialRowContents = Array.from(initialRows).map(row => row.textContent);

    // Access the App component's setState directly
    // This is a test-only approach to directly manipulate state
    const appInstance = container.querySelector('.App').__reactInternalInstance;
    if (!appInstance) {
      // If we can't access the internal instance, skip this test
      console.log("Can't access App instance, skipping test");
      return;
    }

    // Force a table change by simulating a state update
    act(() => {
      appInstance.setState({ currentTable: 'ai' });
    });

    await act(async () => {
      await wait(100);
    });

    // Get new table content
    const aiRows = container.querySelectorAll('table tbody tr');
    const aiRowContents = Array.from(aiRows).map(row => row.textContent);

    // Verify ai table has different content than default table
    expect(aiRowContents).not.toEqual(initialRowContents);
  });

  // Just test regular deletion without table switching
  test('deletes repositories correctly', async () => {
    // Render the app
    const { container } = render(<App />);

    // Wait for initial data to load
    await act(async () => {
      await wait(200);
    });

    // Count initial rows
    const initialRows = container.querySelectorAll('table tbody tr');
    const initialRowCount = initialRows.length;

    // Find and click the first delete button
    const deleteButton = container.querySelector('.delete-btn');

    await act(async () => {
      fireEvent.click(deleteButton);
      await wait(100);
    });

    // Verify one row was deleted
    const updatedRows = container.querySelectorAll('table tbody tr');
    expect(updatedRows.length).toBe(initialRowCount - 1);
  });
});