/**
 * タギング（タグ付け）管理サービスインターフェース
 */
export interface TaggingService {
  // Task Tag operations
  /**
   * タスクにタグを関連付け
   */
  createTaskTag(projectId: string, taskId: string, tagId: string): Promise<boolean>;

  /**
   * タスクとタグの関連付けを削除
   */
  deleteTaskTag(projectId: string, taskId: string, tagId: string): Promise<boolean>;

  // Subtask Tag operations
  /**
   * サブタスクにタグを関連付け
   */
  createSubtaskTag(projectId: string, subtaskId: string, tagId: string): Promise<boolean>;

  /**
   * サブタスクとタグの関連付けを削除
   */
  deleteSubtaskTag(projectId: string, subtaskId: string, tagId: string): Promise<boolean>;
}