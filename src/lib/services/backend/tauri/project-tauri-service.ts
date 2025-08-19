import { invoke } from '@tauri-apps/api/core';
import type { ProjectSearchCondition } from '$lib/types/project';
import type { Project } from '$lib/types/project';
import type { ProjectService } from '$lib/services/backend/project-service';

export class ProjectTauriService implements ProjectService {
  async create(project: Project): Promise<boolean> {
    try {
      await invoke('create_project', { project });
      return true;
    } catch (error) {
      console.error('Failed to create project:', error);
      return false;
    }
  }

  async update(project: Project): Promise<boolean> {
    try {
      await invoke('update_project', { project });
      return true;
    } catch (error) {
      console.error('Failed to update project:', error);
      return false;
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      await invoke('delete_project', { id });
      return true;
    } catch (error) {
      console.error('Failed to delete project:', error);
      return false;
    }
  }

  async get(id: string): Promise<Project | null> {
    try {
      const result = (await invoke('get_project', { id })) as Project | null;
      return result;
    } catch (error) {
      console.error('Failed to get project:', error);
      return null;
    }
  }

  async search(condition: ProjectSearchCondition): Promise<Project[]> {
    try {
      const results = (await invoke('search_projects', { condition })) as Project[];
      return results;
    } catch (error) {
      console.error('Failed to search projects:', error);
      return [];
    }
  }
}
