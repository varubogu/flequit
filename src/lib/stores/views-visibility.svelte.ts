import * as m from '$paraglide/messages.js';
import { reactiveMessage } from './locale.svelte';

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
  const reactiveAll = reactiveMessage(m.all_tasks);
  const reactiveOverdue = reactiveMessage(m.overdue);
  const reactiveToday = reactiveMessage(m.today);
  const reactiveTomorrow = reactiveMessage(m.tomorrow);
  const reactiveCompleted = reactiveMessage(m.completed);
  const reactiveNext3Days = reactiveMessage(m.next_3_days);
  const reactiveNextWeek = reactiveMessage(m.next_week);
  const reactiveThisMonth = reactiveMessage(m.this_month);

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

  constructor() {
    this.loadConfiguration();
  }

  get configuration(): ViewsConfiguration {
    return this._configuration;
  }

  get visibleViews(): ViewItem[] {
    return this._configuration.viewItems
      .filter(item => item.visible)
      .sort((a, b) => a.order - b.order)
      .map(item => ({ ...item, label: getViewLabel(item.id) }));
  }

  get hiddenViews(): ViewItem[] {
    return this._configuration.viewItems
      .filter(item => !item.visible)
      .sort((a, b) => a.order - b.order)
      .map(item => ({ ...item, label: getViewLabel(item.id) }));
  }

  setLists(visible: ViewItem[], hidden: ViewItem[]) {
    const allItemsFromUI = [
      ...visible.map((item, index) => ({ ...item, visible: true, order: index })),
      ...hidden.map((item, index) => ({ ...item, visible: false, order: visible.length + index }))
    ];
    const itemMap = new Map(allItemsFromUI.map(i => [i.id, i]));

    const newViewItems = this._configuration.viewItems.map(originalItem => {
      const updatedItem = itemMap.get(originalItem.id);
      if (updatedItem) {
        return { ...originalItem, visible: updatedItem.visible, order: updatedItem.order };
      }
      return originalItem;
    }).sort((a, b) => a.order - b.order);

    this._configuration.viewItems = newViewItems;
    this.saveConfiguration();
  }

  private loadConfiguration() {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsedConfig = JSON.parse(stored);
          // Merge with defaults to handle new view items
          const existingIds = new Set(parsedConfig.viewItems?.map((item: ViewItem) => item.id) || []);
          const mergedItems = [
            ...(parsedConfig.viewItems || []),
            ...DEFAULT_VIEW_ITEMS.filter(item => !existingIds.has(item.id))
          ].map((item, index) => ({...item, order: item.order ?? index})); // Ensure order exists

          this._configuration = { viewItems: mergedItems };
        } else {
          this._configuration = { viewItems: [...DEFAULT_VIEW_ITEMS] };
        }
      } catch (error) {
        console.warn('Failed to load views configuration:', error);
        this._configuration = { viewItems: [...DEFAULT_VIEW_ITEMS] };
      }
    }
  }

  private saveConfiguration() {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this._configuration));
      } catch (error) {
        console.warn('Failed to save views configuration:', error);
      }
    }
  }

  resetToDefaults() {
    this._configuration = { viewItems: [...DEFAULT_VIEW_ITEMS] };
    this.saveConfiguration();
  }
}

export const viewsVisibilityStore = new ViewsVisibilityStore();
