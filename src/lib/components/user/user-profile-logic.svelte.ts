import { getTranslationService } from '$lib/stores/locale.svelte';
import { getBackendService } from '$lib/services/backend';
import type { User as FullUser } from '$lib/types/user';

// このコンポーネント専用のUser型（簡略版） - 後方互換性のため保持
export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

export class UserProfileLogic {
  // Props
  user?: User | null;
  fullUser?: FullUser | null; // 完全なユーザー情報
  onLogin?: () => void;
  onLogout?: () => void;
  onSettings?: () => void;
  onSwitchAccount?: () => void;
  onUserUpdated?: (user: FullUser) => void;

  // State
  showMenu = $state(false);
  showSettings = $state(false);
  showEditDialog = $state(false);

  // Translation service
  private translationService = getTranslationService();

  constructor(
    user?: User | null,
    fullUser?: FullUser | null,
    onLogin?: () => void,
    onLogout?: () => void,
    onSettings?: () => void,
    onSwitchAccount?: () => void,
    onUserUpdated?: (user: FullUser) => void
  ) {
    this.user = user;
    this.fullUser = fullUser;
    this.onLogin = onLogin;
    this.onLogout = onLogout;
    this.onSettings = onSettings;
    this.onSwitchAccount = onSwitchAccount;
    this.onUserUpdated = onUserUpdated;
  }

  // Reactive messages
  notSignedIn = this.translationService.getMessage('not_signed_in');
  settingsLabel = this.translationService.getMessage('settings');
  switchAccount = this.translationService.getMessage('switch_account');
  signOut = this.translationService.getMessage('sign_out');
  signIn = this.translationService.getMessage('sign_in');

  getInitials(name: string): string {
    return name
      .split(' ')
      .map((word) => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  toggleMenu() {
    this.showMenu = !this.showMenu;
  }

  handleLogin() {
    this.onLogin?.();
    this.showMenu = false;
  }

  handleLogout() {
    this.onLogout?.();
    this.showMenu = false;
  }

  handleSettings() {
    this.showSettings = true;
    this.showMenu = false;
    this.onSettings?.();
  }

  handleSwitchAccount() {
    this.onSwitchAccount?.();
    this.showMenu = false;
  }

  handleEditProfile() {
    this.showEditDialog = true;
    this.showMenu = false;
  }

  handleEditDialogClose() {
    this.showEditDialog = false;
  }

  async handleUserSaved(updatedUser: FullUser) {
    try {
      // Update local user data
      if (this.user) {
        this.user.name = updatedUser.display_name || updatedUser.username;
        this.user.email = updatedUser.email || '';
      }
      this.fullUser = updatedUser;

      // Notify parent component
      this.onUserUpdated?.(updatedUser);
    } catch (error) {
      console.error('Failed to handle user save:', error);
    }
  }

  // Close menu when clicking outside
  handleClickOutside(event: MouseEvent) {
    if (
      this.showMenu &&
      event.target &&
      (event.target as Element).closest &&
      !(event.target as Element).closest('.user-profile-container')
    ) {
      this.showMenu = false;
    }
  }

  setupClickOutsideEffect() {
    // This should be called from the component's $effect
    if (this.showMenu) {
      document.addEventListener('click', this.handleClickOutside.bind(this));
    } else {
      document.removeEventListener('click', this.handleClickOutside.bind(this));
    }

    return () => {
      document.removeEventListener('click', this.handleClickOutside.bind(this));
    };
  }
}
