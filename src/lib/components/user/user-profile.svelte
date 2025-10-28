<script lang="ts">
  import { useSidebar } from '$lib/components/ui/sidebar/context.svelte.js';
  import SettingsDialog from '$lib/components/settings/settings-dialog.svelte';
  import UserProfileEditDialog from '$lib/components/user/user-profile-edit-dialog.svelte';
  import UserProfileButton from '$lib/components/user/user-profile-button.svelte';
  import UserProfileMenu from '$lib/components/user/user-profile-menu.svelte';
  import { createUserProfileController } from '$lib/components/user/user-profile-controller.svelte';
  import type { User as FullUser } from '$lib/types/user';

  // このコンポーネント専用のUser型（簡略版）
  export interface User {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  }

  interface Props {
    user?: User | null;
    fullUser?: FullUser | null;
    onLogin?: () => void;
    onLogout?: () => void;
    onSettings?: () => void;
    onSwitchAccount?: () => void;
    onUserUpdated?: (user: FullUser) => void;
  }

  let {
    user = $bindable(null),
    fullUser = $bindable(null),
    onLogin,
    onLogout,
    onSettings,
    onSwitchAccount,
    onUserUpdated
  }: Props = $props();

  // Get sidebar state
  const sidebar = useSidebar();

  // Create controller
  const controller = createUserProfileController({
    user,
    fullUser,
    onLogin,
    onLogout,
    onSettings,
    onSwitchAccount,
    onUserUpdated
  });

  // Setup click outside effect
  $effect(() => {
    if (controller.showMenu) {
      document.addEventListener('click', controller.handleClickOutside);
    } else {
      document.removeEventListener('click', controller.handleClickOutside);
    }

    return () => {
      document.removeEventListener('click', controller.handleClickOutside);
    };
  });
</script>

<div class="user-profile-container relative">
  <UserProfileButton
    user={user}
    collapsed={sidebar.state === 'collapsed'}
    showMenu={controller.showMenu}
    ontoggle={controller.toggleMenu}
  />

  {#if controller.showMenu}
    <UserProfileMenu
      user={user}
      onlogin={controller.handleLogin}
      onlogout={controller.handleLogout}
      onsettings={controller.handleSettings}
      onswitch={controller.handleSwitchAccount}
      onedit={controller.handleEditProfile}
    />
  {/if}
</div>

<!-- Settings Dialog -->
<SettingsDialog
  bind:open={controller.showSettings}
  onOpenChange={(open) => (controller.showSettings = open)}
/>

<!-- プロフィール編集ダイアログ -->
<UserProfileEditDialog
  user={fullUser || null}
  isOpen={controller.showEditDialog}
  onClose={controller.handleEditDialogClose}
  onSave={controller.handleUserSaved}
/>
