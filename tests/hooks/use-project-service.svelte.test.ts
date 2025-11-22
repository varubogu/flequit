import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useProjectService } from '$lib/hooks/use-project-service.svelte';
import type { IProjectService } from '$lib/hooks/use-project-service.svelte';
import type { Project, ProjectTree } from '$lib/types/project';

// ProjectCompositeServiceのモック
vi.mock('$lib/services/composite/project-composite', () => ({
	ProjectCompositeService: {
		createProject: vi.fn(
			async (data): Promise<ProjectTree> => ({
				id: 'test-project-id',
				name: data.name,
				description: data.description,
				color: data.color,
				orderIndex: data.order_index ?? 0,
				isArchived: false,
				createdAt: new Date(),
				updatedAt: new Date(),
				taskLists: [],
				allTags: []
			})
		),
		updateProject: vi.fn(
			async (projectId, updates): Promise<Project> => ({
				id: projectId,
				name: updates.name ?? 'Updated Project',
				description: updates.description,
				color: updates.color,
				orderIndex: updates.order_index ?? 0,
				isArchived: updates.is_archived ?? false,
				createdAt: new Date(),
				updatedAt: new Date(),
			})
		),
		deleteProject: vi.fn(async () => true),
		reorderProjects: vi.fn(async () => {}),
		moveProjectToPosition: vi.fn(async () => {}),
		archiveProject: vi.fn(async () => true)
	}
}));

describe('useProjectService', () => {
	let projectService: IProjectService;

	beforeEach(() => {
		vi.clearAllMocks();
		projectService = useProjectService();
	});

	it('プロジェクトサービスを取得できる', () => {
		expect(projectService).toBeDefined();
		expect(projectService.createProject).toBeDefined();
		expect(projectService.updateProject).toBeDefined();
		expect(projectService.deleteProject).toBeDefined();
	});

	it('プロジェクトを作成できる', async () => {
		const projectData = {
			name: 'Test Project',
			description: 'Test Description',
			color: '#FF0000'
		};

		const result = await projectService.createProject(projectData);

		expect(result).not.toBeNull();
		expect(result?.name).toBe('Test Project');
		expect(result?.description).toBe('Test Description');
		expect(result?.color).toBe('#FF0000');
		expect(projectService.createProject).toHaveBeenCalledWith(projectData);
	});

	it('プロジェクトを更新できる', async () => {
		const updates = {
			name: 'Updated Name',
			description: 'Updated Description'
		};

		const result = await projectService.updateProject('project-1', updates);

		expect(result).not.toBeNull();
		expect(result?.name).toBe('Updated Name');
		expect(projectService.updateProject).toHaveBeenCalledWith('project-1', updates);
	});

	it('プロジェクトを削除できる', async () => {
		const result = await projectService.deleteProject('project-1');

		expect(result).toBe(true);
		expect(projectService.deleteProject).toHaveBeenCalledWith('project-1');
	});

	it('プロジェクトを並び替えできる', async () => {
		await projectService.reorderProjects(0, 2);

		expect(projectService.reorderProjects).toHaveBeenCalledWith(0, 2);
	});

	it('プロジェクトを特定位置に移動できる', async () => {
		await projectService.moveProjectToPosition('project-1', 3);

		expect(projectService.moveProjectToPosition).toHaveBeenCalledWith('project-1', 3);
	});

	it('プロジェクトをアーカイブできる', async () => {
		const result = await projectService.archiveProject('project-1', true);

		expect(result).toBe(true);
		expect(projectService.archiveProject).toHaveBeenCalledWith('project-1', true);
	});

	it('同じインスタンスを返す', () => {
		const service1 = useProjectService();
		const service2 = useProjectService();

		// 同じオブジェクトへの参照を返すことを確認
		expect(service1).toBe(service2);
	});
});
