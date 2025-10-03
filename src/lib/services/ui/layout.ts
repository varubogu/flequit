const LAYOUT_STORAGE_KEY = 'flequit-layout-preferences';

interface LayoutPreferences {
  taskListPaneSize: number;
  taskDetailPaneSize: number;
}

export class LayoutService {
  static getDefaultPreferences(): LayoutPreferences {
    return {
      taskListPaneSize: 30,
      taskDetailPaneSize: 70
    };
  }

  static loadPreferences(): LayoutPreferences {
    try {
      const stored = localStorage.getItem(LAYOUT_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return {
          ...this.getDefaultPreferences(),
          ...parsed
        };
      }
    } catch (error) {
      console.warn('Failed to load layout preferences:', error);
    }
    return this.getDefaultPreferences();
  }

  static savePreferences(preferences: LayoutPreferences): void {
    try {
      localStorage.setItem(LAYOUT_STORAGE_KEY, JSON.stringify(preferences));
    } catch (error) {
      console.warn('Failed to save layout preferences:', error);
    }
  }

  static updatePaneSizes(taskListSize: number, taskDetailSize: number): void {
    const preferences = {
      taskListPaneSize: taskListSize,
      taskDetailPaneSize: taskDetailSize
    };
    this.savePreferences(preferences);
  }
}
