<script lang="ts">
  import { getTranslationService } from '$lib/stores/locale.svelte';
  import type { ViewType } from '$lib/services/ui/view';
  import { taskStore } from '$lib/stores/tasks.svelte';
  import Button from '$lib/components/shared/button.svelte';
  import { Plus } from 'lucide-svelte';
  import ProjectDialog from '$lib/components/project/project-dialog.svelte';
  import ProjectList from '$lib/components/project/project-list.svelte';
  import { useSidebar } from '$lib/components/ui/sidebar/context.svelte.js';

  interface Props {
    currentView?: ViewType;
    onViewChange?: (view: ViewType) => void;
  }

  let { currentView = 'all', onViewChange }: Props = $props();

  const translationService = getTranslationService();
  const projects = translationService.getMessage('projects');
  const noProjectsYet = translationService.getMessage('no_projects_yet');

  // Get sidebar state
  const sidebar = useSidebar();

  let projectsData = $derived(taskStore.projects);

  let showProjectDialog = $state(false);
  let projectDialogMode: 'add' | 'edit' = $state('add');
  let editingProject: { id: string; name: string; color: string } | null = $state(null);

  function openProjectDialog(
    mode: 'add' | 'edit',
    project?: { id: string; name: string; color: string }
  ) {
    projectDialogMode = mode;
    editingProject = project ?? null;
    showProjectDialog = true;
  }

  async function handleProjectSave(data: { name: string; color: string }) {
    const { name, color } = data;
    if (projectDialogMode === 'add') {
      const newProject = await taskStore.addProject({ name, color });
      if (newProject) {
        taskStore.selectProject(newProject.id);
        onViewChange?.('project');
      }
    } else if (editingProject) {
      await taskStore.updateProject(editingProject.id, { name, color });
    }
    showProjectDialog = false;
  }
</script>

<div>
  {#if sidebar.state !== 'collapsed'}
    <div class="mb-2 flex items-center justify-between">
      <h3 class="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
        {projects()}
      </h3>
      <Button
        variant="ghost"
        size="icon"
        class="text-muted-foreground hover:text-foreground h-6 w-6"
        onclick={() => openProjectDialog('add')}
        title="プロジェクトを追加"
      >
        <Plus class="h-4 w-4" />
      </Button>
    </div>
  {:else}
    <div class="mb-2 flex justify-center">
      <Button
        variant="ghost"
        size="icon"
        class="text-muted-foreground hover:text-foreground h-8 w-8"
        onclick={() => openProjectDialog('add')}
        title="プロジェクトを追加"
      >
        <Plus class="h-4 w-4" />
      </Button>
    </div>
  {/if}

  {#if projectsData.length === 0}
    {#if sidebar.state !== 'collapsed'}
      <div class="text-muted-foreground px-3 py-2 text-sm">
        {noProjectsYet()}
      </div>
    {/if}
  {:else}
    <ProjectList {currentView} {onViewChange} isCollapsed={sidebar.state === 'collapsed'} />
  {/if}
</div>

<ProjectDialog
  open={showProjectDialog}
  mode={projectDialogMode}
  initialName={editingProject?.name || ''}
  initialColor={editingProject?.color || '#3b82f6'}
  onsave={handleProjectSave}
  onclose={() => (showProjectDialog = false)}
/>
