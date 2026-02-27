<script lang="ts">
  import { useTranslation } from '$lib/hooks/use-translation.svelte';
  import { errorHandler } from '$lib/stores/error-handler.svelte';
  import { selectionStore } from '$lib/stores/selection-store.svelte';
  import type { TaskWithSubTasks } from '$lib/types/task';
  import type { SubTask } from '$lib/types/sub-task';
  import type { User } from '$lib/types/user';
  import { Users } from 'lucide-svelte';
  import { AssignmentService } from '$lib/services/domain/assignment';
  import TaskAssignmentList from '$lib/components/task/assignment/task-assignment-list.svelte';
  import TaskAssignmentForm from '$lib/components/task/assignment/task-assignment-form.svelte';

  interface Props {
    task?: TaskWithSubTasks | null;
    subTask?: SubTask | null;
    availableUsers?: User[];
    onAssignmentUpdated?: (itemId: string, assignedUsers: string[]) => void;
  }

  let { task, subTask, availableUsers = [], onAssignmentUpdated }: Props = $props();

  const translationService = useTranslation();

  let currentItem = $derived(subTask || task);
  let isSubTask = $derived(!!subTask);
  let assignedUserIds = $derived(currentItem?.assignedUserIds || []);
  let isLoading = $state(false);

  const assignedUsersLabel = translationService.getMessage('assigned_users');

  let computedAssignedUsers = $derived(availableUsers.filter((user) => assignedUserIds.includes(user.id)));
  let computedUnassignedUsers = $derived(availableUsers.filter((user) => !assignedUserIds.includes(user.id)));

  async function handleUserAssign(userId: string) {
    if (!currentItem || isLoading) return;

    isLoading = true;
    try {
      const projectId = selectionStore.selectedProjectId;

      if (!projectId) {
        errorHandler.addError({ type: 'general', message: 'プロジェクトが選択されていません', retryable: false });
        return;
      }

      if (isSubTask) {
        const success = await AssignmentService.createSubtaskAssignment(projectId, currentItem.id, userId);
        if (success) {
          onAssignmentUpdated?.(currentItem.id, [...assignedUserIds, userId]);
        } else {
          errorHandler.addError({ type: 'general', message: 'サブタスクへのユーザー割り当てに失敗しました', retryable: false });
        }
      } else {
        const success = await AssignmentService.createTaskAssignment(projectId, currentItem.id, userId);
        if (success) {
          onAssignmentUpdated?.(currentItem.id, [...assignedUserIds, userId]);
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
      const projectId = selectionStore.selectedProjectId;

      if (!projectId) {
        errorHandler.addError({ type: 'general', message: 'プロジェクトが選択されていません', retryable: false });
        return;
      }

      if (isSubTask) {
        const success = await AssignmentService.deleteSubtaskAssignment(projectId, currentItem.id, userId);
        if (success) {
          onAssignmentUpdated?.(currentItem.id, assignedUserIds.filter((id: string) => id !== userId));
        } else {
          errorHandler.addError({ type: 'general', message: 'サブタスクからのユーザー割り当て解除に失敗しました', retryable: false });
        }
      } else {
        const success = await AssignmentService.deleteTaskAssignment(projectId, currentItem.id, userId);
        if (success) {
          onAssignmentUpdated?.(currentItem.id, assignedUserIds.filter((id: string) => id !== userId));
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
</script>

{#if currentItem}
  <div class="space-y-3">
    <h3 class="flex items-center gap-2 text-sm font-medium">
      <Users class="h-4 w-4" />
      {assignedUsersLabel()}
    </h3>

    <TaskAssignmentList
      assignedUsers={computedAssignedUsers}
      {isLoading}
      onUnassign={handleUserUnassign}
    />

    <TaskAssignmentForm
      unassignedUsers={computedUnassignedUsers}
      {isLoading}
      onAssign={handleUserAssign}
    />
  </div>
{/if}
