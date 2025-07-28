export interface DragData {
  type: 'project' | 'tasklist' | 'tag' | 'task' | 'subtask';
  id: string;
  projectId?: string; // タスクリストの場合は所属プロジェクトID
  taskId?: string; // サブタスクの場合は所属タスクID
}

export interface DropTarget {
  type: 'project' | 'tasklist' | 'project-container' | 'tag' | 'view' | 'task';
  id: string;
  projectId?: string;
  position?: number;
}

export class DragDropManager {
  private static dragData: DragData | null = null;
  private static dropZoneElement: HTMLElement | null = null;

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

  static handleDragOver(event: DragEvent, target: DropTarget): boolean {
    event.preventDefault();
    
    if (!this.dragData) return false;
    
    // ドロップ可能かどうかの判定
    if (this.canDrop(this.dragData, target)) {
      event.dataTransfer!.dropEffect = 'move';
      return true;
    }
    
    event.dataTransfer!.dropEffect = 'none';
    return false;
  }

  static handleDrop(event: DragEvent, target: DropTarget): DragData | null {
    event.preventDefault();
    
    if (!this.dragData) return null;
    
    if (this.canDrop(this.dragData, target)) {
      const dragData = this.dragData;
      this.dragData = null;
      return dragData;
    }
    
    return null;
  }

  static handleDragEnd(event: DragEvent) {
    // ドラッグ終了時の見た目をリセット
    if (event.target instanceof HTMLElement) {
      event.target.style.opacity = '1';
    }
    this.dragData = null;
  }

  static handleDragEnter(event: DragEvent, element: HTMLElement) {
    event.preventDefault();
    this.dropZoneElement = element;
    element.classList.add('drag-over');
  }

  static handleDragLeave(event: DragEvent, element: HTMLElement) {
    // 子要素に移った場合は無視
    if (event.relatedTarget instanceof Node && element.contains(event.relatedTarget)) {
      return;
    }
    
    element.classList.remove('drag-over');
    if (this.dropZoneElement === element) {
      this.dropZoneElement = null;
    }
  }

  private static canDrop(dragData: DragData, target: DropTarget): boolean {
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
      return target.type === 'view' || target.type === 'project' || target.type === 'tasklist' || target.type === 'tag';
    }

    if (dragData.type === 'subtask') {
      // サブタスクはビューとタグにドロップ可能
      return target.type === 'view' || target.type === 'tag';
    }

    return false;
  }

  static getDragData(): DragData | null {
    return this.dragData;
  }

  static clearDropZone() {
    if (this.dropZoneElement) {
      this.dropZoneElement.classList.remove('drag-over');
      this.dropZoneElement = null;
    }
  }
}