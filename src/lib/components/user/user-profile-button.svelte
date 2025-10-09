<script lang="ts">
  import Button from '$lib/components/shared/button.svelte';
  import { Users, ChevronUp } from 'lucide-svelte';
  import type { User } from './user-profile.svelte';
  import { getTranslationService } from '$lib/stores/locale.svelte';

  interface Props {
    user: User | null;
    collapsed: boolean;
    showMenu: boolean;
    ontoggle: () => void;
  }

  let { user = null, collapsed = false, showMenu = false, ontoggle }: Props = $props();

  const translationService = getTranslationService();
  const notSignedIn = translationService.getMessage('not_signed_in');

  function getInitials(name: string): string {
    return name
      .split(' ')
      .map((word) => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }
</script>

<Button
  variant="ghost"
  class={collapsed
    ? 'hover:bg-muted flex h-auto w-full items-center justify-center p-2'
    : 'hover:bg-muted flex h-auto w-full items-center justify-between gap-3 p-3'}
  onclick={ontoggle}
>
  {#if collapsed}
    <!-- Collapsed: Show only avatar -->
    {#if user}
      <div
        class="bg-primary text-primary-foreground flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium"
      >
        {#if user.avatar}
          <img src={user.avatar} alt={user.name} class="h-full w-full rounded-full object-cover" />
        {:else}
          {getInitials(user.name)}
        {/if}
      </div>
    {:else}
      <div class="bg-muted flex h-8 w-8 items-center justify-center rounded-full">
        <Users class="text-muted-foreground h-4 w-4" />
      </div>
    {/if}
  {:else}
    <!-- Expanded: Show full profile -->
    <div class="flex min-w-0 items-center gap-3">
      {#if user}
        <!-- User Avatar -->
        <div
          class="bg-primary text-primary-foreground flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-sm font-medium"
        >
          {#if user.avatar}
            <img
              src={user.avatar}
              alt={user.name}
              class="h-full w-full rounded-full object-cover"
            />
          {:else}
            {getInitials(user.name)}
          {/if}
        </div>
        <!-- User Name -->
        <div class="min-w-0 flex-1 text-left">
          <div class="truncate text-sm font-medium">{user.name}</div>
          <div class="text-muted-foreground truncate text-xs">{user.email}</div>
        </div>
      {:else}
        <!-- Not logged in -->
        <div class="bg-muted flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full">
          <Users class="text-muted-foreground h-4 w-4" />
        </div>
        <div class="min-w-0 flex-1 text-left">
          <div class="text-muted-foreground text-sm">{notSignedIn()}</div>
        </div>
      {/if}
    </div>
    <ChevronUp
      class="text-muted-foreground h-4 w-4 transition-transform {showMenu ? 'rotate-180' : ''}"
    />
  {/if}
</Button>
