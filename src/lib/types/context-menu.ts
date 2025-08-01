export interface ContextMenuItem {
  id: string;
  label: string | (() => string);
  action: () => void;
  icon?: any; // Lucide icons type
  disabled?: boolean | (() => boolean);
  destructive?: boolean;
  keyboardShortcut?: string;
  visible?: boolean | (() => boolean);
}

export interface SeparatorMenuItem {
  type: 'separator';
}

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
