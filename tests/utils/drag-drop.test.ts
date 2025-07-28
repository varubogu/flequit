import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DragDropManager, type DragData, type DropTarget } from '$lib/utils/drag-drop';

describe('DragDropManager', () => {
  beforeEach(() => {
    // テスト前にDragDropManagerの状態をリセット
    DragDropManager.clearDropZone();
  });

  describe('startDrag', () => {
    it('ドラッグデータを正しく設定する', () => {
      const mockEvent = {
        dataTransfer: {
          effectAllowed: '',
          setData: vi.fn()
        },
        target: document.createElement('div')
      } as unknown as DragEvent;

      const dragData: DragData = {
        type: 'project',
        id: 'test-project-1'
      };

      DragDropManager.startDrag(mockEvent, dragData);

      expect(mockEvent.dataTransfer!.effectAllowed).toBe('move');
      expect(mockEvent.dataTransfer!.setData).toHaveBeenCalledWith('text/plain', JSON.stringify(dragData));
      expect(DragDropManager.getDragData()).toEqual(dragData);
    });

    it('dataTransferがnullの場合は何もしない', () => {
      const mockEvent = {
        dataTransfer: null
      } as unknown as DragEvent;

      const dragData: DragData = {
        type: 'project',
        id: 'test-project-1'
      };

      DragDropManager.startDrag(mockEvent, dragData);
      expect(DragDropManager.getDragData()).toBeNull();
    });
  });

  describe('handleDragOver', () => {
    it('有効なドロップターゲットでドラッグオーバーを許可する', () => {
      const mockEvent = {
        preventDefault: vi.fn(),
        dataTransfer: { dropEffect: '' }
      } as unknown as DragEvent;

      // まずドラッグを開始
      const dragEvent = {
        dataTransfer: {
          effectAllowed: '',
          setData: vi.fn()
        },
        target: document.createElement('div')
      } as unknown as DragEvent;

      const dragData: DragData = {
        type: 'project',
        id: 'project-1'
      };

      DragDropManager.startDrag(dragEvent, dragData);

      const target: DropTarget = {
        type: 'project',
        id: 'project-2'
      };

      const result = DragDropManager.handleDragOver(mockEvent, target);

      expect(mockEvent.preventDefault).toHaveBeenCalled();
      expect(mockEvent.dataTransfer!.dropEffect).toBe('move');
      expect(result).toBe(true);
    });

    it('無効なドロップターゲットでドラッグオーバーを拒否する', () => {
      const mockEvent = {
        preventDefault: vi.fn(),
        dataTransfer: { dropEffect: '' }
      } as unknown as DragEvent;

      // タスクリストをドラッグ
      const dragEvent = {
        dataTransfer: {
          effectAllowed: '',
          setData: vi.fn()
        },
        target: document.createElement('div')
      } as unknown as DragEvent;

      const dragData: DragData = {
        type: 'tasklist',
        id: 'tasklist-1',
        projectId: 'project-1'
      };

      DragDropManager.startDrag(dragEvent, dragData);

      // 同じタスクリスト自身にドロップしようとする
      const target: DropTarget = {
        type: 'tasklist',
        id: 'tasklist-1',
        projectId: 'project-1'
      };

      const result = DragDropManager.handleDragOver(mockEvent, target);

      expect(mockEvent.preventDefault).toHaveBeenCalled();
      expect(mockEvent.dataTransfer!.dropEffect).toBe('none');
      expect(result).toBe(false);
    });
  });

  describe('handleDrop', () => {
    it('有効なドロップでドラッグデータを返す', () => {
      const mockEvent = {
        preventDefault: vi.fn()
      } as unknown as DragEvent;

      // ドラッグを開始
      const dragEvent = {
        dataTransfer: {
          effectAllowed: '',
          setData: vi.fn()
        },
        target: document.createElement('div')
      } as unknown as DragEvent;

      const dragData: DragData = {
        type: 'project',
        id: 'project-1'
      };

      DragDropManager.startDrag(dragEvent, dragData);

      const target: DropTarget = {
        type: 'project',
        id: 'project-2'
      };

      const result = DragDropManager.handleDrop(mockEvent, target);

      expect(mockEvent.preventDefault).toHaveBeenCalled();
      expect(result).toEqual(dragData);
      expect(DragDropManager.getDragData()).toBeNull(); // ドロップ後はクリアされる
    });

    it('無効なドロップでnullを返す', () => {
      const mockEvent = {
        preventDefault: vi.fn()
      } as unknown as DragEvent;

      // ドラッグを開始
      const dragEvent = {
        dataTransfer: {
          effectAllowed: '',
          setData: vi.fn()
        },
        target: document.createElement('div')
      } as unknown as DragEvent;

      const dragData: DragData = {
        type: 'tasklist',
        id: 'tasklist-1',
        projectId: 'project-1'
      };

      DragDropManager.startDrag(dragEvent, dragData);

      // 同じタスクリスト自身にドロップしようとする
      const target: DropTarget = {
        type: 'tasklist',
        id: 'tasklist-1',
        projectId: 'project-1'
      };

      const result = DragDropManager.handleDrop(mockEvent, target);

      expect(mockEvent.preventDefault).toHaveBeenCalled();
      expect(result).toBeNull();
    });
  });

  describe('canDrop（内部ロジック）', () => {
    it('プロジェクト同士の並び替えを許可する', () => {
      const dragEvent = {
        dataTransfer: {
          effectAllowed: '',
          setData: vi.fn()
        },
        target: document.createElement('div')
      } as unknown as DragEvent;

      const dragData: DragData = {
        type: 'project',
        id: 'project-1'
      };

      DragDropManager.startDrag(dragEvent, dragData);

      const target: DropTarget = {
        type: 'project',
        id: 'project-2'
      };

      const mockEvent = {
        preventDefault: vi.fn(),
        dataTransfer: { dropEffect: '' }
      } as unknown as DragEvent;

      const result = DragDropManager.handleDragOver(mockEvent, target);
      expect(result).toBe(true);
    });

    it('タスクリストを別プロジェクトに移動することを許可する', () => {
      const dragEvent = {
        dataTransfer: {
          effectAllowed: '',
          setData: vi.fn()
        },
        target: document.createElement('div')
      } as unknown as DragEvent;

      const dragData: DragData = {
        type: 'tasklist',
        id: 'tasklist-1',
        projectId: 'project-1'
      };

      DragDropManager.startDrag(dragEvent, dragData);

      const target: DropTarget = {
        type: 'project',
        id: 'project-2'
      };

      const mockEvent = {
        preventDefault: vi.fn(),
        dataTransfer: { dropEffect: '' }
      } as unknown as DragEvent;

      const result = DragDropManager.handleDragOver(mockEvent, target);
      expect(result).toBe(true);
    });

    it('タスクリストを同じプロジェクトにドロップすることを拒否する', () => {
      const dragEvent = {
        dataTransfer: {
          effectAllowed: '',
          setData: vi.fn()
        },
        target: document.createElement('div')
      } as unknown as DragEvent;

      const dragData: DragData = {
        type: 'tasklist',
        id: 'tasklist-1',
        projectId: 'project-1'
      };

      DragDropManager.startDrag(dragEvent, dragData);

      const target: DropTarget = {
        type: 'project',
        id: 'project-1' // 同じプロジェクト
      };

      const mockEvent = {
        preventDefault: vi.fn(),
        dataTransfer: { dropEffect: '' }
      } as unknown as DragEvent;

      const result = DragDropManager.handleDragOver(mockEvent, target);
      expect(result).toBe(false);
    });

    it('タグからタスクへのドロップを許可する', () => {
      const dragEvent = {
        dataTransfer: {
          effectAllowed: '',
          setData: vi.fn()
        },
        target: document.createElement('div')
      } as unknown as DragEvent;

      const dragData: DragData = {
        type: 'tag',
        id: 'tag-1'
      };

      DragDropManager.startDrag(dragEvent, dragData);

      const target: DropTarget = {
        type: 'task',
        id: 'task-1'
      };

      const mockEvent = {
        preventDefault: vi.fn(),
        dataTransfer: { dropEffect: '' }
      } as unknown as DragEvent;

      const result = DragDropManager.handleDragOver(mockEvent, target);
      expect(result).toBe(true);
    });

    it('タスクからビューへのドロップを許可する', () => {
      const dragEvent = {
        dataTransfer: {
          effectAllowed: '',
          setData: vi.fn()
        },
        target: document.createElement('div')
      } as unknown as DragEvent;

      const dragData: DragData = {
        type: 'task',
        id: 'task-1'
      };

      DragDropManager.startDrag(dragEvent, dragData);

      const target: DropTarget = {
        type: 'view',
        id: 'today'
      };

      const mockEvent = {
        preventDefault: vi.fn(),
        dataTransfer: { dropEffect: '' }
      } as unknown as DragEvent;

      const result = DragDropManager.handleDragOver(mockEvent, target);
      expect(result).toBe(true);
    });

    it('タスクからプロジェクトへのドロップを許可する', () => {
      const dragEvent = {
        dataTransfer: {
          effectAllowed: '',
          setData: vi.fn()
        },
        target: document.createElement('div')
      } as unknown as DragEvent;

      const dragData: DragData = {
        type: 'task',
        id: 'task-1'
      };

      DragDropManager.startDrag(dragEvent, dragData);

      const target: DropTarget = {
        type: 'project',
        id: 'project-1'
      };

      const mockEvent = {
        preventDefault: vi.fn(),
        dataTransfer: { dropEffect: '' }
      } as unknown as DragEvent;

      const result = DragDropManager.handleDragOver(mockEvent, target);
      expect(result).toBe(true);
    });

    it('タスクからタスクリストへのドロップを許可する', () => {
      const dragEvent = {
        dataTransfer: {
          effectAllowed: '',
          setData: vi.fn()
        },
        target: document.createElement('div')
      } as unknown as DragEvent;

      const dragData: DragData = {
        type: 'task',
        id: 'task-1'
      };

      DragDropManager.startDrag(dragEvent, dragData);

      const target: DropTarget = {
        type: 'tasklist',
        id: 'tasklist-1'
      };

      const mockEvent = {
        preventDefault: vi.fn(),
        dataTransfer: { dropEffect: '' }
      } as unknown as DragEvent;

      const result = DragDropManager.handleDragOver(mockEvent, target);
      expect(result).toBe(true);
    });
  });

  describe('handleDragEnd', () => {
    it('ドラッグ終了時に状態をリセットする', () => {
      const mockElement = document.createElement('div');
      mockElement.style.opacity = '0.5';

      const mockEvent = {
        target: mockElement
      } as unknown as DragEvent;

      DragDropManager.handleDragEnd(mockEvent);

      expect(mockElement.style.opacity).toBe('1');
      expect(DragDropManager.getDragData()).toBeNull();
    });
  });

  describe('handleDragEnter/Leave', () => {
    it('ドラッグエンター時にクラスを追加する', () => {
      const mockElement = document.createElement('div');
      const mockEvent = {
        preventDefault: vi.fn()
      } as unknown as DragEvent;

      DragDropManager.handleDragEnter(mockEvent, mockElement);

      expect(mockEvent.preventDefault).toHaveBeenCalled();
      expect(mockElement.classList.contains('drag-over')).toBe(true);
    });

    it('ドラッグリーブ時にクラスを削除する', () => {
      const mockElement = document.createElement('div');
      mockElement.classList.add('drag-over');

      const mockEvent = {
        relatedTarget: null
      } as unknown as DragEvent;

      DragDropManager.handleDragLeave(mockEvent, mockElement);

      expect(mockElement.classList.contains('drag-over')).toBe(false);
    });

    it('子要素に移った場合はドラッグリーブを無視する', () => {
      const mockElement = document.createElement('div');
      const childElement = document.createElement('span');
      mockElement.appendChild(childElement);
      mockElement.classList.add('drag-over');

      const mockEvent = {
        relatedTarget: childElement
      } as unknown as DragEvent;

      DragDropManager.handleDragLeave(mockEvent, mockElement);

      // 子要素に移った場合はクラスが残る
      expect(mockElement.classList.contains('drag-over')).toBe(true);
    });
  });
});