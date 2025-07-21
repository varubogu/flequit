<script lang="ts">
  import { taskStore } from '$lib/stores/tasks.svelte';
  import { viewsVisibilityStore } from '$lib/stores/views-visibility.svelte';
  import type { ProjectTree } from '$lib/types/task';
  import type { ViewType } from '$lib/services/view-service';
  import Button from '$lib/components/ui/button.svelte';
  import Card from '$lib/components/ui/card.svelte';
  import SidebarButton from '$lib/components/sidebar-button.svelte';
  import SearchCommand from '$lib/components/search-command.svelte';
  import UserProfile from '$lib/components/user-profile.svelte';
  import KeyboardShortcut from '$lib/components/ui/keyboard-shortcut.svelte';
  import { Search, ChevronDown, ChevronRight } from 'lucide-svelte';
  import { contextMenuStore } from '$lib/stores/context-menu.svelte';
  import ProjectDialog from '$lib/components/project-dialog.svelte';
  import TaskListDialog from '$lib/components/task-list-dialog.svelte';

  interface Props {
    currentView?: ViewType;
    onViewChange?: (view: ViewType) => void;
  }

  let { currentView = 'all', onViewChange }: Props = $props();

  let projects = $derived(taskStore.projects);
  let todayTasksCount = $derived(taskStore.todayTasks.length);
  let overdueTasksCount = $derived(taskStore.overdueTasks.length);
  let visibleViews = $derived(viewsVisibilityStore.visibleViews);
  let showSearchDialog = $state(false);
  let expandedProjects = $state<Set<string>>(new Set());

  // Modal states
  let showProjectDialog = $state(false);
  let showTaskListDialog = $state(false);
  let projectDialogMode: 'add' | 'edit' = $state('add');
  let taskListDialogMode: 'add' | 'edit' = $state('add');
  let editingProject: any = $state(null);
  let editingTaskList: any = $state(null);

  // Mock user data - replace with actual user store
  let currentUser = $state<{
    id: string;
    name: string;
    email: string;
    avatar?: string;
  } | null>({
    id: '1',
    name: 'John Doe',
    email: 'john.doe@example.com'
  });

  // グローバルキーボードショートカット
  $effect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault();
        showSearchDialog = true;
      }
    }

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  });

  function handleViewChange(view: ViewType) {
    onViewChange?.(view);
  }

  function handleProjectSelect(project: ProjectTree) {
    taskStore.selectProject(project.id);
    onViewChange?.('project');
  }

  function toggleProjectExpansion(projectId: string) {
    if (expandedProjects.has(projectId)) {
      expandedProjects.delete(projectId);
    } else {
      expandedProjects.add(projectId);
    }
    expandedProjects = new Set(expandedProjects);
  }

  function getProjectTaskCount(project: ProjectTree): number {
    return project.task_lists.reduce((acc, list) => acc + list.tasks.length, 0);
  }

  function getTaskCountForView(viewId: string): number {
    switch (viewId) {
      case 'allTasks':
        return taskStore.allTasks.length;
      case 'today':
        return todayTasksCount;
      case 'overdue':
        return overdueTasksCount;
      case 'completed':
        return taskStore.allTasks.filter(t => t.status === 'completed').length;
      case 'tomorrow':
        return taskStore.allTasks.filter(t => {
          if (t.status === 'completed' || !t.end_date) return false;
          const tomorrow = new Date();
          tomorrow.setDate(tomorrow.getDate() + 1);
          const tomorrowStart = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate());
          const tomorrowEnd = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate() + 1);
          const dueDate = new Date(t.end_date);
          return dueDate >= tomorrowStart && dueDate < tomorrowEnd;
        }).length;
      case 'next3days':
        return taskStore.allTasks.filter(t => {
          if (t.status === 'completed' || !t.end_date) return false;
          const today = new Date();
          const threeDaysLater = new Date();
          threeDaysLater.setDate(today.getDate() + 3);
          const dueDate = new Date(t.end_date);
          return dueDate > today && dueDate <= threeDaysLater;
        }).length;
      case 'nextweek':
        return taskStore.allTasks.filter(t => {
          if (t.status === 'completed' || !t.end_date) return false;
          const today = new Date();
          const oneWeekLater = new Date();
          oneWeekLater.setDate(today.getDate() + 7);
          const dueDate = new Date(t.end_date);
          return dueDate > today && dueDate <= oneWeekLater;
        }).length;
      case 'thismonth':
        return taskStore.allTasks.filter(t => {
          if (t.status === 'completed' || !t.end_date) return false;
          const today = new Date();
          const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
          const dueDate = new Date(t.end_date);
          return dueDate >= today && dueDate <= endOfMonth;
        }).length;
      default:
        return 0;
    }
  }


  function handleLogin() {
    console.log('Login clicked');
    // TODO: Implement login logic
  }

  function handleLogout() {
    console.log('Logout clicked');
    currentUser = null;
    // TODO: Implement logout logic
  }

  function handleSettings() {
    // TODO: Implement settings logic
  }

  function handleSwitchAccount() {
    console.log('Switch Account clicked');
    // TODO: Implement account switching logic
  }

  function handleProjectContextMenu(event: MouseEvent, project: ProjectTree) {
    event.preventDefault();
    event.stopPropagation();

    contextMenuStore.open(event.clientX, event.clientY, [
      {
        label: 'Edit Project',
        action: () => openProjectDialog('edit', project)
      },
      {
        label: 'Add Task List',
        action: () => openTaskListDialog('add', null, project)
      },
      {
        label: '',
        action: () => {},
        separator: true
      },
      {
        label: 'Delete Project',
        action: () => console.log('Delete project:', project.name),
        disabled: project.task_lists.length > 0
      }
    ]);
  }

  function handleTaskListContextMenu(event: MouseEvent, list: any, project: ProjectTree) {
    event.preventDefault();
    event.stopPropagation();

    contextMenuStore.open(event.clientX, event.clientY, [
      {
        label: 'Edit Task List',
        action: () => openTaskListDialog('edit', list, project)
      },
      {
        label: 'Add Task',
        action: () => console.log('Add task to:', list.name)
      },
      {
        label: '',
        action: () => {},
        separator: true
      },
      {
        label: 'Delete Task List',
        action: () => console.log('Delete task list:', list.name),
        disabled: list.tasks.length > 0
      }
    ]);
  }

  // Dialog handlers
  function openProjectDialog(mode: 'add' | 'edit', project?: any) {
    projectDialogMode = mode;
    editingProject = project;
    showProjectDialog = true;
  }

  function openTaskListDialog(mode: 'add' | 'edit', taskList?: any, project?: any) {
    taskListDialogMode = mode;
    editingTaskList = taskList;
    editingProject = project;
    showTaskListDialog = true;
  }

  function handleProjectSave(data: { name: string; color: string }) {
    const { name, color } = data;
    if (projectDialogMode === 'add') {
      console.log('Creating new project:', name, color);
      // TODO: Implement project creation
    } else {
      console.log('Updating project:', editingProject?.name, 'to', name, color);
      // TODO: Implement project update
    }
    showProjectDialog = false;
  }

  function handleTaskListSave(data: { name: string }) {
    const { name } = data;
    if (taskListDialogMode === 'add') {
      console.log('Creating new task list:', name, 'in project:', editingProject?.name);
      // TODO: Implement task list creation
    } else {
      console.log('Updating task list:', editingTaskList?.name, 'to', name);
      // TODO: Implement task list update
    }
    showTaskListDialog = false;
  }
