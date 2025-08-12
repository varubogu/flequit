import type { TaskStatus } from '$lib/types/task';
import { getTranslationService } from '$lib/stores/locale.svelte';

/**
 * タスクステータスに対応するアイコンを取得する
 * @param status タスクステータス
 * @returns ステータスに対応する絵文字アイコン
 */
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

/**
 * タスクステータスのローカライズされたラベルを取得する
 * @param status タスクステータス
 * @returns ローカライズされたステータスラベル
 */
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

/**
 * 優先度に基づいてTailwind CSS境界線クラスを取得する
 * @param priority 優先度（1が最高、数字が大きいほど低い）
 * @returns 優先度に対応するborder-leftクラス
 */
export function getPriorityColor(priority: number): string {
  if (priority <= 1) return 'border-l-red-500';
  if (priority <= 2) return 'border-l-orange-500';
  if (priority <= 3) return 'border-l-yellow-500';
  return 'border-l-gray-300';
}

/**
 * 優先度のローカライズされたラベルを取得する
 * @param priority 優先度（1が最高、数字が大きいほど低い）
 * @returns ローカライズされた優先度ラベル
 */
export function getPriorityLabel(priority: number): string {
  const translationService = getTranslationService();
  if (priority <= 1) return translationService.getMessage('high_priority')();
  if (priority === 2) return translationService.getMessage('medium_priority')();
  if (priority === 3) return translationService.getMessage('low_priority')();
  return translationService.getMessage('lowest_priority')();
}

/**
 * 優先度に基づいてTailwind CSS背景・文字色クラスを取得する
 * @param priority 優先度（1が最高、数字が大きいほど低い）
 * @returns 優先度に対応する背景・文字色クラス
 */
export function getPriorityColorClass(priority: number): string {
  if (priority <= 1) return 'bg-red-100 text-red-800';
  if (priority === 2) return 'bg-orange-100 text-orange-800';
  if (priority === 3) return 'bg-yellow-100 text-yellow-800';
  return 'bg-gray-100 text-gray-800';
}

/**
 * サブタスクの完了進捗率を計算する
 * @param completedCount 完了済みサブタスク数
 * @param totalCount 全サブタスク数
 * @returns 進捗率（0-100のパーセント値）
 */
export function calculateSubTaskProgress(completedCount: number, totalCount: number): number {
  if (totalCount === 0) return 0;
  return (completedCount / totalCount) * 100;
}
