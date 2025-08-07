export interface TagRange {
  start: number;
  end: number;
  content: string;
}

/**
 * Handles parsing and detection of tag input from text
 */
export class TagParser {
  /**
   * Find all tag ranges in the given text
   * Tags are defined as # followed by non-whitespace characters
   */
  static findTagRanges(text: string): TagRange[] {
    const tagRanges: TagRange[] = [];

    for (let i = 0; i < text.length; i++) {
      if (text[i] === '#') {
        // Check if this # is at the start or preceded by whitespace
        const isValidTagStart = i === 0 || /[\s\n\t]/.test(text[i - 1]);

        if (isValidTagStart) {
          // Find the end of this tag (until whitespace, newline, tab, or end of string)
          let tagEnd = i + 1;
          while (tagEnd < text.length && !/[\s\n\t]/.test(text[tagEnd])) {
            tagEnd++;
          }

          // Only consider it a tag if there's content after #
          if (tagEnd > i + 1) {
            tagRanges.push({
              start: i,
              end: tagEnd,
              content: text.slice(i + 1, tagEnd)
            });
          }
        }
      }
    }

    return tagRanges;
  }

  /**
   * Find the tag range that contains the cursor position
   */
  static findCurrentTagRange(tagRanges: TagRange[], cursorPos: number): TagRange | null {
    for (const range of tagRanges) {
      if (cursorPos >= range.start && cursorPos <= range.end) {
        return range;
      }
    }
    return null;
  }
}