import type { TaskStatus } from '$lib/types/task';
import { getTranslationService } from '$lib/stores/locale.svelte';

export function getStatusIcon(status: TaskStatus): string {
  switch (status) {
    case 'completed':
      return '✅';
    case 'in_progress':
      return '🔄';
    case 'waiting':
      return '⏸️';
    case 'cancelled':
      return '❌';
    default:
      return '⚪';
  }
}

export function getStatusLabel(status: TaskStatus): string {
  const translationService = getTranslationService();
  switch (status) {
    case 'not_started':
      return translationService.getMessage('status_not_started')();
    case 'in_progress':
      return translationService.getMessage('status_in_progress')();
    case 'waiting':
      return translationService.getMessage('status_waiting')();
    case 'completed':
      return translationService.getMessage('status_completed')();
    case 'cancelled':
      return translationService.getMessage('status_cancelled')();
    default:
      return status;
  }
}

export function getPriorityColor(priority: number): string {
  if (priority <= 1) return 'border-l-red-500';
  if (priority <= 2) return 'border-l-orange-500';
  if (priority <= 3) return 'border-l-yellow-500';
  return 'border-l-gray-300';
}

export function getPriorityLabel(priority: number): string {
  const translationService = getTranslationService();
  if (priority <= 1) return translationService.getMessage('high_priority')();
  if (priority === 2) return translationService.getMessage('medium_priority')();
  if (priority === 3) return translationService.getMessage('low_priority')();
  return translationService.getMessage('lowest_priority')();
}

export function getPriorityColorClass(priority: number): string {
  if (priority <= 1) return 'bg-red-100 text-red-800';
  if (priority === 2) return 'bg-orange-100 text-orange-800';
  if (priority === 3) return 'bg-yellow-100 text-yellow-800';
  return 'bg-gray-100 text-gray-800';
}

export function calculateSubTaskProgress(completedCount: number, totalCount: number): number {
  if (totalCount === 0) return 0;
  return (completedCount / totalCount) * 100;
}
