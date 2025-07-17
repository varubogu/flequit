import type { ViewType } from '$lib/services/view-service';
import { ViewService } from '$lib/services/view-service';

export class ViewStore {
  currentView = $state<ViewType>('all');
  
  // Computed values
  get tasks() {
    return ViewService.getTasksForView(this.currentView);
  }
  
  get viewTitle() {
    return ViewService.getViewTitle(this.currentView);
  }
  
  get showAddButton() {
    return ViewService.shouldShowAddButton(this.currentView);
  }
  
  // Actions
  changeView(view: ViewType) {
    this.currentView = view;
    ViewService.handleViewChange(view);
  }
}

// Create global store instance
export const viewStore = new ViewStore();