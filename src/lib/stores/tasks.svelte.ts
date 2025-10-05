import type { Task, TaskWithSubTasks } from '$lib/types/task';
import type { ProjectTree } from '$lib/types/project';
import type { TaskList } from '$lib/types/task-list';
import type { Project } from '$lib/types/project';
import type { Tag } from '$lib/types/tag';
import type { SubTask } from '$lib/types/sub-task';
import { tagStore } from './tags.svelte';
import { selectionStore } from './selection-store.svelte';
import { projectStore } from './project-store.svelte';
import { taskListStore } from './task-list-store.svelte';
import { subTaskStore } from './sub-task-store.svelte';
import { taskCoreStore } from './task-core-store.svelte';
import { SvelteDate } from 'svelte/reactivity';
import { errorHandler } from './error-handler.svelte';
import { getBackendService } from '$lib/infrastructure/backends';
import { ProjectTreeTraverser } from '$lib/utils/project-tree-traverser';

// Global state using Svelte 5 runes
export class TaskStore {
  // projectsはProjectStoreに委譲（Phase 1.1のselectionStoreパターンと同様）
  get projects() { return projectStore.projects; }
  set projects(value: ProjectTree[]) { projectStore.projects = value; }
  isNewTaskMode = $state<boolean>(false);
  newTaskData = $state<TaskWithSubTasks | null>(null);

  // 選択状態はSelectionStoreに委譲
  get selectedTaskId() { return selectionStore.selectedTaskId; }
  set selectedTaskId(value: string | null) { selectionStore.selectTask(value); }

  get selectedSubTaskId() { return selectionStore.selectedSubTaskId; }
  set selectedSubTaskId(value: string | null) { selectionStore.selectSubTask(value); }

  get selectedProjectId() { return selectionStore.selectedProjectId; }
  set selectedProjectId(value: string | null) { selectionStore.selectProject(value); }

  get selectedListId() { return selectionStore.selectedListId; }
  set selectedListId(value: string | null) { selectionStore.selectList(value); }

  get pendingTaskSelection() { return selectionStore.pendingTaskSelection; }
  set pendingTaskSelection(value: string | null) { selectionStore.pendingTaskSelection = value; }

  get pendingSubTaskSelection() { return selectionStore.pendingSubTaskSelection; }
  set pendingSubTaskSelection(value: string | null) { selectionStore.pendingSubTaskSelection = value; }

  // データサービス経由でバックエンドにアクセス

  constructor() {
    // Listen for tag update events to avoid circular dependency
    if (typeof window !== 'undefined') {
      window.addEventListener('tag-updated', (event: Event) => {
        const customEvent = event as CustomEvent<Tag>;
        this.updateTagInAllTasks(customEvent.detail);
      });
    }
  }

  // Computed values
  get selectedTask(): TaskWithSubTasks | null {
    if (!this.selectedTaskId) return null;
    return ProjectTreeTraverser.findTask(this.projects, this.selectedTaskId);
  }

  get selectedSubTask() {
    return subTaskStore.selectedSubTask;
  }

  get allTasks(): TaskWithSubTasks[] {
    return ProjectTreeTraverser.getAllTasks(this.projects);
  }

  getTaskById(taskId: string): TaskWithSubTasks | null {
    return ProjectTreeTraverser.findTask(this.projects, taskId);
  }

  getTaskProjectAndList(taskId: string): { project: Project; taskList: TaskList } | null {
    return ProjectTreeTraverser.findTaskContext(this.projects, taskId);
  }

