import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Setting } from '$lib/types/settings';
import { errorHandler } from '$lib/stores/error-handler.svelte';
import { ViewsVisibilityStore, type ViewItem } from '$lib/stores/views-visibility.svelte';

function memoryStorage() {
  const entries = new Map<string, string>();
  return {
    getItem: (key: string) => entries.get(key) ?? null,
    setItem: (key: string, value: string) => {
      entries.set(key, String(value));
    },
    removeItem: (key: string) => {
      entries.delete(key);
    },
    clear: () => entries.clear()
  };
}

function setting(value: string): Setting {
  return {
    id: 'setting_views_visibility',
    key: 'views_visibility',
    value,
    dataType: 'string',
    createdAt: new Date(),
    updatedAt: new Date()
  } as Setting;
}

describe('views visibility store', () => {
  const gateway = {
    getAllSettings: vi.fn(async () => [] as Setting[]),
    getSettingByKey: vi.fn((_settings: Setting[], _key: string) => undefined as Setting | undefined),
    updateSetting: vi.fn(async () => undefined)
  };

  beforeEach(() => {
    vi.clearAllMocks();
    errorHandler.clearAllErrors();
    vi.stubGlobal('localStorage', memoryStorage());
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    gateway.getAllSettings.mockResolvedValue([]);
    gateway.getSettingByKey.mockReturnValue(undefined);
    gateway.updateSetting.mockResolvedValue(undefined);
  });

  it('merges a partial saved configuration with the default views', async () => {
    gateway.getSettingByKey.mockReturnValue(
      setting(JSON.stringify({ viewItems: [{ id: 'today', label: 'Today', icon: 'sun', visible: false }] }))
    );
    const store = new ViewsVisibilityStore(gateway);

    await store.init();

    const today = store.configuration.viewItems.find((item) => item.id === 'today');
    expect(today?.visible).toBe(false);
    expect(today?.order).toBe(0);
    expect(store.configuration.viewItems.length).toBeGreaterThan(1);
    expect(store.hiddenViews.map((item) => item.id)).toContain('today');
    expect(store.visibleViews.length).toBeGreaterThan(0);
  });

  it('uses defaults when no setting is stored and when the payload has no items', async () => {
    const store = new ViewsVisibilityStore(gateway);
    await store.init();
    const defaultCount = store.configuration.viewItems.length;

    gateway.getSettingByKey.mockReturnValue(setting(JSON.stringify({})));
    await store.init();
    expect(store.configuration.viewItems).toHaveLength(defaultCount);
  });

  it('falls back to localStorage when settings cannot be loaded', async () => {
    localStorage.setItem(
      'views-configuration',
      JSON.stringify({ viewItems: [{ id: 'overdue', label: 'Overdue', icon: 'alert', visible: true, order: 3 }] })
    );
    gateway.getAllSettings.mockRejectedValueOnce(new Error('down'));
    const store = new ViewsVisibilityStore(gateway);

    await store.init();

    expect(store.configuration.viewItems.find((item) => item.id === 'overdue')?.order).toBe(3);
    expect(errorHandler.errors.at(-1)?.message).toBe('ビュー表示設定の読み込みに失敗しました');

    localStorage.setItem('views-configuration', '{');
    gateway.getAllSettings.mockRejectedValueOnce('down');
    await store.init();
    expect(store.configuration.viewItems.length).toBeGreaterThan(0);

    localStorage.removeItem('views-configuration');
    gateway.getAllSettings.mockRejectedValueOnce(new Error('down'));
    await store.init();
    expect(errorHandler.errors.at(-1)?.details).toBe('down');
  });

  it('writes localStorage before initialization and the backend afterwards', async () => {
    const store = new ViewsVisibilityStore(gateway);
    const visible = store.visibleViews;
    const hidden = store.hiddenViews;

    store.setLists(visible, hidden);
    expect(localStorage.getItem('views-configuration')).toContain('viewItems');
    expect(gateway.updateSetting).not.toHaveBeenCalled();

    await store.init();
    store.setLists(hidden, visible);
    await vi.waitFor(() => {
      expect(gateway.updateSetting).toHaveBeenCalled();
    });

    gateway.updateSetting.mockRejectedValueOnce('save failed');
    store.resetToDefaults();
    await vi.waitFor(() => {
      expect(errorHandler.errors.at(-1)?.message).toBe('ビュー表示設定の保存に失敗しました');
    });
    expect(localStorage.getItem('views-configuration')).toContain('viewItems');
  });

  it('preserves an item the caller did not include', async () => {
    const store = new ViewsVisibilityStore(gateway);
    await store.init();
    const [first, ...rest] = store.configuration.viewItems;
    const visible = rest.filter((item) => item.visible);
    const hidden = rest.filter((item) => !item.visible);

    store.setLists(visible, hidden as ViewItem[]);

    expect(store.configuration.viewItems.find((item) => item.id === first.id)).toMatchObject({
      visible: first.visible,
      order: first.order
    });
  });
});
