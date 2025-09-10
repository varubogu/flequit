<script lang="ts">
  import Button from '$lib/components/shared/button.svelte';
  import Card from '$lib/components/ui/card.svelte';
  import { Settings, LogIn, LogOut, Users, ChevronUp, Edit } from 'lucide-svelte';
  import { useSidebar } from '$lib/components/ui/sidebar/context.svelte.js';
  import type { UserProfileLogic } from './user-profile-logic.svelte';
  import UserProfileEditDialog from './user-profile-edit-dialog.svelte';

  interface Props {
    logic: UserProfileLogic;
  }

  let { logic }: Props = $props();

  // Get sidebar state
  const sidebar = useSidebar();
</script>

<div class="user-profile-container relative">
  <Button
    variant="ghost"
    class={sidebar.state === 'collapsed'
      ? 'hover:bg-muted flex h-auto w-full items-center justify-center p-2'
      : 'hover:bg-muted flex h-auto w-full items-center justify-between gap-3 p-3'}
    onclick={logic.toggleMenu.bind(logic)}
  >
    {#if sidebar.state === 'collapsed'}
      <!-- Collapsed: Show only avatar -->
      {#if logic.user}
        <div
          class="bg-primary text-primary-foreground flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium"
        >
          {#if logic.user.avatar}
            <img
              src={logic.user.avatar}
              alt={logic.user.name}
              class="h-full w-full rounded-full object-cover"
            />
          {:else}
            {logic.getInitials(logic.user.name)}
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
        {#if logic.user}
          <!-- User Avatar -->
          <div
            class="bg-primary text-primary-foreground flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-sm font-medium"
          >
            {#if logic.user.avatar}
              <img
                src={logic.user.avatar}
                alt={logic.user.name}
                class="h-full w-full rounded-full object-cover"
              />
            {:else}
              {logic.getInitials(logic.user.name)}
            {/if}
          </div>
          <!-- User Name -->
          <div class="min-w-0 flex-1 text-left">
            <div class="truncate text-sm font-medium">{logic.user.name}</div>
            <div class="text-muted-foreground truncate text-xs">{logic.user.email}</div>
          </div>
        {:else}
          <!-- Not logged in -->
          <div class="bg-muted flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full">
            <Users class="text-muted-foreground h-4 w-4" />
          </div>
          <div class="min-w-0 flex-1 text-left">
            <div class="text-muted-foreground text-sm">{logic.notSignedIn()}</div>
          </div>
        {/if}
      </div>
      <ChevronUp
        class="text-muted-foreground h-4 w-4 transition-transform {logic.showMenu
          ? 'rotate-180'
          : ''}"
      />
    {/if}
  </Button>

  {#if logic.showMenu}
    <Card class="absolute right-0 bottom-full left-0 z-50 mb-2 border shadow-lg">
      <div class="p-1">
        {#if logic.user}
          <!-- User Info Section -->
          <div class="border-b px-3 py-2">
            <div class="text-sm font-medium">{logic.user.name}</div>
            <div class="text-muted-foreground text-xs">{logic.user.email}</div>
          </div>

          <!-- Menu Items -->
          <Button
            variant="ghost"
            size="sm"
            class="h-8 w-full justify-start gap-2 text-sm"
            onclick={logic.handleEditProfile.bind(logic)}
          >
            <Edit class="h-4 w-4" />
            プロフィール編集
          </Button>

          <Button
            variant="ghost"
            size="sm"
            class="h-8 w-full justify-start gap-2 text-sm"
            onclick={logic.handleSettings.bind(logic)}
          >
            <Settings class="h-4 w-4" />
            {logic.settingsLabel()}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            class="h-8 w-full justify-start gap-2 text-sm"
            onclick={logic.handleSwitchAccount.bind(logic)}
          >
            <Users class="h-4 w-4" />
            {logic.switchAccount()}
          </Button>

          <div class="my-1 border-t"></div>

          <Button
            variant="ghost"
            size="sm"
            class="h-8 w-full justify-start gap-2 text-sm"
            onclick={logic.handleLogout.bind(logic)}
          >
            <LogOut class="h-4 w-4" />
            {logic.signOut()}
          </Button>
        {:else}
          <!-- Not logged in -->
          <Button
            variant="ghost"
            size="sm"
            class="h-8 w-full justify-start gap-2 text-sm"
            onclick={logic.handleLogin.bind(logic)}
          >
            <LogIn class="h-4 w-4" />
            {logic.signIn()}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            class="h-8 w-full justify-start gap-2 text-sm"
            onclick={logic.handleSettings.bind(logic)}
          >
            <Settings class="h-4 w-4" />
            {logic.settingsLabel()}
          </Button>
        {/if}
      </div>
    </Card>
  {/if}
</div>

<!-- プロフィール編集ダイアログ -->
<UserProfileEditDialog
  user={logic.fullUser || null}
  isOpen={logic.showEditDialog}
  onClose={logic.handleEditDialogClose.bind(logic)}
  onSave={logic.handleUserSaved.bind(logic)}
/>
