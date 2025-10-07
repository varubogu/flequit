<script lang="ts">
  import type { ViewType } from '$lib/stores/view-store.svelte';
  import Card from '$lib/components/ui/card.svelte';
  import SidebarSearchHeader from '$lib/components/sidebar/sidebar-search-header.svelte';
  import SidebarViewList from '$lib/components/sidebar/sidebar-view-list.svelte';
  import SidebarProjectList from '$lib/components/sidebar/sidebar-project-list.svelte';
  import SidebarTagList from '$lib/components/sidebar/sidebar-tag-list.svelte';
  import UserProfile from '$lib/components/user/user-profile.svelte';

  interface Props {
    currentView?: ViewType;
    onViewChange?: (view: ViewType) => void;
  }

  let { currentView = 'all', onViewChange }: Props = $props();

  let currentUser = $state<{
    id: string;
    name: string;
    email: string;
    avatar?: string;
  } | null>(null);

  function handleLogin() {
    // TODO: 認証フロー実装時に処理を追加
  }

  function handleLogout() {
    currentUser = null;
  }

  function handleSettings() {
    // TODO: Implement settings logic
  }

  function handleSwitchAccount() {
    // TODO: アカウント切り替えフロー実装時に処理を追加
  }
</script>

<Card class="flex h-full w-64 flex-col border-r">
  <SidebarSearchHeader />

  <nav class="flex-1 p-4">
    <div class="space-y-1">
      <SidebarViewList {currentView} {onViewChange} />
      <SidebarProjectList {currentView} {onViewChange} />
      <SidebarTagList {currentView} {onViewChange} />
    </div>
  </nav>

  <div class="border-t">
    <UserProfile
      user={currentUser}
      onLogin={handleLogin}
      onLogout={handleLogout}
      onSettings={handleSettings}
      onSwitchAccount={handleSwitchAccount}
    />
  </div>
</Card>
