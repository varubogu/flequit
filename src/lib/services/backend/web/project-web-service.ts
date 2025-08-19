import type { ProjectSearchCondition } from '$lib/types/project';
import type { Project } from '$lib/types/project';
import type { ProjectService } from '$lib/services/backend/project-service';

export class ProjectWebService implements ProjectService {
  async create(project: Project): Promise<boolean> {
    // TODO: Web API実装を追加
    console.warn('Web backend: createProject not implemented', project);
    return true; // 警告を出しつつ正常終了として扱う
  }

  async update(project: Project): Promise<boolean> {
    // TODO: Web API実装を追加
    console.warn('Web backend: updateProject not implemented', project);
    return true; // 警告を出しつつ正常終了として扱う
  }

  async delete(id: string): Promise<boolean> {
    // TODO: Web API実装を追加
    console.warn('Web backend: deleteProject not implemented', id);
    return true; // 警告を出しつつ正常終了として扱う
  }

  async get(id: string): Promise<Project | null> {
    // TODO: Web API実装を追加
    console.warn('Web backend: getProject not implemented', id);
    return null; // 仮実装としてnullを返す
  }

  async search(condition: ProjectSearchCondition): Promise<Project[]> {
    // TODO: Web API実装を追加
    console.warn('Web backend: searchProjects not implemented', condition);
    return []; // 仮実装として空配列を返す
  }
}
