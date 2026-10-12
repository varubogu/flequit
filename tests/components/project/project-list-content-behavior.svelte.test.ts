import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/svelte';
import ProjectListContent from '$lib/components/project/project-list-content.svelte';
import { selectionStore } from '$lib/stores/selection-store.svelte';
import { setTranslationService } from '$lib/stores/locale.svelte';
import { createUnitTestTranslationService } from '../../unit-translation-mock';
import { createMockProjectTree, createMockTaskListWithTasks } from '../../utils/mock-factories';
import type { ProjectTree } from '$lib/types/project';

function createLogic(projects: ProjectTree[]) {
  return {
    expandedProjects: new Set<string>(),
    projectsData: projects,
    toggleTaskLists: 'Toggle lists',
    handleProjectSelect: vi.fn(),
    toggleProjectExpansion: vi.fn(),
    getProjectTaskCount: vi.fn(() => 3),
    openProjectDialog: vi.fn(),
    openTaskListDialog: vi.fn(),
    handleProjectDragStart: vi.fn(),
    handleProjectDragOver: vi.fn(),
    handleProjectDrop: vi.fn(async () => {}),
    handleProjectDragEnd: vi.fn(),
    handleProjectDragEnter: vi.fn(),
    handleProjectDragLeave: vi.fn(),
    createProjectContextMenu: vi.fn(() => [])
  };
}

describe('ProjectListContent behavior', () => {
  beforeEach(() => {
    setTranslationService(createUnitTestTranslationService());
    selectionStore.reset();
  });

  it('highlights the selected project, toggles lists, and shows the default color when none is set', async () => {
    const withLists = createMockProjectTree({
      id: 'project-1',
      name: 'Work',
      color: '#ff0000',
      taskLists: [createMockTaskListWithTasks({ id: 'list-1', name: 'Todo' })]
    });
    const plain = createMockProjectTree({
      id: 'project-2',
      name: 'Personal',
      color: undefined,
      taskLists: []
    });
    const logic = createLogic([withLists, plain]);
    logic.expandedProjects.add('project-1');
    selectionStore.selectProject('project-1');

    render(ProjectListContent, {
      props: { logic, currentView: 'project', onViewChange: vi.fn() }
    });

    const work = screen.getByTestId('project-project-1');
    expect(work.className).toContain('bg-primary/20');
    expect(screen.getByText('Work')).toBeInTheDocument();
    expect(screen.getAllByText('3').length).toBeGreaterThan(0);
    expect(work.querySelector('div[style]')?.getAttribute('style') ?? '').toMatch(
      /#ff0000|rgb\(255,\s*0,\s*0\)/i
    );

    const personal = screen.getByTestId('project-project-2');
    expect(personal.className).not.toContain('bg-primary/20');
    expect(personal.querySelector('div[style]')?.getAttribute('style') ?? '').toMatch(
      /#3b82f6|rgb\(59,\s*130,\s*246\)/i
    );
    expect(screen.queryByTestId('toggle-project-project-2')).not.toBeInTheDocument();

    await fireEvent.click(screen.getByTestId('toggle-project-project-1'));
    expect(logic.toggleProjectExpansion).toHaveBeenCalledWith('project-1');
    await fireEvent.click(personal);
    expect(logic.handleProjectSelect).toHaveBeenCalledWith(plain);
  });

  it('highlights a project when the selected task list belongs to it', () => {
    const project = createMockProjectTree({
      id: 'project-1',
      name: 'Work',
      taskLists: [createMockTaskListWithTasks({ id: 'list-9', name: 'Todo' })]
    });
    const logic = createLogic([project]);
    selectionStore.selectList('list-9');

    render(ProjectListContent, { props: { logic, currentView: 'tasklist' } });

    expect(screen.getByTestId('project-project-1').className).toContain('bg-primary/20');
  });

  it('hides names and counts when collapsed and forwards drag events', async () => {
    const project = createMockProjectTree({
      id: 'project-1',
      name: 'Work',
      taskLists: [createMockTaskListWithTasks({ id: 'list-1' })]
    });
    const logic = createLogic([project]);

    render(ProjectListContent, { props: { logic, isCollapsed: true, currentView: 'all' } });

    expect(screen.queryByText('Work')).not.toBeInTheDocument();
    expect(screen.queryByText('3')).not.toBeInTheDocument();
    expect(screen.queryByTestId('toggle-project-project-1')).not.toBeInTheDocument();

    const button = screen.getByTestId('project-project-1');
    await fireEvent.dragStart(button);
    await fireEvent.dragOver(button);
    await fireEvent.drop(button);
    await fireEvent.dragEnd(button);
    await fireEvent.dragEnter(button);
    await fireEvent.dragLeave(button);

    expect(logic.handleProjectDragStart).toHaveBeenCalled();
    expect(logic.handleProjectDragOver).toHaveBeenCalled();
    expect(logic.handleProjectDrop).toHaveBeenCalled();
    expect(logic.handleProjectDragEnd).toHaveBeenCalled();
    expect(logic.handleProjectDragEnter).toHaveBeenCalled();
    expect(logic.handleProjectDragLeave).toHaveBeenCalled();
  });
});
