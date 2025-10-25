import type { IProjectStore } from '$lib/types/store-interfaces';
import type { Project, ProjectTree } from '$lib/types/project';
import type { ISelectionStore } from '$lib/types/store-interfaces';
import { selectionStore } from './selection-store.svelte';
import { tagStore } from './tags.svelte';
import { SvelteDate } from 'svelte/reactivity';
import { loadProjectsData as loadProjects, registerTagsToStore } from '$lib/services/data-loader';

/**
 * プロジェクト管理ストア
 *
 * 責務: プロジェクトのCRUD操作、並び替え
 * 依存: SelectionStore（選択状態の参照）
 *
 * TaskStoreから分離して、プロジェクト管理の責務を明確化しています。
 */
export class ProjectStore implements IProjectStore {
	projects = $state<ProjectTree[]>([]);

	constructor(private selection: ISelectionStore) {}

	// 派生状態
	get selectedProject(): ProjectTree | null {
		const id = this.selection.selectedProjectId;
		if (!id) return null;
		return this.projects.find((p) => p.id === id) ?? null;
	}

    // CRUD操作（ストア更新のみ）
    addProjectToStore(project: ProjectTree) {
        const orderIndex = project.orderIndex ?? this.projects.length;
        const normalized: ProjectTree = {
            ...project,
            orderIndex,
            updatedAt: project.updatedAt ?? new SvelteDate(),
            createdAt: project.createdAt ?? new SvelteDate(),
            taskLists: project.taskLists ?? [],
            allTags: project.allTags ?? []
        };

        this.projects.push(normalized);
        return normalized;
    }

    updateProjectInStore(projectId: string, updates: Partial<ProjectTree>) {
        const index = this.projects.findIndex((p) => p.id === projectId);
        if (index === -1) {
            return null;
        }

        const current = this.projects[index];
        const updated: ProjectTree = {
            ...current,
            ...updates,
            orderIndex: updates.orderIndex ?? current.orderIndex,
            updatedAt: updates.updatedAt ?? new SvelteDate()
        };

        this.projects[index] = updated;
        return updated;
    }

    removeProjectFromStore(projectId: string) {
        const index = this.projects.findIndex((p) => p.id === projectId);
        if (index === -1) {
            return false;
        }

        this.projects.splice(index, 1);

        if (this.selection.selectedProjectId === projectId) {
            this.selection.selectProject(null);
            this.selection.selectTask(null);
            this.selection.selectSubTask(null);
        }

        return true;
    }

    // 並び替え（Store内のみ）
    reorderProjectsInStore(fromIndex: number, toIndex: number) {
        if (
            fromIndex === toIndex ||
            fromIndex < 0 ||
            toIndex < 0 ||
            fromIndex >= this.projects.length ||
            toIndex >= this.projects.length
        ) {
            return [] as ProjectTree[];
        }

        const [movedProject] = this.projects.splice(fromIndex, 1);
        this.projects.splice(toIndex, 0, movedProject);

        const updated: ProjectTree[] = [];
        for (let index = 0; index < this.projects.length; index++) {
            const project = this.projects[index];
            if (project.orderIndex !== index) {
                project.orderIndex = index;
                project.updatedAt = new SvelteDate();
                updated.push(project);
            }
        }

        return updated;
    }

	moveProjectToPositionInStore(projectId: string, targetIndex: number) {
		const currentIndex = this.projects.findIndex((p) => p.id === projectId);
		if (currentIndex === -1 || currentIndex === targetIndex) {
			return [] as ProjectTree[];
		}

		return this.reorderProjectsInStore(currentIndex, targetIndex);
	}

	// 互換API（段階的移行用）
	async addProject(project: { name: string; description?: string; color?: string }) {
		const newProject: ProjectTree = {
			id: crypto.randomUUID(),
			name: project.name,
			description: project.description,
			color: project.color,
			orderIndex: this.projects.length,
			isArchived: false,
			createdAt: new SvelteDate(),
			updatedAt: new SvelteDate(),
			taskLists: [],
			allTags: []
		};

		return this.addProjectToStore(newProject);
	}

	async updateProject(
		projectId: string,
		updates: {
			name?: string;
			description?: string;
			color?: string;
			order_index?: number;
			is_archived?: boolean;
		}
	) {
		const current = this.projects.find((p) => p.id === projectId);
		if (!current) {
			return null;
		}

		const updated = this.updateProjectInStore(projectId, {
			name: updates.name ?? current.name,
			description: updates.description ?? current.description,
			color: updates.color ?? current.color,
			orderIndex: updates.order_index ?? current.orderIndex,
			isArchived: updates.is_archived ?? current.isArchived
		});

		if (!updated) {
			return null;
		}

		const result: Project = {
			id: updated.id,
			name: updated.name,
			description: updated.description,
			color: updated.color,
			orderIndex: updated.orderIndex,
			isArchived: updated.isArchived,
			createdAt: updated.createdAt,
			updatedAt: updated.updatedAt
		};

		return result;
	}

	async deleteProject(projectId: string) {
		return this.removeProjectFromStore(projectId);
	}

	async reorderProjects(fromIndex: number, toIndex: number) {
		this.reorderProjectsInStore(fromIndex, toIndex);
	}

	async moveProjectToPosition(projectId: string, targetIndex: number) {
		this.moveProjectToPositionInStore(projectId, targetIndex);
	}

	// ヘルパー
	getProjectById(id: string): ProjectTree | null {
		return this.projects.find((p) => p.id === id) ?? null;
	}

	// データロード
	loadProjects(projects: ProjectTree[]) {
		// data-loaderを使用してプロジェクトデータを読み込み・変換
		const loadedData = loadProjects(projects);

		// 変換済みプロジェクトデータを設定
		this.projects = loadedData.projects;

		// タグストアにタグを登録し、初期ブックマークを設定
		registerTagsToStore(tagStore, loadedData);
	}

	setProjects(projects: ProjectTree[]) {
		// 既に変換済みのプロジェクトデータを設定（タグ変換は不要）
		this.projects = projects;
	}

	// テスト用
	reset() {
		this.projects = [];
	}
}

// シングルトンエクスポート（真の遅延初期化で循環参照を回避）
let _projectStore: ProjectStore | undefined;
function getProjectStore(): ProjectStore {
	if (!_projectStore) {
		_projectStore = new ProjectStore(selectionStore);
	}
	return _projectStore;
}

// Proxyを使用してアクセス時に初期化
export const projectStore = new Proxy({} as ProjectStore, {
	get(_target, prop) {
		const store = getProjectStore();
		const value = store[prop as keyof ProjectStore];
		return typeof value === 'function' ? value.bind(store) : value;
	}
});
