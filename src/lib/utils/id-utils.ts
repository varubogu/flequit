/**
 * ランダムなID生成のユーティリティ関数
 */

/**
 * ランダムなUUID風のIDを生成（crypto.randomUUID代替）
 */
export function generateRandomId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    try {
      return crypto.randomUUID();
    } catch {
      // フォールバックを使用
    }
  }
  
  // フォールバック実装: 簡易的なランダムID生成
  return 'xxxx-xxxx-4xxx-yxxx-xxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  }) + '-xxxx-xxxx';
}

/**
 * 短いランダムIDを生成（8文字）
 */
export function generateShortId(): string {
  return Math.random().toString(36).substring(2, 10);
}