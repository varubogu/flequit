/* eslint-disable no-restricted-imports -- TODO [計画02]: フロントエンド層方針の再定義と移行で対応予定。期限: 2026-04-30 */
import { defaultViewDependencies } from '$lib/services/ui/view/view-dependencies';
import { getTasksForView } from '$lib/services/ui/view/view-queries';
import {
  forceViewChange,
  getViewTitle,
  handleViewChange,
  shouldShowAddButton
} from '$lib/services/ui/view/view-preferences';
import type { ViewStoreDependencies, ViewType } from '$lib/services/ui/view/types';

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

export { getTasksForView } from '$lib/services/ui/view/view-queries';
export {
  getViewTitle,
  shouldShowAddButton,
  handleViewChange,
  forceViewChange
} from '$lib/services/ui/view/view-preferences';
export type { ViewType, ViewStoreDependencies } from '$lib/services/ui/view/types';
