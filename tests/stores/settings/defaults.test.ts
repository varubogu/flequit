import { describe, expect, test } from 'vitest';

import { DEFAULT_SETTINGS, applySettingsPatch } from '../../../src/lib/stores/settings/defaults';

const cloneDefaults = () => structuredClone(DEFAULT_SETTINGS);

describe('settings defaults helpers', () => {
  test('DEFAULT_SETTINGS provides baseline values', () => {
    expect(DEFAULT_SETTINGS.language).toBeDefined();
    expect(Array.isArray(DEFAULT_SETTINGS.viewItems)).toBe(true);
    expect(DEFAULT_SETTINGS.viewItems.length).toBeGreaterThan(0);
  });

  test('applySettingsPatch merges primitive and complex fields', () => {
    const target = cloneDefaults();

    applySettingsPatch(target, {
      language: 'en',
      timeLabels: [{ id: 'id-1', name: 'Morning', time: '08:00' }],
      dueDateButtons: { today: false }
    });

    expect(target.language).toBe('en');
    expect(target.timeLabels).toEqual([{ id: 'id-1', name: 'Morning', time: '08:00' }]);
    expect(target.dueDateButtons.today).toBe(false);
    expect(target.dueDateButtons.overdue).toBe(true);
  });

  test('applySettingsPatch replaces viewItems when patch provided', () => {
    const target = cloneDefaults();
    const patch = [{ id: 'custom', label: 'Custom', icon: '⭐', visible: true, order: 0 }];

    applySettingsPatch(target, { viewItems: patch });

    expect(target.viewItems).toEqual(patch);
  });
});
