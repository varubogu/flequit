/**
 * ドラッグされている要素の情報を表すインターフェース
 */
export interface DragData {
  type: 'project' | 'tasklist' | 'tag' | 'task' | 'subtask';
  id: string;
  projectId?: string; // タスクリストの場合は所属プロジェクトID
  taskId?: string; // サブタスクの場合は所属タスクID
}

/**
 * ドロップ対象となる要素の情報を表すインターフェース
 */
export interface DropTarget {
  type: 'project' | 'tasklist' | 'project-container' | 'tag' | 'view' | 'task' | 'subtask';
  id: string;
  projectId?: string;
  position?: number;
}

/**
 * ドラッグ&ドロップ操作を管理するクラス
 */
export class DragDropManager {
  private static dragData: DragData | null = null;
  private static dropZoneElement: HTMLElement | null = null;

  /**
   * ドラッグ操作を開始する
   * @param event ドラッグイベント
   * @param data ドラッグされる要素の情報
   */
  static startDrag(event: DragEvent, data: DragData) {
    if (!event.dataTransfer) {
      this.dragData = null; // dataTransferがnullの場合はdragDataもnullにする
      return;
    }

    this.dragData = data;
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', JSON.stringify(data));

    // ドラッグ中の見た目を調整
    if (event.target instanceof HTMLElement) {
      event.target.style.opacity = '0.5';
    }
  }

  /**
   * ドラッグオーバーイベントを処理し、ドロップ可能かどうかを判定する
   * @param event ドラッグオーバーイベント
   * @param target ドロップ対象の情報
   * @returns ドロップ可能な場合true
   */
  static handleDragOver(event: DragEvent, target: DropTarget): boolean {
    event.preventDefault();

    if (!this.dragData) return false;

    // ドロップ可能かどうかの判定
    if (this.canDrop(this.dragData, target)) {
      event.dataTransfer!.dropEffect = 'move';

      // ドラッグオーバー時のホバースタイルを適用
      if (event.currentTarget instanceof HTMLElement) {
        event.currentTarget.classList.add('drop-target-hover');
      }

      return true;
    }

    event.dataTransfer!.dropEffect = 'none';

    // ドロップできない場合はホバースタイルを削除
    if (event.currentTarget instanceof HTMLElement) {
      event.currentTarget.classList.remove('drop-target-hover');
    }

    return false;
  }

  /**
   * ドロップイベントを処理し、ドラッグされた要素の情報を返す
   * @param event ドロップイベント
   * @param target ドロップ対象の情報
   * @returns ドロップされた要素の情報（ドロップ失敗時はnull）
   */
  static handleDrop(event: DragEvent, target: DropTarget): DragData | null {
    event.preventDefault();

    // ドロップ時にホバースタイルをクリア
    if (event.currentTarget instanceof HTMLElement) {
      event.currentTarget.classList.remove('drop-target-hover');
    }

    if (!this.dragData) return null;

    if (this.canDrop(this.dragData, target)) {
      const dragData = this.dragData;
      this.dragData = null;
      return dragData;
    }

    return null;
  }

  /**
   * ドラッグ終了イベントを処理し、状態をクリアする
   * @param event ドラッグ終了イベント
   */
  static handleDragEnd(event: DragEvent) {
    // ドラッグ終了時の見た目をリセット
    if (event.target instanceof HTMLElement) {
      event.target.style.opacity = '1';
    }

    // 全ての要素からホバースタイルを削除
    this.clearAllDropTargetHover();

    this.dragData = null;
  }

  /**
   * ドラッグエンターイベントを処理し、要素にドラッグ中スタイルを適用する
   * @param event ドラッグエンターイベント
   * @param element ドロップゾーン要素
   */
  static handleDragEnter(event: DragEvent, element: HTMLElement) {
    event.preventDefault();
    this.dropZoneElement = element;
    element.classList.add('drag-over');
  }

  /**
   * ドラッグリーブイベントを処理し、要素からドラッグ中スタイルを削除する
   * @param event ドラッグリーブイベント
   * @param element ドロップゾーン要素
   */
  static handleDragLeave(event: DragEvent, element: HTMLElement) {
    // 子要素に移った場合は無視
    if (event.relatedTarget instanceof Node && element.contains(event.relatedTarget)) {
      return;
    }

    element.classList.remove('drag-over');
    element.classList.remove('drop-target-hover');

    if (this.dropZoneElement === element) {
      this.dropZoneElement = null;
    }
  }

  /**
   * 指定された要素が対象にドロップ可能かどうかを判定する
   * @param dragData ドラッグされている要素の情報
   * @param target ドロップ対象の情報
   * @returns ドロップ可能な場合true
   */
  static canDrop(dragData: DragData, target: DropTarget): boolean {
    // 自分自身にはドロップできない
    if (dragData.id === target.id && dragData.type === target.type) {
      return false;
    }

    if (dragData.type === 'project') {
      // プロジェクト同士の並び替えのみ可能
      return target.type === 'project' || target.type === 'project-container';
    }

    if (dragData.type === 'tasklist') {
      // タスクリストは他のタスクリストまたはプロジェクトにドロップ可能
      if (target.type === 'tasklist') {
        // 同じプロジェクト内または別プロジェクトのタスクリスト
        return true;
      }
      if (target.type === 'project') {
        // プロジェクトにドロップ（最後尾に配置）
        return target.id !== dragData.projectId; // 同じプロジェクトは除く
      }
    }

    if (dragData.type === 'tag') {
      // タグは他のタグとタスクにドロップ可能
      return target.type === 'tag' || target.type === 'task';
    }

    if (dragData.type === 'task') {
      // タスクはビュー、プロジェクト、タスクリスト、タグにドロップ可能
      return (
        target.type === 'view' ||
        target.type === 'project' ||
        target.type === 'tasklist' ||
        target.type === 'tag'
      );
    }

    if (dragData.type === 'subtask') {
      // サブタスクはビューとタグにドロップ可能
      return target.type === 'view' || target.type === 'tag';
    }

    // subtaskタイプのターゲットには何もドロップできない
    if (target.type === 'subtask') {
      return false;
    }

    return false;
  }

  /**
   * 現在ドラッグ中の要素の情報を取得する
   * @returns ドラッグ中の要素の情報（ドラッグ中でない場合はnull）
   */
  static getDragData(): DragData | null {
    return this.dragData;
  }

  /**
   * ドロップゾーンの状態をクリアする
   */
  static clearDropZone() {
    if (this.dropZoneElement) {
      this.dropZoneElement.classList.remove('drag-over');
      this.dropZoneElement.classList.remove('drop-target-hover');
      this.dropZoneElement = null;
    }
  }

  /**
   * 全ての要素からドロップターゲットのホバースタイルを削除する
   */
  private static clearAllDropTargetHover() {
    // 全ての要素からdrop-target-hoverクラスを削除
    const elements = document.querySelectorAll('.drop-target-hover');
    elements.forEach((element) => {
      element.classList.remove('drop-target-hover');
    });
  }
}
