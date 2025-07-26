<script lang="ts">
  import Button from '$lib/components/button.svelte';
  import Card from '$lib/components/ui/card.svelte';
  import SettingsDialog from '$lib/components/settings/settings-dialog.svelte';
  import { Settings, LogIn, LogOut, Users, ChevronUp } from 'lucide-svelte';
  import * as m from '$paraglide/messages.js';
  import { reactiveMessage } from '$lib/stores/locale.svelte';

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

  let {
    user = null,
    onLogin,
    onLogout,
    onSettings,
    onSwitchAccount
  }: Props = $props();

  let showMenu = $state(false);
  let showSettings = $state(false);

  // Reactive messages
  const notSignedIn = reactiveMessage(m.not_signed_in);
  const settingsLabel = reactiveMessage(m.settings);
  const switchAccount = reactiveMessage(m.switch_account);
  const signOut = reactiveMessage(m.sign_out);
  const signIn = reactiveMessage(m.sign_in);

  function getInitials(name: string): string {
    return name
      .split(' ')
      .map(word => word.charAt(0))
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
    if (showMenu && event.target && (event.target as Element).closest && !(event.target as Element).closest('.user-profile-container')) {
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
    class="w-full h-auto p-3 flex items-center gap-3 justify-between hover:bg-muted"
    onclick={toggleMenu}
  >
    <div class="flex items-center gap-3 min-w-0">
      {#if user}
        <!-- User Avatar -->
        <div class="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium flex-shrink-0">
          {#if user.avatar}
            <img src={user.avatar} alt={user.name} class="w-full h-full rounded-full object-cover" />
          {:else}
            {getInitials(user.name)}
          {/if}
        </div>
        <!-- User Name -->
        <div class="min-w-0 flex-1 text-left">
          <div class="text-sm font-medium truncate">{user.name}</div>
          <div class="text-xs text-muted-foreground truncate">{user.email}</div>
        </div>
      {:else}
        <!-- Not logged in -->
        <div class="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
          <Users class="h-4 w-4 text-muted-foreground" />
        </div>
        <div class="min-w-0 flex-1 text-left">
          <div class="text-sm text-muted-foreground">{notSignedIn()}</div>
        </div>
      {/if}
    </div>
    <ChevronUp class="h-4 w-4 text-muted-foreground transition-transform {showMenu ? 'rotate-180' : ''}" />
  </Button>

  {#if showMenu}
    <Card class="absolute bottom-full left-0 right-0 mb-2 shadow-lg border z-50">
      <div class="p-1">
        {#if user}
          <!-- User Info Section -->
          <div class="px-3 py-2 border-b">
            <div class="text-sm font-medium">{user.name}</div>
            <div class="text-xs text-muted-foreground">{user.email}</div>
          </div>

          <!-- Menu Items -->
          <Button
            variant="ghost"
            size="sm"
            class="w-full justify-start gap-2 h-8 text-sm"
            onclick={handleSettings}
          >
            <Settings class="h-4 w-4" />
            {settingsLabel()}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            class="w-full justify-start gap-2 h-8 text-sm"
            onclick={handleSwitchAccount}
          >
            <Users class="h-4 w-4" />
            {switchAccount()}
          </Button>

          <div class="border-t my-1"></div>

          <Button
            variant="ghost"
            size="sm"
            class="w-full justify-start gap-2 h-8 text-sm"
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
            class="w-full justify-start gap-2 h-8 text-sm"
            onclick={handleLogin}
          >
            <LogIn class="h-4 w-4" />
            {signIn()}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            class="w-full justify-start gap-2 h-8 text-sm"
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
<SettingsDialog
  bind:open={showSettings}
  onOpenChange={(open) => showSettings = open}
/>
