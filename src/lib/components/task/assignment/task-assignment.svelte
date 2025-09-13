<script lang="ts">
  import { getTranslationService } from '$lib/stores/locale.svelte';
  import { getBackendService } from '$lib/services/backend';
  import { errorHandler } from '$lib/stores/error-handler.svelte';
  import { ProjectsService } from '$lib/services/projects-service';
  import type { TaskWithSubTasks } from '$lib/types/task';
  import type { SubTask } from '$lib/types/sub-task';
  import type { User } from '$lib/types/user';
  import Button from '$lib/components/ui/button/button.svelte';
  import { UserPlus, UserMinus, Users } from 'lucide-svelte';

  interface Props {
    task?: TaskWithSubTasks | null;
    subTask?: SubTask | null;
    availableUsers?: User[];
    onAssignmentUpdated?: (itemId: string, assignedUsers: string[]) => void;
  }

  let { 
    task, 
    subTask, 
    availableUsers = [], 
    onAssignmentUpdated 
  }: Props = $props();

  const translationService = getTranslationService();

  let currentItem = $derived(subTask || task);
  let isSubTask = $derived(!!subTask);
  let assignedUserIds = $derived(currentItem?.assigned_user_ids || []);
  let isLoading = $state(false);

  // Translation messages
  const assignedUsers = translationService.getMessage('assigned_users');

  async function handleUserAssign(userId: string) {
    if (!currentItem || isLoading) return;

    isLoading = true;
    try {
      const backend = await getBackendService();
      const projectId = ProjectsService.getSelectedProjectId();
      
      if (!projectId) {
        errorHandler.addError({ type: 'general', message: 'プロジェクトが選択されていません', retryable: false });
        return;
      }
      
      if (isSubTask) {
        const success = await backend.assignment.createSubtaskAssignment(projectId, currentItem.id, userId);
        if (success) {
          const updatedIds = [...assignedUserIds, userId];
          onAssignmentUpdated?.(currentItem.id, updatedIds);
        } else {
          errorHandler.addError({ type: 'general', message: 'サブタスクへのユーザー割り当てに失敗しました', retryable: false });
        }
      } else {
        const success = await backend.assignment.createTaskAssignment(projectId, currentItem.id, userId);
        if (success) {
          const updatedIds = [...assignedUserIds, userId];
          onAssignmentUpdated?.(currentItem.id, updatedIds);
        } else {
          errorHandler.addError({ type: 'general', message: 'タスクへのユーザー割り当てに失敗しました', retryable: false });
        }
      }
    } catch (error) {
      console.error('Failed to assign user:', error);
      errorHandler.addError({ type: 'general', message: 'ユーザー割り当て中にエラーが発生しました', retryable: false });
    } finally {
      isLoading = false;
    }
  }

  async function handleUserUnassign(userId: string) {
    if (!currentItem || isLoading) return;

    isLoading = true;
    try {
      const backend = await getBackendService();
      const projectId = ProjectsService.getSelectedProjectId();
      
      if (!projectId) {
        errorHandler.addError({ type: 'general', message: 'プロジェクトが選択されていません', retryable: false });
        return;
      }
      
      if (isSubTask) {
        const success = await backend.assignment.deleteSubtaskAssignment(projectId, currentItem.id, userId);
        if (success) {
          const updatedIds = assignedUserIds.filter((id: string) => id !== userId);
          onAssignmentUpdated?.(currentItem.id, updatedIds);
        } else {
          errorHandler.addError({ type: 'general', message: 'サブタスクからのユーザー割り当て解除に失敗しました', retryable: false });
        }
      } else {
        const success = await backend.assignment.deleteTaskAssignment(projectId, currentItem.id, userId);
        if (success) {
          const updatedIds = assignedUserIds.filter((id: string) => id !== userId);
          onAssignmentUpdated?.(currentItem.id, updatedIds);
        } else {
          errorHandler.addError({ type: 'general', message: 'タスクからのユーザー割り当て解除に失敗しました', retryable: false });
        }
      }
    } catch (error) {
      console.error('Failed to unassign user:', error);
      errorHandler.addError({ type: 'general', message: 'ユーザー割り当て解除中にエラーが発生しました', retryable: false });
    } finally {
      isLoading = false;
    }
  }

  function getAssignedUsers(): User[] {
    return availableUsers.filter(user => assignedUserIds.includes(user.id));
  }

  function getUnassignedUsers(): User[] {
    return availableUsers.filter(user => !assignedUserIds.includes(user.id));
  }

  function getUserDisplayName(user: User): string {
    return user.display_name || user.handle_id;
  }

  function getUserInitials(user: User): string {
    const name = getUserDisplayName(user);
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }
</script>

{#if currentItem}
  <div class="space-y-3">
    <h3 class="flex items-center gap-2 text-sm font-medium">
      <Users class="h-4 w-4" />
      {assignedUsers()}
    </h3>

    <!-- 割り当て済みユーザー -->
    {#if getAssignedUsers().length > 0}
      <div class="flex flex-wrap gap-2">
        {#each getAssignedUsers() as user (user.id)}
          <div class="flex items-center gap-2 rounded-md border px-2 py-1 text-sm">
            <!-- ユーザーアバター -->
            <div class="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
              {#if user.avatar_url}
                <img
                  src={user.avatar_url}
                  alt={getUserDisplayName(user)}
                  class="h-full w-full rounded-full object-cover"
                />
              {:else}
                {getUserInitials(user)}
              {/if}
            </div>
            
            <span>{getUserDisplayName(user)}</span>
            
            <!-- 割り当て解除ボタン -->
            <Button
              variant="ghost"
              size="sm"
              class="h-auto p-0 text-muted-foreground hover:text-destructive"
              onclick={() => handleUserUnassign(user.id)}
              disabled={isLoading}
            >
              <UserMinus class="h-3 w-3" />
            </Button>
          </div>
        {/each}
      </div>
    {:else}
      <p class="text-sm text-muted-foreground">まだユーザーが割り当てられていません</p>
    {/if}

    <!-- ユーザー追加 -->
    {#if getUnassignedUsers().length > 0}
      <div class="space-y-2">
        <h4 class="text-xs font-medium text-muted-foreground">ユーザーを追加</h4>
        <div class="flex flex-wrap gap-2">
          {#each getUnassignedUsers() as user (user.id)}
            <Button
              variant="outline"
              size="sm"
              class="h-auto px-2 py-1 text-sm"
              onclick={() => handleUserAssign(user.id)}
              disabled={isLoading}
            >
              <UserPlus class="h-3 w-3 mr-1" />
              <div class="flex items-center gap-1">
                <div class="flex h-4 w-4 items-center justify-center rounded-full bg-muted text-xs">
                  {#if user.avatar_url}
                    <img
                      src={user.avatar_url}
                      alt={getUserDisplayName(user)}
                      class="h-full w-full rounded-full object-cover"
                    />
                  {:else}
                    {getUserInitials(user)}
                  {/if}
                </div>
                <span>{getUserDisplayName(user)}</span>
              </div>
            </Button>
          {/each}
        </div>
      </div>
    {/if}
  </div>
{/if}