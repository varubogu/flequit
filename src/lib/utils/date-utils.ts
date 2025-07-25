export function formatDate(date: Date | undefined): string {
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

export function formatDateTime(date: Date): string {
  return new Date(date).toLocaleString();
}

export function formatDateForInput(date: Date | undefined): string {
  if (!date) return '';
  const d = new Date(date);
  // Use local date to avoid timezone shift
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatDetailedDate(date: Date | undefined): string {
  if (!date) return 'No due date';
  return new Date(date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

export function getDueDateClass(date: Date | undefined, status?: string): string {
  if (!date) return '';

  const now = new Date();
  const taskDate = new Date(date);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (taskDate < today && status !== 'completed') {
    return 'text-red-600 font-semibold'; // Overdue
  } else if (taskDate.getTime() === today.getTime()) {
    return 'text-orange-300 font-medium'; // Due today
  } else {
    return 'text-muted-foreground'; // Future
  }
}