  get todayTasks(): TaskWithSubTasks[] {
    const today = new SvelteDate();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new SvelteDate(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return this.allTasks.filter((task) => {
      if (!task.planEndDate) return false;
      // eslint-disable-next-line svelte/prefer-svelte-reactivity
      const dueDate = new Date(task.planEndDate);
      return dueDate >= today && dueDate < tomorrow;
    });
  }

  get overdueTasks(): TaskWithSubTasks[] {
    const today = new SvelteDate();
    today.setHours(0, 0, 0, 0);

    return this.allTasks.filter((task) => {
      if (!task.planEndDate || task.status === 'completed') return false;
      // eslint-disable-next-line svelte/prefer-svelte-reactivity
      const dueDate = new Date(task.planEndDate);
      return dueDate < today;
    });
  }

  // Actions
  async setProjects(projects: ProjectTree[]) {
    projectStore.setProjects(projects);
    taskCoreStore.setProjects(projectStore.projects);
  }

  // データ読み込み専用メソッド（保存処理なし）
  loadProjectsData(projects: ProjectTree[]) {
    projectStore.loadProjects(projects);
    taskCoreStore.loadProjectsData(projectStore.projects);
  }

  // New task mode methods
  startNewTaskMode(listId: string) {
    this.isNewTaskMode = true;
    this.selectedTaskId = null;
    this.selectedSubTaskId = null;

    const projectId = taskListStore.getProjectIdByListId(listId);
    if (!projectId) {
      console.error('Failed to find project for list:', listId);
      return;
    }

    this.newTaskData = {
      id: 'new-task',
      projectId: projectId,
      title: '',
      description: '',
      status: 'not_started',
      priority: 0,
      listId: listId,
      assignedUserIds: [],
      tagIds: [],
      orderIndex: 0,
      isArchived: false,
      createdAt: new SvelteDate(),
      updatedAt: new SvelteDate(),
      subTasks: [],
      tags: []
    };
  }

  cancelNewTaskMode() {
    this.isNewTaskMode = false;
    this.newTaskData = null;
    this.pendingTaskSelection = null;
    this.pendingSubTaskSelection = null;
  }

  async saveNewTask(): Promise<string | null> {
    if (!this.newTaskData || !this.newTaskData.listId || !this.newTaskData.title?.trim()) {
      return null;
    }

    const taskData = this.newTaskData as Task;
    const newTask = await this.addTask(taskData.listId, taskData);

    if (newTask) {
      this.isNewTaskMode = false;
      this.newTaskData = null;
      this.pendingTaskSelection = null;
      this.pendingSubTaskSelection = null;
      this.selectedTaskId = newTask.id;
      return newTask.id;
    }

    return null;
  }

  clearPendingSelections() {
    selectionStore.clearPendingSelections();
  }

  updateNewTaskData(updates: Partial<TaskWithSubTasks>) {
    if (this.newTaskData) {
      this.newTaskData = { ...this.newTaskData, ...updates };
    }
  }

  // Tag management methods
  async addTagToTask(taskId: string, tagName: string) {
    const trimmed = tagName.trim();
    if (!trimmed) {
      console.warn('Empty tag name provided');
      return;
    }

    const context = ProjectTreeTraverser.findTaskContext(this.projects, taskId);
    if (!context) {
      console.error('Failed to find task:', taskId);
      return;
    }

    const { project } = context;
    const task = ProjectTreeTraverser.findTask(this.projects, taskId);
    if (!task) return;

    // Check if tag already exists on this task (by name, not ID)
    if (task.tags.some((t) => t.name.toLowerCase() === trimmed.toLowerCase())) {
      // すでにタグが存在する場合は何もしない
      return;
    }

    // 即時保存：新しいtagging serviceを使用
    let tag: Tag;
    try {
      console.debug('[addTagToTask] invoking backends create_task_tag', { projectId: project.id, taskId, tagName: trimmed });
      const backend = await getBackendService();
      tag = await backend.tagging.createTaskTag(project.id, taskId, trimmed);
    } catch (error) {
      console.error('Failed to sync tag addition to backends:', error);
      errorHandler.addSyncError('タスクタグ追加', 'task', taskId, error);
      return;
    }
    task.tags.push(tag);
  }

  async removeTagFromTask(taskId: string, tagId: string) {
    const context = ProjectTreeTraverser.findTaskContext(this.projects, taskId);
    if (!context) return;

    const { project } = context;
    const task = ProjectTreeTraverser.findTask(this.projects, taskId);
    if (!task) return;

    const tagIndex = task.tags.findIndex((t) => t.id === tagId);
    if (tagIndex !== -1) {
      task.tags.splice(tagIndex, 1);
      task.updatedAt = new SvelteDate();

      // 即時保存：新しいtagging serviceを使用
      try {
        const backend = await getBackendService();
        await backend.tagging.deleteTaskTag(project.id, taskId, tagId);
      } catch (error) {
        console.error('Failed to sync tag removal to backends:', error);
        errorHandler.addSyncError('タスクタグ削除', 'task', taskId, error);
      }
    }
  }

  addTagToNewTask(tagName: string) {
    if (this.newTaskData && this.selectedProjectId) {
      const tag = tagStore.getOrCreateTagWithProject(tagName, this.selectedProjectId);
      if (!tag) return;

      // Check if tag already exists on this task (by name, not ID)
      if (!this.newTaskData.tags.some((t) => t.name.toLowerCase() === tag.name.toLowerCase())) {
        this.newTaskData.tags.push(tag);
      }
    }
  }

  removeTagFromNewTask(tagId: string) {
    if (this.newTaskData) {
      const tagIndex = this.newTaskData.tags.findIndex((t) => t.id === tagId);
      if (tagIndex !== -1) {
        this.newTaskData.tags.splice(tagIndex, 1);
      }
    }
  }


  // Get task count for a specific tag
  getTaskCountByTag(tagName: string): number {
    return ProjectTreeTraverser.getTaskCountByTag(this.projects, tagName);
  }

  // Remove tag from all tasks and subtasks by tag ID
  removeTagFromAllTasks(tagId: string) {
    const now = new SvelteDate();

    // タグ削除前に、どのタスク/サブタスクがこのタグを持っているか記録
    const affectedTasks: TaskWithSubTasks[] = [];
    const affectedSubTasks: SubTask[] = [];

    for (const project of this.projects) {
      for (const list of project.taskLists) {
        for (const task of list.tasks) {
          if (task.tags.some((t) => t.id === tagId)) {
            affectedTasks.push(task);
          }
          for (const subTask of task.subTasks) {
            if (subTask.tags?.some((t) => t.id === tagId)) {
              affectedSubTasks.push(subTask);
            }
          }
        }
      }
    }

    // ProjectTreeTraverserでタグを削除
    ProjectTreeTraverser.removeTagFromAllTasks(this.projects, tagId);

    // 影響を受けたタスクとサブタスクのupdatedAtを更新
    affectedTasks.forEach(task => task.updatedAt = now);
    affectedSubTasks.forEach(subTask => subTask.updatedAt = now);
  }

  // Update tag in all tasks and subtasks when tag is modified
  updateTagInAllTasks(updatedTag: Tag) {
    const now = new SvelteDate();

    // タグ更新前に、どのタスク/サブタスクがこのタグを持っているか記録
    const affectedTasks: TaskWithSubTasks[] = [];
    const affectedSubTasks: SubTask[] = [];

    for (const project of this.projects) {
      for (const list of project.taskLists) {
        for (const task of list.tasks) {
          if (task.tags.some((t) => t.id === updatedTag.id)) {
            affectedTasks.push(task);
          }
          for (const subTask of task.subTasks) {
            if (subTask.tags?.some((t) => t.id === updatedTag.id)) {
              affectedSubTasks.push(subTask);
            }
          }
        }
      }
    }

    // ProjectTreeTraverserでタグを更新
    ProjectTreeTraverser.updateTagInAllTasks(this.projects, updatedTag);

    // 影響を受けたタスクとサブタスクのupdatedAtを更新
    affectedTasks.forEach(task => task.updatedAt = now);
    affectedSubTasks.forEach(subTask => subTask.updatedAt = now);

    // Update in new task data if present
    if (this.newTaskData) {
      const newTaskTagIndex = this.newTaskData.tags.findIndex((t) => t.id === updatedTag.id);
      if (newTaskTagIndex !== -1) {
        this.newTaskData.tags[newTaskTagIndex] = { ...updatedTag };
      }
    }
  }

  // Helper method to get project ID by task ID
  getProjectIdByTaskId(taskId: string): string | null {
    return ProjectTreeTraverser.getProjectIdByTaskId(this.projects, taskId);
  }

  // Helper method to get project ID by tag ID
  getProjectIdByTagId(tagId: string): string | null {
    return ProjectTreeTraverser.getProjectIdByTagId(this.projects, tagId);
  }
}

// Create global store instance
export const taskStore = new TaskStore();
