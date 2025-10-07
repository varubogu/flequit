<script lang="ts">
  import type { ViewType } from '$lib/stores/view-store.svelte';
  import * as Sidebar from '$lib/components/ui/sidebar';
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

<Sidebar.Root collapsible="icon" class="border-r">
  <Sidebar.Header>
    <div class="flex items-center justify-between p-2">
      <Sidebar.Trigger />
    </div>
    <SidebarSearchHeader />
  </Sidebar.Header>

  <Sidebar.Content>
    <Sidebar.Group>
      <SidebarViewList {currentView} {onViewChange} />
    </Sidebar.Group>

    <Sidebar.Separator />

    <Sidebar.Group>
      <SidebarProjectList {currentView} {onViewChange} />
    </Sidebar.Group>

    <Sidebar.Separator />

    <Sidebar.Group>
      <SidebarTagList {currentView} {onViewChange} />
    </Sidebar.Group>
  </Sidebar.Content>

  <Sidebar.Footer>
    <UserProfile
      user={currentUser}
      onLogin={handleLogin}
      onLogout={handleLogout}
      onSettings={handleSettings}
      onSwitchAccount={handleSwitchAccount}
    />
  </Sidebar.Footer>
</Sidebar.Root>
