import type { User as FullUser } from '$lib/types/user';
import type { User } from './user-profile.svelte';

/**
 * User profile controller
 *
 * Manages state and event handlers for user profile component
 */
export class UserProfileController {
  showMenu = $state(false);
  showSettings = $state(false);
  showEditDialog = $state(false);

  private user: User | null;
  private fullUser: FullUser | null;
  private onLogin?: () => void;
  private onLogout?: () => void;
  private onSettings?: () => void;
  private onSwitchAccount?: () => void;
  private onUserUpdated?: (user: FullUser) => void;

  constructor(props: {
    user: User | null;
    fullUser: FullUser | null;
    onLogin?: () => void;
    onLogout?: () => void;
    onSettings?: () => void;
    onSwitchAccount?: () => void;
    onUserUpdated?: (user: FullUser) => void;
  }) {
    this.user = props.user;
    this.fullUser = props.fullUser;
    this.onLogin = props.onLogin;
    this.onLogout = props.onLogout;
    this.onSettings = props.onSettings;
    this.onSwitchAccount = props.onSwitchAccount;
    this.onUserUpdated = props.onUserUpdated;
  }

  // Event handlers
  toggleMenu = () => {
    this.showMenu = !this.showMenu;
  };

  handleLogin = () => {
    this.onLogin?.();
    this.showMenu = false;
  };

  handleLogout = () => {
    this.onLogout?.();
    this.showMenu = false;
  };

  handleSettings = () => {
    this.showSettings = true;
    this.showMenu = false;
    this.onSettings?.();
  };

  handleSwitchAccount = () => {
    this.onSwitchAccount?.();
    this.showMenu = false;
  };

  handleEditProfile = () => {
    this.showEditDialog = true;
    this.showMenu = false;
  };

  handleEditDialogClose = () => {
    this.showEditDialog = false;
  };

  handleUserSaved = async (updatedUser: FullUser) => {
    try {
      // Update local user data
      if (this.user) {
        this.user.name = updatedUser.displayName || updatedUser.handleId;
        this.user.email = updatedUser.email || '';
      }
      this.fullUser = updatedUser;

      // Notify parent component
      this.onUserUpdated?.(updatedUser);
    } catch (error) {
      console.error('Failed to handle user save:', error);
    }
  };

  // Close menu when clicking outside
  handleClickOutside = (event: MouseEvent) => {
    if (
      this.showMenu &&
      event.target &&
      (event.target as Element).closest &&
      !(event.target as Element).closest('.user-profile-container')
    ) {
      this.showMenu = false;
    }
  };

  // Setup effect
  setupClickOutsideEffect(callback: (handler: (e: MouseEvent) => void) => void) {
    $effect(() => {
      if (this.showMenu) {
        callback(this.handleClickOutside);
      }
    });
  }
}

/**
 * Create user profile controller
 */
export function createUserProfileController(props: {
  user: User | null;
  fullUser: FullUser | null;
  onLogin?: () => void;
  onLogout?: () => void;
  onSettings?: () => void;
  onSwitchAccount?: () => void;
  onUserUpdated?: (user: FullUser) => void;
}) {
  return new UserProfileController(props);
}
