import { invoke } from '@tauri-apps/api/core';
import type {
  InitializationService,
  LocalSettings,
  Account,
  InitializationResult
} from '../initialization-service';
import type { ProjectTree } from '$lib/types/project';
import type { TaskListWithTasks } from '$lib/types/task-list';
import type { TaskWithSubTasks } from '$lib/types/task';
import type { SubTask } from '$lib/types/sub-task';
import type { Tag } from '$lib/types/tag';

/**
 * Tauri版初期化サービス
 * ローカルファイルシステムとデータベースから初期データを読み込む
 */
export class InitializationTauriService implements InitializationService {
  /**
   * 段階1: ローカル設定読み込み
   * Tauriのローカルファイルから設定を読み込む
   */
  async loadLocalSettings(): Promise<LocalSettings> {
    try {
      // TODO: load_local_settings コマンドが Tauri側でコメントアウトされているため、一時的にmock実装
      console.warn('load_local_settings is not implemented on Tauri side - using default settings');
      return this.getDefaultSettings();
    } catch (error) {
      console.warn('Failed to load local settings:', error);
      return this.getDefaultSettings();
    }
  }

  /**
   * 段階2: アカウント情報読み込み
   * ローカルデータベースからアカウント情報を取得
   */
  async loadAccount(): Promise<Account | null> {
    try {
      const account = (await invoke('load_current_account')) as Account | null;
      return account;
    } catch (error) {
      console.warn('Failed to load account:', error);
      return null;
    }
  }

  /**
   * 段階3: プロジェクトデータ読み込み
   * データベースから全プロジェクト・タスクリスト・タスク・サブタスクを階層構造で取得
   */
  async loadProjectData(): Promise<ProjectTree[]> {
    try {
      const projects = (await invoke('load_all_project_data')) as ProjectTree[];
      const parsed = projects ? this.parseProjectDates(projects) : [];
      return parsed;
    } catch (error) {
      console.error('Failed to load project data:', error);
      return [];
    }
  }

  /**
   * 全初期化実行
   * 3段階を順次実行
   */
  async initializeAll(): Promise<InitializationResult> {
    const localSettings = await this.loadLocalSettings();
    const account = await this.loadAccount();
    const projects = await this.loadProjectData();

    return {
      localSettings,
      account,
      projects
    };
  }

  /**
   * デフォルト設定を取得
   */
  private getDefaultSettings(): LocalSettings {
    return {
      theme: 'system',
      language: 'ja'
    };
  }

  /**
   * Tauriから取得したProjectTree群の日時フィールドをDate型へ復元する
   * Web版の実装と同等の責務を担う
   */
  private parseProjectDates(projects: ProjectTree[]): ProjectTree[] {
    const toDate = (value: unknown): Date | undefined => {
      if (!value) return undefined;
      const d = new Date(value as string | number | Date);
      return isNaN(d.getTime()) ? undefined : d;
    };

    return projects.map((project) => ({
      ...project,
      createdAt: toDate((project as unknown as Record<string, unknown>).createdAt) || new Date(),
      updatedAt: toDate((project as unknown as Record<string, unknown>).updatedAt) || new Date(),
      taskLists: (project.taskLists as TaskListWithTasks[]).map((taskList) => ({
        ...taskList,
        createdAt: toDate((taskList as unknown as Record<string, unknown>).createdAt) || new Date(),
        updatedAt: toDate((taskList as unknown as Record<string, unknown>).updatedAt) || new Date(),
        tasks: (taskList.tasks as TaskWithSubTasks[]).map((task) => ({
          ...task,
          createdAt: toDate((task as unknown as Record<string, unknown>).createdAt) || new Date(),
          updatedAt: toDate((task as unknown as Record<string, unknown>).updatedAt) || new Date(),
          planStartDate: toDate((task as unknown as Record<string, unknown>).planStartDate),
          planEndDate: toDate((task as unknown as Record<string, unknown>).planEndDate),
          doStartDate: toDate((task as unknown as Record<string, unknown>).doStartDate),
          doEndDate: toDate((task as unknown as Record<string, unknown>).doEndDate),
          subTasks: (task.subTasks as SubTask[]).map((subTask) => ({
            ...subTask,
            createdAt: toDate((subTask as unknown as Record<string, unknown>).createdAt) || new Date(),
            updatedAt: toDate((subTask as unknown as Record<string, unknown>).updatedAt) || new Date(),
            planStartDate: toDate((subTask as unknown as Record<string, unknown>).planStartDate),
            planEndDate: toDate((subTask as unknown as Record<string, unknown>).planEndDate),
            doStartDate: toDate((subTask as unknown as Record<string, unknown>).doStartDate),
            doEndDate: toDate((subTask as unknown as Record<string, unknown>).doEndDate)
          })),
          tags: (task.tags as Tag[])?.map((tag) => ({
            ...tag,
            createdAt: toDate((tag as unknown as Record<string, unknown>).createdAt) || new Date(),
            updatedAt: toDate((tag as unknown as Record<string, unknown>).updatedAt) || new Date()
          }))
        }))
      })),
      allTags: (project.allTags as Tag[]).map((tag) => ({
        ...tag,
        createdAt: toDate((tag as unknown as Record<string, unknown>).createdAt) || new Date(),
        updatedAt: toDate((tag as unknown as Record<string, unknown>).updatedAt) || new Date()
      }))
    }));
  }
}
