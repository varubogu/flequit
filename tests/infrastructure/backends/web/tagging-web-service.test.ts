import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TaggingWebService } from '$lib/infrastructure/backends/web/tagging-web-service';

describe('TaggingWebService', () => {
  const service = new TaggingWebService();

  beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  it('returns a placeholder tag and reports that delete is not implemented', async () => {
    const created = await service.createTaskTag('p1', 't1', 'milk');
    const createdSubtask = await service.createSubtaskTag('p1', 's1', 'bread');

    expect(created).toMatchObject({ id: 'experimental-web-milk', name: 'milk' });
    expect(createdSubtask).toMatchObject({ id: 'experimental-web-bread', name: 'bread' });
    await expect(service.deleteTaskTag('p1', 't1', 'tag-1')).resolves.toBe(false);
    await expect(service.deleteSubtaskTag('p1', 's1', 'tag-1')).resolves.toBe(false);
    expect(console.warn).toHaveBeenCalledTimes(4);
  });
});
