import { afterEach, describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/svelte';
import SettingsDraggableItems from '$lib/components/settings/draggable-items/settings-draggable-items.svelte';
import { setTranslationService } from '$lib/stores/locale.svelte';
import { createUnitTestTranslationService } from '../../unit-translation-mock';
import { MockViewsVisibilityStore } from '../../utils/mock-factories';
import { setupViewsVisibilityStoreOverride } from '../../utils/store-overrides';
import type { ViewItem } from '$lib/stores/views-visibility.svelte';
import type { ViewsVisibilityStore } from '$lib/hooks/use-views-visibility-store.svelte';

const visible: ViewItem[] = [
  { id: 'today', label: 'Today', icon: '📅', visible: true, order: 0 },
  { id: 'overdue', label: 'Overdue', icon: '⚠️', visible: true, order: 1 }
];
const hidden: ViewItem[] = [
  { id: 'completed', label: 'Completed', icon: '✅', visible: false, order: 2 }
];

describe('SettingsDraggableItems reorder', () => {
  let cleanup: (() => void) | null = null;
  const savedLists: Array<{ visible: ViewItem[]; hidden: ViewItem[] }> = [];

  afterEach(() => {
    cleanup?.();
    cleanup = null;
    savedLists.length = 0;
  });

  it('marks the dragged item, shows the end drop indicator, and persists a move into the hidden list', async () => {
    setTranslationService(createUnitTestTranslationService());
    const store = new MockViewsVisibilityStore({
      visible: [...visible],
      hidden: [...hidden],
      onSetLists: (nextVisible, nextHidden) => {
        savedLists.push({ visible: nextVisible, hidden: nextHidden });
      }
    });
    cleanup = setupViewsVisibilityStoreOverride(store as ViewsVisibilityStore);

    const { container } = render(SettingsDraggableItems);
    expect(screen.getByText('TEST_VISIBLE_IN_SIDEBAR')).toBeInTheDocument();
    expect(screen.getByText(/Today/)).toBeInTheDocument();
    expect(screen.getByText(/Completed/)).toBeInTheDocument();

    const today = container.querySelector('[data-item-id="today"]') as HTMLElement;
    const visibleZone = screen.getByText('TEST_VISIBLE_IN_SIDEBAR').nextElementSibling as HTMLElement;
    const hiddenZone = screen.getByText('TEST_HIDDEN_FROM_SIDEBAR').nextElementSibling as HTMLElement;
    await fireEvent.dragStart(today);

    expect(today.className).toContain('opacity-50');

    await fireEvent.dragOver(visibleZone);
    expect(visibleZone.className).toContain('border-primary');
    expect(visibleZone.querySelector('.rounded-full')).not.toBeNull();

    await fireEvent.dragOver(hiddenZone);
    expect(hiddenZone.className).toContain('border-primary');

    await fireEvent.drop(hiddenZone);
    expect(savedLists.length).toBeGreaterThan(0);
    const last = savedLists[savedLists.length - 1];
    expect(last.visible.map((item) => item.id)).not.toContain('today');
    expect(last.hidden.map((item) => item.id)).toContain('today');
    expect(container.querySelector('[data-item-id="today"]')?.className ?? '').not.toContain(
      'opacity-50'
    );
  });
});
