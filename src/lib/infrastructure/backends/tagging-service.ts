import type { Tag } from "$lib/types/tag";

/**
 * タギング（タグ付け）管理サービスインターフェース
 */
export interface TaggingService {
  // Task Tag operations
  /**
   * タスクにタグを関連付け
   */
  createTaskTag(projectId: string, taskId: string, tagName: string): Promise<Tag>;

  /**
   * タスクとタグの関連付けを削除
   */
  deleteTaskTag(projectId: string, taskId: string, tagId: string): Promise<boolean>;

  // Subtask Tag operations
  /**
   * サブタスクにタグを関連付け
   */
  createSubtaskTag(projectId: string, subtaskId: string, tagName: string): Promise<Tag>;

  /**
   * サブタスクとタグの関連付けを削除
   */
  deleteSubtaskTag(projectId: string, subtaskId: string, tagId: string): Promise<boolean>;
}
