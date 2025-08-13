import { getTranslationService } from '$lib/stores/locale.svelte';

export function createSearchMessages() {
  const translationService = getTranslationService();

  const searchTasks = translationService.getMessage('search_tasks');
  const typeACommand = translationService.getMessage('type_a_command');
  const noCommandsFound = translationService.getMessage('no_commands_found');
  const noTasksFound = translationService.getMessage('no_tasks_found');
  const commands = translationService.getMessage('commands');
  const settings = translationService.getMessage('settings');
  const help = translationService.getMessage('help');
  const search = translationService.getMessage('search');
  const jumpToTask = translationService.getMessage('jump_to_task');
  const results = translationService.getMessage('results');
  const noMatchingTasksFound = translationService.getMessage('no_matching_tasks_found');
  const showAllTasks = translationService.getMessage('show_all_tasks');
  const quickActions = translationService.getMessage('quick_actions');
  const addNewTask = translationService.getMessage('add_new_task');
  const viewAllTasks = translationService.getMessage('view_all_tasks');

  function getShowAllResultsFor(searchValue: string) {
    return translationService.getMessage('show_all_results_for', { searchValue });
  }

  return {
    searchTasks,
    typeACommand,
    noCommandsFound,
    noTasksFound,
    commands,
    settings,
    help,
    search,
    jumpToTask,
    results,
    noMatchingTasksFound,
    showAllTasks,
    quickActions,
    addNewTask,
    viewAllTasks,
    getShowAllResultsFor
  };
}