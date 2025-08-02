import { test, expect, beforeEach } from 'vitest';
import {
  getStatusIcon,
  getStatusLabel,
  getPriorityColor,
  getPriorityLabel,
  getPriorityColorClass,
  calculateSubTaskProgress
} from '../../src/lib/utils/task-utils';
import { setTranslationService } from '$lib/stores/locale.svelte';
import { createUnitTestTranslationService, unitTestTranslations } from '../unit-translation-mock';

// CLAUDE.mdの指示通り、getTranslationService()のみをモック化
beforeEach(() => {
  setTranslationService(createUnitTestTranslationService());
});

test('getStatusIcon: returns correct icons for each status', () => {
  expect(getStatusIcon('completed')).toBe('✅');
  expect(getStatusIcon('in_progress')).toBe('🔄');
  expect(getStatusIcon('waiting')).toBe('⏸️');
  expect(getStatusIcon('cancelled')).toBe('❌');
  expect(getStatusIcon('not_started')).toBe('⚪');
});

test('getStatusLabel: returns correct labels for each status', () => {
  expect(getStatusLabel('not_started')).toBe(unitTestTranslations.status_not_started);
  expect(getStatusLabel('in_progress')).toBe(unitTestTranslations.status_in_progress);
  expect(getStatusLabel('waiting')).toBe(unitTestTranslations.status_waiting);
  expect(getStatusLabel('completed')).toBe(unitTestTranslations.status_completed);
  expect(getStatusLabel('cancelled')).toBe(unitTestTranslations.status_cancelled);
});

test('getPriorityColor: returns correct border colors for priority levels', () => {
  expect(getPriorityColor(1)).toBe('border-l-red-500');
  expect(getPriorityColor(2)).toBe('border-l-orange-500');
  expect(getPriorityColor(3)).toBe('border-l-yellow-500');
  expect(getPriorityColor(4)).toBe('border-l-gray-300');
  expect(getPriorityColor(5)).toBe('border-l-gray-300');
});

test('getPriorityLabel: returns correct labels for priority levels', () => {
  expect(getPriorityLabel(1)).toBe(unitTestTranslations.high_priority);
  expect(getPriorityLabel(2)).toBe(unitTestTranslations.medium_priority);
  expect(getPriorityLabel(3)).toBe(unitTestTranslations.low_priority);
  expect(getPriorityLabel(4)).toBe(unitTestTranslations.lowest_priority);
  expect(getPriorityLabel(5)).toBe(unitTestTranslations.lowest_priority);
});

test('getPriorityColorClass: returns correct color classes for priority levels', () => {
  expect(getPriorityColorClass(1)).toBe('bg-red-100 text-red-800');
  expect(getPriorityColorClass(2)).toBe('bg-orange-100 text-orange-800');
  expect(getPriorityColorClass(3)).toBe('bg-yellow-100 text-yellow-800');
  expect(getPriorityColorClass(4)).toBe('bg-gray-100 text-gray-800');
  expect(getPriorityColorClass(5)).toBe('bg-gray-100 text-gray-800');
});

test('calculateSubTaskProgress: calculates progress correctly', () => {
  expect(calculateSubTaskProgress(0, 0)).toBe(0);
  expect(calculateSubTaskProgress(0, 5)).toBe(0);
  expect(calculateSubTaskProgress(2, 5)).toBe(40);
  expect(calculateSubTaskProgress(5, 5)).toBe(100);
  expect(calculateSubTaskProgress(3, 4)).toBe(75);
});
