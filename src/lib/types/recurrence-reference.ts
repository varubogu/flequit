/**
 * 繰り返しルール関連付け型定義
 *
 * タスク、サブタスク、プロジェクトなど様々なエンティティと
 * 繰り返しルールの関連付けを管理するための型定義。
 */

// ========================================
// 汎用関連付け型
// ========================================

/**
 * 繰り返しルール関連付け（汎用型）
 *
 * @template TEntityType - エンティティタイプ（'task' | 'subtask' | 'project' など）
 *
 * 任意のエンティティと繰り返しルールを関連付けるための汎用型。
 * 将来的に新しいエンティティ（プロジェクト、マイルストーンなど）に
 * 繰り返し機能を追加する場合も、この型を使用できます。
 */
export interface RecurrenceReference<TEntityType extends string = string> {
	/** エンティティID */
	entityId: string;
	/** エンティティタイプ */
	entityType: TEntityType;
	/** 繰り返しルールID */
	recurrenceRuleId: string;
}

// ========================================
// 具体的なエンティティ型（後方互換性のため個別定義）
// ========================================

/**
 * タスク繰り返し関連付け
 */
export interface TaskRecurrence {
	/** タスクID */
	taskId: string;
	/** 繰り返しルールID */
	recurrenceRuleId: string;
	/** 作成日時 */
	createdAt: Date;
	/** 更新日時 */
	updatedAt: Date;
	/** 削除フラグ（論理削除） */
	deleted: boolean;
	/** 最終更新者のユーザーID */
	updatedBy: string;
}

/**
 * サブタスク繰り返し関連付け
 */
export interface SubtaskRecurrence {
	/** サブタスクID */
	subtaskId: string;
	/** 繰り返しルールID */
	recurrenceRuleId: string;
	/** 作成日時 */
	createdAt: Date;
	/** 更新日時 */
	updatedAt: Date;
	/** 削除フラグ（論理削除） */
	deleted: boolean;
	/** 最終更新者のユーザーID */
	updatedBy: string;
}

/**
 * プロジェクト繰り返し関連付け（将来用）
 *
 * 注：将来的に汎用RecurrenceReference<T>型への移行を検討
 */
export interface ProjectRecurrence {
	/** プロジェクトID */
	projectId: string;
	/** 繰り返しルールID */
	recurrenceRuleId: string;
}

// ========================================
// 検索条件型
// ========================================

/**
 * 繰り返しルール関連付け検索条件（汎用型）
 *
 * @template TEntityType - エンティティタイプ
 */
export interface RecurrenceReferenceSearchCondition<TEntityType extends string = string> {
	/** エンティティIDでの絞り込み */
	entityId?: string;
	/** エンティティタイプでの絞り込み */
	entityType?: TEntityType;
	/** 繰り返しルールIDでの絞り込み */
	recurrenceRuleId?: string;
}

/**
 * タスク繰り返し関連付け検索条件
 */
export interface TaskRecurrenceSearchCondition {
	/** タスクIDでの絞り込み */
	taskId?: string;
	/** 繰り返しルールIDでの絞り込み */
	recurrenceRuleId?: string;
}

/**
 * サブタスク繰り返し関連付け検索条件
 */
export interface SubtaskRecurrenceSearchCondition {
	/** サブタスクIDでの絞り込み */
	subtaskId?: string;
	/** 繰り返しルールIDでの絞り込み */
	recurrenceRuleId?: string;
}

/**
 * プロジェクト繰り返し関連付け検索条件（将来用）
 */
export interface ProjectRecurrenceSearchCondition {
	/** プロジェクトIDでの絞り込み */
	projectId?: string;
	/** 繰り返しルールIDでの絞り込み */
	recurrenceRuleId?: string;
}

// ========================================
// ヘルパー関数（型安全な作成関数）
// ========================================

/**
 * タスク繰り返し関連付けを作成
 *
 * @param taskId - タスクID
 * @param recurrenceRuleId - 繰り返しルールID
 * @param updatedBy - 更新者のユーザーID
 * @returns タスク繰り返し関連付け
 */
export function createTaskRecurrence(
	taskId: string,
	recurrenceRuleId: string,
	updatedBy: string
): TaskRecurrence {
	const now = new Date();
	return {
		taskId,
		recurrenceRuleId,
		createdAt: now,
		updatedAt: now,
		deleted: false,
		updatedBy
	};
}

/**
 * サブタスク繰り返し関連付けを作成
 *
 * @param subtaskId - サブタスクID
 * @param recurrenceRuleId - 繰り返しルールID
 * @param updatedBy - 更新者のユーザーID
 * @returns サブタスク繰り返し関連付け
 */
export function createSubtaskRecurrence(
	subtaskId: string,
	recurrenceRuleId: string,
	updatedBy: string
): SubtaskRecurrence {
	const now = new Date();
	return {
		subtaskId,
		recurrenceRuleId,
		createdAt: now,
		updatedAt: now,
		deleted: false,
		updatedBy
	};
}

/**
 * プロジェクト繰り返し関連付けを作成（将来用）
 *
 * @param projectId - プロジェクトID
 * @param recurrenceRuleId - 繰り返しルールID
 * @returns プロジェクト繰り返し関連付け
 */
export function createProjectRecurrence(
	projectId: string,
	recurrenceRuleId: string
): ProjectRecurrence {
	return {
		projectId,
		recurrenceRuleId
	};
}