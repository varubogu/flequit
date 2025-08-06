<script lang="ts">
  import type { ViewType } from '$lib/services/view-service';
  import ProjectDialog from '$lib/components/project/project-dialog.svelte';
  import TaskListDialog from '$lib/components/task/task-list-dialog.svelte';
  import ProjectListContent from './project-list-content.svelte';
  import { ProjectListLogic } from './project-list-logic.svelte';

  interface Props {
    currentView?: ViewType;
    onViewChange?: (view: ViewType) => void;
    isCollapsed?: boolean;
  }

  let { currentView = 'all', onViewChange, isCollapsed = false }: Props = $props();

  // Initialize logic
  const logic = new ProjectListLogic(onViewChange);
</script>

<ProjectListContent {logic} {currentView} {isCollapsed} {onViewChange} />

<ProjectDialog
  open={logic.showProjectDialog}
  mode={logic.projectDialogMode}
  initialName={logic.editingProject?.name || ''}
  initialColor={logic.editingProject?.color || '#3b82f6'}
  onsave={logic.handleProjectSave.bind(logic)}
  onclose={logic.handleProjectDialogClose.bind(logic)}
/>

<TaskListDialog
  open={logic.showTaskListDialog}
  mode="add"
  initialName=""
  onsave={logic.handleTaskListSave.bind(logic)}
  onclose={logic.handleTaskListDialogClose.bind(logic)}
/>
