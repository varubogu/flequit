/**
 * 言語に応じた曜日条件の表示順序を管理
 */
export class LanguageOrderUtils {
  /**
   * 曜日条件の表示順序を言語に応じて決定
   * 日本語: [条件] なら [方向] の [対象] にずらす
   * 英語: If [条件], move to [方向] [対象]
   * @param language 対象言語（省略時は現在のロケールを使用）
   * @returns 'ja'（日本語）または'en'（英語）
   */
  static getWeekdayConditionOrder(language?: string): 'ja' | 'en' {
    const lang = language ?? 'en';
    return lang.startsWith('ja') ? 'ja' : 'en';
  }

  /**
   * 日本語の条件表示テンプレートを生成する
   * @param condition 条件文字列
   * @param direction 方向文字列
   * @param target 対象文字列
   * @returns テンプレートとパーツの配列を含むオブジェクト
   */
  static formatWeekdayConditionJa(
    condition: string,
    direction: string,
    target: string
  ): {
    template: string;
    parts: Array<{ type: 'text' | 'select'; content: string; key?: string }>;
  } {
    return {
      template: '{condition}なら{direction}の{target}にずらす',
      parts: [
        { type: 'select', content: condition, key: 'condition' },
        { type: 'text', content: 'なら' },
        { type: 'select', content: direction, key: 'direction' },
        { type: 'text', content: 'の' },
        { type: 'select', content: target, key: 'target' },
        { type: 'text', content: 'にずらす' }
      ]
    };
  }

  /**
   * 英語の条件表示テンプレートを生成する
   * @param condition 条件文字列
   * @param direction 方向文字列
   * @param target 対象文字列
   * @returns テンプレートとパーツの配列を含むオブジェクト
   */
  static formatWeekdayConditionEn(
    condition: string,
    direction: string,
    target: string
  ): {
    template: string;
    parts: Array<{ type: 'text' | 'select'; content: string; key?: string }>;
  } {
    return {
      template: 'If {condition}, move to {direction} {target}',
      parts: [
        { type: 'text', content: 'If' },
        { type: 'select', content: condition, key: 'condition' },
        { type: 'text', content: ', move to' },
        { type: 'select', content: direction, key: 'direction' },
        { type: 'select', content: target, key: 'target' }
      ]
    };
  }

  /**
   * 現在の言語に応じた条件表示を生成する
   * @param condition 条件文字列
   * @param direction 方向文字列
   * @param target 対象文字列
   * @param language 対象言語（省略時は現在のロケールを使用）
   * @returns 言語に応じたテンプレートとパーツの配列を含むオブジェクト
   */
  static formatWeekdayCondition(
    condition: string,
    direction: string,
    target: string,
    language?: string
  ) {
    const order = this.getWeekdayConditionOrder(language);
    return order === 'ja'
      ? this.formatWeekdayConditionJa(condition, direction, target)
      : this.formatWeekdayConditionEn(condition, direction, target);
  }
}
