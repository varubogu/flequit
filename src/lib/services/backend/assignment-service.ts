/**
 * アサインメント（割り当て）管理サービスインターフェース
 */
export interface AssignmentService {
  // Task Assignment operations
  /**
   * タスクにユーザーを割り当て
   */
  createTaskAssignment(projectId: string, taskId: string, userId: string): Promise<boolean>;

  /**
   * タスクとユーザーの割り当てを削除
   */
  deleteTaskAssignment(projectId: string, taskId: string, userId: string): Promise<boolean>;

  // Subtask Assignment operations
  /**
   * サブタスクにユーザーを割り当て
   */
  createSubtaskAssignment(projectId: string, subtaskId: string, userId: string): Promise<boolean>;

  /**
   * サブタスクとユーザーの割り当てを削除
   */
  deleteSubtaskAssignment(projectId: string, subtaskId: string, userId: string): Promise<boolean>;
}