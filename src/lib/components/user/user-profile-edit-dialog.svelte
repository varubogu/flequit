<script lang="ts">
  import { useTranslation } from '$lib/hooks/use-translation.svelte';
  import type { User } from '$lib/types/user';
  import { errorHandler } from '$lib/stores/error-handler.svelte';
  import Button from '$lib/components/ui/button/button.svelte';
  import Input from '$lib/components/ui/input/input.svelte';
  import Label from '$lib/components/ui/label.svelte';
  import Textarea from '$lib/components/ui/textarea.svelte';
  import { UserService } from '$lib/services/domain/user';
  import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter
  } from '$lib/components/ui/dialog';

  interface Props {
    user: User | null;
    isOpen: boolean;
    onClose: () => void;
    onSave?: (user: User) => void;
  }

  let { user, isOpen = false, onClose, onSave }: Props = $props();

  const translationService = useTranslation();

  // Form state
  let username = $state('');
  let displayName = $state('');
  let email = $state('');
  let bio = $state('');
  let timezone = $state('');
  let isSaving = $state(false);

  // Initialize form when user changes
  $effect(() => {
    if (user) {
      username = user.handleId || '';
      displayName = user.displayName || '';
      email = user.email || '';
      bio = user.bio || '';
      timezone = user.timezone || '';
    }
  });

  // Translation messages
  const editProfile = translationService.getMessage('edit_profile');
  const usernameLabel = translationService.getMessage('username');
  const displayNameLabel = translationService.getMessage('display_name');
  const emailLabel = translationService.getMessage('email');
  const bioLabel = translationService.getMessage('bio');
  const timezoneLabel = translationService.getMessage('timezone');
  const cancel = translationService.getMessage('cancel');
  const save = translationService.getMessage('save');

  function createUpdatedUser(sourceUser: User): User {
    return {
      ...sourceUser,
      handleId: username.trim() || sourceUser.handleId,
      displayName: displayName.trim() || sourceUser.displayName,
      email: email.trim() || sourceUser.email,
      bio: bio.trim() || sourceUser.bio,
      timezone: timezone.trim() || sourceUser.timezone,
      updatedAt: new Date().toISOString()
    };
  }

  function addSaveError(message: string) {
    errorHandler.addError({
      type: 'general',
      message,
      retryable: false
    });
  }

  function handleClose() {
    if (!isSaving) {
      onClose();
    }
  }

  async function handleSave() {
    if (!user || isSaving) return;

    isSaving = true;
    try {
      const updatedUser = createUpdatedUser(user);

      const success = await UserService.update(updatedUser);

      if (success) {
        onSave?.(updatedUser);
        onClose();
      } else {
        addSaveError('プロフィール保存に失敗しました');
      }
    } catch {
      addSaveError('プロフィール保存中にエラーが発生しました');
    } finally {
      isSaving = false;
    }
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      handleClose();
    }
  }
</script>

<svelte:window onkeydown={handleKeydown} />

<Dialog bind:open={isOpen} onOpenChange={handleClose}>
  <DialogContent class="max-w-md">
    <DialogHeader>
      <DialogTitle>{editProfile()}</DialogTitle>
    </DialogHeader>

    {#if user}
      <div class="space-y-4">
        <!-- Username -->
        <div class="space-y-2">
          <Label for="username">{usernameLabel()}</Label>
          <Input
            id="username"
            bind:value={username}
            disabled={isSaving}
            placeholder="ユーザー名を入力"
          />
        </div>

        <!-- Display Name -->
        <div class="space-y-2">
          <Label for="display-name">{displayNameLabel()}</Label>
          <Input
            id="display-name"
            bind:value={displayName}
            disabled={isSaving}
            placeholder="表示名を入力（任意）"
          />
        </div>

        <!-- Email -->
        <div class="space-y-2">
          <Label for="email">{emailLabel()}</Label>
          <Input
            id="email"
            type="email"
            bind:value={email}
            disabled={isSaving}
            placeholder="メールアドレスを入力（任意）"
          />
        </div>

        <!-- Bio -->
        <div class="space-y-2">
          <Label for="bio">{bioLabel()}</Label>
          <Textarea id="bio" bind:value={bio} placeholder="自己紹介を入力（任意）" />
        </div>

        <!-- Timezone -->
        <div class="space-y-2">
          <Label for="timezone">{timezoneLabel()}</Label>
          <Input id="timezone" bind:value={timezone} disabled={isSaving} placeholder="Asia/Tokyo" />
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" onclick={handleClose} disabled={isSaving}>
          {cancel()}
        </Button>
        <Button onclick={handleSave} disabled={isSaving}>
          {isSaving ? '保存中...' : save()}
        </Button>
      </DialogFooter>
    {/if}
  </DialogContent>
</Dialog>
