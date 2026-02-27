import type { ProjectTree } from '$lib/types/project';
import type { Project } from '$lib/types/project';
import { SvelteDate } from 'svelte/reactivity';

/**
 * プロジェクト配列の並び替えを実行し、更新されたプロジェクトの配列を返す
 */
export function reorderProjectsArray(
  projects: ProjectTree[],
  fromIndex: number,
  toIndex: number
): ProjectTree[] {
  const [movedProject] = projects.splice(fromIndex, 1);
  projects.splice(toIndex, 0, movedProject);

  const updated: ProjectTree[] = [];
  for (let index = 0; index < projects.length; index++) {
    const project = projects[index];
    if (project.orderIndex !== index) {
      project.orderIndex = index;
      project.updatedAt = new SvelteDate();
      updated.push(project);
    }
  }

  return updated;
}

/**
 * 新しいプロジェクトのデフォルト値を生成する
 */
export function createNewProject(
  orderIndex: number,
  getCurrentUserId: () => string,
  project: { name: string; description?: string; color?: string }
): ProjectTree {
  return {
    id: crypto.randomUUID(),
    name: project.name,
    description: project.description,
    color: project.color,
    orderIndex,
    isArchived: false,
    createdAt: new SvelteDate(),
    updatedAt: new SvelteDate(),
    deleted: false,
    updatedBy: getCurrentUserId(),
    taskLists: [],
    allTags: []
  };
}

/**
 * プロジェクト更新時の差分データを構築する
 */
export function buildProjectUpdate(
  current: ProjectTree,
  updates: {
    name?: string;
    description?: string;
    color?: string;
    order_index?: number;
    is_archived?: boolean;
  }
): Partial<ProjectTree> {
  return {
    name: updates.name ?? current.name,
    description: updates.description ?? current.description,
    color: updates.color ?? current.color,
    orderIndex: updates.order_index ?? current.orderIndex,
    isArchived: updates.is_archived ?? current.isArchived
  };
}

/**
 * ProjectTree から Project に変換する
 */
export function toProjectResult(updated: ProjectTree): Project {
  return {
    id: updated.id,
    name: updated.name,
    description: updated.description,
    color: updated.color,
    orderIndex: updated.orderIndex,
    isArchived: updated.isArchived,
    createdAt: updated.createdAt,
    updatedAt: updated.updatedAt,
    deleted: updated.deleted,
    updatedBy: updated.updatedBy
  };
}
