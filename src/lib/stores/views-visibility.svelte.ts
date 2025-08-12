import { getTranslationService } from './locale.svelte';
import { getBackendService } from '$lib/services/backend';
import { settingsInitService } from '$lib/services/settings-init-service';
import type { Setting } from '$lib/types/settings';

const translationService = getTranslationService();

export interface ViewItem {
  id: string;
  label: string;
  icon: string;
  visible: boolean;
  order: number;
}

export interface ViewsConfiguration {
  viewItems: ViewItem[];
}

// メッセージ関数をマップ
const getViewLabel = (id: string): string => {
  const reactiveAll = translationService.getMessage('all_tasks');
  const reactiveOverdue = translationService.getMessage('overdue');
  const reactiveToday = translationService.getMessage('today');
  const reactiveTomorrow = translationService.getMessage('tomorrow');
  const reactiveCompleted = translationService.getMessage('completed');
  const reactiveNext3Days = translationService.getMessage('next_3_days');
  const reactiveNextWeek = translationService.getMessage('next_week');
  const reactiveThisMonth = translationService.getMessage('this_month');

  switch (id) {
    case 'allTasks':
      return reactiveAll();
    case 'overdue':
      return reactiveOverdue();
    case 'today':
      return reactiveToday();
    case 'tomorrow':
      return reactiveTomorrow();
    case 'completed':
      return reactiveCompleted();
    case 'next3days':
      return reactiveNext3Days();
    case 'nextweek':
      return reactiveNextWeek();
    case 'thismonth':
      return reactiveThisMonth();
    default:
      return id;
  }
};

const DEFAULT_VIEW_ITEMS: ViewItem[] = [
  { id: 'allTasks', label: 'All Tasks', icon: '📝', visible: true, order: 0 },
  { id: 'overdue', label: 'Overdue', icon: '🚨', visible: true, order: 1 },
  { id: 'today', label: 'Today', icon: '📅', visible: true, order: 2 },
  { id: 'tomorrow', label: 'Tomorrow', icon: '📆', visible: true, order: 3 },
  { id: 'completed', label: 'Completed', icon: '✅', visible: true, order: 4 },
  { id: 'next3days', label: 'Next 3 Days', icon: '📋', visible: false, order: 5 },
  { id: 'nextweek', label: 'Next Week', icon: '📊', visible: false, order: 6 },
  { id: 'thismonth', label: 'This Month', icon: '📅', visible: false, order: 7 }
];

const STORAGE_KEY = 'views-configuration';

class ViewsVisibilityStore {
  private _configuration = $state<ViewsConfiguration>({
    viewItems: [...DEFAULT_VIEW_ITEMS]
  });
  private backendService: Awaited<ReturnType<typeof getBackendService>> | null = null;
  private isInitialized = false;

  constructor() {
    // 非同期初期化は外部で実行
    // this.init() は別途呼び出す必要がある
  }

  get configuration(): ViewsConfiguration {
    return this._configuration;
  }

  get visibleViews(): ViewItem[] {
    return this._configuration.viewItems
      .filter((item) => item.visible)
      .sort((a, b) => a.order - b.order)
      .map((item) => ({ ...item, label: getViewLabel(item.id) }));
  }

  get hiddenViews(): ViewItem[] {
    return this._configuration.viewItems
      .filter((item) => !item.visible)
      .sort((a, b) => a.order - b.order)
      .map((item) => ({ ...item, label: getViewLabel(item.id) }));
  }

  setLists(visible: ViewItem[], hidden: ViewItem[]) {
    const allItemsFromUI = [
      ...visible.map((item, index) => ({ ...item, visible: true, order: index })),
      ...hidden.map((item, index) => ({ ...item, visible: false, order: visible.length + index }))
    ];
    const itemMap = new Map(allItemsFromUI.map((i) => [i.id, i]));

    const newViewItems = this._configuration.viewItems
      .map((originalItem) => {
        const updatedItem = itemMap.get(originalItem.id);
        if (updatedItem) {
          return { ...originalItem, visible: updatedItem.visible, order: updatedItem.order };
        }
        return originalItem;
      })
      .sort((a, b) => a.order - b.order);

    this._configuration.viewItems = newViewItems;
    this.saveConfiguration();
  }

