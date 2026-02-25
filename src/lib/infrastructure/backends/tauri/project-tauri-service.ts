import { invoke } from '@tauri-apps/api/core';
import type { ProjectSearchCondition, Project } from '$lib/types/project';
import type { ProjectService } from '$lib/infrastructure/backends/project-service';

export class ProjectTauriService implements ProjectService {
  async create(project: Project, userId: string): Promise<boolean> {
    try {
      await invoke('create_project', { project, userId });
      return true;
    } catch (error) {
      console.error('Failed to create project:', error);
      return false;
    }
  }

  async update(id: string, patch: Partial<Project>, userId: string): Promise<boolean> {
    try {
      const result = await invoke('update_project', { id, patch, userId });
      return result as boolean;
    } catch (error) {
      console.error('Failed to update project:', error);
      return false;
    }
  }

  async delete(id: string, userId: string): Promise<boolean> {
    try {
      await invoke('delete_project', { id, userId });
      return true;
    } catch (error) {
      console.error('Failed to delete project:', error);
      return false;
    }
  }

  async restore(id: string, userId: string): Promise<boolean> {
    try {
      await invoke('restore_project', { id, userId });
      return true;
    } catch (error) {
      console.error('Failed to restore project:', error);
      return false;
    }
  }

  async get(id: string, userId: string): Promise<Project | null> {
    try {
      const result = (await invoke('get_project', { id, userId })) as Project | null;
      return result;
    } catch (error) {
      console.error('Failed to get project:', error);
      return null;
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async search(_condition: ProjectSearchCondition): Promise<Project[]> {
    try {
      // TODO: search_projects コマンドが Tauri側に実装されていないため、一時的にmock実装
      console.warn('search_projects is not implemented on Tauri side - using mock implementation');
      return [];
    } catch (error) {
      console.error('Failed to search projects:', error);
      return [];
    }
  }
}
