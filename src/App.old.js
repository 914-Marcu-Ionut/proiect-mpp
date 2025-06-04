import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';

// Mock fetch calls
global.fetch = jest.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve({})
  })
);

beforeEach(() => {
  fetch.mockClear();
});

describe('App Component', () => {
  test('renders the Git Crawler title', () => {
    render(<App />);
    const titleElement = screen.getByText(/Git Crawler/i);
    expect(titleElement).toBeInTheDocument();
  });

  test('renders table with repository data', async () => {
    render(<App />);
    // Wait for async data loading
    const repoLink = await screen.findByText(/user\/repo1/i);
    expect(repoLink).toBeInTheDocument();
  });

  test('switches between tables', async () => {
    render(<App />);
    // Wait for data to load
    await screen.findByText(/user\/repo1/i);
    
    // Click on ai tab
    const aiTab = screen.getByText('ai');
    fireEvent.click(aiTab);
    
    // Should show ai repo
    const aiRepo = await screen.findByText(/user\/ai-repo/i);
    expect(aiRepo).toBeInTheDocument();
    
    // Default tab should not be visible
    const defaultRepo = screen.queryByText(/user\/repo1/i);
    expect(defaultRepo).not.toBeInTheDocument();
  });
});