<script lang="ts">
  import type { ViewType } from '$lib/services/view-service';
  import { taskStore } from '$lib/stores/tasks.svelte';
  import Button from '$lib/components/button.svelte';
  import { Plus } from 'lucide-svelte';
  import ProjectDialog from '$lib/components/project-dialog.svelte';
  import ProjectList from '$lib/components/project-list.svelte';
  import * as m from '$paraglide/messages.js';
  import { reactiveMessage } from '$lib/stores/locale.svelte';

  interface Props {
    currentView?: ViewType;
    onViewChange?: (view: ViewType) => void;
  }

  let { currentView = 'all', onViewChange }: Props = $props();
  
  const projects = reactiveMessage(m.projects);
  const noProjectsYet = reactiveMessage(m.no_projects_yet);

  let projectsData = $derived(taskStore.projects);

  let showProjectDialog = $state(false);
  let projectDialogMode: 'add' | 'edit' = $state('add');
  let editingProject: any = $state(null);

  function openProjectDialog(mode: 'add' | 'edit', project?: any) {
    projectDialogMode = mode;
    editingProject = project;
    showProjectDialog = true;
  }

  function handleProjectSave(data: { name: string; color: string }) {
    const { name, color } = data;
    if (projectDialogMode === 'add') {
      const newProject = taskStore.addProject({ name, color });
      if (newProject) {
        taskStore.selectProject(newProject.id);
        onViewChange?.('project');
      }
    } else if (editingProject) {
      taskStore.updateProject(editingProject.id, { name, color });
    }
    showProjectDialog = false;
  }
</script>

<div>
  <div class="flex items-center justify-between mb-2">
    <h3 class="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
      {projects()}
    </h3>
    <Button
      variant="ghost"
      size="icon"
      class="h-6 w-6 text-muted-foreground hover:text-foreground"
      onclick={() => openProjectDialog('add')}
      title="プロジェクトを追加"
    >
      <Plus class="h-4 w-4" />
    </Button>
  </div>

  {#if projectsData.length === 0}
    <div class="text-sm text-muted-foreground px-3 py-2">
      {noProjectsYet()}
    </div>
  {:else}
    <ProjectList {currentView} {onViewChange} />
  {/if}
</div>

<ProjectDialog
  open={showProjectDialog}
  mode={projectDialogMode}
  initialName={editingProject?.name || ''}
  initialColor={editingProject?.color || '#3b82f6'}
  onsave={handleProjectSave}
  onclose={() => showProjectDialog = false}
/>

