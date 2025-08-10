import { invoke } from '@tauri-apps/api/core';
import type { ProjectTree } from '$lib/types/task';
import { convertProjectTree, isTauriEnvironment } from './common';

export interface ProjectService {
  createProject: (project: {
    name: string;
    description?: string;
    color?: string;
  }) => Promise<ProjectTree>;
  updateProject: (
    projectId: string,
    updates: { name?: string; description?: string; color?: string }
  ) => Promise<ProjectTree | null>;
  deleteProject: (projectId: string) => Promise<boolean>;
}

class TauriProjectService implements ProjectService {
  async createProject(project: { name: string; description?: string; color?: string }) {
    const result = await invoke('create_project', {
      name: project.name,
      description: project.description,
      color: project.color
    });
    return convertProjectTree(result);
  }

  async updateProject(
    projectId: string,
    updates: { name?: string; description?: string; color?: string }
  ) {
    const result = await invoke('update_project', {
      projectId,
      name: updates.name,
      description: updates.description,
      color: updates.color
    });
    return result ? convertProjectTree(result) : null;
  }

  async deleteProject(projectId: string): Promise<boolean> {
    return await invoke('delete_project', { projectId });
  }
}

class WebProjectService implements ProjectService {
  async createProject(project: { name: string; description?: string; color?: string }) {
    console.log('Web backend: createProject not implemented', project);
    return {
      id: crypto.randomUUID(),
      name: project.name,
      description: project.description || '',
      color: project.color || '#3b82f6',
      order_index: 0,
      is_archived: false,
      created_at: new Date(),
      updated_at: new Date(),
      task_lists: []
    };
  }

  async updateProject(
    projectId: string,
    updates: { name?: string; description?: string; color?: string }
  ) {
    console.log('Web backend: updateProject not implemented', { projectId, updates });
    return {
      id: projectId,
      name: updates.name || 'Updated Project',
      description: updates.description || '',
      color: updates.color || '#3b82f6',
      order_index: 0,
      is_archived: false,
      created_at: new Date(),
      updated_at: new Date(),
      task_lists: []
    };
  }

  async deleteProject(projectId: string) {
    console.log('Web backend: deleteProject not implemented', { projectId });
    return true;
  }
}

export function createProjectService(): ProjectService {
  return isTauriEnvironment() ? new TauriProjectService() : new WebProjectService();
}
