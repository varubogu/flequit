import type { ProjectTree } from '$lib/types/project';
import type { TaskListWithTasks } from '$lib/types/task-list';
import type { TaskWithSubTasks } from '$lib/types/task';
import type { SubTask } from '$lib/types/sub-task';
import type { Tag } from '$lib/types/tag';

/**
 * ProjectTreeを効率的に走査するユーティリティクラス
 *
 * TaskStore内の重複したループパターンを集約し、コードの可読性とメンテナンス性を向上させる。
 *
 * @example
 * ```typescript
 * const task = ProjectTreeTraverser.findTask(projects, taskId);
 * if (task) {
 *   task.title = "Updated Title";
 * }
 * ```
 */
export class ProjectTreeTraverser {
  /**
   * タスクIDからタスクを検索
   */
  static findTask(projects: ProjectTree[], taskId: string): TaskWithSubTasks | null {
    for (const project of projects) {
      for (const list of project.taskLists) {
        const task = list.tasks.find((t) => t.id === taskId);
        if (task) return task;
      }
    }
    return null;
  }

  /**
   * タスクリストIDからタスクリストを検索
   */
  static findTaskList(projects: ProjectTree[], listId: string): TaskListWithTasks | null {
    for (const project of projects) {
      const list = project.taskLists.find((l) => l.id === listId);
      if (list) return list;
    }
    return null;
  }

  /**
   * プロジェクトIDからプロジェクトを検索
   */
  static findProject(projects: ProjectTree[], projectId: string): ProjectTree | null {
    return projects.find((p) => p.id === projectId) || null;
  }

  /**
   * サブタスクIDからサブタスクを検索
   */
  static findSubTask(projects: ProjectTree[], subTaskId: string): SubTask | null {
    for (const project of projects) {
      for (const list of project.taskLists) {
        for (const task of list.tasks) {
          const subTask = task.subTasks.find((st) => st.id === subTaskId);
          if (subTask) return subTask;
        }
      }
    }
    return null;
  }

  /**
   * タスクIDからプロジェクトとタスクリストを取得
   */
  static findTaskContext(
    projects: ProjectTree[],
    taskId: string
  ): { project: ProjectTree; taskList: TaskListWithTasks } | null {
    for (const project of projects) {
      for (const list of project.taskLists) {
        const task = list.tasks.find((t) => t.id === taskId);
        if (task) {
          return { project, taskList: list };
        }
      }
    }
    return null;
  }

  /**
   * タスクIDからプロジェクトIDを取得
   */
  static getProjectIdByTaskId(projects: ProjectTree[], taskId: string): string | null {
    const context = this.findTaskContext(projects, taskId);
    return context?.project.id || null;
  }

  /**
   * タグIDからプロジェクトIDを取得
   */
  static getProjectIdByTagId(projects: ProjectTree[], tagId: string): string | null {
    for (const project of projects) {
      for (const list of project.taskLists) {
        for (const task of list.tasks) {
          // タスクのタグをチェック
          if (task.tags.some((tag) => tag.id === tagId)) {
            return project.id;
          }
          // サブタスクのタグをチェック
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

  /**
   * タスクを更新（updater関数を使用）
   */
  static updateTask(
    projects: ProjectTree[],
    taskId: string,
    updater: (task: TaskWithSubTasks) => void
  ): boolean {
    const task = this.findTask(projects, taskId);
    if (task) {
      updater(task);
      return true;
    }
    return false;
  }

  /**
   * タスクを削除
   */
  static deleteTask(projects: ProjectTree[], taskId: string): boolean {
    for (const project of projects) {
      for (const list of project.taskLists) {
        const taskIndex = list.tasks.findIndex((t) => t.id === taskId);
        if (taskIndex !== -1) {
          list.tasks.splice(taskIndex, 1);
          return true;
        }
      }
    }
    return false;
  }

  /**
   * すべてのタスクからタグを削除
   */
  static removeTagFromAllTasks(projects: ProjectTree[], tagId: string): void {
    for (const project of projects) {
      for (const list of project.taskLists) {
        for (const task of list.tasks) {
          // タスクからタグを削除
          const taskTagIndex = task.tags.findIndex((t) => t.id === tagId);
          if (taskTagIndex !== -1) {
            task.tags.splice(taskTagIndex, 1);
          }

          // サブタスクからタグを削除
          for (const subTask of task.subTasks) {
            if (!subTask.tags) continue;
            const subTaskTagIndex = subTask.tags.findIndex((t) => t.id === tagId);
            if (subTaskTagIndex !== -1) {
              subTask.tags.splice(subTaskTagIndex, 1);
            }
          }
        }
      }
    }
  }

  /**
   * すべてのタスクのタグを更新
   */
  static updateTagInAllTasks(projects: ProjectTree[], updatedTag: Tag): void {
    for (const project of projects) {
      for (const list of project.taskLists) {
        for (const task of list.tasks) {
          // タスクのタグを更新
          const taskTagIndex = task.tags.findIndex((t) => t.id === updatedTag.id);
          if (taskTagIndex !== -1) {
            task.tags[taskTagIndex] = { ...updatedTag };
          }

          // サブタスクのタグを更新
          for (const subTask of task.subTasks) {
            if (!subTask.tags) continue;
            const subTaskTagIndex = subTask.tags.findIndex((t) => t.id === updatedTag.id);
            if (subTaskTagIndex !== -1) {
              subTask.tags[subTaskTagIndex] = { ...updatedTag };
            }
          }
        }
      }
    }
  }

  /**
   * タグ名でタスク数をカウント
   */
  static getTaskCountByTag(projects: ProjectTree[], tagName: string): number {
    let count = 0;
    for (const project of projects) {
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

  /**
   * すべてのタスクを取得
   */
  static getAllTasks(projects: ProjectTree[]): TaskWithSubTasks[] {
    return projects.flatMap((project) =>
      project.taskLists.flatMap((list) => list.tasks)
    );
  }
}
