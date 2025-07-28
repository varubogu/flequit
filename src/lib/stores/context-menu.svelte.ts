/**
 * Context Menu選択状態管理ストア
 * キーボード操作とマウス操作での選択インデックスを管理
 */
export class ContextMenuStore {
  private _selectedIndex = $state(-1);
  private _itemCount = $state(0);
  private _isOpen = $state(false);

  get selectedIndex() {
    return this._selectedIndex;
  }

  get itemCount() {
    return this._itemCount;
  }

  get isOpen() {
    return this._isOpen;
  }

  /**
   * メニューを開く
   */
  open(itemCount: number) {
    this._isOpen = true;
    this._itemCount = itemCount;
    this._selectedIndex = -1; // 初期状態では何も選択されていない
  }

  /**
   * メニューを閉じる
   */
  close() {
    this._isOpen = false;
    this._selectedIndex = -1;
    this._itemCount = 0;
  }

  /**
   * 次の項目を選択（下矢印キー）
   */
  selectNext() {
    if (!this._isOpen || this._itemCount === 0) return;
    
    this._selectedIndex = this._selectedIndex < this._itemCount - 1 
      ? this._selectedIndex + 1 
      : 0; // ループして最初に戻る
  }

  /**
   * 前の項目を選択（上矢印キー）
   */
  selectPrevious() {
    if (!this._isOpen || this._itemCount === 0) return;
    
    this._selectedIndex = this._selectedIndex > 0 
      ? this._selectedIndex - 1 
      : this._itemCount - 1; // ループして最後に移動
  }

  /**
   * 特定のインデックスを選択（マウスホバー時）
   */
  selectIndex(index: number) {
    if (!this._isOpen || index < 0 || index >= this._itemCount) return;
    this._selectedIndex = index;
  }

  /**
   * 現在選択されている項目をアクティブ化（Enterキー）
   */
  activateSelected(): number | null {
    if (!this._isOpen || this._selectedIndex < 0) return null;
    return this._selectedIndex;
  }
}

// グローバルなcontext-menuストアインスタンス
export const contextMenuStore = new ContextMenuStore();