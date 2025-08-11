import type { Project, ProjectSearchCondition } from '$lib/types/task';
import type { ProjectService } from '$lib/services/backend/project-service';

export class WebProjectService implements ProjectService {
  async create(project: Project): Promise<boolean> {
    // TODO: Web API実装を追加
    console.log('Web backend: createProject not implemented', project);
    throw new Error('Not implemented for web mode');
  }

  async update(project: Project): Promise<boolean> {
    // TODO: Web API実装を追加
    console.log('Web backend: updateProject not implemented', project);
    throw new Error('Not implemented for web mode');
  }

  async delete(id: string): Promise<boolean> {
    // TODO: Web API実装を追加
    console.log('Web backend: deleteProject not implemented', id);
    throw new Error('Not implemented for web mode');
  }

  async get(id: string): Promise<Project | null> {
    // TODO: Web API実装を追加
    console.log('Web backend: getProject not implemented', id);
    throw new Error('Not implemented for web mode');
  }

  async search(condition: ProjectSearchCondition): Promise<Project[]> {
    // TODO: Web API実装を追加
    console.log('Web backend: searchProjects not implemented', condition);
    throw new Error('Not implemented for web mode');
  }
}
