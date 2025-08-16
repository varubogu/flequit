/**
 * Utility functions for tag name processing
 */
export class TagNameUtils {
  /**
   * Clean tag name for display in title/description
   * Keep first #, remove other # and spaces
   */
  static cleanTagNameForDisplay(name: string): string {
    const withoutSpaces = name.replace(/\s/g, '');
    if (withoutSpaces.startsWith('#')) {
      return '#' + withoutSpaces.slice(1).replace(/#/g, '');
    }
    return withoutSpaces.replace(/#/g, '');
  }

  /**
   * Extract clean tag name for storage
   * Remove all # and spaces
   */
  static extractTagName(name: string): string {
    return name.replace(/[#\s]/g, '');
  }
}
