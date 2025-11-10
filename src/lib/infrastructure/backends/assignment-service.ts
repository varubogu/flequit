/**
 * アサインメント（割り当て）管理サービスインターフェース
 */
export interface AssignmentService {
  // Task Assignment operations
  /**
   * タスクにユーザーを割り当て
   * @param projectId プロジェクトID
   * @param taskId タスクID
   * @param userId 割り当てるユーザーID
   * @param createdByUserId 操作を行ったユーザーID
   */
  createTaskAssignment(projectId: string, taskId: string, userId: string, createdByUserId: string): Promise<boolean>;

  /**
   * タスクとユーザーの割り当てを削除
   * @param projectId プロジェクトID
   * @param taskId タスクID
   * @param userId 割り当てられているユーザーID
   * @param deletedByUserId 削除を行ったユーザーID
   */
  deleteTaskAssignment(projectId: string, taskId: string, userId: string, deletedByUserId: string): Promise<boolean>;

  // Subtask Assignment operations
  /**
   * サブタスクにユーザーを割り当て
   * @param projectId プロジェクトID
   * @param subtaskId サブタスクID
   * @param userId 割り当てるユーザーID
   * @param createdByUserId 操作を行ったユーザーID
   */
  createSubtaskAssignment(projectId: string, subtaskId: string, userId: string, createdByUserId: string): Promise<boolean>;

  /**
   * サブタスクとユーザーの割り当てを削除
   * @param projectId プロジェクトID
   * @param subtaskId サブタスクID
   * @param userId 割り当てられているユーザーID
   * @param deletedByUserId 削除を行ったユーザーID
   */
  deleteSubtaskAssignment(projectId: string, subtaskId: string, userId: string, deletedByUserId: string): Promise<boolean>;
}