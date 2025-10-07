const LAYOUT_STORAGE_KEY = 'flequit-layout-preferences';

export interface LayoutPreferences {
  taskListPaneSize: number;
  taskDetailPaneSize: number;
}

export type LayoutPreferencesStoreOptions = {
  storage?: Pick<Storage, 'getItem' | 'setItem'> | null;
};

function getDefaultPreferences(): LayoutPreferences {
  return {
    taskListPaneSize: 30,
    taskDetailPaneSize: 70
  };
}

function parseStoredPreferences(raw: string | null): Partial<LayoutPreferences> | null {
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<LayoutPreferences>;
    return parsed ?? null;
  } catch (error) {
    console.warn('Failed to parse layout preferences:', error);
    return null;
  }
}

export class LayoutPreferencesStore {
  #storage: LayoutPreferencesStoreOptions['storage'];
  preferences = $state<LayoutPreferences>(getDefaultPreferences());

  constructor(options: LayoutPreferencesStoreOptions = {}) {
    const hasBrowserStorage = typeof localStorage !== 'undefined';
    this.#storage = options.storage ?? (hasBrowserStorage ? localStorage : null);

    this.loadPreferences();
  }

  get value(): LayoutPreferences {
    return this.preferences;
  }

  loadPreferences(): LayoutPreferences {
    try {
      const stored = this.#storage?.getItem?.(LAYOUT_STORAGE_KEY) ?? null;
      const parsed = parseStoredPreferences(stored);
      if (parsed) {
        this.preferences = {
          ...getDefaultPreferences(),
          ...parsed
        };
      }
    } catch (error) {
      console.warn('Failed to load layout preferences:', error);
      this.preferences = getDefaultPreferences();
    }

    return this.preferences;
  }

  savePreferences(preferences: LayoutPreferences = this.preferences): void {
    if (!this.#storage) {
      return;
    }

    try {
      this.#storage.setItem?.(LAYOUT_STORAGE_KEY, JSON.stringify(preferences));
    } catch (error) {
      console.warn('Failed to save layout preferences:', error);
    }
  }

  updatePreferences(update: Partial<LayoutPreferences>): LayoutPreferences {
    this.preferences = {
      ...this.preferences,
      ...update
    };
    this.savePreferences();
    return this.preferences;
  }

  updatePaneSizes(taskListSize: number, taskDetailSize: number): LayoutPreferences {
    return this.updatePreferences({
      taskListPaneSize: taskListSize,
      taskDetailPaneSize: taskDetailSize
    });
  }
}

export function createLayoutPreferencesStore(options?: LayoutPreferencesStoreOptions) {
  return new LayoutPreferencesStore(options);
}

export const layoutPreferencesStore = createLayoutPreferencesStore();
