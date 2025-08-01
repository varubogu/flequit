import { test, expect, vi, beforeEach } from 'vitest';
import { LayoutService } from '../../src/lib/services/layout-service';

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage
});

// Mock console.warn
const mockConsoleWarn = vi.fn();
console.warn = mockConsoleWarn;

beforeEach(() => {
  vi.clearAllMocks();
});

test('LayoutService.getDefaultPreferences: returns correct default values', () => {
  const defaults = LayoutService.getDefaultPreferences();

  expect(defaults).toEqual({
    taskListPaneSize: 30,
    taskDetailPaneSize: 70
  });
});

test('LayoutService.loadPreferences: returns defaults when no stored data', () => {
  mockLocalStorage.getItem.mockReturnValue(null);

  const preferences = LayoutService.loadPreferences();

  expect(mockLocalStorage.getItem).toHaveBeenCalledWith('flequit-layout-preferences');
  expect(preferences).toEqual({
    taskListPaneSize: 30,
    taskDetailPaneSize: 70
  });
});

test('LayoutService.loadPreferences: loads and merges stored preferences', () => {
  const storedData = JSON.stringify({
    taskListPaneSize: 40
  });
  mockLocalStorage.getItem.mockReturnValue(storedData);

  const preferences = LayoutService.loadPreferences();

  expect(preferences).toEqual({
    taskListPaneSize: 40,
    taskDetailPaneSize: 70 // merged from defaults
  });
});

test('LayoutService.loadPreferences: handles invalid JSON gracefully', () => {
  mockLocalStorage.getItem.mockReturnValue('invalid json');

  const preferences = LayoutService.loadPreferences();

  expect(mockConsoleWarn).toHaveBeenCalledWith(
    'Failed to load layout preferences:',
    expect.any(SyntaxError)
  );
  expect(preferences).toEqual({
    taskListPaneSize: 30,
    taskDetailPaneSize: 70
  });
});

test('LayoutService.loadPreferences: handles localStorage error gracefully', () => {
  mockLocalStorage.getItem.mockImplementation(() => {
    throw new Error('localStorage unavailable');
  });

  const preferences = LayoutService.loadPreferences();

  expect(mockConsoleWarn).toHaveBeenCalledWith(
    'Failed to load layout preferences:',
    expect.any(Error)
  );
  expect(preferences).toEqual({
    taskListPaneSize: 30,
    taskDetailPaneSize: 70
  });
});

test('LayoutService.savePreferences: saves preferences to localStorage', () => {
  const preferences = {
    taskListPaneSize: 35,
    taskDetailPaneSize: 65
  };

  LayoutService.savePreferences(preferences);

  expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
    'flequit-layout-preferences',
    JSON.stringify(preferences)
  );
});

test('LayoutService.savePreferences: handles localStorage error gracefully', () => {
  const preferences = {
    taskListPaneSize: 35,
    taskDetailPaneSize: 65
  };

  mockLocalStorage.setItem.mockImplementation(() => {
    throw new Error('localStorage quota exceeded');
  });

  LayoutService.savePreferences(preferences);

  expect(mockConsoleWarn).toHaveBeenCalledWith(
    'Failed to save layout preferences:',
    expect.any(Error)
  );
});

test('LayoutService.updatePaneSizes: updates and saves pane sizes', () => {
  const taskListSize = 25;
  const taskDetailSize = 75;

  LayoutService.updatePaneSizes(taskListSize, taskDetailSize);

  expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
    'flequit-layout-preferences',
    JSON.stringify({
      taskListPaneSize: 25,
      taskDetailPaneSize: 75
    })
  );
});

test('LayoutService.updatePaneSizes: handles edge case values', () => {
  LayoutService.updatePaneSizes(0, 100);

  expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
    'flequit-layout-preferences',
    JSON.stringify({
      taskListPaneSize: 0,
      taskDetailPaneSize: 100
    })
  );
});
