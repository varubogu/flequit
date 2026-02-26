import { defaultViewDependencies } from '$lib/dependencies/view';
import { getTasksForView } from '$lib/dependencies/view';
import {
  forceViewChange,
  getViewTitle,
  handleViewChange,
  shouldShowAddButton
} from '$lib/dependencies/view';
import type { ViewStoreDependencies, ViewType } from '$lib/dependencies/view';

export class ViewStore {
  #deps: ViewStoreDependencies;

  constructor(deps: ViewStoreDependencies = defaultViewDependencies) {
    this.#deps = deps;
  }

  currentView = $state<ViewType>('all');
  searchQuery = $state('');

  get tasks() {
    return getTasksForView(this.currentView, this.searchQuery, this.#deps);
  }

  get viewTitle() {
    return getViewTitle(this.currentView, this.searchQuery, this.#deps);
  }

  get showAddButton() {
    return shouldShowAddButton(this.currentView);
  }

  changeView(view: ViewType) {
    if (!handleViewChange(view, this.#deps)) {
      return;
    }

    this.currentView = view;

    if (view !== 'search') {
      this.searchQuery = '';
    }
  }

  forceChangeView(view: ViewType) {
    forceViewChange(view, this.#deps);
    this.currentView = view;

    if (view !== 'search') {
      this.searchQuery = '';
    }
  }

  performSearch(query: string) {
    this.searchQuery = query;
    this.currentView = 'search';
  }
}

export const viewStore = new ViewStore();

export { getTasksForView } from '$lib/dependencies/view';
export {
  getViewTitle,
  shouldShowAddButton,
  handleViewChange,
  forceViewChange
} from '$lib/dependencies/view';
export type { ViewType, ViewStoreDependencies } from '$lib/dependencies/view';
