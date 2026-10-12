import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DateTimeFormatService } from '$lib/infrastructure/backends/tauri/settings-categories/datetime-format-service';

vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn()
}));

const mockInvoke = vi.mocked((await import('@tauri-apps/api/core')).invoke);

describe('DateTimeFormatService', () => {
  const service = new DateTimeFormatService();
  const formatSetting = { id: 'fmt-1', format: 'yyyy-MM-dd' };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('adds, upserts, and deletes format settings', async () => {
    mockInvoke.mockResolvedValue(true);

    await expect(service.addDateTimeFormatSetting(formatSetting)).resolves.toBe(true);
    await expect(service.upsertDateTimeFormatSetting(formatSetting)).resolves.toBe(true);
    await expect(service.deleteDateTimeFormatSetting('fmt-1')).resolves.toBe(true);

    expect(mockInvoke).toHaveBeenNthCalledWith(1, 'add_datetime_format_setting', {
      format_setting: formatSetting
    });
    expect(mockInvoke).toHaveBeenNthCalledWith(2, 'upsert_datetime_format_setting', {
      format_setting: formatSetting
    });
    expect(mockInvoke).toHaveBeenNthCalledWith(3, 'delete_datetime_format_setting', {
      format_id: 'fmt-1'
    });
  });

  it('returns false when invoke rejects', async () => {
    mockInvoke.mockRejectedValue(new Error('offline'));

    await expect(service.addDateTimeFormatSetting(formatSetting)).resolves.toBe(false);
    await expect(service.upsertDateTimeFormatSetting(formatSetting)).resolves.toBe(false);
    await expect(service.deleteDateTimeFormatSetting('fmt-1')).resolves.toBe(false);
  });
});
