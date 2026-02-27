/**
 * ストア間のインターフェース定義
 *
 * 各インターフェースは store-interfaces/ ディレクトリのエンティティ別ファイルで定義されています。
 */
export type { ISelectionStore } from './store-interfaces/selection';
export type { IProjectStore, ITaskListStore } from './store-interfaces/project';
export type { ITaskStore, ISubTaskStore, ITagStore, IStoreContainer } from './store-interfaces/task';
