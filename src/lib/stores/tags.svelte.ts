import type { Tag } from '$lib/types/task';

// Tag store using Svelte 5 runes
export class TagStore {
  tags = $state<Tag[]>([]);
  
  // Computed values
  get allTags(): Tag[] {
    return this.tags;
  }
  
  get tagNames(): string[] {
    return this.tags.map(tag => tag.name);
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
  
  updateTag(tagId: string, updates: Partial<Tag>) {
    const tagIndex = this.tags.findIndex(tag => tag.id === tagId);
    if (tagIndex !== -1) {
      this.tags[tagIndex] = {
        ...this.tags[tagIndex],
        ...updates,
        updated_at: new Date()
      };
    }
  }
  
  deleteTag(tagId: string) {
    const tagIndex = this.tags.findIndex(tag => tag.id === tagId);
    if (tagIndex !== -1) {
      this.tags.splice(tagIndex, 1);
    }
  }
  
  findTagByName(name: string): Tag | undefined {
    return this.tags.find(tag => tag.name.toLowerCase() === name.toLowerCase());
  }
  
  searchTags(query: string): Tag[] {
    if (!query.trim()) return [];
    
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
}

// Create global store instance
export const tagStore = new TagStore();