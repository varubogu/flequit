import { fireEvent, render, screen } from '@testing-library/svelte';
import { flushSync } from 'svelte';
import { describe, expect, it, vi } from 'vitest';
import SearchCommand from '$lib/components/command/search-command.svelte';
import type { TaskWithSubTasks } from '$lib/types/task';

const tasks = vi.hoisted(() => ({
  allTasks: [] as TaskWithSubTasks[],
  selectedListId: null as string | null,
  projects: [] as Array<{ id: string; taskLists: Array<{ id: string }> }>
}));

const views = vi.hoisted(() => ({
  performSearch: vi.fn(),
  changeView: vi.fn()
}));

const selection = vi.hoisted(() => ({
  selectTask: vi.fn()
}));

const interactions = vi.hoisted(() => ({
  startNewTaskMode: vi.fn()
}));

vi.mock('$lib/stores/tasks.svelte', () => ({
  taskStore: tasks
}));

vi.mock('$lib/stores/view-store.svelte', () => ({
  viewStore: views
}));

vi.mock('$lib/stores/selection-store.svelte', () => ({
  selectionStore: selection
}));

vi.mock('$lib/services/ui/task', () => ({
  taskInteractions: interactions
}));

const milk = {
  id: 'task-milk',
  title: 'Buy milk',
  description: 'from the shop',
  tags: [{ id: 'tag-1', name: 'Groceries' }]
} as unknown as TaskWithSubTasks;
const bread = {
  id: 'task-bread',
  title: 'Bake bread',
  description: 'needs milk',
  tags: []
} as unknown as TaskWithSubTasks;

async function typeSearch(value: string) {
  const input = document.querySelector<HTMLInputElement>('[data-slot="command-input"]');
  if (!input) {
    throw new Error(
      `missing input state=${document.querySelector('[data-slot="dialog-content"]')?.getAttribute('data-state') ?? 'no-content'}`
    );
  }
  await fireEvent.input(input, { target: { value } });
  flushSync();
  return input;
}

describe('SearchCommand behavior', () => {
  it('filters by title, description, and tag, then opens the matching task', async () => {
    tasks.allTasks = [milk, bread];
    tasks.selectedListId = 'list-1';
    tasks.projects = [];
    views.performSearch.mockClear();
    selection.selectTask.mockClear();
    const onOpenChange = vi.fn();
    const rendered = render(SearchCommand, { props: { open: true, onOpenChange } });
    if (!document.querySelector('[data-slot="command-input"]')) {
      throw new Error(rendered.container.innerHTML.slice(0, 400));
    }

    await typeSearch('bread');
    expect(screen.getByText('Bake bread')).toBeInTheDocument();
    expect(screen.queryByText('Buy milk')).not.toBeInTheDocument();

    await typeSearch('shop');
    expect(screen.getByText('Buy milk')).toBeInTheDocument();

    await typeSearch('#');
    expect(screen.getByText('Buy milk')).toBeInTheDocument();
    expect(screen.queryByText('Bake bread')).not.toBeInTheDocument();

    await typeSearch('#groc');
    expect(screen.getByText('Buy milk')).toBeInTheDocument();

    await typeSearch('missing');
    expect(screen.getByText('no_matching_tasks_found')).toBeInTheDocument();
    await fireEvent.click(screen.getByText(/show_all_results_for/));
    expect(views.performSearch).toHaveBeenCalledWith('missing');

    await typeSearch('milk');
    await fireEvent.click(screen.getByText('Buy milk'));
    expect(selection.selectTask).toHaveBeenCalledWith('task-milk');
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('closes from Escape without running a search', async () => {
    tasks.allTasks = [milk];
    const onOpenChange = vi.fn();
    render(SearchCommand, { props: { open: true, onOpenChange } });
    const input = await typeSearch('milk');
    await fireEvent.keyDown(input, { key: 'a' });
    expect(onOpenChange).not.toHaveBeenCalled();
    await fireEvent.keyDown(input, { key: 'Escape' });
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('starts a new task from the selected list, the first project list, or nowhere', async () => {
    interactions.startNewTaskMode.mockClear();
    views.changeView.mockClear();
    tasks.allTasks = [];
    tasks.selectedListId = 'list-selected';
    tasks.projects = [{ id: 'project-1', taskLists: [{ id: 'list-fallback' }] }];
    const rendered = render(SearchCommand, { props: { open: true, onOpenChange: vi.fn() } });

    await fireEvent.click(screen.getByText('add_new_task'));
    expect(interactions.startNewTaskMode).toHaveBeenCalledWith('list-selected');

    tasks.selectedListId = null;
    await rendered.rerender({ open: true, onOpenChange: vi.fn() });
    await fireEvent.click(screen.getByText('add_new_task'));
    expect(interactions.startNewTaskMode).toHaveBeenCalledWith('list-fallback');

    tasks.projects = [{ id: 'project-1', taskLists: [] }];
    interactions.startNewTaskMode.mockClear();
    await rendered.rerender({ open: true, onOpenChange: vi.fn() });
    await fireEvent.click(screen.getByText('add_new_task'));
    expect(interactions.startNewTaskMode).not.toHaveBeenCalled();

    await fireEvent.click(screen.getByText('view_all_tasks'));
    expect(views.changeView).toHaveBeenCalledWith('all');
  });

  it('keeps command mode from searching and closes when a command is chosen', async () => {
    tasks.allTasks = [milk];
    views.performSearch.mockClear();
    const onOpenChange = vi.fn();
    render(SearchCommand, { props: { open: true, onOpenChange } });

    const input = await typeSearch('>');
    expect(input).toHaveAttribute('placeholder', 'type_a_command');
    expect(screen.queryByText('Buy milk')).not.toBeInTheDocument();
    await fireEvent.click(screen.getByText('settings'));
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(views.performSearch).not.toHaveBeenCalled();
  });
});
