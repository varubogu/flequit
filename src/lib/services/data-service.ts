import { taskStore } from '$lib/stores/tasks.svelte';
import { generateSampleData } from '$lib/data/sample-data';

export class DataService {
  static initializeSampleData(): void {
    const sampleData = generateSampleData();
    taskStore.setProjects(sampleData);
  }
  
  static loadUserData(): void {
    // In a real app, this would load from local storage, API, etc.
    // For now, just load sample data
    this.initializeSampleData();
  }
  
  static saveUserData(): void {
    // In a real app, this would save to local storage, API, etc.
    // For now, this is a no-op
    console.log('Saving user data...', taskStore.projects);
  }
}