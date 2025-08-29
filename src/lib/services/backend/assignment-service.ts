/**
 * アサインメント（割り当て）管理サービスインターフェース
 */
export interface AssignmentService {
  // Task Assignment operations
  /**
   * タスクにユーザーを割り当て
   */
  createTaskAssignment(taskId: string, userId: string): Promise<boolean>;

  /**
   * タスクとユーザーの割り当てを削除
   */
  deleteTaskAssignment(taskId: string, userId: string): Promise<boolean>;

  // Subtask Assignment operations
  /**
   * サブタスクにユーザーを割り当て
   */
  createSubtaskAssignment(subtaskId: string, userId: string): Promise<boolean>;

  /**
   * サブタスクとユーザーの割り当てを削除
   */
  deleteSubtaskAssignment(subtaskId: string, userId: string): Promise<boolean>;
}