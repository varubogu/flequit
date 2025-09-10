<script lang="ts">
  import { getTranslationService } from '$lib/stores/locale.svelte';
  import { getBackendService } from '$lib/services/backend';
  import type { User } from '$lib/types/user';
  import { errorHandler } from '$lib/stores/error-handler.svelte';
  import Button from '$lib/components/ui/button/button.svelte';
  import Input from '$lib/components/ui/input/input.svelte';
  import Label from '$lib/components/ui/label.svelte';
  import Textarea from '$lib/components/ui/textarea.svelte';
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

  const translationService = getTranslationService();

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
      username = user.handle_id || '';
      displayName = user.display_name || '';
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

  function handleClose() {
    if (!isSaving) {
      onClose();
    }
  }

  async function handleSave() {
    if (!user || isSaving) return;

    isSaving = true;
    try {
      const backend = await getBackendService();

      // Create updated user object
      const updatedUser: User = {
        ...user,
        handle_id: username.trim() || user.handle_id,
        display_name: displayName.trim() || user.display_name,
        email: email.trim() || user.email,
        bio: bio.trim() || user.bio,
        timezone: timezone.trim() || user.timezone,
        updated_at: new Date().toISOString()
      };

      // Save to backend
      const success = await backend.user.update(updatedUser);

      if (success) {
        onSave?.(updatedUser);
        onClose();
      } else {
        errorHandler.addError({ type: 'general', message: 'プロフィール保存に失敗しました', retryable: false });
      }
    } catch (error) {
      console.error('Failed to save user profile:', error);
      errorHandler.addError({ type: 'general', message: 'プロフィール保存中にエラーが発生しました', retryable: false });
    } finally {
      isSaving = false;
    }
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape' && !isSaving) {
      onClose();
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
          <Textarea
            id="bio"
            bind:value={bio}
            placeholder="自己紹介を入力（任意）"
          />
        </div>

        <!-- Timezone -->
        <div class="space-y-2">
          <Label for="timezone">{timezoneLabel()}</Label>
          <Input
            id="timezone"
            bind:value={timezone}
            disabled={isSaving}
            placeholder="Asia/Tokyo"
          />
        </div>
      </div>

      <DialogFooter>
        <Button
          variant="outline"
          onclick={handleClose}
          disabled={isSaving}
        >
          {cancel()}
        </Button>
        <Button
          onclick={handleSave}
          disabled={isSaving}
        >
          {isSaving ? '保存中...' : save()}
        </Button>
      </DialogFooter>
    {/if}
  </DialogContent>
</Dialog>