  private async loadConfiguration() {
    try {
      // 統合初期化サービスから全設定を取得
      const allSettings = await settingsInitService.getAllSettings();
      const viewsSetting = settingsInitService.getSettingByKey(allSettings, 'views_visibility');
      
      if (viewsSetting) {
        const parsedConfig = JSON.parse(viewsSetting.value);
        // Merge with defaults to handle new view items
        const existingIds = new Set(
          parsedConfig.viewItems?.map((item: ViewItem) => item.id) || []
        );
        const mergedItems = [
          ...(parsedConfig.viewItems || []),
          ...DEFAULT_VIEW_ITEMS.filter((item) => !existingIds.has(item.id))
        ].map((item, index) => ({ ...item, order: item.order ?? index })); // Ensure order exists

        this._configuration = { viewItems: mergedItems };
        console.log('Views configuration loaded from backend');
      } else {
        console.log('No views setting found in backend, using defaults');
        this._configuration = { viewItems: [...DEFAULT_VIEW_ITEMS] };
      }
    } catch (error) {
      console.error('Failed to load views configuration from backend:', error);
      
      // フォールバックとしてlocalStorageから読み込み
      if (typeof window !== 'undefined') {
        try {
          const stored = localStorage.getItem(STORAGE_KEY);
          if (stored) {
            const parsedConfig = JSON.parse(stored);
            // Merge with defaults to handle new view items
            const existingIds = new Set(
              parsedConfig.viewItems?.map((item: ViewItem) => item.id) || []
            );
            const mergedItems = [
              ...(parsedConfig.viewItems || []),
              ...DEFAULT_VIEW_ITEMS.filter((item) => !existingIds.has(item.id))
            ].map((item, index) => ({ ...item, order: item.order ?? index })); // Ensure order exists

            this._configuration = { viewItems: mergedItems };
            console.log('Views configuration loaded from localStorage fallback');
          } else {
            this._configuration = { viewItems: [...DEFAULT_VIEW_ITEMS] };
          }
        } catch (localError) {
          console.warn('Failed to load views configuration from localStorage:', localError);
          this._configuration = { viewItems: [...DEFAULT_VIEW_ITEMS] };
        }
      }
    }
  }

  private async saveConfiguration() {
    // 初期化が完了していない場合は保存しない
    if (!this.isInitialized) {
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(this._configuration));
        } catch (error) {
          console.warn('Failed to save views configuration to localStorage:', error);
        }
      }
      return;
    }

    try {
      const backend = await this.initBackendService();
      if (!backend) {
        throw new Error('Backend service not available');
      }
      
      const setting: Setting = {
        id: 'setting_views_visibility',
        key: 'views_visibility',
        value: JSON.stringify(this._configuration),
        data_type: 'json',
        created_at: new Date(),
        updated_at: new Date()
      };
      
      await backend.setting.update(setting);
      console.log('Views visibility configuration saved successfully');
    } catch (error) {
      console.error('Failed to save views visibility to backend:', error);
      
      // フォールバックとしてlocalStorageに保存
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(this._configuration));
        } catch (localError) {
          console.warn('Failed to save views configuration to localStorage:', localError);
        }
      }
    }
  }

  resetToDefaults() {
    this._configuration = { viewItems: [...DEFAULT_VIEW_ITEMS] };
    this.saveConfiguration();
  }

  private async initBackendService() {
    if (!this.backendService) {
      this.backendService = await getBackendService();
    }
    return this.backendService;
  }

  async init() {
    await this.loadConfiguration();
    this.isInitialized = true;
  }
}

export const viewsVisibilityStore = new ViewsVisibilityStore();

// 初期化の実行
viewsVisibilityStore.init().catch(error => {
  console.error('Failed to initialize views visibility store:', error);
});
