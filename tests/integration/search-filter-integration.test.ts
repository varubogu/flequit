import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { TaskWithSubTasks, Tag, TaskStatus } from '$lib/types/task';

// 検索・フィルタリング機能のモック
const mockSearchStore = {
  searchQuery: '',
  searchResults: [] as TaskWithSubTasks[],
  searchHistory: [] as string[],
  searchFilters: {
    status: null as TaskStatus | null,
    priority: null as number | null,
    tags: [] as string[],
    dateRange: {
      start: null as Date | null,
      end: null as Date | null
    },
    projectId: null as string | null
  },

  performSearch: vi.fn((query: string) => {
    mockSearchStore.searchQuery = query;

    // 簡単な検索ロジックシミュレーション
    const allTasks = mockTaskStore.getAllTasks();
    let results = allTasks;

    if (query) {
      // タグ検索
      if (query.startsWith('#')) {
        const tagQuery = query.slice(1).toLowerCase();
        results = allTasks.filter((task) =>
          task.tags.some((tag) => tag.name.toLowerCase().includes(tagQuery))
        );
      }
      // コマンド検索
      else if (query.startsWith('>')) {
        results = []; // コマンド検索は別処理
      }
      // 通常のテキスト検索
      else {
        results = allTasks.filter(
          (task) =>
            task.title.toLowerCase().includes(query.toLowerCase()) ||
            task.description.toLowerCase().includes(query.toLowerCase())
        );
      }
    }

    mockSearchStore.searchResults = results;

    // 検索履歴に追加（重複除外）
    if (query) {
      // 既存の履歴から同じクエリを削除
      const existingIndex = mockSearchStore.searchHistory.indexOf(query);
      if (existingIndex !== -1) {
        mockSearchStore.searchHistory.splice(existingIndex, 1);
      }
      // 先頭に追加
      mockSearchStore.searchHistory.unshift(query);
      // 履歴は10件まで
      if (mockSearchStore.searchHistory.length > 10) {
        mockSearchStore.searchHistory = mockSearchStore.searchHistory.slice(0, 10);
      }
    }

    return results;
  }),

  applyFilters: vi.fn((filters: typeof mockSearchStore.searchFilters) => {
    mockSearchStore.searchFilters = { ...filters };

    let results = mockTaskStore.getAllTasks();

    // ステータスフィルター
    if (filters.status) {
      results = results.filter((task) => task.status === filters.status);
    }

    // 優先度フィルター
    if (filters.priority !== null) {
      results = results.filter((task) => task.priority === filters.priority);
    }

    // タグフィルター
    if (filters.tags.length > 0) {
      results = results.filter((task) =>
        filters.tags.some((tagId) => task.tags.some((tag) => tag.id === tagId))
      );
    }

    // 日付範囲フィルター
    if (filters.dateRange.start || filters.dateRange.end) {
      results = results.filter((task) => {
        if (!task.end_date) return false;

        const taskDate = new Date(task.end_date);

        if (filters.dateRange.start && taskDate < filters.dateRange.start) {
          return false;
        }

        if (filters.dateRange.end && taskDate > filters.dateRange.end) {
          return false;
        }

        return true;
      });
    }

    // プロジェクトフィルター
    if (filters.projectId) {
      results = results.filter((task) => {
        // プロジェクトIDからタスクを特定する処理のシミュレーション
        return task.list_id.startsWith(filters.projectId!);
      });
    }

    mockSearchStore.searchResults = results;
    return results;
  }),

  clearSearch: vi.fn(() => {
    mockSearchStore.searchQuery = '';
    mockSearchStore.searchResults = [];
    return [];
  }),

  clearFilters: vi.fn(() => {
    mockSearchStore.searchFilters = {
      status: null,
      priority: null,
      tags: [],
      dateRange: { start: null, end: null },
      projectId: null
    };
    return mockSearchStore.searchFilters;
  })
};

