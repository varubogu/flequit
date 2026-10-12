import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AssignmentWebService } from '$lib/infrastructure/backends/web/assignment-web-service';

describe('AssignmentWebService', () => {
  const service = new AssignmentWebService();

  beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  it('reports that the web assignment API is not implemented', async () => {
    await expect(service.createTaskAssignment('p1', 't1', 'u1')).resolves.toBe(false);
    await expect(service.deleteTaskAssignment('p1', 't1', 'u1')).resolves.toBe(false);
    await expect(service.createSubtaskAssignment('p1', 's1', 'u1')).resolves.toBe(false);
    await expect(service.deleteSubtaskAssignment('p1', 's1', 'u1')).resolves.toBe(false);
    expect(console.warn).toHaveBeenCalledTimes(4);
  });
});
