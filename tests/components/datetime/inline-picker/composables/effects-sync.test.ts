import { flushSync } from 'svelte';
import { describe, expect, it } from 'vitest';
import { setupSyncEffects } from '$lib/components/datetime/inline-picker/composables/effects.svelte';
import { createInlineDatePickerState } from '$lib/components/datetime/inline-picker/composables/state.svelte';
import { runEffectRoot } from '../../../../helpers/effect-root.svelte';
import { createSyncSources } from './effects-sync-fixture.svelte';

describe('inline date picker sync effects', () => {
  it('follows getter values and skips a date update while the picker is hidden or blank', () => {
    const sources = createSyncSources();
    let endDate = '';
    const stop = runEffectRoot(() => {
      const state = createInlineDatePickerState({ isRangeDate: true });
      setupSyncEffects(state, {
        getShow: () => sources.show,
        getCurrentDate: () => sources.currentDate,
        getCurrentStartDate: () => sources.currentStartDate,
        getIsRangeDate: () => sources.isRangeDate
      });
      endDate = state.endDate;
      Object.assign(globalThis, { __pickerState: state });
    });
    flushSync();

    const state = (
      globalThis as unknown as { __pickerState: ReturnType<typeof createInlineDatePickerState> }
    ).__pickerState;
    expect(state.useRangeMode).toBe(true);
    expect(state.lastSyncedRangeMode).toBe(true);
    expect(state.endDate).not.toBe('');
    expect(state.startDate).not.toBe('');
    const syncedEnd = state.endDate;

    sources.isRangeDate = true;
    flushSync();
    expect(state.useRangeMode).toBe(true);

    sources.isRangeDate = false;
    flushSync();
    expect(state.useRangeMode).toBe(false);

    sources.show = false;
    sources.currentDate = '2024-06-01T12:00:00.000Z';
    flushSync();
    expect(state.endDate).toBe(syncedEnd);

    sources.show = true;
    sources.currentDate = undefined;
    flushSync();
    expect(state.endDate).toBe(syncedEnd);

    sources.currentStartDate = undefined;
    flushSync();
    expect(state.startDate).toBe('');
    expect(state.startTime).toBe('00:00:00');
    expect(endDate).toBeTypeOf('string');
    stop();
  });

  it('falls back to plain option fields when getters are absent', () => {
    const stop = runEffectRoot(() => {
      const state = createInlineDatePickerState({});
      setupSyncEffects(state, {
        show: true,
        currentDate: '2024-07-04T00:00:00.000Z',
        currentStartDate: '2024-07-01T00:00:00.000Z',
        isRangeDate: false
      });
      (globalThis as unknown as { __plainState?: typeof state }).__plainState = state;
    });
    flushSync();
    const state = (
      globalThis as unknown as { __plainState: ReturnType<typeof createInlineDatePickerState> }
    ).__plainState;
    expect(state.useRangeMode).toBe(false);
    expect(state.endDate).not.toBe('');
    expect(state.startDate).not.toBe('');
    stop();
  });
});