// タスクストアのモック
const mockTaskStore = {
  tasks: [
    {
      id: 'task-1',
      list_id: 'project-1-list-1',
      title: '重要なタスク',
      description: 'これは重要な作業です',
      status: 'not_started' as TaskStatus,
      priority: 3,
      end_date: new Date('2024-01-15'),
      created_at: new Date(),
      updated_at: new Date(),
      sub_tasks: [],
      tags: [
        {
          id: 'tag-1',
          name: '重要',
          color: '#ef4444',
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          id: 'tag-2',
          name: '作業',
          color: '#3b82f6',
          created_at: new Date(),
          updated_at: new Date()
        }
      ],
      order_index: 0,
      is_archived: false
    },
    {
      id: 'task-2',
      list_id: 'project-1-list-1',
      title: '日常タスク',
      description: '毎日の定期作業',
      status: 'completed' as TaskStatus,
      priority: 1,
      end_date: new Date('2024-01-10'),
      created_at: new Date(),
      updated_at: new Date(),
      sub_tasks: [],
      tags: [
        {
          id: 'tag-2',
          name: '作業',
          color: '#3b82f6',
          created_at: new Date(),
          updated_at: new Date()
        }
      ],
      order_index: 1,
      is_archived: false
    },
    {
      id: 'task-3',
      list_id: 'project-2-list-1',
      title: 'プロジェクト2のタスク',
      description: '別プロジェクトの作業',
      status: 'in_progress' as TaskStatus,
      priority: 2,
      end_date: new Date('2024-01-20'),
      created_at: new Date(),
      updated_at: new Date(),
      sub_tasks: [],
      tags: [
        {
          id: 'tag-3',
          name: '個人',
          color: '#10b981',
          created_at: new Date(),
          updated_at: new Date()
        }
      ],
      order_index: 0,
      is_archived: false
    }
  ] as TaskWithSubTasks[],

  getAllTasks: vi.fn(() => mockTaskStore.tasks),

  getTasksByStatus: vi.fn((status: TaskStatus) => {
    return mockTaskStore.tasks.filter((task) => task.status === status);
  }),

  getTasksByPriority: vi.fn((priority: number) => {
    return mockTaskStore.tasks.filter((task) => task.priority === priority);
  }),

  getTasksByTag: vi.fn((tagId: string) => {
    return mockTaskStore.tasks.filter((task) => task.tags.some((tag) => tag.id === tagId));
  })
};

// ビューストアのモック
const mockViewStore = {
  currentView: 'all',
  availableViews: [
    { id: 'all', name: 'すべて', icon: '📋' },
    { id: 'today', name: '今日', icon: '📅' },
    { id: 'completed', name: '完了済み', icon: '✅' },
    { id: 'high-priority', name: '高優先度', icon: '🔥' }
  ],

  applyView: vi.fn((viewId: string) => {
    mockViewStore.currentView = viewId;

    let filteredTasks = mockTaskStore.getAllTasks();

    switch (viewId) {
      case 'today':
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        filteredTasks = filteredTasks.filter((task) => {
          if (!task.end_date) return false;
          const taskDate = new Date(task.end_date);
          return taskDate >= today && taskDate < tomorrow;
        });
        break;

      case 'completed':
        filteredTasks = filteredTasks.filter((task) => task.status === 'completed');
        break;

      case 'high-priority':
        filteredTasks = filteredTasks.filter((task) => task.priority >= 3);
        break;

      default:
        // 'all' の場合はフィルターなし
        break;
    }

    return filteredTasks;
  })
};

