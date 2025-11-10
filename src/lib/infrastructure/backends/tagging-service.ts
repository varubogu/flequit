import type { Tag } from "$lib/types/tag";

/**
 * タギング（タグ付け）管理サービスインターフェース
 */
export interface TaggingService {
  // Task Tag operations
  /**
   * タスクにタグを関連付け
   */
  createTaskTag(projectId: string, taskId: string, tagName: string, userId: string): Promise<Tag>;

  /**
   * タスクとタグの関連付けを削除
   * @param projectId プロジェクトID
   * @param taskId タスクID
   * @param tagId タグID
   * @param userId 削除を行ったユーザーID
   */
  deleteTaskTag(projectId: string, taskId: string, tagId: string, userId: string): Promise<boolean>;

  // Subtask Tag operations
  /**
   * サブタスクにタグを関連付け
   */
  createSubtaskTag(projectId: string, subtaskId: string, tagName: string, userId: string): Promise<Tag>;

  /**
   * サブタスクとタグの関連付けを削除
   * @param projectId プロジェクトID
   * @param subtaskId サブタスクID
   * @param tagId タグID
   * @param userId 削除を行ったユーザーID
   */
  deleteSubtaskTag(projectId: string, subtaskId: string, tagId: string, userId: string): Promise<boolean>;
}
