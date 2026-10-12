import { describe, expect, it } from 'vitest';
import { TagElementUpdater } from '$lib/components/tag/utils/tag-element-updater.svelte';

describe('TagElementUpdater', () => {
  it('replaces the tag range, moves the cursor, and emits an input event', () => {
    const element = document.createElement('input');
    element.value = 'buy #mil';
    const events: Event[] = [];
    element.addEventListener('input', (event) => events.push(event));

    const result = TagElementUpdater.updateElementWithTag(element, 4, 8, '#milk');

    expect(result).toEqual({ newValue: 'buy #milk ', newCursorPos: 10 });
    expect(element.value).toBe('buy #milk ');
    expect(element.selectionStart).toBe(10);
    expect(events).toHaveLength(1);
  });

  it('notifies a listener and ignores a missing callback', () => {
    const received: Array<{ tagName: string; position: number }> = [];
    TagElementUpdater.notifyTagDetection(
      (event) => received.push(event.detail),
      'milk',
      4
    );
    TagElementUpdater.notifyTagDetection(undefined, 'milk', 4);

    expect(received).toEqual([{ tagName: 'milk', position: 4 }]);
  });
});
