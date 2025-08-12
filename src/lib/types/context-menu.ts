/**
 * コンテキストメニューのアイテム
 */
export interface ContextMenuItem {
  /** 一意識別子 */
  id: string;
  /** 表示するラベル（固定文字列または関数） */
  label: string | (() => string);
  /** クリック時に実行されるアクション */
  action: () => void;
  /** 表示するアイコン（Lucide icons） */
  icon?: import('svelte').ComponentType; // Lucide icons type
  /** 無効化状態（固定値または関数） */
  disabled?: boolean | (() => boolean);
  /** 危険なアクション（削除など）の場合はtrue */
  destructive?: boolean;
  /** キーボードショートカット表示用 */
  keyboardShortcut?: string;
  /** 表示・非表示の制御（固定値または関数） */
  visible?: boolean | (() => boolean);
}

/**
 * メニューセパレーター
 */
export interface SeparatorMenuItem {
  /** セパレーター種別 */
  type: 'separator';
}

/**
 * コンテキストメニューのリスト
 */
export type ContextMenuList = (ContextMenuItem | SeparatorMenuItem)[];

/**
 * メニュー生成ヘルパー関数
 */
export function createContextMenu(items: ContextMenuList): ContextMenuList {
  return items.filter((item) => {
    if ('type' in item && item.type === 'separator') return true;

    const menuItem = item as ContextMenuItem;
    const visible = typeof menuItem.visible === 'function' ? menuItem.visible() : menuItem.visible;
    return visible !== false;
  });
}

/**
 * セパレーターアイテム生成ヘルパー
 */
export function createSeparator(): SeparatorMenuItem {
  return { type: 'separator' };
}
