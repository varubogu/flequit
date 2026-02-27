<script lang="ts">
  import type { User } from '$lib/types/user';
  import Button from '$lib/components/ui/button/button.svelte';
  import { UserMinus } from 'lucide-svelte';

  interface Props {
    assignedUsers: User[];
    isLoading: boolean;
    onUnassign: (userId: string) => void;
  }

  let { assignedUsers, isLoading, onUnassign }: Props = $props();

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

{#if assignedUsers.length > 0}
  <div class="flex flex-wrap gap-2">
    {#each assignedUsers as user (user.id)}
      <div class="flex items-center gap-2 rounded-md border px-2 py-1 text-sm">
        <div
          class="bg-primary text-primary-foreground flex h-6 w-6 items-center justify-center rounded-full text-xs"
        >
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

        <Button
          variant="ghost"
          size="sm"
          class="text-muted-foreground hover:text-destructive h-auto p-0"
          onclick={() => onUnassign(user.id)}
          disabled={isLoading}
        >
          <UserMinus class="h-3 w-3" />
        </Button>
      </div>
    {/each}
  </div>
{:else}
  <p class="text-muted-foreground text-sm">まだユーザーが割り当てられていません</p>
{/if}
