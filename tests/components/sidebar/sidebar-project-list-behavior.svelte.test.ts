import { afterEach, describe, expect, test, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/svelte';
import SidebarProjectList from '$lib/components/sidebar/sidebar-project-list.svelte';
import { ProjectCompositeService } from '$lib/services/composite/project-composite';
import { selectionStore } from '$lib/stores/selection-store.svelte';
import { taskStore } from '$lib/stores/tasks.svelte';
import type { ProjectTree } from '$lib/types/project';

const sidebar = vi.hoisted(() => ({
  state: 'expanded' as 'expanded' | 'collapsed',
  open: true,
  isMobile: false,
  toggleSidebar: vi.fn(),
  setOpen: vi.fn()
}));

vi.mock('$lib/components/ui/sidebar/context.svelte.js', () => ({
  useSidebar: () => sidebar
}));

vi.mock('$lib/components/project/project-list.svelte', async () => {
  return import('./project-list-stub.svelte');
});

const project = {
  id: 'project-1',
  name: 'Home',
  description: '',
  color: '#112233',
  orderIndex: 0,
  isArchived: false,
  createdAt: new Date('2024-01-01T00:00:00Z'),
  updatedAt: new Date('2024-01-01T00:00:00Z'),
  allTags: [],
  taskLists: []
} as ProjectTree;

afterEach(() => {
  sidebar.state = 'expanded';
  selectionStore.reset();
  taskStore.setProjects([]);
  vi.restoreAllMocks();
});

async function saveProject(name: string) {
  await fireEvent.click(screen.getByTitle('プロジェクトを追加'));
  await fireEvent.input(screen.getByLabelText('Project Name'), { target: { value: name } });
  await fireEvent.click(screen.getByRole('button', { name: 'save' }));
}

describe('SidebarProjectList', () => {
  test('shows the empty message only while expanded, and the project list otherwise', () => {
    taskStore.setProjects([]);
    const expanded = render(SidebarProjectList, { props: { currentView: 'all' } });
    expect(screen.getByText('no_projects_yet')).toBeInTheDocument();
    expect(screen.queryByTestId('project-list-stub')).not.toBeInTheDocument();
    expanded.unmount();

    sidebar.state = 'collapsed';
    const collapsed = render(SidebarProjectList, { props: { currentView: 'all' } });
    expect(screen.queryByText('no_projects_yet')).not.toBeInTheDocument();
    expect(screen.queryByText('projects')).not.toBeInTheDocument();
    expect(screen.getByTitle('プロジェクトを追加')).toBeInTheDocument();
    collapsed.unmount();

    sidebar.state = 'expanded';
    taskStore.setProjects([project]);
    render(SidebarProjectList, { props: { currentView: 'project' } });
    expect(screen.getByTestId('project-list-stub')).toHaveTextContent('expanded-list');
    expect(screen.queryByText('no_projects_yet')).not.toBeInTheDocument();
  });

  test('selects a created project and changes the view', async () => {
    const onViewChange = vi.fn();
    vi.spyOn(ProjectCompositeService, 'createProject').mockResolvedValue({
      ...project,
      id: 'project-new',
      name: 'Garden'
    });

    render(SidebarProjectList, { props: { onViewChange } });
    await saveProject('Garden');

    expect(ProjectCompositeService.createProject).toHaveBeenCalledWith({
      name: 'Garden',
      color: '#3b82f6'
    });
    expect(selectionStore.selectedProjectId).toBe('project-new');
    expect(onViewChange).toHaveBeenCalledWith('project');
    expect(screen.queryByLabelText('Project Name')).not.toBeInTheDocument();
  });

  test('closes without changing the view when creation returns nothing', async () => {
    const onViewChange = vi.fn();
    vi.spyOn(ProjectCompositeService, 'createProject').mockResolvedValue(null);

    render(SidebarProjectList, { props: { onViewChange } });
    await saveProject('Nope');

    expect(onViewChange).not.toHaveBeenCalled();
    expect(selectionStore.selectedProjectId).toBeNull();
    expect(screen.queryByLabelText('Project Name')).not.toBeInTheDocument();
  });

  test('selects the project even when no view callback is provided', async () => {
    vi.spyOn(ProjectCompositeService, 'createProject').mockResolvedValue({
      ...project,
      id: 'project-solo'
    });

    render(SidebarProjectList, { props: {} });
    await saveProject('Solo');

    expect(selectionStore.selectedProjectId).toBe('project-solo');
  });
});
