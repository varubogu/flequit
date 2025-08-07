<script lang="ts">
  import SettingsDialog from '$lib/components/settings/settings-dialog.svelte';
  import UserProfileContent from './user-profile-content.svelte';
  import { UserProfileLogic, type User } from './user-profile-logic.svelte';

  interface Props {
    user?: User | null;
    onLogin?: () => void;
    onLogout?: () => void;
    onSettings?: () => void;
    onSwitchAccount?: () => void;
  }

  let { user = null, onLogin, onLogout, onSettings, onSwitchAccount }: Props = $props();

  // Initialize logic
  const logic = new UserProfileLogic(user, onLogin, onLogout, onSettings, onSwitchAccount);

  // Setup click outside effect
  $effect(() => {
    return logic.setupClickOutsideEffect();
  });
</script>

<UserProfileContent {logic} />

<!-- Settings Dialog -->
<SettingsDialog
  bind:open={logic.showSettings}
  onOpenChange={(open) => (logic.showSettings = open)}
/>
