import type { ProjectSearchCondition, Project } from '$lib/types/project';
import type { ProjectService } from '$lib/infrastructure/backends/project-service';

export class ProjectWebService implements ProjectService {
  async create(project: Project): Promise<boolean> {
    // TODO: Web API実装を追加
    console.warn('Web backends: createProject not implemented', project);
    return true; // 警告を出しつつ正常終了として扱う
  }

  async update(id: string, patch: Partial<Project>): Promise<boolean> {
    // TODO: Web API実装を追加
    console.warn('Web backends: updateProject not implemented', id, patch);
    return true; // 警告を出しつつ正常終了として扱う
  }

  async delete(id: string): Promise<boolean> {
    // TODO: Web API実装を追加
    console.warn('Web backends: deleteProject not implemented', id);
    return true; // 警告を出しつつ正常終了として扱う
  }

  async restore(id: string): Promise<boolean> {
    // TODO: Web API実装を追加
    console.warn('Web backends: restoreProject not implemented', id);
    return false;
  }

  async get(id: string): Promise<Project | null> {
    // TODO: Web API実装を追加
    console.warn('Web backends: getProject not implemented', id);
    return null; // 仮実装としてnullを返す
  }

  async search(condition: ProjectSearchCondition): Promise<Project[]> {
    // TODO: Web API実装を追加
    console.warn('Web backends: searchProjects not implemented', condition);
    return []; // 仮実装として空配列を返す
  }
}
