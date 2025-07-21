import { test, expect } from "vitest";

// ビジネスロジックのテスト（コンポーネントに依存しない）

// タスクステータス遷移ロジック
function getNextTaskStatus(currentStatus: string): string {
  switch (currentStatus) {
    case 'not_started':
      return 'completed';
    case 'completed':
      return 'not_started';
    case 'in_progress':
      return 'completed';
    case 'waiting':
      return 'in_progress';
    case 'cancelled':
      return 'not_started';
    default:
      return 'not_started';
  }
}

test("task status transition logic", () => {
  expect(getNextTaskStatus('not_started')).toBe('completed');
  expect(getNextTaskStatus('completed')).toBe('not_started');
  expect(getNextTaskStatus('in_progress')).toBe('completed');
  expect(getNextTaskStatus('waiting')).toBe('in_progress');
  expect(getNextTaskStatus('cancelled')).toBe('not_started');
});

// サブタスク完了率計算
function calculateCompletionRate(subTasks: Array<{status: string}>): number {
  if (subTasks.length === 0) return 0;
  const completed = subTasks.filter(st => st.status === 'completed').length;
  return Math.round((completed / subTasks.length) * 100);
}

test("subtask completion rate calculation", () => {
  expect(calculateCompletionRate([])).toBe(0);
  
  const subTasks = [
    { status: 'completed' },
    { status: 'completed' },
    { status: 'not_started' },
    { status: 'not_started' }
  ];
  expect(calculateCompletionRate(subTasks)).toBe(50);
  
  const allCompleted = [
    { status: 'completed' },
    { status: 'completed' }
  ];
  expect(calculateCompletionRate(allCompleted)).toBe(100);
});

// タスクフィルタリングロジック
function filterTasksByStatus(tasks: Array<{status: string}>, status: string): Array<{status: string}> {
  return tasks.filter(task => task.status === status);
}

test("task filtering by status", () => {
  const tasks = [
    { status: 'completed' },
    { status: 'not_started' },
    { status: 'completed' },
    { status: 'in_progress' }
  ];
  
  expect(filterTasksByStatus(tasks, 'completed')).toHaveLength(2);
  expect(filterTasksByStatus(tasks, 'not_started')).toHaveLength(1);
  expect(filterTasksByStatus(tasks, 'in_progress')).toHaveLength(1);
  expect(filterTasksByStatus(tasks, 'cancelled')).toHaveLength(0);
});

// 期限切れ判定ロジック
function isOverdue(dueDate: Date | undefined, currentDate: Date = new Date()): boolean {
  if (!dueDate) return false;
  const today = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
  const taskDay = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());
  return taskDay < today;
}

test("overdue task detection", () => {
  const today = new Date('2024-01-15');
  const yesterday = new Date('2024-01-14');
  const tomorrow = new Date('2024-01-16');
  
  expect(isOverdue(yesterday, today)).toBe(true);
  expect(isOverdue(today, today)).toBe(false);
  expect(isOverdue(tomorrow, today)).toBe(false);
  expect(isOverdue(undefined, today)).toBe(false);
});