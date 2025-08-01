<script lang="ts">
  import { getTranslationService } from '$lib/stores/locale.svelte';
  import Button from '$lib/components/shared/button.svelte';
  import Card from '$lib/components/ui/card.svelte';
  import SettingsDialog from '$lib/components/settings/settings-dialog.svelte';
  import { Settings, LogIn, LogOut, Users, ChevronUp } from 'lucide-svelte';
  import { useSidebar } from '$lib/components/ui/sidebar/context.svelte.js';

  interface User {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  }

  interface Props {
    user?: User | null;
    onLogin?: () => void;
    onLogout?: () => void;
    onSettings?: () => void;
    onSwitchAccount?: () => void;
  }

  let { user = null, onLogin, onLogout, onSettings, onSwitchAccount }: Props = $props();

  const translationService = getTranslationService();
  // Get sidebar state
  const sidebar = useSidebar();

  let showMenu = $state(false);
  let showSettings = $state(false);

  // Reactive messages
  const notSignedIn = translationService.getMessage('not_signed_in');
  const settingsLabel = translationService.getMessage('settings');
  const switchAccount = translationService.getMessage('switch_account');
  const signOut = translationService.getMessage('sign_out');
  const signIn = translationService.getMessage('sign_in');

  function getInitials(name: string): string {
    return name
      .split(' ')
      .map((word) => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  function toggleMenu() {
    showMenu = !showMenu;
  }

  function handleLogin() {
    onLogin?.();
    showMenu = false;
  }

  function handleLogout() {
    onLogout?.();
    showMenu = false;
  }

  function handleSettings() {
    showSettings = true;
    showMenu = false;
    onSettings?.();
  }

  function handleSwitchAccount() {
    onSwitchAccount?.();
    showMenu = false;
  }

  // Close menu when clicking outside
  function handleClickOutside(event: MouseEvent) {
    if (
      showMenu &&
      event.target &&
      (event.target as Element).closest &&
      !(event.target as Element).closest('.user-profile-container')
    ) {
      showMenu = false;
    }
  }

  $effect(() => {
    if (showMenu) {
      document.addEventListener('click', handleClickOutside);
    } else {
      document.removeEventListener('click', handleClickOutside);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  });
</script>

<div class="user-profile-container relative">
  <Button
    variant="ghost"
    class={sidebar.state === 'collapsed'
      ? 'hover:bg-muted flex h-auto w-full items-center justify-center p-2'
      : 'hover:bg-muted flex h-auto w-full items-center justify-between gap-3 p-3'}
    onclick={toggleMenu}
  >
    {#if sidebar.state === 'collapsed'}
      <!-- Collapsed: Show only avatar -->
      {#if user}
        <div
          class="bg-primary text-primary-foreground flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium"
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

  {#if showMenu}
    <Card class="absolute right-0 bottom-full left-0 z-50 mb-2 border shadow-lg">
      <div class="p-1">
        {#if user}
          <!-- User Info Section -->
          <div class="border-b px-3 py-2">
            <div class="text-sm font-medium">{user.name}</div>
            <div class="text-muted-foreground text-xs">{user.email}</div>
          </div>

          <!-- Menu Items -->
          <Button
            variant="ghost"
            size="sm"
            class="h-8 w-full justify-start gap-2 text-sm"
            onclick={handleSettings}
          >
            <Settings class="h-4 w-4" />
            {settingsLabel()}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            class="h-8 w-full justify-start gap-2 text-sm"
            onclick={handleSwitchAccount}
          >
            <Users class="h-4 w-4" />
            {switchAccount()}
          </Button>

          <div class="my-1 border-t"></div>

          <Button
            variant="ghost"
            size="sm"
            class="h-8 w-full justify-start gap-2 text-sm"
            onclick={handleLogout}
          >
            <LogOut class="h-4 w-4" />
            {signOut()}
          </Button>
        {:else}
          <!-- Not logged in -->
          <Button
            variant="ghost"
            size="sm"
            class="h-8 w-full justify-start gap-2 text-sm"
            onclick={handleLogin}
          >
            <LogIn class="h-4 w-4" />
            {signIn()}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            class="h-8 w-full justify-start gap-2 text-sm"
            onclick={handleSettings}
          >
            <Settings class="h-4 w-4" />
            {settingsLabel()}
          </Button>
        {/if}
      </div>
    </Card>
  {/if}
</div>

<!-- Settings Dialog -->
<SettingsDialog bind:open={showSettings} onOpenChange={(open) => (showSettings = open)} />
