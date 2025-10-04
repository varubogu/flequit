import type { Task, TaskWithSubTasks } from '$lib/types/task';
import type { ProjectTree } from '$lib/types/project';
import type { TaskListWithTasks } from '$lib/types/task-list';
import type { TaskList } from '$lib/types/task-list';
import type { Project } from '$lib/types/project';
import type { Tag } from '$lib/types/tag';
import { tagStore } from './tags.svelte';
import { selectionStore } from './selection-store.svelte';
import { projectStore } from './project-store.svelte';
import { taskListStore } from './task-list-store.svelte';
import { subTaskStore } from './sub-task-store.svelte';
import { SvelteDate } from 'svelte/reactivity';
import { dataService } from '$lib/services/data-service';
import { errorHandler } from './error-handler.svelte';
import { getBackendService } from '$lib/infrastructure/backends';

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

    for (const project of this.projects) {
      for (const list of project.taskLists) {
        const task = list.tasks.find((t) => t.id === this.selectedTaskId);
        if (task) return task;
      }
    }
    return null;
  }

  get selectedSubTask() {
    return subTaskStore.selectedSubTask;
  }

  get allTasks(): TaskWithSubTasks[] {
    return this.projects.flatMap((project) => project.taskLists.flatMap((list) => list.tasks));
  }

  getTaskById(taskId: string): TaskWithSubTasks | null {
    for (const project of this.projects) {
      for (const list of project.taskLists) {
        const task = list.tasks.find((t) => t.id === taskId);
        if (task) return task;
      }
    }
    return null;
  }

  getTaskProjectAndList(taskId: string): { project: Project; taskList: TaskList } | null {
    for (const project of this.projects) {
      for (const list of project.taskLists) {
        const task = list.tasks.find((t) => t.id === taskId);
        if (task) {
          return { project, taskList: list };
        }
      }
    }
    return null;
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
  }

  // データ読み込み専用メソッド（保存処理なし）
  loadProjectsData(projects: ProjectTree[]) {
    projectStore.loadProjects(projects);
  }


  async updateTask(taskId: string, updates: Partial<Task>) {
    console.log('[TaskStore] updateTask called with:', { taskId, updates });
    console.log('[TaskStore] updateTask stack:', new Error().stack);
    // まずローカル状態を更新
    for (const project of this.projects) {
      for (const list of project.taskLists) {
        const taskIndex = list.tasks.findIndex((t) => t.id === taskId);
        if (taskIndex !== -1) {
          list.tasks[taskIndex] = {
            ...list.tasks[taskIndex],
            ...updates,
            updatedAt: new SvelteDate()
          };

          // バックエンドに同期（自動保存は個別に実行せず、定期保存に任せる）
          try {
            await dataService.updateTaskWithSubTasks(taskId, updates as Partial<TaskWithSubTasks>);
          } catch (error) {
            console.error('Failed to sync task update to backends:', error);
            errorHandler.addSyncError('タスク更新', 'task', taskId, error);
          }
          return;
        }
      }
    }
  }

  async toggleTaskStatus(taskId: string) {
    const task = this.allTasks.find((t) => t.id === taskId);
    if (!task) return;

    const newStatus = task.status === 'completed' ? 'not_started' : 'completed';
    await this.updateTask(taskId, { status: newStatus });
  }

  async addTask(listId: string, task: Omit<Task, 'id' | 'created_at' | 'updated_at'>) {
    const newTask: TaskWithSubTasks = {
      ...task,
      id: crypto.randomUUID(),
      createdAt: new SvelteDate(),
      updatedAt: new SvelteDate(),
      subTasks: [],
      tags: []
    };

    // まずローカル状態に追加
    for (const project of this.projects) {
      const list = project.taskLists.find((l) => l.id === listId);
      if (list) {
        list.tasks.push(newTask);

        // バックエンドに同期（作成操作は即座に保存）
        try {
          await dataService.createTaskWithSubTasks(listId, newTask);
        } catch (error) {
          console.error('Failed to sync new task to backends:', error);
          errorHandler.addSyncError('タスク作成', 'task', newTask.id, error);
          // エラーが発生した場合はローカル状態から削除
          const taskIndex = list.tasks.findIndex((t) => t.id === newTask.id);
          if (taskIndex !== -1) {
            list.tasks.splice(taskIndex, 1);
          }
          return null;
        }

        return newTask;
      }
    }
    return null;
  }

  createRecurringTask(taskData: Partial<Task>): TaskWithSubTasks | null {
    if (!taskData.listId) return null;

    const newTask: TaskWithSubTasks = {
      id: crypto.randomUUID(),
      projectId: taskData.projectId || '',
      subTaskId: taskData.subTaskId,
      listId: taskData.listId,
      title: taskData.title || '',
      description: taskData.description,
      status: taskData.status || 'not_started',
      priority: taskData.priority || 0,
      planStartDate: taskData.planStartDate,
      planEndDate: taskData.planEndDate,
      isRangeDate: taskData.isRangeDate || false,
      recurrenceRule: taskData.recurrenceRule,
      assignedUserIds: taskData.assignedUserIds || [],
      tagIds: taskData.tagIds || [],
      orderIndex: taskData.orderIndex || 0,
      isArchived: taskData.isArchived || false,
      createdAt: new SvelteDate(),
      updatedAt: new SvelteDate(),
      subTasks: [],
      tags: []
    };

    for (const project of this.projects) {
      const list = project.taskLists.find((l) => l.id === taskData.listId);
      if (list) {
        list.tasks.push(newTask);
        return newTask;
      }
    }
    return null;
  }

  async deleteTask(taskId: string) {
    for (const project of this.projects) {
      for (const list of project.taskLists) {
        const taskIndex = list.tasks.findIndex((t) => t.id === taskId);
        if (taskIndex !== -1) {
          // バックアップとして削除するタスクを保持
          const deletedTask = list.tasks[taskIndex];

          // まずローカル状態から削除
          list.tasks.splice(taskIndex, 1);
          if (this.selectedTaskId === taskId) {
            this.selectedTaskId = null;
          }

          // バックエンドに同期（削除操作は即座に保存）
          try {
            await dataService.deleteTaskWithSubTasks(taskId, project.id);
          } catch (error) {
            console.error('Failed to sync task deletion to backends:', error);
            errorHandler.addSyncError('タスク削除', 'task', taskId, error);
            // エラーが発生した場合はローカル状態を復元
            list.tasks.splice(taskIndex, 0, deletedTask);
          }
          return;
        }
      }
    }
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

    for (const project of this.projects) {
      for (const list of project.taskLists) {
        const task = list.tasks.find((t) => t.id === taskId);
        if (task) {
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
          return;
        }
      }
    }

    console.error('Failed to find task:', taskId);
  }

  async removeTagFromTask(taskId: string, tagId: string) {
    for (const project of this.projects) {
      for (const list of project.taskLists) {
        const task = list.tasks.find((t) => t.id === taskId);
        if (task) {
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
          return;
        }
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
    let count = 0;

    for (const project of this.projects) {
      for (const list of project.taskLists) {
        for (const task of list.tasks) {
          if (task.tags.some((tag) => tag.name.toLowerCase() === tagName.toLowerCase())) {
            count++;
          }
        }
      }
    }

    return count;
  }

  // Remove tag from all tasks and subtasks by tag ID
  removeTagFromAllTasks(tagId: string) {
    for (const project of this.projects) {
      for (const list of project.taskLists) {
        for (const task of list.tasks) {
          // Remove from main task
          const taskTagIndex = task.tags.findIndex((t) => t.id === tagId);
          if (taskTagIndex !== -1) {
            task.tags.splice(taskTagIndex, 1);
            task.updatedAt = new SvelteDate();
          }

          // Remove from all subtasks
          for (const subTask of task.subTasks) {
            if (!subTask.tags) continue;
            const subTaskTagIndex = subTask.tags.findIndex((t) => t.id === tagId);
            if (subTaskTagIndex !== -1) {
              subTask.tags.splice(subTaskTagIndex, 1);
              subTask.updatedAt = new SvelteDate();
            }
          }
        }
      }
    }
  }

  // Update tag in all tasks and subtasks when tag is modified
  updateTagInAllTasks(updatedTag: Tag) {
    for (const project of this.projects) {
      for (const list of project.taskLists) {
        for (const task of list.tasks) {
          // Update in main task
          const taskTagIndex = task.tags.findIndex((t) => t.id === updatedTag.id);
          if (taskTagIndex !== -1) {
            task.tags[taskTagIndex] = { ...updatedTag };
            task.updatedAt = new SvelteDate();
          }

          // Update in subtasks
          for (const subTask of task.subTasks) {
            if (!subTask.tags) continue;
            const subTaskTagIndex = subTask.tags.findIndex((t) => t.id === updatedTag.id);
            if (subTaskTagIndex !== -1) {
              subTask.tags[subTaskTagIndex] = { ...updatedTag };
              subTask.updatedAt = new SvelteDate();
            }
          }
        }
      }
    }

    // Update in new task data if present
    if (this.newTaskData) {
      const newTaskTagIndex = this.newTaskData.tags.findIndex((t) => t.id === updatedTag.id);
      if (newTaskTagIndex !== -1) {
        this.newTaskData.tags[newTaskTagIndex] = { ...updatedTag };
      }
    }
  }

  async moveTaskToList(taskId: string, newTaskListId: string) {
    // 最初に移動先のタスクリストが存在するかチェック
    let targetTaskList: TaskListWithTasks | null = null;
    let targetProject: ProjectTree | null = null;

    for (const project of this.projects) {
      const foundTaskList = project.taskLists.find((tl) => tl.id === newTaskListId);
      if (foundTaskList) {
        targetTaskList = foundTaskList;
        targetProject = project;
        break;
      }
    }

    // 移動先が存在しない場合は何もしない
    if (!targetTaskList || !targetProject) return;

    // タスクを現在の位置から探して削除
    let taskToMove: TaskWithSubTasks | null = null;

    for (const project of this.projects) {
      for (const taskList of project.taskLists) {
        const taskIndex = taskList.tasks.findIndex((t) => t.id === taskId);
        if (taskIndex !== -1) {
          taskToMove = taskList.tasks[taskIndex];
          taskList.tasks.splice(taskIndex, 1);
          taskList.updatedAt = new SvelteDate();
          break;
        }
      }
      if (taskToMove) break;
    }

    if (!taskToMove) return;

    // タスクのlist_idを更新
    taskToMove.listId = newTaskListId;
    taskToMove.updatedAt = new SvelteDate();

    // 新しいタスクリストに追加
    targetTaskList.tasks.push(taskToMove);
    targetTaskList.updatedAt = new SvelteDate();
    targetProject.updatedAt = new SvelteDate();

    // バックエンドに同期
    try {
      await dataService.updateTask(taskId, { listId: newTaskListId });
    } catch (error) {
      console.error('Failed to sync task move to backends:', error);
      errorHandler.addSyncError('タスク移動', 'task', taskId, error);
    }
  }

  // Helper method to get project ID by task ID
  getProjectIdByTaskId(taskId: string): string | null {
    for (const project of this.projects) {
      for (const list of project.taskLists) {
        const task = list.tasks.find((t) => t.id === taskId);
        if (task) {
          return project.id;
        }
      }
    }
    return null;
  }

  // Helper method to get project ID by tag ID
  getProjectIdByTagId(tagId: string): string | null {
    for (const project of this.projects) {
      for (const list of project.taskLists) {
        for (const task of list.tasks) {
          // Check if tag exists on this task
          if (task.tags.some((tag) => tag.id === tagId)) {
            return project.id;
          }
          // Check if tag exists on subtasks
          for (const subTask of task.subTasks) {
            if (subTask.tags && subTask.tags.some((tag) => tag.id === tagId)) {
              return project.id;
            }
          }
        }
      }
    }
    return null;
  }
}

// Create global store instance
export const taskStore = new TaskStore();
