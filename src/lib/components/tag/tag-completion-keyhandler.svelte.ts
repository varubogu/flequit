import type { Tag } from "$lib/types/tag";

export interface KeyHandlerCallbacks {
  selectSuggestion: (tag: Tag) => void;
  createNewTag: () => void;
  hideSuggestions: () => void;
  getCurrentSuggestions: () => Tag[];
  getCurrentTagInput: () => string;
  isShowingSuggestions: () => boolean;
  isInTagInput: () => boolean;
}

export class TagCompletionKeyHandler {
  private callbacks: KeyHandlerCallbacks;

  constructor(callbacks: KeyHandlerCallbacks) {
    this.callbacks = callbacks;
  }

  handleKeydown(event: KeyboardEvent): void {
    if (!this.callbacks.isShowingSuggestions() || !this.callbacks.isInTagInput()) {
      return;
    }

    switch (event.key) {
      case 'Enter':
        this.handleEnterKey(event);
        break;
      case 'Escape':
        this.handleEscapeKey(event);
        break;
      case 'Tab':
        this.handleTabKey(event);
        break;
    }
  }

  private handleEnterKey(event: KeyboardEvent): void {
    event.preventDefault();

    const suggestions = this.callbacks.getCurrentSuggestions();
    if (suggestions.length > 0) {
      this.callbacks.selectSuggestion(suggestions[0]);
    } else if (this.callbacks.getCurrentTagInput().trim()) {
      this.callbacks.createNewTag();
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private handleEscapeKey(_event: KeyboardEvent): void {
    this.callbacks.hideSuggestions();
  }

  private handleTabKey(event: KeyboardEvent): void {
    const suggestions = this.callbacks.getCurrentSuggestions();
    if (suggestions.length > 0) {
      event.preventDefault();
      this.callbacks.selectSuggestion(suggestions[0]);
    }
  }
}
