import type {
  InitializationService,
  LocalSettings,
  Account,
  InitializationResult
} from '../initialization-service';
import type { ProjectTree } from '$lib/types/project';
import { generateSampleData } from '$lib/data/sample-data';

/**
 * Web版初期化サービス
 * ローカルストレージとサンプルデータを使用した仮実装
 */
export class InitializationWebService implements InitializationService {
  /**
   * 段階1: ローカル設定読み込み
   * Web版では空のデフォルト設定を返す（ローカルファイル読み込みは使用しない）
   */
  async loadLocalSettings(): Promise<LocalSettings> {
    console.warn(
      'Web backends: loadLocalSettings - localStorage-based implementation (not fully implemented)'
    );
    try {
      // Web版ではlocalStorageから設定を読み込む
      const savedSettings = localStorage.getItem('flequit_local_settings');
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        return { ...this.getDefaultSettings(), ...parsed };
      }
    } catch (error) {
      console.warn('Failed to load local settings from localStorage:', error);
    }

    return this.getDefaultSettings();
  }

  /**
   * 段階2: アカウント情報読み込み
   * Web版では仮のアカウント情報を返す
   */
  async loadAccount(): Promise<Account | null> {
    console.warn(
      'Web backends: loadAccount - localStorage-based mock implementation (not fully implemented)'
    );
    try {
      // Web版では仮のアカウントデータを返す
      const savedAccount = localStorage.getItem('flequit_account');
      if (savedAccount) {
        const parsed = JSON.parse(savedAccount);
        // 日付フィールドをDateオブジェクトに変換
        if (parsed.created_at) {
          parsed.created_at = new Date(parsed.created_at);
        }
        if (parsed.updated_at) {
          parsed.updated_at = new Date(parsed.updated_at);
        }
        return parsed;
      }

      // デフォルトアカウントを作成
      const defaultAccount: Account = {
        id: 'web-user-1',
        userId: 'web-demo-user',
        displayName: 'Web Demo User',
        email: 'demo@example.com',
        provider: 'local',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        deleted: false,
        updatedBy: 'system'
      };

      // localStorageに保存
      localStorage.setItem('flequit_account', JSON.stringify(defaultAccount));

      return defaultAccount;
    } catch (error) {
      console.warn('Failed to load account:', error);
      return null;
    }
  }

  /**
   * 段階3: プロジェクトデータ読み込み
   * Web版ではsample-dataからサンプルプロジェクトデータを返す
   */
  async loadProjectData(): Promise<ProjectTree[]> {
    console.warn(
      'Web backends: loadProjectData - localStorage with sample data (not fully implemented)'
    );
    try {
      // localStorageに保存されたプロジェクトデータがあればそれを使用
      const savedProjects = localStorage.getItem('flequit_projects');
      if (savedProjects) {
        const parsed = JSON.parse(savedProjects);
        return this.parseProjectDates(parsed);
      }

      // サンプルデータを生成
      const sampleData = generateSampleData();

      // localStorageに保存
      localStorage.setItem('flequit_projects', JSON.stringify(sampleData));

      return sampleData;
    } catch (error) {
      console.error('Failed to load project data:', error);
      // エラーが発生した場合もサンプルデータを返す
      return generateSampleData();
    }
  }

  /**
   * 全初期化実行
   * 3段階を順次実行
   */
  async initializeAll(): Promise<InitializationResult> {
    console.warn(
      'Web backends: initializeAll - combined initialization with localStorage (not fully implemented)'
    );
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
   * JSONから復元されたプロジェクトデータの日付フィールドをDateオブジェクトに変換
   */
  private parseProjectDates(projects: ProjectTree[]): ProjectTree[] {
    return projects.map((project) => ({
      ...project,
      createdAt: new Date(project.createdAt),
      updatedAt: new Date(project.updatedAt),
      taskLists: project.taskLists.map((taskList) => ({
        ...taskList,
        createdAt: new Date(taskList.createdAt),
        updatedAt: new Date(taskList.updatedAt),
        tasks: taskList.tasks.map((task) => ({
          ...task,
          createdAt: new Date(task.createdAt),
          updatedAt: new Date(task.updatedAt),
          planStartDate: task.planStartDate ? new Date(task.planStartDate) : undefined,
          planEndDate: task.planEndDate ? new Date(task.planEndDate) : undefined,
          subTasks: task.subTasks.map((subTask) => ({
            ...subTask,
            createdAt: new Date(subTask.createdAt),
            updatedAt: new Date(subTask.updatedAt),
            planStartDate: subTask.planStartDate ? new Date(subTask.planStartDate) : undefined,
            planEndDate: subTask.planEndDate ? new Date(subTask.planEndDate) : undefined
          })),
          tags: task.tags.map((tag) => ({
            ...tag,
            createdAt: new Date(tag.createdAt),
            updatedAt: new Date(tag.updatedAt)
          }))
        }))
      }))
    }));
  }
}