</script>

<Card class="w-64 border-r flex flex-col h-full">
  <!-- Header -->
  <div class="p-4 border-b">
    <Button
      variant="ghost"
      class="w-full justify-start gap-2 px-3 py-2 h-auto text-muted-foreground"
      onclick={() => showSearchDialog = true}
    >
      <Search class="h-4 w-4" />
      <span class="text-sm">Search</span>
      <div class="ml-auto">
        <KeyboardShortcut keys={['cmd', 'k']} />
      </div>
    </Button>
  </div>

  <!-- Navigation -->
  <nav class="flex-1 p-4">
    <div class="space-y-1">
      <!-- Quick Views -->
      <div class="mb-4">
        <h3 class="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
          Views
        </h3>

        {#each visibleViews as view (view.id)}
          <SidebarButton
            icon={view.icon}
            label={view.label}
            count={getTaskCountForView(view.id)}
            isActive={currentView === view.id}
            onclick={() => handleViewChange(view.id as ViewType)}
          />
        {/each}
      </div>

      <!-- Projects -->
      <div>
        <h3 class="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
          Projects
        </h3>

        {#if projects.length === 0}
          <div class="text-sm text-muted-foreground px-3 py-2">
            No projects yet
          </div>
        {:else}
          {#each projects as project (project.id)}
            <div class="flex items-start w-full">
              <!-- Accordion Toggle Button -->
              {#if project.task_lists.length > 0}
                <Button
                  variant="ghost"
                  size="icon"
                  class="h-8 w-8 min-h-[32px] min-w-[32px] text-muted-foreground hover:text-foreground mt-1"
                  onclick={() => toggleProjectExpansion(project.id)}
                  title="Toggle task lists"
                >
                  {#if expandedProjects.has(project.id)}
                    <ChevronDown class="h-4 w-4" />
                  {:else}
                    <ChevronRight class="h-4 w-4" />
                  {/if}
                </Button>
              {:else}
                <div class="h-8 w-8 min-h-[32px] min-w-[32px] mt-1"></div>
              {/if}

              <!-- Project Button -->
              <div
                class="flex-1"
                role="button"
                tabindex="0"
                oncontextmenu={(e) => handleProjectContextMenu(e, project)}
              >
                <Button
                  variant={currentView === 'project' && taskStore.selectedProjectId === project.id ? 'secondary' : 'ghost'}
                  class="flex items-center justify-between w-full h-auto py-3 pr-3 pl-1 text-sm"
                  onclick={() => handleProjectSelect(project)}
                >
                  <div class="flex items-center gap-2 min-w-0">
                    <div
                      class="w-3 h-3 rounded-full flex-shrink-0"
                      style="background-color: {project.color || '#3b82f6'}"
                    ></div>
                    <span class="truncate">{project.name}</span>
                  </div>
                  <span class="text-xs text-muted-foreground flex-shrink-0">
                    {getProjectTaskCount(project)}
                  </span>
                </Button>
              </div>

                <!-- Task Lists (when project is expanded) -->
                {#if expandedProjects.has(project.id)}
                  <div class="ml-4 mt-1 space-y-1">
                    {#each project.task_lists as list (list.id)}
                      <div
                        role="button"
                        tabindex="0"
                        oncontextmenu={(e) => handleTaskListContextMenu(e, list, project)}
                      >
                        <Button
                          variant={taskStore.selectedListId === list.id ? 'secondary' : 'ghost'}
                          size="sm"
                          class="flex items-center justify-between w-full h-auto p-2 text-xs"
                          onclick={() => taskStore.selectList(list.id)}
                        >
                          <span class="truncate">{list.name}</span>
                          <span class="text-muted-foreground">
                            {list.tasks.length}
                          </span>
                        </Button>
                      </div>
                    {/each}
                  </div>
                {/if}
            </div>
          {/each}
        {/if}
      </div>
    </div>
  </nav>

  <!-- Footer -->
  <div class="border-t">
    <UserProfile
      user={currentUser}
      onLogin={handleLogin}
      onLogout={handleLogout}
      onSettings={handleSettings}
      onSwitchAccount={handleSwitchAccount}
    />
  </div>
</Card>

<!-- Search Command Dialog -->
<SearchCommand
  bind:open={showSearchDialog}
  onOpenChange={(open) => showSearchDialog = open}
/>

<!-- Project Dialog -->
<ProjectDialog
  open={showProjectDialog}
  mode={projectDialogMode}
  initialName={editingProject?.name || ''}
  initialColor={editingProject?.color || '#3b82f6'}
  onsave={handleProjectSave}
  onclose={() => showProjectDialog = false}
/>

<!-- Task List Dialog -->
<TaskListDialog
  open={showTaskListDialog}
  mode={taskListDialogMode}
  initialName={editingTaskList?.name || ''}
  onsave={handleTaskListSave}
  onclose={() => showTaskListDialog = false}
/>
