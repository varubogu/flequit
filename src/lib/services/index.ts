/**
 * Services層の公開API
 *
 * コンポーネントはこのファイルから必要なServiceをimportしてください。
 * infrastructure層への直接アクセスは禁止です。
 */

// Domain Services（単一エンティティ操作）
// TODO: Phase 2-2以降で追加
// export * from './domain/project';
// export * from './domain/task';
// export * from './domain/subtask';
// export * from './domain/tag';
// export * from './domain/settings';

// Composite Services（横断的操作）
// TODO: Phase 5で追加
// export * from './composite/project-composite';
// export * from './composite/task-composite';

// UI Services（UI状態管理のみ）
export * from './ui/task-detail';
export * from './ui/view';
export * from './ui/layout';
