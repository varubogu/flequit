import type { Task, TaskWithSubTasks } from '$lib/types/task';
import type { ProjectTree } from '$lib/types/project';
import type { SubTask } from '$lib/types/sub-task';
import type { TaskListWithTasks } from '$lib/types/task-list';
import type { TaskList } from '$lib/types/task-list';
import type { Project } from '$lib/types/project';
import type { Tag } from '$lib/types/tag';
import { tagStore } from './tags.svelte';
import { SvelteDate, SvelteMap } from 'svelte/reactivity';
import { dataService } from '$lib/services/data-service';
import { errorHandler } from './error-handler.svelte';
import { getBackendService } from '$lib/services/backend';

// Global state using Svelte 5 runes
export class TaskStore {
  projects = $state<ProjectTree[]>([]);
  selectedTaskId = $state<string | null>(null);
  selectedSubTaskId = $state<string | null>(null);
  selectedProjectId = $state<string | null>(null);
  selectedListId = $state<string | null>(null);
  isNewTaskMode = $state<boolean>(false);
  newTaskData = $state<TaskWithSubTasks | null>(null);
  pendingTaskSelection = $state<string | null>(null);
  pendingSubTaskSelection = $state<string | null>(null);

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
      for (const list of project.task_lists) {
        const task = list.tasks.find((t) => t.id === this.selectedTaskId);
        if (task) return task;
      }
    }
    return null;
  }

  get selectedSubTask(): SubTask | null {
    if (!this.selectedSubTaskId) return null;

    for (const project of this.projects) {
      for (const list of project.task_lists) {
        for (const task of list.tasks) {
          const subTask = task.sub_tasks.find((st) => st.id === this.selectedSubTaskId);
          if (subTask) return subTask;
        }
      }
    }
    return null;
  }

  get allTasks(): TaskWithSubTasks[] {
    return this.projects.flatMap((project) => project.task_lists.flatMap((list) => list.tasks));
  }

  getTaskById(taskId: string): TaskWithSubTasks | null {
    for (const project of this.projects) {
      for (const list of project.task_lists) {
        const task = list.tasks.find((t) => t.id === taskId);
        if (task) return task;
      }
    }
    return null;
  }

  getTaskProjectAndList(taskId: string): { project: Project; taskList: TaskList } | null {
    for (const project of this.projects) {
      for (const list of project.task_lists) {
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
      if (!task.plan_end_date) return false;
      // eslint-disable-next-line svelte/prefer-svelte-reactivity
      const dueDate = new Date(task.plan_end_date);
      return dueDate >= today && dueDate < tomorrow;
    });
  }

  get overdueTasks(): TaskWithSubTasks[] {
    const today = new SvelteDate();
    today.setHours(0, 0, 0, 0);

    return this.allTasks.filter((task) => {
      if (!task.plan_end_date || task.status === 'completed') return false;
      // eslint-disable-next-line svelte/prefer-svelte-reactivity
      const dueDate = new Date(task.plan_end_date);
      return dueDate < today;
    });
  }

  // Actions
  async setProjects(projects: ProjectTree[]) {
    this.loadProjectsData(projects);
  }

  // データ読み込み専用メソッド（保存処理なし）
  loadProjectsData(projects: ProjectTree[]) {
    this.projects = projects;

    // Extract and register all tags from sample data to tag store
    const allTags = new SvelteMap<string, Tag>();

    projects.forEach((project) => {
      project.task_lists.forEach((list) => {
        list.tasks.forEach((task) => {
          task.tags.forEach((tag) => {
            allTags.set(tag.id, tag);
          });
        });
      });
    });

    // Register tags in tag store with their original IDs
    allTags.forEach((tag) => {
      tagStore.addTagWithId(tag);
    });

    // Add initial bookmarks for common tags (initialization only, no backend sync)
    const workTag = tagStore.tags.find((tag) => tag.name === 'work');
    const personalTag = tagStore.tags.find((tag) => tag.name === 'personal');

    if (workTag && !tagStore.isBookmarked(workTag.id)) {
      tagStore.setBookmarkForInitialization(workTag.id);
    }
    if (personalTag && !tagStore.isBookmarked(personalTag.id)) {
      tagStore.setBookmarkForInitialization(personalTag.id);
    }
  }

  selectTask(taskId: string | null) {
    this.selectedTaskId = taskId;
    this.selectedSubTaskId = null; // Clear subtask selection when selecting a task
  }

  selectSubTask(subTaskId: string | null) {
    this.selectedSubTaskId = subTaskId;
    this.selectedTaskId = null; // Clear task selection when selecting a subtask
  }

  selectProject(projectId: string | null) {
    this.selectedProjectId = projectId;
    this.selectedListId = null; // Clear list selection when selecting a project
  }

  selectList(listId: string | null) {
    this.selectedListId = listId;
    this.selectedProjectId = null; // Clear project selection when selecting a list
  }

  async updateTask(taskId: string, updates: Partial<Task>) {
    // まずローカル状態を更新
    for (const project of this.projects) {
      for (const list of project.task_lists) {
        const taskIndex = list.tasks.findIndex((t) => t.id === taskId);
        if (taskIndex !== -1) {
          list.tasks[taskIndex] = {
            ...list.tasks[taskIndex],
            ...updates,
            updated_at: new SvelteDate()
          };

          // バックエンドに同期（自動保存は個別に実行せず、定期保存に任せる）
          try {
            await dataService.updateTaskWithSubTasks(taskId, updates as Partial<TaskWithSubTasks>);
          } catch (error) {
            console.error('Failed to sync task update to backend:', error);
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
      created_at: new SvelteDate(),
      updated_at: new SvelteDate(),
      sub_tasks: [],
      tags: []
    };

    // まずローカル状態に追加
    for (const project of this.projects) {
      const list = project.task_lists.find((l) => l.id === listId);
      if (list) {
        list.tasks.push(newTask);

        // バックエンドに同期（作成操作は即座に保存）
        try {
          await dataService.createTaskWithSubTasks(listId, newTask);
        } catch (error) {
          console.error('Failed to sync new task to backend:', error);
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
    if (!taskData.list_id) return null;

    const newTask: TaskWithSubTasks = {
      id: crypto.randomUUID(),
      project_id: taskData.project_id || '',
      sub_task_id: taskData.sub_task_id,
      list_id: taskData.list_id,
      title: taskData.title || '',
      description: taskData.description,
      status: taskData.status || 'not_started',
      priority: taskData.priority || 0,
      plan_start_date: taskData.plan_start_date,
      plan_end_date: taskData.plan_end_date,
      is_range_date: taskData.is_range_date || false,
      recurrence_rule: taskData.recurrence_rule,
      assigned_user_ids: taskData.assigned_user_ids || [],
      tag_ids: taskData.tag_ids || [],
      order_index: taskData.order_index || 0,
      is_archived: taskData.is_archived || false,
      created_at: new SvelteDate(),
      updated_at: new SvelteDate(),
      sub_tasks: [],
      tags: []
    };

    for (const project of this.projects) {
      const list = project.task_lists.find((l) => l.id === taskData.list_id);
      if (list) {
        list.tasks.push(newTask);
        return newTask;
      }
    }
    return null;
  }

  async deleteTask(taskId: string) {
    for (const project of this.projects) {
      for (const list of project.task_lists) {
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
            console.error('Failed to sync task deletion to backend:', error);
            errorHandler.addSyncError('タスク削除', 'task', taskId, error);
            // エラーが発生した場合はローカル状態を復元
            list.tasks.splice(taskIndex, 0, deletedTask);
          }
          return;
        }
      }
    }
  }

  async updateSubTask(subTaskId: string, updates: Partial<SubTask>) {
    // まずローカル状態を更新
    for (const project of this.projects) {
      for (const list of project.task_lists) {
        for (const task of list.tasks) {
          const subTaskIndex = task.sub_tasks.findIndex((st) => st.id === subTaskId);
          if (subTaskIndex !== -1) {
            task.sub_tasks[subTaskIndex] = {
              ...task.sub_tasks[subTaskIndex],
              ...updates,
              updated_at: new SvelteDate()
            };

            // バックエンドに同期（更新操作は定期保存に任せる）
            try {
              await dataService.updateSubTask(subTaskId, {
                title: updates.title,
                description: updates.description,
                status: updates.status,
                priority: updates.priority
              });
            } catch (error) {
              console.error('Failed to sync subtask update to backend:', error);
              errorHandler.addSyncError('サブタスク更新', 'task', subTaskId, error);
            }
            return;
          }
        }
      }
    }
  }

  async addSubTask(
    taskId: string,
    subTask: { title: string; description?: string; status?: string; priority?: number }
  ) {
    try {
      const newSubTask = await dataService.createSubTask(taskId, subTask);

      // ローカル状態に追加
      for (const project of this.projects) {
        for (const list of project.task_lists) {
          const task = list.tasks.find((t) => t.id === taskId);
          if (task) {
            task.sub_tasks.push(newSubTask);
            // 作成操作は即座に保存
            return newSubTask;
          }
        }
      }
      return newSubTask;
    } catch (error) {
      console.error('Failed to create subtask:', error);
      errorHandler.addSyncError('サブタスク作成', 'task', taskId, error);
      return null;
    }
  }

  async deleteSubTask(subTaskId: string) {
    for (const project of this.projects) {
      for (const list of project.task_lists) {
        for (const task of list.tasks) {
          const subTaskIndex = task.sub_tasks.findIndex((st) => st.id === subTaskId);
          if (subTaskIndex !== -1) {
            // バックアップとして削除するサブタスクを保持
            const deletedSubTask = task.sub_tasks[subTaskIndex];

            // まずローカル状態から削除
            task.sub_tasks.splice(subTaskIndex, 1);
            if (this.selectedSubTaskId === subTaskId) {
              this.selectedSubTaskId = null;
            }

            // バックエンドに同期（削除操作は即座に保存）
            try {
              await dataService.deleteSubTask(subTaskId);
            } catch (error) {
              console.error('Failed to sync subtask deletion to backend:', error);
              errorHandler.addSyncError('サブタスク削除', 'task', subTaskId, error);
              // エラーが発生した場合はローカル状態を復元
              task.sub_tasks.splice(subTaskIndex, 0, deletedSubTask);
            }
            return;
          }
        }
      }
    }
  }

  // New task mode methods
  startNewTaskMode(listId: string) {
    this.isNewTaskMode = true;
    this.selectedTaskId = null;
    this.selectedSubTaskId = null;

    const projectId = this.getProjectIdByListId(listId);
    if (!projectId) {
      console.error('Failed to find project for list:', listId);
      return;
    }

    this.newTaskData = {
      id: 'new-task',
      project_id: projectId,
      title: '',
      description: '',
      status: 'not_started',
      priority: 0,
      list_id: listId,
      assigned_user_ids: [],
      tag_ids: [],
      order_index: 0,
      is_archived: false,
      created_at: new SvelteDate(),
      updated_at: new SvelteDate(),
      sub_tasks: [],
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
    if (!this.newTaskData || !this.newTaskData.list_id || !this.newTaskData.title?.trim()) {
      return null;
    }

    const taskData = this.newTaskData as Task;
    const newTask = await this.addTask(taskData.list_id, taskData);

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
    this.pendingTaskSelection = null;
    this.pendingSubTaskSelection = null;
  }

  updateNewTaskData(updates: Partial<TaskWithSubTasks>) {
    if (this.newTaskData) {
      this.newTaskData = { ...this.newTaskData, ...updates };
    }
  }

  // Tag management methods
  async addTagToTask(taskId: string, tagName: string) {
    const tag = tagStore.getOrCreateTag(tagName);
    if (!tag) return;

    for (const project of this.projects) {
      for (const list of project.task_lists) {
        const task = list.tasks.find((t) => t.id === taskId);
        if (task) {
          // Check if tag already exists on this task (by name, not ID)
          if (!task.tags.some((t) => t.name.toLowerCase() === tag.name.toLowerCase())) {
            task.tags.push(tag);
            task.updated_at = new SvelteDate();

            // 即時保存：新しいtagging serviceを使用
            try {
              const backend = await getBackendService();
              await backend.tagging.createTaskTag(project.id, taskId, tag.id);
            } catch (error) {
              console.error('Failed to sync tag addition to backend:', error);
              errorHandler.addSyncError('タスクタグ追加', 'task', taskId, error);
            }
          }
          return;
        }
      }
    }
  }

  async removeTagFromTask(taskId: string, tagId: string) {
    for (const project of this.projects) {
      for (const list of project.task_lists) {
        const task = list.tasks.find((t) => t.id === taskId);
        if (task) {
          const tagIndex = task.tags.findIndex((t) => t.id === tagId);
          if (tagIndex !== -1) {
            task.tags.splice(tagIndex, 1);
            task.updated_at = new SvelteDate();

            // 即時保存：新しいtagging serviceを使用
            try {
              const backend = await getBackendService();
              await backend.tagging.deleteTaskTag(project.id, taskId, tagId);
            } catch (error) {
              console.error('Failed to sync tag removal to backend:', error);
              errorHandler.addSyncError('タスクタグ削除', 'task', taskId, error);
            }
          }
          return;
        }
      }
    }
  }

  addTagToNewTask(tagName: string) {
    if (this.newTaskData) {
      const tag = tagStore.getOrCreateTag(tagName);
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

  async addTagToSubTask(subTaskId: string, tagName: string) {
    const tag = tagStore.getOrCreateTag(tagName);
    if (!tag) return;

    for (const project of this.projects) {
      for (const list of project.task_lists) {
        for (const task of list.tasks) {
          const subTask = task.sub_tasks.find((st) => st.id === subTaskId);
          if (subTask) {
            // Check if tag already exists on this subtask (by name, not ID)
            if (!subTask.tags.some((t) => t.name.toLowerCase() === tag.name.toLowerCase())) {
              subTask.tags.push(tag);
              subTask.updated_at = new SvelteDate();

              // 即時保存：新しいtagging serviceを使用
              try {
                const backend = await getBackendService();
                await backend.tagging.createSubtaskTag(project.id, subTaskId, tag.id);
              } catch (error) {
                console.error('Failed to sync subtask tag addition to backend:', error);
                errorHandler.addSyncError('サブタスクタグ追加', 'subtask', subTaskId, error);
              }
            }
            return;
          }
        }
      }
    }
  }

  async removeTagFromSubTask(subTaskId: string, tagId: string) {
    for (const project of this.projects) {
      for (const list of project.task_lists) {
        for (const task of list.tasks) {
          const subTask = task.sub_tasks.find((st) => st.id === subTaskId);
          if (subTask) {
            const tagIndex = subTask.tags.findIndex((t) => t.id === tagId);
            if (tagIndex !== -1) {
              subTask.tags.splice(tagIndex, 1);
              subTask.updated_at = new SvelteDate();

              // 即時保存：新しいtagging serviceを使用
              try {
                const backend = await getBackendService();
                await backend.tagging.deleteSubtaskTag(project.id, subTaskId, tagId);
              } catch (error) {
                console.error('Failed to sync subtask tag removal to backend:', error);
                errorHandler.addSyncError('サブタスクタグ削除', 'subtask', subTaskId, error);
              }
            }
            return;
          }
        }
      }
    }
  }

  // Project management methods
  async addProject(project: { name: string; description?: string; color?: string }) {
    try {
      const projectWithOrderIndex = {
        ...project,
        order_index: this.projects.length
      };
      const newProject = await dataService.createProjectTree(projectWithOrderIndex);
      this.projects.push(newProject);
      return newProject;
    } catch (error) {
      console.error('Failed to create project:', error);
      errorHandler.addSyncError('プロジェクト作成', 'project', 'new', error);
      return null;
    }
  }

  async updateProject(
    projectId: string,
    updates: {
      name?: string;
      description?: string;
      color?: string;
      order_index?: number;
      is_archived?: boolean;
    }
  ) {
    try {
      const updatedProject = await dataService.updateProject(projectId, updates);
      if (updatedProject) {
        const projectIndex = this.projects.findIndex((p) => p.id === projectId);
        if (projectIndex !== -1) {
          this.projects[projectIndex] = { ...this.projects[projectIndex], ...updatedProject };
        }
      }
      // 更新操作は定期保存に任せる
      return updatedProject;
    } catch (error) {
      console.error('Failed to update project:', error);
      errorHandler.addSyncError('プロジェクト更新', 'project', projectId, error);
      return null;
    }
  }

  async deleteProject(projectId: string) {
    try {
      const success = await dataService.deleteProject(projectId);
      if (success) {
        const projectIndex = this.projects.findIndex((p) => p.id === projectId);
        if (projectIndex !== -1) {
          this.projects.splice(projectIndex, 1);
          // 削除されたプロジェクトのタスクが選択されていた場合はクリア
          if (this.selectedProjectId === projectId) {
            this.selectedProjectId = null;
            this.selectedTaskId = null;
            this.selectedSubTaskId = null;
          }
        }
      }
      return success;
    } catch (error) {
      console.error('Failed to delete project:', error);
      errorHandler.addSyncError('プロジェクト削除', 'project', projectId, error);
      return false;
    }
  }

  // Task list management methods
  async addTaskList(
    projectId: string,
    taskList: { name: string; description?: string; color?: string }
  ) {
    try {
      const project = this.projects.find((p) => p.id === projectId);
      const taskListWithOrderIndex = {
        ...taskList,
        order_index: project ? project.task_lists.length : 0
      };
      const newTaskList = await dataService.createTaskListWithTasks(
        projectId,
        taskListWithOrderIndex
      );
      if (project) {
        project.task_lists.push(newTaskList);
      }
      return newTaskList;
    } catch (error) {
      console.error('Failed to create task list:', error);
      return null;
    }
  }

  async updateTaskList(
    taskListId: string,
    updates: { name?: string; description?: string; color?: string }
  ): Promise<TaskListWithTasks | null> {
    try {
      // taskListIdからprojectIdを取得
      const projectId = this.getProjectIdByListId(taskListId);
      if (!projectId) {
        throw new Error(`タスクリストID ${taskListId} に対応するプロジェクトが見つかりません。`);
      }
      
      const updatedTaskList = await dataService.updateTaskList(projectId, taskListId, updates);
      if (updatedTaskList) {
        for (const project of this.projects) {
          const listIndex = project.task_lists.findIndex((l) => l.id === taskListId);
          if (listIndex !== -1) {
            project.task_lists[listIndex] = {
              ...project.task_lists[listIndex],
              ...updatedTaskList
            };
            // 更新された TaskListWithTasks を返す
            return project.task_lists[listIndex];
          }
        }
      }
      return null;
    } catch (error) {
      console.error('Failed to update task list:', error);
      return null;
    }
  }

  async deleteTaskList(taskListId: string) {
    try {
      // taskListIdからprojectIdを取得
      const projectId = this.getProjectIdByListId(taskListId);
      if (!projectId) {
        throw new Error(`タスクリストID ${taskListId} に対応するプロジェクトが見つかりません。`);
      }
      
      const success = await dataService.deleteTaskList(projectId, taskListId);
      if (success) {
        for (const project of this.projects) {
          const listIndex = project.task_lists.findIndex((l) => l.id === taskListId);
          if (listIndex !== -1) {
            project.task_lists.splice(listIndex, 1);
            // 削除されたタスクリストのタスクが選択されていた場合はクリア
            if (this.selectedListId === taskListId) {
              this.selectedListId = null;
              this.selectedTaskId = null;
              this.selectedSubTaskId = null;
            }
            break;
          }
        }
      }
      return success;
    } catch (error) {
      console.error('Failed to delete task list:', error);
      return false;
    }
  }

  // Get task count for a specific tag
  getTaskCountByTag(tagName: string): number {
    let count = 0;

    for (const project of this.projects) {
      for (const list of project.task_lists) {
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
      for (const list of project.task_lists) {
        for (const task of list.tasks) {
          // Remove from main task
          const taskTagIndex = task.tags.findIndex((t) => t.id === tagId);
          if (taskTagIndex !== -1) {
            task.tags.splice(taskTagIndex, 1);
            task.updated_at = new SvelteDate();
          }

          // Remove from all subtasks
          for (const subTask of task.sub_tasks) {
            const subTaskTagIndex = subTask.tags.findIndex((t) => t.id === tagId);
            if (subTaskTagIndex !== -1) {
              subTask.tags.splice(subTaskTagIndex, 1);
              subTask.updated_at = new SvelteDate();
            }
          }
        }
      }
    }
  }

  // Update tag in all tasks and subtasks when tag is modified
  updateTagInAllTasks(updatedTag: Tag) {
    for (const project of this.projects) {
      for (const list of project.task_lists) {
        for (const task of list.tasks) {
          // Update in main task
          const taskTagIndex = task.tags.findIndex((t) => t.id === updatedTag.id);
          if (taskTagIndex !== -1) {
            task.tags[taskTagIndex] = { ...updatedTag };
            task.updated_at = new SvelteDate();
          }

          // Update in subtasks
          for (const subTask of task.sub_tasks) {
            const subTaskTagIndex = subTask.tags.findIndex((t) => t.id === updatedTag.id);
            if (subTaskTagIndex !== -1) {
              subTask.tags[subTaskTagIndex] = { ...updatedTag };
              subTask.updated_at = new SvelteDate();
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
      const foundTaskList = project.task_lists.find((tl) => tl.id === newTaskListId);
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
      for (const taskList of project.task_lists) {
        const taskIndex = taskList.tasks.findIndex((t) => t.id === taskId);
        if (taskIndex !== -1) {
          taskToMove = taskList.tasks[taskIndex];
          taskList.tasks.splice(taskIndex, 1);
          taskList.updated_at = new SvelteDate();
          break;
        }
      }
      if (taskToMove) break;
    }

    if (!taskToMove) return;

    // タスクのlist_idを更新
    taskToMove.list_id = newTaskListId;
    taskToMove.updated_at = new SvelteDate();

    // 新しいタスクリストに追加
    targetTaskList.tasks.push(taskToMove);
    targetTaskList.updated_at = new SvelteDate();
    targetProject.updated_at = new SvelteDate();

    // バックエンドに同期
    try {
      await dataService.updateTask(taskId, { list_id: newTaskListId });
    } catch (error) {
      console.error('Failed to sync task move to backend:', error);
      errorHandler.addSyncError('タスク移動', 'task', taskId, error);
    }
  }

  // Drag & Drop methods
  async reorderProjects(fromIndex: number, toIndex: number) {
    if (
      fromIndex === toIndex ||
      fromIndex < 0 ||
      toIndex < 0 ||
      fromIndex >= this.projects.length ||
      toIndex >= this.projects.length
    ) {
      return;
    }

    const [movedProject] = this.projects.splice(fromIndex, 1);
    this.projects.splice(toIndex, 0, movedProject);

    // Update order indices and sync to backend
    for (let index = 0; index < this.projects.length; index++) {
      const project = this.projects[index];
      project.order_index = index;
      project.updated_at = new SvelteDate();

      try {
        // Use dataService directly to avoid circular dependency and double update
        await dataService.updateProject(project.id, { order_index: index });
      } catch (error) {
        console.error('Failed to sync project order to backend:', error);
        errorHandler.addSyncError('プロジェクト順序更新', 'project', project.id, error);
      }
    }
  }

  async moveProjectToPosition(projectId: string, targetIndex: number) {
    const currentIndex = this.projects.findIndex((p) => p.id === projectId);
    if (currentIndex === -1 || currentIndex === targetIndex) return;

    await this.reorderProjects(currentIndex, targetIndex);
  }

  async reorderTaskLists(projectId: string, fromIndex: number, toIndex: number) {
    const project = this.projects.find((p) => p.id === projectId);
    if (
      !project ||
      fromIndex === toIndex ||
      fromIndex < 0 ||
      toIndex < 0 ||
      fromIndex >= project.task_lists.length ||
      toIndex >= project.task_lists.length
    ) {
      return;
    }

    const [movedTaskList] = project.task_lists.splice(fromIndex, 1);
    project.task_lists.splice(toIndex, 0, movedTaskList);

    // Update order indices and sync to backend
    project.updated_at = new SvelteDate();
    for (let index = 0; index < project.task_lists.length; index++) {
      const taskList = project.task_lists[index];
      taskList.order_index = index;
      taskList.updated_at = new SvelteDate();

      try {
        await dataService.updateTaskList(projectId, taskList.id, { order_index: index });
      } catch (error) {
        console.error('Failed to sync task list order to backend:', error);
        errorHandler.addSyncError('タスクリスト順序更新', 'tasklist', taskList.id, error);
      }
    }
  }

  async moveTaskListToProject(taskListId: string, targetProjectId: string, targetIndex?: number) {
    // Find and remove the task list from its current project
    let taskListToMove: TaskListWithTasks | null = null;
    let sourceProject: ProjectTree | null = null;

    for (const project of this.projects) {
      const taskListIndex = project.task_lists.findIndex((tl) => tl.id === taskListId);
      if (taskListIndex !== -1) {
        taskListToMove = project.task_lists[taskListIndex];
        sourceProject = project;
        project.task_lists.splice(taskListIndex, 1);
        project.updated_at = new SvelteDate();

        // Update order indices in source project and sync to backend
        for (let index = 0; index < project.task_lists.length; index++) {
          const tl = project.task_lists[index];
          tl.order_index = index;
          tl.updated_at = new SvelteDate();

          try {
            await dataService.updateTaskList(project.id, tl.id, { order_index: index });
          } catch (error) {
            console.error('Failed to sync source project task list order to backend:', error);
            errorHandler.addSyncError('タスクリスト順序更新（移動元）', 'tasklist', tl.id, error);
          }
        }
        break;
      }
    }

    if (!taskListToMove || !sourceProject) return;

    // Find target project and add the task list
    const targetProject = this.projects.find((p) => p.id === targetProjectId);
    if (!targetProject) {
      // Restore to original project if target not found
      sourceProject.task_lists.push(taskListToMove);
      return;
    }

    // Update task list's project reference
    taskListToMove.project_id = targetProjectId;
    taskListToMove.updated_at = new SvelteDate();

    // Insert at specified position or at the end
    if (
      targetIndex !== undefined &&
      targetIndex >= 0 &&
      targetIndex <= targetProject.task_lists.length
    ) {
      targetProject.task_lists.splice(targetIndex, 0, taskListToMove);
    } else {
      targetProject.task_lists.push(taskListToMove);
    }

    // Update order indices in target project and sync to backend
    targetProject.updated_at = new SvelteDate();
    for (let index = 0; index < targetProject.task_lists.length; index++) {
      const tl = targetProject.task_lists[index];
      tl.order_index = index;
      tl.updated_at = new SvelteDate();

      try {
        await dataService.updateTaskList(targetProject.id, tl.id, {
          order_index: index
        });
      } catch (error) {
        console.error('Failed to sync target project task list order to backend:', error);
        errorHandler.addSyncError('タスクリスト順序更新（移動先）', 'tasklist', tl.id, error);
      }
    }
  }

  async moveTaskListToPosition(taskListId: string, targetProjectId: string, targetIndex: number) {
    // Find current position
    let currentProject: ProjectTree | null = null;
    let currentIndex = -1;

    for (const project of this.projects) {
      const index = project.task_lists.findIndex((tl) => tl.id === taskListId);
      if (index !== -1) {
        currentProject = project;
        currentIndex = index;
        break;
      }
    }

    if (!currentProject || currentIndex === -1) return;

    if (currentProject.id === targetProjectId) {
      // Same project - just reorder
      await this.reorderTaskLists(targetProjectId, currentIndex, targetIndex);
    } else {
      // Different project - move
      await this.moveTaskListToProject(taskListId, targetProjectId, targetIndex);
    }
  }

  // Helper method to get project ID by list ID
  getProjectIdByListId(listId: string): string | null {
    for (const project of this.projects) {
      const list = project.task_lists.find((l) => l.id === listId);
      if (list) {
        return project.id;
      }
    }
    return null;
  }
  // Helper method to get project ID by task ID
  getProjectIdByTaskId(taskId: string): string | null {
    for (const project of this.projects) {
      for (const list of project.task_lists) {
        const task = list.tasks.find((t) => t.id === taskId);
        if (task) {
          return project.id;
        }
      }
    }
    return null;
  }

  // Helper method to get task ID by subtask ID
  getTaskIdBySubTaskId(subTaskId: string): string | null {
    for (const project of this.projects) {
      for (const list of project.task_lists) {
        for (const task of list.tasks) {
          const subTask = task.sub_tasks.find((st) => st.id === subTaskId);
          if (subTask) {
            return task.id;
          }
        }
      }
    }
    return null;
  }

  // Helper method to get project ID by subtask ID
  getProjectIdBySubTaskId(subTaskId: string): string | null {
    const taskId = this.getTaskIdBySubTaskId(subTaskId);
    if (!taskId) {
      return null;
    }
    return this.getProjectIdByTaskId(taskId);
  }
}

// Create global store instance
export const taskStore = new TaskStore();
