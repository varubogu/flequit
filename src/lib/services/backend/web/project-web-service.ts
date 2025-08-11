import type { Project, ProjectSearchCondition } from '$lib/types/task';
import type { ProjectService } from '$lib/services/backend/project-service';

export class WebProjectService implements ProjectService {
  async create(project: Project): Promise<boolean> {
    // TODO: Web API実装を追加
    console.warn('Web backend: createProject not implemented', project);
    return false; // 仮実装として失敗を返す
  }

  async update(project: Project): Promise<boolean> {
    // TODO: Web API実装を追加
    console.warn('Web backend: updateProject not implemented', project);
    return false; // 仮実装として失敗を返す
  }

  async delete(id: string): Promise<boolean> {
    // TODO: Web API実装を追加
    console.warn('Web backend: deleteProject not implemented', id);
    return false; // 仮実装として失敗を返す
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
