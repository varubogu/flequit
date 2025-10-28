import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { InitializationWebService } from '$lib/infrastructure/backends/web/initialization-web-service';

const storageBacking = () => {
	const map = new Map<string, string>();
	return {
		getItem: vi.fn((key: string) => map.get(key) ?? null),
		setItem: vi.fn((key: string, value: string) => {
			map.set(key, value);
		}),
		clear: vi.fn(() => map.clear())
	};
};

vi.mock('$lib/data/sample-data', () => ({
	generateSampleData: vi.fn(() => [
		{
			id: 'sample-project-1',
			name: 'Sample Project',
			createdAt: '2024-01-01T00:00:00Z',
			updatedAt: '2024-01-01T00:00:00Z',
			projectId: 'sample-project-1',
			color: '#ffffff',
			orderIndex: 0,
			archived: false,
			taskLists: []
		}
	])
}));

describe('InitializationWebService (web)', () => {
	let service: InitializationWebService;
	let storage: ReturnType<typeof storageBacking>;
	let warnSpy: ReturnType<typeof vi.spyOn>;
	let errorSpy: ReturnType<typeof vi.spyOn>;

	beforeEach(() => {
		storage = storageBacking();
		Object.defineProperty(global, 'localStorage', {
			value: storage,
			configurable: true
		});
		warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
		errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
		service = new InitializationWebService();
	});

	afterEach(() => {
		warnSpy.mockRestore();
		errorSpy.mockRestore();
	});

	it('loadLocalSettings: returns defaults when storage empty', async () => {
		const settings = await service.loadLocalSettings();

		expect(settings).toEqual({ theme: 'system', language: 'ja' });
		expect(storage.getItem).toHaveBeenCalledWith('flequit_local_settings');
		expect(warnSpy).toHaveBeenCalledWith(
			'Web backends: loadLocalSettings - localStorage-based implementation (not fully implemented)'
		);
	});

	it('loadLocalSettings: merges stored values', async () => {
		storage.getItem.mockReturnValueOnce(JSON.stringify({ theme: 'dark', custom: true }));

		const settings = await service.loadLocalSettings();

		expect(settings).toEqual({ theme: 'dark', language: 'ja', custom: true });
	});

	it('loadAccount: creates default account when none saved', async () => {
		const account = await service.loadAccount();

		expect(account?.id).toBe('web-user-1');
		expect(storage.setItem).toHaveBeenCalledWith('flequit_account', expect.any(String));
		expect(warnSpy).toHaveBeenCalledWith(
			'Web backends: loadAccount - localStorage-based mock implementation (not fully implemented)'
		);
	});

	it('loadAccount: parses stored account and dates', async () => {
		storage.getItem.mockReturnValueOnce(
			JSON.stringify({
				id: 'stored',
				name: 'Stored',
				email: 'stored@example.com',
				created_at: '2024-01-01T00:00:00Z',
				updated_at: '2024-01-02T00:00:00Z'
			})
		);

		const account = await service.loadAccount();

		expect(account).toEqual({
			id: 'stored',
			name: 'Stored',
			email: 'stored@example.com',
			created_at: new Date('2024-01-01T00:00:00Z'),
			updated_at: new Date('2024-01-02T00:00:00Z')
		});
	});

	it('loadProjectData: loads sample data when storage empty', async () => {
		const projects = await service.loadProjectData();

		expect(projects).toHaveLength(1);
		expect(projects[0]?.id).toBe('sample-project-1');
		expect(storage.setItem).toHaveBeenCalledWith('flequit_projects', expect.any(String));
		expect(warnSpy).toHaveBeenCalledWith(
			'Web backends: loadProjectData - localStorage with sample data (not fully implemented)'
		);
	});

	it('loadProjectData: parses stored payload dates into Date instances', async () => {
	const stored = [
		{
			id: 'stored-project',
			name: 'Stored Project',
			color: '#123456',
			orderIndex: 0,
			isArchived: false,
			createdAt: '2024-01-03T00:00:00Z',
			updatedAt: '2024-01-04T00:00:00Z',
			taskLists: []
		}
	];
		storage.getItem.mockReturnValueOnce(JSON.stringify(stored));

		const projects = await service.loadProjectData();

	const loadedProject = projects[0];
	expect(loadedProject?.createdAt).toEqual(new Date('2024-01-03T00:00:00Z'));
	expect(loadedProject?.updatedAt).toEqual(new Date('2024-01-04T00:00:00Z'));
	});

	it('initializeAll: combines results from each step', async () => {
		const result = await service.initializeAll();

		expect(result.localSettings).toEqual({ theme: 'system', language: 'ja' });
		expect(result.account?.id).toBe('web-user-1');
		expect(result.projects.length).toBeGreaterThan(0);
		expect(warnSpy).toHaveBeenCalledWith(
			'Web backends: initializeAll - combined initialization with localStorage (not fully implemented)'
		);
	});

	it('loadLocalSettings: tolerates parse errors', async () => {
		storage.getItem.mockReturnValueOnce('not-json');

		const settings = await service.loadLocalSettings();

		expect(settings).toEqual({ theme: 'system', language: 'ja' });
		expect(warnSpy).toHaveBeenCalledWith(
			'Failed to load local settings from localStorage:',
			expect.any(Error)
		);
	});

	it('loadAccount: returns null on errors', async () => {
		storage.getItem.mockImplementationOnce(() => {
			throw new Error('boom');
		});

		const account = await service.loadAccount();

		expect(account).toBeNull();
		expect(warnSpy).toHaveBeenCalledWith('Failed to load account:', expect.any(Error));
	});

	it('loadProjectData: falls back to sample data on errors', async () => {
		storage.getItem.mockImplementationOnce(() => {
			throw new Error('bad storage');
		});

		const projects = await service.loadProjectData();

		expect(projects[0]?.id).toBe('sample-project-1');
		expect(errorSpy).toHaveBeenCalledWith('Failed to load project data:', expect.any(Error));
	});
});
