import { describe, it, expect, beforeEach, vi } from 'vitest';
import { settingsStore } from '$lib/stores/settings.svelte';

// バックエンドサービスをモック化
vi.mock('$lib/services/backend', () => ({
  getBackendService: vi.fn(() => Promise.resolve({
    setting: {
      get: vi.fn(() => Promise.resolve(null)),
      getAll: vi.fn(() => Promise.resolve([])),
      update: vi.fn(() => Promise.resolve(true))
    }
  }))
}));

describe('TimeLabels Store', () => {
  beforeEach(async () => {
    // LocalStorageをモック化
    const localStorageMock = {
      getItem: vi.fn(() => null),
      setItem: vi.fn(),
      clear: vi.fn()
    };
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true
    });

    // settingsStoreの状態をリセット
    settingsStore.timeLabels.splice(0, settingsStore.timeLabels.length);
    
    // モックをクリア
    vi.clearAllMocks();
  });

  describe('addTimeLabel', () => {
    it('新しい時刻ラベルを追加できること', async () => {
      const id = settingsStore.addTimeLabel('朝食', '08:00');
      
      expect(id).toBeDefined();
      expect(id.startsWith('time_')).toBe(true);
      expect(settingsStore.timeLabels).toHaveLength(1);
      
      const timeLabel = settingsStore.timeLabels[0];
      expect(timeLabel.name).toBe('朝食');
      expect(timeLabel.time).toBe('08:00');
      expect(timeLabel.id).toBe(id);
      
      // 少し待ってバックエンドサービス呼び出しが完了することを確認
      await new Promise(resolve => setTimeout(resolve, 10));
    });

    it('複数の時刻ラベルを追加できること', () => {
      const id1 = settingsStore.addTimeLabel('朝食', '08:00');
      const id2 = settingsStore.addTimeLabel('昼食', '12:00');
      const id3 = settingsStore.addTimeLabel('夕食', '18:00');
      
      expect(settingsStore.timeLabels).toHaveLength(3);
      expect(settingsStore.timeLabels.map(t => t.id)).toEqual([id1, id2, id3]);
    });

    it('同じ時刻に複数のラベルを設定できること', () => {
      settingsStore.addTimeLabel('朝食', '08:00');
      settingsStore.addTimeLabel('出勤準備', '08:00');
      
      expect(settingsStore.timeLabels).toHaveLength(2);
      expect(settingsStore.getTimeLabelsByTime('08:00')).toHaveLength(2);
    });
  });

  describe('updateTimeLabel', () => {
    it('時刻ラベルの名前を更新できること', () => {
      const id = settingsStore.addTimeLabel('朝食', '08:00');
      settingsStore.updateTimeLabel(id, { name: '朝ごはん' });
      
      const timeLabel = settingsStore.timeLabels.find(t => t.id === id);
      expect(timeLabel?.name).toBe('朝ごはん');
      expect(timeLabel?.time).toBe('08:00');
    });

    it('時刻ラベルの時刻を更新できること', () => {
      const id = settingsStore.addTimeLabel('朝食', '08:00');
      settingsStore.updateTimeLabel(id, { time: '08:30' });
      
      const timeLabel = settingsStore.timeLabels.find(t => t.id === id);
      expect(timeLabel?.name).toBe('朝食');
      expect(timeLabel?.time).toBe('08:30');
    });

    it('時刻ラベルの名前と時刻を同時に更新できること', () => {
      const id = settingsStore.addTimeLabel('朝食', '08:00');
      settingsStore.updateTimeLabel(id, { name: '朝ごはん', time: '08:30' });
      
      const timeLabel = settingsStore.timeLabels.find(t => t.id === id);
      expect(timeLabel?.name).toBe('朝ごはん');
      expect(timeLabel?.time).toBe('08:30');
    });

    it('存在しないIDの更新は何もしないこと', () => {
      settingsStore.addTimeLabel('朝食', '08:00');
      const originalLength = settingsStore.timeLabels.length;
      
      settingsStore.updateTimeLabel('nonexistent', { name: 'test' });
      
      expect(settingsStore.timeLabels).toHaveLength(originalLength);
    });
  });

  describe('removeTimeLabel', () => {
    it('時刻ラベルを削除できること', () => {
      const id1 = settingsStore.addTimeLabel('朝食', '08:00');
      const id2 = settingsStore.addTimeLabel('昼食', '12:00');
      
      settingsStore.removeTimeLabel(id1);
      
      expect(settingsStore.timeLabels).toHaveLength(1);
      expect(settingsStore.timeLabels[0].id).toBe(id2);
    });

    it('存在しないIDの削除は何もしないこと', () => {
      const id = settingsStore.addTimeLabel('朝食', '08:00');
      const originalLength = settingsStore.timeLabels.length;
      
      settingsStore.removeTimeLabel('nonexistent');
      
      expect(settingsStore.timeLabels).toHaveLength(originalLength);
      expect(settingsStore.timeLabels[0].id).toBe(id);
    });
  });

  describe('getTimeLabelsByTime', () => {
    it('指定した時刻のラベルを取得できること', () => {
      const id1 = settingsStore.addTimeLabel('朝食', '08:00');
      const id2 = settingsStore.addTimeLabel('出勤準備', '08:00');
      settingsStore.addTimeLabel('昼食', '12:00');
      
      const timeLabels = settingsStore.getTimeLabelsByTime('08:00');
      
      expect(timeLabels).toHaveLength(2);
      expect(timeLabels.map(t => t.id)).toEqual([id1, id2]);
    });

    it('該当する時刻がない場合は空配列を返すこと', () => {
      settingsStore.addTimeLabel('朝食', '08:00');
      
      const timeLabels = settingsStore.getTimeLabelsByTime('09:00');
      
      expect(timeLabels).toHaveLength(0);
    });
  });
});