import type { ViewType } from '$lib/services/view-service';
import { ViewService } from '$lib/services/view-service';

export class ViewStore {
  currentView = $state<ViewType>('all');
  searchQuery = $state('');
  
  // Computed values
  get tasks() {
    return ViewService.getTasksForView(this.currentView, this.searchQuery);
  }
  
  get viewTitle() {
    return ViewService.getViewTitle(this.currentView, this.searchQuery);
  }
  
  get showAddButton() {
    return ViewService.shouldShowAddButton(this.currentView);
  }
  
  // Actions
  changeView(view: ViewType) {
    this.currentView = view;
    ViewService.handleViewChange(view);
    
    // Clear search query when leaving search view
    if (view !== 'search') {
      this.searchQuery = '';
    }
  }
  
  performSearch(query: string) {
    this.searchQuery = query;
    this.currentView = 'search';
  }
}

// Create global store instance
export const viewStore = new ViewStore();