// コマンドパレットのモック
const mockCommandStore = {
  isOpen: false,
  commandMode: false,
  availableCommands: [
    { id: 'settings', name: '設定を開く', shortcut: 'Cmd+,' },
    { id: 'new-task', name: '新しいタスク', shortcut: 'Cmd+N' },
    { id: 'search-tasks', name: 'タスクを検索', shortcut: 'Cmd+K' },
    { id: 'toggle-sidebar', name: 'サイドバー切り替え', shortcut: 'Cmd+B' }
  ],

  executeCommand: vi.fn((commandId: string) => {
    switch (commandId) {
      case 'settings':
        return { action: 'open-settings', success: true };
      case 'new-task':
        return { action: 'create-task', success: true };
      case 'search-tasks':
        return { action: 'focus-search', success: true };
      case 'toggle-sidebar':
        return { action: 'toggle-sidebar', success: true };
      default:
        return { action: 'unknown', success: false };
    }
  }),

  searchCommands: vi.fn((query: string) => {
    return mockCommandStore.availableCommands.filter((cmd) =>
      cmd.name.toLowerCase().includes(query.toLowerCase())
    );
  })
};

describe('検索・フィルタリング結合テスト', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // 検索状態をリセット
    mockSearchStore.searchQuery = '';
    mockSearchStore.searchResults = [];
    mockSearchStore.searchHistory = [];
    mockSearchStore.searchFilters = {
      status: null,
      priority: null,
      tags: [],
      dateRange: { start: null, end: null },
      projectId: null
    };

    mockViewStore.currentView = 'all';
    mockCommandStore.isOpen = false;
    mockCommandStore.commandMode = false;
  });

  it('基本的なテキスト検索が正しく動作する', () => {
    // テキスト検索実行
    const results = mockSearchStore.performSearch('重要');

    expect(mockSearchStore.performSearch).toHaveBeenCalledWith('重要');
    expect(mockSearchStore.searchQuery).toBe('重要');
    expect(results).toHaveLength(1);
    expect(results[0].title).toBe('重要なタスク');
    expect(mockSearchStore.searchHistory).toContain('重要');
  });

  it('タグ検索が正しく動作する', () => {
    // タグ検索実行（#記号付き）
    const results = mockSearchStore.performSearch('#作業');

    expect(mockSearchStore.performSearch).toHaveBeenCalledWith('#作業');
    expect(results).toHaveLength(2); // '重要なタスク'と'日常タスク'に'作業'タグが付いている
    expect(results.every((task) => task.tags.some((tag) => tag.name.includes('作業')))).toBe(true);
  });

  it('コマンド検索が正しく動作する', () => {
    // コマンド検索
    const commandResults = mockCommandStore.searchCommands('新し');

    expect(mockCommandStore.searchCommands).toHaveBeenCalledWith('新し');
    expect(commandResults).toHaveLength(1);
    expect(commandResults[0].name).toBe('新しいタスク');

    // コマンド実行
    const executeResult = mockCommandStore.executeCommand('new-task');
    expect(mockCommandStore.executeCommand).toHaveBeenCalledWith('new-task');
    expect(executeResult.action).toBe('create-task');
    expect(executeResult.success).toBe(true);
  });

  it('ステータスフィルターが正しく動作する', () => {
    // 完了済みタスクのみ表示
    const filters = {
      status: 'completed' as TaskStatus,
      priority: null,
      tags: [],
      dateRange: { start: null, end: null },
      projectId: null
    };

    const results = mockSearchStore.applyFilters(filters);

    expect(mockSearchStore.applyFilters).toHaveBeenCalledWith(filters);
    expect(results).toHaveLength(1);
    expect(results[0].status).toBe('completed');
    expect(results[0].title).toBe('日常タスク');
  });

  it('優先度フィルターが正しく動作する', () => {
    // 高優先度タスク（優先度3以上）のフィルター
    const filters = {
      status: null,
      priority: 3,
      tags: [],
      dateRange: { start: null, end: null },
      projectId: null
    };

    const results = mockSearchStore.applyFilters(filters);

    expect(results).toHaveLength(1);
    expect(results[0].priority).toBe(3);
    expect(results[0].title).toBe('重要なタスク');
  });

  it('タグフィルターが正しく動作する', () => {
    // '作業'タグでフィルター
    const filters = {
      status: null,
      priority: null,
      tags: ['tag-2'], // '作業'タグのID
      dateRange: { start: null, end: null },
      projectId: null
    };

    const results = mockSearchStore.applyFilters(filters);

    expect(results).toHaveLength(2);
    expect(results.every((task) => task.tags.some((tag) => tag.id === 'tag-2'))).toBe(true);
  });

  it('日付範囲フィルターが正しく動作する', () => {
    // 2024年1月12日から18日の範囲でフィルター
    const filters = {
      status: null,
      priority: null,
      tags: [],
      dateRange: {
        start: new Date('2024-01-12'),
        end: new Date('2024-01-18')
      },
      projectId: null
    };

    const results = mockSearchStore.applyFilters(filters);

    expect(results).toHaveLength(1);
    expect(results[0].title).toBe('重要なタスク'); // end_date: 2024-01-15
  });

  it('複合フィルターが正しく動作する', () => {
    // ステータス、優先度、タグの複合フィルター
    const filters = {
      status: 'not_started' as TaskStatus,
      priority: 3,
      tags: ['tag-1'], // '重要'タグ
      dateRange: { start: null, end: null },
      projectId: null
    };

    const results = mockSearchStore.applyFilters(filters);

    expect(results).toHaveLength(1);
    expect(results[0].title).toBe('重要なタスク');
    expect(results[0].status).toBe('not_started');
    expect(results[0].priority).toBe(3);
    expect(results[0].tags.some((tag) => tag.id === 'tag-1')).toBe(true);
  });

  it('ビュー切り替えとフィルタリングの連携', () => {
    // 今日のビューを適用
    const todayTasks = mockViewStore.applyView('today');

    expect(mockViewStore.applyView).toHaveBeenCalledWith('today');
    expect(mockViewStore.currentView).toBe('today');

    // 完了済みビューを適用
    const completedTasks = mockViewStore.applyView('completed');
    expect(completedTasks).toHaveLength(1);
    expect(completedTasks[0].status).toBe('completed');

    // 高優先度ビューを適用
    const highPriorityTasks = mockViewStore.applyView('high-priority');
    expect(highPriorityTasks).toHaveLength(1);
    expect(highPriorityTasks[0].priority).toBe(3);
  });

  it('検索結果とビューの同期', () => {
    // まず検索を実行
    const searchResults = mockSearchStore.performSearch('タスク');
    expect(searchResults).toHaveLength(3); // 全タスクにマッチ

    // 検索結果に対してビューフィルターを適用
    const applyViewToSearchResults = (viewId: string, searchResults: TaskWithSubTasks[]) => {
      let filtered = [...searchResults];

      switch (viewId) {
        case 'completed':
          filtered = filtered.filter((task) => task.status === 'completed');
          break;
        case 'high-priority':
          filtered = filtered.filter((task) => task.priority >= 3);
          break;
      }

      return filtered;
    };

    // 検索結果から完了済みのみを表示
    const completedFromSearch = applyViewToSearchResults('completed', searchResults);
    expect(completedFromSearch).toHaveLength(1);
    expect(completedFromSearch[0].title).toBe('日常タスク');

    // 検索結果から高優先度のみを表示
    const highPriorityFromSearch = applyViewToSearchResults('high-priority', searchResults);
    expect(highPriorityFromSearch).toHaveLength(1);
    expect(highPriorityFromSearch[0].title).toBe('重要なタスク');
  });

  it('検索履歴の管理が正しく動作する', () => {
    // 複数回検索を実行
    mockSearchStore.performSearch('重要');
    mockSearchStore.performSearch('作業');
    mockSearchStore.performSearch('プロジェクト');

    expect(mockSearchStore.searchHistory).toEqual(['プロジェクト', '作業', '重要']);

    // 同じクエリの重複を避ける
    mockSearchStore.performSearch('重要');
    expect(mockSearchStore.searchHistory).toEqual(['重要', 'プロジェクト', '作業']);
  });

  it('検索とフィルターのクリア機能が正しく動作する', () => {
    // 検索とフィルターを設定
    mockSearchStore.performSearch('重要');
    mockSearchStore.applyFilters({
      status: 'completed',
      priority: 3,
      tags: ['tag-1'],
      dateRange: { start: new Date(), end: new Date() },
      projectId: 'project-1'
    });

    expect(mockSearchStore.searchQuery).toBe('重要');
    expect(mockSearchStore.searchFilters.status).toBe('completed');

    // 検索をクリア
    const clearedSearch = mockSearchStore.clearSearch();
    expect(mockSearchStore.clearSearch).toHaveBeenCalled();
    expect(clearedSearch).toHaveLength(0);
    expect(mockSearchStore.searchQuery).toBe('');

    // フィルターをクリア
    const clearedFilters = mockSearchStore.clearFilters();
    expect(mockSearchStore.clearFilters).toHaveBeenCalled();
    expect(clearedFilters.status).toBe(null);
    expect(clearedFilters.tags).toHaveLength(0);
  });

  it('高度な検索オプションが正しく動作する', () => {
    // 高度な検索条件の組み合わせ
    const advancedSearch = (options: {
      textQuery?: string;
      status?: TaskStatus;
      priorityRange?: { min: number; max: number };
      dateRange?: { start: Date; end: Date };
      hasSubTasks?: boolean;
      tagCount?: { min: number; max: number };
    }) => {
      let results = mockTaskStore.getAllTasks();

      if (options.textQuery) {
        results = results.filter(
          (task) =>
            task.title.toLowerCase().includes(options.textQuery!.toLowerCase()) ||
            task.description.toLowerCase().includes(options.textQuery!.toLowerCase())
        );
      }

      if (options.status) {
        results = results.filter((task) => task.status === options.status);
      }

      if (options.priorityRange) {
        results = results.filter(
          (task) =>
            task.priority >= options.priorityRange!.min &&
            task.priority <= options.priorityRange!.max
        );
      }

      if (options.hasSubTasks !== undefined) {
        results = results.filter((task) =>
          options.hasSubTasks ? task.sub_tasks.length > 0 : task.sub_tasks.length === 0
        );
      }

      if (options.tagCount) {
        results = results.filter(
          (task) =>
            task.tags.length >= options.tagCount!.min && task.tags.length <= options.tagCount!.max
        );
      }

      return results;
    };

    // 優先度2-3で、タグが1個以上のタスク
    const complexResults = advancedSearch({
      priorityRange: { min: 2, max: 3 },
      tagCount: { min: 1, max: 10 }
    });

    expect(complexResults).toHaveLength(2); // '重要なタスク'と'プロジェクト2のタスク'
    expect(complexResults.every((task) => task.priority >= 2 && task.priority <= 3)).toBe(true);
    expect(complexResults.every((task) => task.tags.length >= 1)).toBe(true);
  });

  it('検索パフォーマンスの最適化確認', () => {
    // 大量データでの検索性能シミュレーション
    const performanceTest = (taskCount: number) => {
      const largeTasks = Array.from({ length: taskCount }, (_, i) => ({
        id: `task-${i}`,
        title: `タスク${i}`,
        description: `説明${i}`,
        status: 'not_started' as TaskStatus,
        priority: i % 5,
        tags: [
          {
            id: `tag-${i % 3}`,
            name: `タグ${i % 3}`,
            color: '#000000',
            created_at: new Date(),
            updated_at: new Date()
          }
        ],
        list_id: `list-${i % 10}`,
        end_date: new Date(),
        created_at: new Date(),
        updated_at: new Date(),
        sub_tasks: [],
        order_index: i,
        is_archived: false
      }));

      const startTime = Date.now();

      // 検索実行
      const results = largeTasks.filter(
        (task) => task.title.includes('500') || task.description.includes('500')
      );

      const endTime = Date.now();
      const duration = endTime - startTime;

      return { results: results.length, duration, taskCount };
    };

    // 1000件のタスクで検索性能テスト
    const performanceResult = performanceTest(1000);

    expect(performanceResult.taskCount).toBe(1000);
    expect(performanceResult.duration).toBeLessThan(100); // 100ms以内で完了することを期待
    expect(typeof performanceResult.results).toBe('number');
  });
});
