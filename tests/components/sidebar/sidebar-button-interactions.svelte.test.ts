import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/svelte';
import { Pencil } from 'lucide-svelte';
import type { Component } from 'svelte';
import SidebarButton from '$lib/components/sidebar/sidebar-button.svelte';
import { DragDropManager, type DragData } from '$lib/utils/drag-drop';

const baseProps = {
  icon: '📋',
  label: 'Inbox',
  count: 0,
  isActive: false,
  isCollapsed: false,
  onclick: vi.fn(),
  testId: 'inbox-button'
};

const viewTarget = { type: 'view' as const, id: 'today' };

function dispatchDrag(target: Element, type: string) {
  const event = new Event(type, { bubbles: true, cancelable: true });
  Object.defineProperty(event, 'dataTransfer', {
    configurable: true,
    value: {
      dropEffect: 'none',
      effectAllowed: 'move',
      setData() {},
      getData: () => ''
    }
  });
  target.dispatchEvent(event);
}

function startDrag(data: DragData, target?: EventTarget | null) {
  const dataTransfer = {
    effectAllowed: '',
    dropEffect: '',
    setData: vi.fn(),
    getData: vi.fn(() => '')
  };
  DragDropManager.startDrag(
    { dataTransfer, target: target ?? null } as unknown as DragEvent,
    data
  );
  return dataTransfer;
}

describe('SidebarButton interactions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    DragDropManager.handleDragEnd({ target: null } as unknown as DragEvent);
  });

  it('shows the label and a zero count when expanded, and only the icon when collapsed and active', () => {
    const expanded = render(SidebarButton, { props: { ...baseProps, count: 0 } });
    const expandedButton = screen.getByTestId('inbox-button');
    expect(screen.getByText('Inbox')).toBeInTheDocument();
    expect(screen.getByText('0')).toBeInTheDocument();
    expect(expandedButton).toHaveClass('justify-between');
    expect(expandedButton).not.toHaveClass('bg-muted');
    expanded.unmount();

    render(SidebarButton, {
      props: { ...baseProps, isCollapsed: true, isActive: true, count: 4 }
    });
    const collapsedButton = screen.getByTestId('inbox-button');
    expect(screen.queryByText('Inbox')).not.toBeInTheDocument();
    expect(screen.queryByText('4')).not.toBeInTheDocument();
    expect(screen.getByText('📋')).toBeInTheDocument();
    expect(collapsedButton).toHaveClass('bg-muted', 'justify-center');
  });

  it('calls onDrop only when a compatible payload is released on a drop target', async () => {
    const onDrop = vi.fn();
    const { container, unmount } = render(SidebarButton, {
      props: { ...baseProps, dropTarget: viewTarget, onDrop }
    });
    const region = container.querySelector('[role="region"]');
    expect(region).not.toBeNull();

    startDrag({ type: 'task', id: 'task-1' });
    dispatchDrag(region!, 'dragenter');
    expect(region).toHaveClass('drag-over');
    dispatchDrag(region!, 'dragover');
    expect(region).toHaveClass('drop-target-hover');
    dispatchDrag(region!, 'drop');
    expect(onDrop).toHaveBeenCalledWith({ type: 'task', id: 'task-1' });
    expect(region).not.toHaveClass('drop-target-hover');

    onDrop.mockClear();
    startDrag({ type: 'tag', id: 'tag-1' });
    dispatchDrag(region!, 'drop');
    expect(onDrop).not.toHaveBeenCalled();
    unmount();

    const withoutHandler = render(SidebarButton, {
      props: { ...baseProps, dropTarget: viewTarget }
    });
    const bareRegion = withoutHandler.container.querySelector('[role="region"]');
    startDrag({ type: 'task', id: 'task-2' });
    dispatchDrag(bareRegion!, 'drop');
    expect(onDrop).not.toHaveBeenCalled();
    withoutHandler.unmount();

    const withoutTarget = render(SidebarButton, { props: { ...baseProps, onDrop } });
    const plainRegion = withoutTarget.container.querySelector('[role="region"]');
    startDrag({ type: 'task', id: 'task-3' });
    dispatchDrag(plainRegion!, 'dragover');
    dispatchDrag(plainRegion!, 'dragenter');
    dispatchDrag(plainRegion!, 'dragleave');
    dispatchDrag(plainRegion!, 'drop');
    expect(onDrop).not.toHaveBeenCalled();
    expect(plainRegion).not.toHaveClass('drag-over');
  });

  it('opens the context menu and runs item actions, including destructive and icon items', async () => {
    const edit = vi.fn();
    const remove = vi.fn();
    const { container } = render(SidebarButton, {
      props: {
        ...baseProps,
        isActive: true,
        dropTarget: viewTarget,
        onDrop: vi.fn(),
        contextMenuItems: [
          { label: 'Edit', action: edit, icon: Pencil as unknown as Component },
          { label: '', action: vi.fn(), separator: true },
          { label: 'Delete', action: remove, destructive: true },
          { label: 'Locked', action: vi.fn(), disabled: true }
        ]
      }
    });

    const region = container.querySelector('[role="region"]');
    expect(region).not.toBeNull();
    startDrag({ type: 'subtask', id: 'sub-1', taskId: 'task-1' });
    dispatchDrag(region!, 'dragover');
    dispatchDrag(region!, 'drop');

    await fireEvent.contextMenu(screen.getByTestId('inbox-button'));
    const editItem = await screen.findByText('Edit');
    expect(editItem.closest('[data-slot="context-menu-item"]')?.querySelector('svg')).not.toBeNull();
    await fireEvent.click(editItem);
    expect(edit).toHaveBeenCalledOnce();

    await fireEvent.contextMenu(screen.getByTestId('inbox-button'));
    const deleteItem = await screen.findByText('Delete');
    expect(deleteItem.closest('[data-slot="context-menu-item"]')).toHaveClass('text-destructive');
    expect(document.querySelector('[data-slot="context-menu-separator"]')).toBeInTheDocument();
    const locked = screen.getByText('Locked').closest('[data-slot="context-menu-item"]');
    expect(locked).toHaveAttribute('data-disabled');
    await fireEvent.click(deleteItem);
    expect(remove).toHaveBeenCalledOnce();
  });

  it('shows only the icon, without the active background, when a collapsed menu has no drop target', () => {
    render(SidebarButton, {
      props: {
        ...baseProps,
        isCollapsed: true,
        isActive: false,
        contextMenuItems: [{ label: 'Edit', action: vi.fn() }]
      }
    });

    const button = screen.getByTestId('inbox-button');
    expect(screen.queryByText('Inbox')).not.toBeInTheDocument();
    expect(screen.getByText('📋')).toBeInTheDocument();
    expect(button).toHaveClass('justify-center');
    expect(button).not.toHaveClass('bg-muted');
    expect(button.closest('[role="region"]')).not.toHaveAttribute('ondrop');
  });
});
