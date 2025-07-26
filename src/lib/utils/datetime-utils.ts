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

export function hasTime(date?: Date): boolean {
  return !!date && (date.getHours() !== 0 || date.getMinutes() !== 0);
}

export function formatTime(date: Date): string {
  return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
}

export function formatDateJapanese(date: Date): string {
  return date.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    weekday: 'short'
  });
}

export function formatSingleDate(date: Date, time?: Date): string {
  const baseFormatted = formatDateJapanese(date);
  if (hasTime(time)) {
    return `${baseFormatted} ${formatTime(time!)}`;
  }
  return baseFormatted;
}

export function formatDateDisplayRange(start: Date, end: Date): string {
  const startFormatted = formatDateJapanese(start);
  const endFormatted = formatDateJapanese(end);

  const startTime = hasTime(start) ? ` ${formatTime(start)}` : '';
  const endTime = hasTime(end) ? ` ${formatTime(end)}` : '';

  if (start.toDateString() === end.toDateString()) {
    if (startTime || endTime) {
      return `${startFormatted}${startTime} 〜${endTime}`;
    }
    return startFormatted;
  } else {
    return `${startFormatted}${startTime} 〜 ${endFormatted}${endTime}`;
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

  if (isRangeDate && startDateTime && endDateTime) {
    const rangeStartDate = new Date(date);
    const startDateOnly = new Date(startDateTime.getFullYear(), startDateTime.getMonth(), startDateTime.getDate());
    const endDateOnly = new Date(endDateTime.getFullYear(), endDateTime.getMonth(), endDateTime.getDate());
    const originalDayDiff = Math.round((endDateOnly.getTime() - startDateOnly.getTime()) / (1000 * 60 * 60 * 24));
    
    rangeStartDate.setHours(startDateTime.getHours(), startDateTime.getMinutes(), 0, 0);

    const rangeEndDate = new Date(rangeStartDate);
    rangeEndDate.setDate(rangeStartDate.getDate() + originalDayDiff);
    rangeEndDate.setHours(endDateTime.getHours(), endDateTime.getMinutes(), 0, 0);
    
    return formatDateDisplayRange(rangeStartDate, rangeEndDate);
  }

  if (endDateTime) {
    return formatSingleDate(date, endDateTime);
  }

  return formatDateJapanese(date);
}

export function formatTime1(date: Date): string {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
}

export function formatDate1(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
