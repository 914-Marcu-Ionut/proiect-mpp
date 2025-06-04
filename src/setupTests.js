// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Mock window.location methods
const mockLocation = {
  pathname: '/git-crawler',
  origin: 'http://localhost',
  href: 'http://localhost/git-crawler',
  split: jest.fn(() => ['', 'git-crawler'])
};

Object.defineProperty(window, 'location', {
  value: mockLocation,
  writable: true
});

// Mock for window.fs
global.window.fs = {
  readFile: jest.fn().mockResolvedValue(new Uint8Array())
};

// Silence console errors during tests
console.error = jest.fn();