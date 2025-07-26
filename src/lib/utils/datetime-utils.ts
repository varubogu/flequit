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

export function formatDateTimeRange(
  date: Date,
  options: {
    startDateTime?: Date;
    endDateTime?: Date;
    isRangeDate?: boolean;
  }
): string {
  const { startDateTime, endDateTime, isRangeDate } = options;

  const baseFormatted = date.toLocaleDateString('ja-JP', {
    year: 'numeric', month: 'short', day: 'numeric', weekday: 'short'
  });
  const hasStartTime = startDateTime && (startDateTime.getHours() !== 0 || startDateTime.getMinutes() !== 0);
  const hasEndTime = endDateTime && (endDateTime.getHours() !== 0 || endDateTime.getMinutes() !== 0);
  if (isRangeDate && startDateTime && endDateTime) {
    const startDate = new Date(date);
    const endDate = new Date(date);
    const originalDayDiff = Math.floor((endDateTime.getTime() - startDateTime.getTime()) / (1000 * 60 * 60 * 24));
    endDate.setDate(endDate.getDate() + originalDayDiff);
    startDate.setHours(startDateTime.getHours(), startDateTime.getMinutes(), 0, 0);
    endDate.setHours(endDateTime.getHours(), endDateTime.getMinutes(), 0, 0);
    const isSameDay = startDate.toDateString() === endDate.toDateString();
    if (isSameDay) {
      const startTime = hasStartTime ? ` ${startDate.getHours().toString().padStart(2, '0')}:${startDate.getMinutes().toString().padStart(2, '0')}` : '';
      const endTime = hasEndTime ? `${endDate.getHours().toString().padStart(2, '0')}:${endDate.getMinutes().toString().padStart(2, '0')}` : '';
      if (startTime || endTime) {
        return `${baseFormatted}${startTime} 〜 ${endTime}`;
      }
      return baseFormatted;
    } else {
      const startFormatted = startDate.toLocaleDateString('ja-JP', { year: 'numeric', month: 'short', day: 'numeric', weekday: 'short' });
      const endFormatted = endDate.toLocaleDateString('ja-JP', { year: 'numeric', month: 'short', day: 'numeric', weekday: 'short' });
      const startTime = hasStartTime ? ` ${startDate.getHours().toString().padStart(2, '0')}:${startDate.getMinutes().toString().padStart(2, '0')}` : '';
      const endTime = hasEndTime ? ` ${endDate.getHours().toString().padStart(2, '0')}:${endDate.getMinutes().toString().padStart(2, '0')}` : '';
      return `${startFormatted}${startTime} 〜 ${endFormatted}${endTime}`;
    }
  } else if (endDateTime) {
    const targetDate = new Date(date);
    targetDate.setHours(endDateTime.getHours(), endDateTime.getMinutes(), 0, 0);
    let result = baseFormatted;
    if (hasEndTime) {
      result = `${baseFormatted} ${targetDate.getHours().toString().padStart(2, '0')}:${targetDate.getMinutes().toString().padStart(2, '0')}`;
    }
    return result;
  } else {
    return baseFormatted;
  }
}
