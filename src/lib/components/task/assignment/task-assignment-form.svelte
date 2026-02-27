<script lang="ts">
  import type { User } from '$lib/types/user';
  import Button from '$lib/components/ui/button/button.svelte';
  import { UserPlus } from 'lucide-svelte';

  interface Props {
    unassignedUsers: User[];
    isLoading: boolean;
    onAssign: (userId: string) => void;
  }

  let { unassignedUsers, isLoading, onAssign }: Props = $props();

  function getUserDisplayName(user: User): string {
    return user.displayName || user.handleId;
  }

  function getUserInitials(user: User): string {
    const name = getUserDisplayName(user);
    return name
      .split(' ')
      .map((word) => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }
</script>

{#if unassignedUsers.length > 0}
  <div class="space-y-2">
    <h4 class="text-muted-foreground text-xs font-medium">ユーザーを追加</h4>
    <div class="flex flex-wrap gap-2">
      {#each unassignedUsers as user (user.id)}
        <Button
          variant="outline"
          size="sm"
          class="h-auto px-2 py-1 text-sm"
          onclick={() => onAssign(user.id)}
          disabled={isLoading}
        >
          <UserPlus class="mr-1 h-3 w-3" />
          <div class="flex items-center gap-1">
            <div class="bg-muted flex h-4 w-4 items-center justify-center rounded-full text-xs">
              {#if user.avatarUrl}
                <img
                  src={user.avatarUrl}
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
