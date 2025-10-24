<script lang="ts">
  import Button from '$lib/components/shared/button.svelte';
  import Card from '$lib/components/ui/card.svelte';
  import { Settings, LogIn, LogOut, Users, Edit } from 'lucide-svelte';
  import type { User } from './user-profile.svelte';
  import { useTranslation } from '$lib/hooks/use-translation.svelte';

  interface Props {
    user: User | null;
    onlogin: () => void;
    onlogout: () => void;
    onsettings: () => void;
    onswitch: () => void;
    onedit: () => void;
  }

  let { user = null, onlogin, onlogout, onsettings, onswitch, onedit }: Props = $props();

  const translationService = useTranslation();
  const settingsLabel = translationService.getMessage('settings');
  const switchAccount = translationService.getMessage('switch_account');
  const signOut = translationService.getMessage('sign_out');
  const signIn = translationService.getMessage('sign_in');
</script>

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
        onclick={onedit}
      >
        <Edit class="h-4 w-4" />
        プロフィール編集
      </Button>

      <Button
        variant="ghost"
        size="sm"
        class="h-8 w-full justify-start gap-2 text-sm"
        onclick={onsettings}
      >
        <Settings class="h-4 w-4" />
        {settingsLabel()}
      </Button>

      <Button
        variant="ghost"
        size="sm"
        class="h-8 w-full justify-start gap-2 text-sm"
        onclick={onswitch}
      >
        <Users class="h-4 w-4" />
        {switchAccount()}
      </Button>

      <div class="my-1 border-t"></div>

      <Button
        variant="ghost"
        size="sm"
        class="h-8 w-full justify-start gap-2 text-sm"
        onclick={onlogout}
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
        onclick={onlogin}
      >
        <LogIn class="h-4 w-4" />
        {signIn()}
      </Button>

      <Button
        variant="ghost"
        size="sm"
        class="h-8 w-full justify-start gap-2 text-sm"
        onclick={onsettings}
      >
        <Settings class="h-4 w-4" />
        {settingsLabel()}
      </Button>
    {/if}
  </div>
</Card>
