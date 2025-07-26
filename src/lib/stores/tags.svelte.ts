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
    return tags.filter(tag => bookmarked.has(tag.id));
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
  }
  
  removeBookmark(tagId: string) {
    const newBookmarks = new Set(this.bookmarkedTags);
    newBookmarks.delete(tagId);
    this.bookmarkedTags = newBookmarks;
  }
}

// Create global store instance
export const tagStore = new TagStore();