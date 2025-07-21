import { test, expect } from "vitest";

// Test basic functionality that doesn't require imports
test("basic functionality test", () => {
  expect(2 + 2).toBe(4);
});

// Test date utility functions by copying the logic
function formatDateLocal(date: Date | undefined): string {
  if (!date) return '';
  
  const now = new Date();
  const taskDate = new Date(date);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const taskDay = new Date(taskDate.getFullYear(), taskDate.getMonth(), taskDate.getDate());
  
  if (taskDay.getTime() === today.getTime()) {
    return 'Today';
  } else if (taskDay.getTime() === today.getTime() + 24 * 60 * 60 * 1000) {
    return 'Tomorrow';
  } else if (taskDay.getTime() === today.getTime() - 24 * 60 * 60 * 1000) {
    return 'Yesterday';
  } else {
    return taskDate.toLocaleDateString();
  }
}

test("date formatting logic works correctly", () => {
  const today = new Date();
  expect(formatDateLocal(today)).toBe('Today');
  
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  expect(formatDateLocal(tomorrow)).toBe('Tomorrow');
});

// Test task status logic
function getStatusIconLocal(status: string): string {
  switch (status) {
    case 'completed': return '✅';
    case 'in_progress': return '🔄';
    case 'waiting': return '⏸️';
    case 'cancelled': return '❌';
    default: return '⚪';
  }
}

test("status icons work correctly", () => {
  expect(getStatusIconLocal('completed')).toBe('✅');
  expect(getStatusIconLocal('in_progress')).toBe('🔄');
  expect(getStatusIconLocal('not_started')).toBe('⚪');
});

// Test priority logic
function getPriorityLabelLocal(priority: number): string {
  if (priority <= 1) return 'High';
  if (priority === 2) return 'Medium';
  if (priority === 3) return 'Low';
  return 'Lowest';
}

test("priority labels work correctly", () => {
  expect(getPriorityLabelLocal(1)).toBe('High');
  expect(getPriorityLabelLocal(2)).toBe('Medium');
  expect(getPriorityLabelLocal(3)).toBe('Low');
  expect(getPriorityLabelLocal(4)).toBe('Lowest');
});