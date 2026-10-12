import { cleanup, fireEvent, render, screen } from '@testing-library/svelte';
import { flushSync } from 'svelte';
import { Pencil } from 'lucide-svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import ContextMenuKeyboardHarness from './context-menu-keyboard-harness.svelte';
import { contextMenuStore } from '$lib/stores/context-menu.svelte';
import type { ContextMenuList } from '$lib/types/context-menu';

function menuItems(actions: {
  first: () => void;
  second: () => void;
  locked: () => void;
  off: () => void;
}): ContextMenuList {
  return [
    {
      id: 'first',
      label: 'First',
      action: actions.first,
      icon: Pencil,
      keyboardShortcut: 'Ctrl+1'
    },
    { type: 'separator' },
    {
      id: 'second',
      label: () => 'Second',
      action: actions.second,
      destructive: true
    },
    { id: 'locked', label: 'Locked', action: actions.locked, disabled: () => true },
    { id: 'off', label: 'Off', action: actions.off, disabled: true }
  ];
}

async function openMenu() {
  await fireEvent.contextMenu(screen.getByRole('button', { name: 'Menu' }));
  expect(await screen.findByText('First')).toBeInTheDocument();
  const content = document.querySelector<HTMLElement>('[data-slot="context-menu-content"]');
  expect(content).not.toBeNull();
  return content!;
}

function selectedText() {
  flushSync();
  const selected = [...document.querySelectorAll<HTMLElement>('[data-slot="context-menu-item"]')].find(
    (item) => item.dataset.selected === 'true' || item.getAttribute('data-selected') === 'true'
  );
  return selected?.textContent?.replace(/\s+/g, ' ').trim() ?? '';
}

describe('ContextMenuItems keyboard and item state', () => {
  afterEach(() => {
    contextMenuStore.close();
    cleanup();
  });

  it('moves the selection with arrows, runs the selected action, and closes on Escape', async () => {
    const first = vi.fn();
    const second = vi.fn();
    render(ContextMenuKeyboardHarness, {
      props: { items: menuItems({ first, second, locked: vi.fn(), off: vi.fn() }) }
    });

    const content = await openMenu();
    expect(contextMenuStore.isOpen).toBe(true);
    expect(contextMenuStore.selectedIndex).toBe(-1);
    expect(screen.getByText('Ctrl+1')).toBeInTheDocument();
    expect(screen.getByText('Second').closest('[data-slot="context-menu-item"]')).toHaveClass(
      'text-destructive'
    );
    expect(document.querySelector('svg')).toBeInTheDocument();

    const down = new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true });
    content.dispatchEvent(down);
    expect(down.defaultPrevented).toBe(true);
    expect(selectedText()).toContain('First');

    await fireEvent.keyDown(content, { key: 'ArrowDown' });
    expect(selectedText()).toContain('Second');
    await fireEvent.keyDown(content, { key: 'ArrowUp' });
    expect(selectedText()).toContain('First');
    await fireEvent.keyDown(content, { key: 'a' });
    expect(selectedText()).toContain('First');

    const enter = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true });
    content.dispatchEvent(enter);
    expect(enter.defaultPrevented).toBe(true);
    expect(first).toHaveBeenCalledOnce();
    expect(second).not.toHaveBeenCalled();

    await fireEvent.keyDown(content, { key: 'Escape' });
    expect(contextMenuStore.isOpen).toBe(false);
    expect(contextMenuStore.selectedIndex).toBe(-1);
  });

  it('ignores keys while the menu store is closed and Enter when nothing is selected', async () => {
    const first = vi.fn();
    render(ContextMenuKeyboardHarness, {
      props: {
        items: menuItems({ first, second: vi.fn(), locked: vi.fn(), off: vi.fn() })
      }
    });

    const content = await openMenu();
    contextMenuStore.close();
    await fireEvent.keyDown(content, { key: 'ArrowDown' });
    await fireEvent.keyDown(content, { key: 'Enter' });
    expect(first).not.toHaveBeenCalled();
    expect(contextMenuStore.selectedIndex).toBe(-1);

    contextMenuStore.open(4);
    await fireEvent.keyDown(content, { key: 'Enter' });
    expect(first).not.toHaveBeenCalled();
    expect(contextMenuStore.selectedIndex).toBe(-1);
  });

  it('does not run an action when the selected index no longer matches the items', async () => {
    const first = vi.fn();
    const second = vi.fn();
    const view = render(ContextMenuKeyboardHarness, {
      props: { items: menuItems({ first, second, locked: vi.fn(), off: vi.fn() }) }
    });
    const content = await openMenu();
    await fireEvent.keyDown(content, { key: 'ArrowDown' });
    await fireEvent.keyDown(content, { key: 'ArrowDown' });
    expect(contextMenuStore.selectedIndex).toBe(1);

    await view.rerender({
      items: [{ id: 'only', label: 'Only', action: first }]
    });
    await fireEvent.keyDown(content, { key: 'Enter' });
    expect(first).not.toHaveBeenCalled();
    expect(second).not.toHaveBeenCalled();
  });

  it('selects an item on hover and keeps a disabled item from running', async () => {
    const locked = vi.fn();
    const off = vi.fn();
    render(ContextMenuKeyboardHarness, {
      props: { items: menuItems({ first: vi.fn(), second: vi.fn(), locked, off }) }
    });
    await openMenu();

    const lockedItem = screen.getByText('Locked').closest('[data-slot="context-menu-item"]');
    const offItem = screen.getByText('Off').closest('[data-slot="context-menu-item"]');
    expect(lockedItem).toHaveAttribute('data-disabled');
    expect(offItem).toHaveAttribute('data-disabled');

    await fireEvent.mouseEnter(screen.getByText('Second').closest('[data-slot="context-menu-item"]')!);
    expect(selectedText()).toContain('Second');
    expect(contextMenuStore.selectedIndex).toBe(1);

    contextMenuStore.close();
    await fireEvent.mouseEnter(screen.getByText('First').closest('[data-slot="context-menu-item"]')!);
    expect(contextMenuStore.selectedIndex).toBe(-1);

    await fireEvent.click(screen.getByText('Locked'));
    await fireEvent.click(screen.getByText('Off'));
    expect(locked).not.toHaveBeenCalled();
    expect(off).not.toHaveBeenCalled();
  });
});
