import type { Tag } from '$lib/types/task';

// Tag store using Svelte 5 runes
export class TagStore {
  tags = $state<Tag[]>([]);
  bookmarkedTags = $state<Set<string>>(new Set());
  
  // Computed values
  get allTags(): Tag[] {
    return this.tags;
  }
  
  get tagNames(): string[] {
    return this.tags.map(tag => tag.name);
  }
  
  get bookmarkedTagList(): Tag[] {
    // Explicitly access both reactive properties to ensure reactivity
    const tags = this.tags;
    const bookmarked = this.bookmarkedTags;
    return tags
      .filter(tag => bookmarked.has(tag.id))
      .sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0));
  }
  
  // Actions
  setTags(tags: Tag[]) {
    this.tags = tags;
  }
  
  addTag(tagData: { name: string; color?: string }): Tag | null {
    const trimmedName = tagData.name.trim();
    if (!trimmedName) {
      return null;
    }
    
    const existingTag = this.tags.find(tag => tag.name.toLowerCase() === trimmedName.toLowerCase());
    if (existingTag) {
      return existingTag;
    }
    
    const newTag: Tag = {
      id: crypto.randomUUID(),
      name: trimmedName,
      color: tagData.color,
      created_at: new Date(),
      updated_at: new Date()
    };
    
    this.tags.push(newTag);
    return newTag;
  }

  // Add or update tag with existing ID (for sample data initialization)
  addTagWithId(tag: Tag): Tag {
    const existingTag = this.tags.find(t => t.id === tag.id);
    if (existingTag) {
      // Update existing tag
      Object.assign(existingTag, tag);
      return existingTag;
    }
    
    // Add new tag
    this.tags.push(tag);
    return tag;
  }
  
  updateTag(tagId: string, updates: Partial<Tag>) {
    const tagIndex = this.tags.findIndex(tag => tag.id === tagId);
    if (tagIndex !== -1) {
      this.tags[tagIndex] = {
        ...this.tags[tagIndex],
        ...updates,
        updated_at: new Date()
      };
      
      // Dispatch custom event to notify task store about tag update
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('tag-updated', { 
          detail: this.tags[tagIndex] 
        }));
      }
    }
  }
  
  deleteTag(tagId: string, onDelete?: (tagId: string) => void) {
    const tagIndex = this.tags.findIndex(tag => tag.id === tagId);
    if (tagIndex !== -1) {
      this.tags.splice(tagIndex, 1);
      
      // Remove from bookmarks if exists
      if (this.bookmarkedTags.has(tagId)) {
        this.removeBookmark(tagId);
      }
      
      // Call the deletion callback if provided
      onDelete?.(tagId);
    }
  }
  
  findTagByName(name: string): Tag | undefined {
    return this.tags.find(tag => tag.name.toLowerCase() === name.toLowerCase());
  }
  
  searchTags(query: string): Tag[] {
    if (!query.trim()) return this.tags; // Return all tags for empty query
    
    const lowerQuery = query.toLowerCase();
    return this.tags.filter(tag => 
      tag.name.toLowerCase().includes(lowerQuery)
    );
  }
  
  getOrCreateTag(name: string, color?: string): Tag | null {
    const trimmedName = name.trim();
    if (!trimmedName) {
      return null;
    }
    
    const existingTag = this.findTagByName(trimmedName);
    if (existingTag) {
      return existingTag;
    }
    
    return this.addTag({ name: trimmedName, color });
  }
  
  // Bookmark management methods
  toggleBookmark(tagId: string) {
    const newBookmarks = new Set(this.bookmarkedTags);
    if (newBookmarks.has(tagId)) {
      newBookmarks.delete(tagId);
    } else {
      newBookmarks.add(tagId);
    }
    this.bookmarkedTags = newBookmarks;
  }
  
  isBookmarked(tagId: string): boolean {
    return this.bookmarkedTags.has(tagId);
  }
  
  addBookmark(tagId: string) {
    const newBookmarks = new Set(this.bookmarkedTags);
    newBookmarks.add(tagId);
    this.bookmarkedTags = newBookmarks;
    
    // 新しくブックマークされたタグにorder_indexを設定
    const tag = this.tags.find(t => t.id === tagId);
    if (tag && tag.order_index === undefined) {
      const currentBookmarkedTags = this.bookmarkedTagList;
      this.updateTag(tagId, { order_index: currentBookmarkedTags.length - 1 });
    }
  }
  
  removeBookmark(tagId: string) {
    const newBookmarks = new Set(this.bookmarkedTags);
    newBookmarks.delete(tagId);
    this.bookmarkedTags = newBookmarks;
  }

  // Drag & Drop methods for bookmarked tags
  reorderBookmarkedTags(fromIndex: number, toIndex: number) {
    const bookmarkedTags = this.bookmarkedTagList;
    
    if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0 || 
        fromIndex >= bookmarkedTags.length || toIndex >= bookmarkedTags.length) {
      return;
    }

    // ブックマークされたタグの並び順を変更
    const [movedTag] = bookmarkedTags.splice(fromIndex, 1);
    bookmarkedTags.splice(toIndex, 0, movedTag);

    // order_indexを更新
    bookmarkedTags.forEach((tag, index) => {
      this.updateTag(tag.id, { order_index: index });
    });
  }

  moveBookmarkedTagToPosition(tagId: string, targetIndex: number) {
    const bookmarkedTags = this.bookmarkedTagList;
    const currentIndex = bookmarkedTags.findIndex(tag => tag.id === tagId);
    
    if (currentIndex === -1 || currentIndex === targetIndex) return;

    this.reorderBookmarkedTags(currentIndex, targetIndex);
  }

  initializeTagOrderIndices() {
    // 既存のブックマークされたタグにorder_indexを設定（まだ設定されていない場合）
    const bookmarkedTags = this.tags.filter(tag => this.bookmarkedTags.has(tag.id));
    bookmarkedTags.forEach((tag, index) => {
      if (tag.order_index === undefined) {
        this.updateTag(tag.id, { order_index: index });
      }
    });
  }
}

// Create global store instance
export const tagStore = new TagStore();