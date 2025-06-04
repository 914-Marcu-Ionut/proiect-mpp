import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';

// Mock fetch for async operations
global.fetch = jest.fn();
// Mock window.location
window.location = {
  origin: 'http://localhost',
  pathname: '/git-crawler',
  split: jest.fn(() => ['', 'git-crawler'])
};

// Mock data returned by fetch
const mockData = {
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

const mockStats = {
  total_repos: 150,
  analyzed: 100,
  not_analyzed: 50
};

beforeEach(() => {
  // Reset mocks
  jest.clearAllMocks();
  
  // Setup fetch mock to return our test data
  global.fetch.mockImplementation(() => {
    return Promise.resolve({
      json: () => Promise.resolve(mockData)
    });
  });
});

describe('Add Repository Functionality', () => {
  test('opens add repository form when button is clicked', async () => {
    const { container, debug } = render(<App />);
    
    // Wait for initial render to complete - give it some time
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Debug to see what's in the DOM
    console.log('DOM at start of test:');
    debug();
    
    // Find the button container
    const buttonContainers = container.querySelectorAll('.button-container');
    
    // Log what we found
    console.log(`Found ${buttonContainers.length} button containers`);
    for (let i = 0; i < buttonContainers.length; i++) {
      console.log(`Buttons in container ${i}:`, buttonContainers[i].textContent);
    }
    
    // Loop through all button containers to find our button
    let addButton = null;
    for (let i = 0; i < buttonContainers.length; i++) {
      const buttons = buttonContainers[i].querySelectorAll('button');
      for (let j = 0; j < buttons.length; j++) {
        console.log(`Button ${j} text:`, buttons[j].textContent);
        if (buttons[j].textContent.includes('Add')) {
          addButton = buttons[j];
          break;
        }
      }
      if (addButton) break;
    }
    
    // Check that we found a button
    expect(addButton).not.toBeNull();
    
    // Click the button
    fireEvent.click(addButton);
    
    // Wait a bit for the form to appear
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Debug again to see the form
    console.log('DOM after clicking add button:');
    debug();
    
    // Check that the form appears
    const formTitle = container.querySelector('.add-form h3');
    expect(formTitle).not.toBeNull();
    expect(formTitle.textContent).toBe('Add New Repository');
    
    // Check for form fields
    const repoNameInput = container.querySelector('#repo_name');
    const percentInput = container.querySelector('#percent');
    expect(repoNameInput).not.toBeNull();
    expect(percentInput).not.toBeNull();
  });
  
  test('adds a new repository when form is submitted', async () => {
    const { container } = render(<App />);
    
    // Wait for initial render to complete
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Find the button container and add button
    const buttonContainers = container.querySelectorAll('.button-container');
    let addButton = null;
    
    for (const buttonContainer of buttonContainers) {
      const buttons = buttonContainer.querySelectorAll('button');
      for (const button of buttons) {
        if (button.textContent.includes('Add')) {
          addButton = button;
          break;
        }
      }
      if (addButton) break;
    }
    
    // Click the button
    fireEvent.click(addButton);
    
    // Wait for form to appear
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Fill in the form
    const repoNameInput = container.querySelector('#repo_name');
    const percentInput = container.querySelector('#percent');
    const keysFoundInput = container.querySelector('#keys_found');
    const mustKeysInput = container.querySelector('#must_keys');
    const badKeysInput = container.querySelector('#bad_keys');
    
    userEvent.type(repoNameInput, 'testuser/testrepo');
    userEvent.clear(percentInput);
    userEvent.type(percentInput, '75.5');
    userEvent.type(keysFoundInput, 'TEST_KEY|src/test.js');
    userEvent.type(mustKeysInput, 'TEST_KEY');
    userEvent.type(badKeysInput, 'PASSWORD');
    
    // Get initial table row count
    const initialRows = container.querySelectorAll('table tbody tr');
    const initialRowCount = initialRows.length;
    
    // Submit the form - find the submit button by its class
    const submitButton = container.querySelector('.submit-btn');
    fireEvent.click(submitButton);
    
    // Wait for table to update
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Verify form is closed
    expect(container.querySelector('.add-form')).toBeNull();
    
    // Verify new repo is added to the table by checking row count
    const updatedRows = container.querySelectorAll('table tbody tr');
    expect(updatedRows.length).toBe(initialRowCount + 1);
    
    // Check the content of the new row
    let foundNewRepo = false;
    updatedRows.forEach(row => {
      if (row.textContent.includes('testuser/testrepo')) {
        foundNewRepo = true;
      }
    });
    expect(foundNewRepo).toBe(true);
  });
  
  test('cancels adding repository when cancel button is clicked', async () => {
    const { container } = render(<App />);
    
    // Wait for initial render
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Get initial row count
    const initialRows = container.querySelectorAll('table tbody tr');
    const initialRowCount = initialRows.length;
    
    // Find and click the Add button
    const buttonContainers = container.querySelectorAll('.button-container');
    let addButton = null;
    
    for (const buttonContainer of buttonContainers) {
      const buttons = buttonContainer.querySelectorAll('button');
      for (const button of buttons) {
        if (button.textContent.includes('Add')) {
          addButton = button;
          break;
        }
      }
      if (addButton) break;
    }
    
    fireEvent.click(addButton);
    
    // Wait for form to appear
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Enter some data
    const repoNameInput = container.querySelector('#repo_name');
    userEvent.type(repoNameInput, 'canceltest/repo');
    
    // Find and click the cancel button by its class
    const cancelButton = container.querySelector('.cancel-btn');
    fireEvent.click(cancelButton);
    
    // Wait a bit
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Verify form is closed
    expect(container.querySelector('.add-form')).toBeNull();
    
    // Verify no new repository was added by checking row count
    const finalRows = container.querySelectorAll('table tbody tr');
    expect(finalRows.length).toBe(initialRowCount);
    
    // Verify the canceled repo is not in the table
    let foundCanceledRepo = false;
    finalRows.forEach(row => {
      if (row.textContent.includes('canceltest/repo')) {
        foundCanceledRepo = true;
      }
    });
    expect(foundCanceledRepo).toBe(false);
  });
});