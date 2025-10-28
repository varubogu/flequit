<script lang="ts">
  import type { ViewType } from '$lib/stores/view-store.svelte';
  import ProjectDialog from '$lib/components/project/project-dialog.svelte';
  import TaskListDialog from '$lib/components/task/dialogs/task-list-dialog.svelte';
  import ProjectListContent from '$lib/components/project/project-list-content.svelte';
  import { useProjectListController } from '$lib/components/project/project-list-controller.svelte';

  interface Props {
    currentView?: ViewType;
    onViewChange?: (view: ViewType) => void;
    isCollapsed?: boolean;
  }

  let { currentView = 'all', onViewChange, isCollapsed = false }: Props = $props();

  // Use controller
  const controller = useProjectListController(onViewChange);
  const { logic, dialogState } = controller;
</script>

<ProjectListContent {logic} {currentView} {isCollapsed} {onViewChange} />

<ProjectDialog
  open={dialogState.showProjectDialog}
  mode={dialogState.projectDialogMode}
  initialName={dialogState.editingProject?.name || ''}
  initialColor={dialogState.editingProject?.color || '#3b82f6'}
  onsave={controller.handleProjectSave}
  onclose={controller.handleProjectDialogClose}
/>

<TaskListDialog
  open={dialogState.showTaskListDialog}
  mode="add"
  initialName=""
  onsave={controller.handleTaskListSave}
  onclose={controller.handleTaskListDialogClose}
/>
