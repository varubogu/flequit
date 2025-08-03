import { describe, test, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import UserProfile from '$lib/components/user/user-profile.svelte';
import { setTranslationService } from '$lib/stores/locale.svelte';
import {
  createUnitTestTranslationService,
  unitTestTranslations
} from '../../unit-translation-mock';

// --- Sidebar Context Mock ---
vi.mock('$lib/components/ui/sidebar/context.svelte.js', () => ({
  useSidebar: () => ({
    state: 'expanded',
    open: true,
    isMobile: false,
    toggleSidebar: vi.fn(),
    setOpen: vi.fn()
  })
}));

// --- Settings Dialog Mock ---
vi.mock('$lib/components/settings/settings-dialog.svelte', () => ({
  default: vi.fn().mockImplementation(() => ({ component: 'SettingsDialog' }))
}));

const mockUser = {
  id: '1',
  name: 'John Doe',
  email: 'john.doe@example.com',
  avatar: undefined
};

const mockUserWithAvatar = {
  id: '2',
  name: 'Jane Smith',
  email: 'jane.smith@example.com',
  avatar: 'https://example.com/avatar.jpg'
};

// Mock SettingsDialog to prevent it from actually rendering
vi.mock('$lib/components/settings-dialog.svelte', () => ({
  default: vi.fn()
}));

describe('UserProfile Component', () => {
  let onLogin: ReturnType<typeof vi.fn>;
  let onLogout: ReturnType<typeof vi.fn>;
  let onSettings: ReturnType<typeof vi.fn>;
  let onSwitchAccount: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    setTranslationService(createUnitTestTranslationService());
    onLogin = vi.fn();
    onLogout = vi.fn();
    onSettings = vi.fn();
    onSwitchAccount = vi.fn();
    vi.clearAllMocks();
  });

  const renderComponent = (props = {}) => {
    const defaultProps = {
      onLogin,
      onLogout,
      onSettings,
      onSwitchAccount
    };
    return render(UserProfile, { ...defaultProps, ...props });
  };

  describe('Rendering and State', () => {
    test('should render "Not signed in" when no user is provided', () => {
      renderComponent({ user: null });
      expect(screen.getByText(unitTestTranslations.not_signed_in)).toBeInTheDocument();
    });

    test('should render user name and email when user is provided', () => {
      renderComponent({ user: mockUser });
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('john.doe@example.com')).toBeInTheDocument();
    });

    test('should display user initials when no avatar is provided', () => {
      renderComponent({ user: mockUser });
      expect(screen.getByText('JD')).toBeInTheDocument();
    });

    test('should display user avatar when provided', () => {
      renderComponent({ user: mockUserWithAvatar });
      const avatar = screen.getByAltText('Jane Smith');
      expect(avatar).toBeInTheDocument();
      expect((avatar as HTMLImageElement).src).toBe(mockUserWithAvatar.avatar);
    });
  });

  describe('Menu Interaction', () => {
    test('should toggle menu on button click', async () => {
      renderComponent({ user: mockUser });
      const toggleButton = screen.getByRole('button', { name: /John Doe/ });

      // The menu is identified by its content
      expect(screen.queryByText(unitTestTranslations.switch_account)).not.toBeInTheDocument();

      await fireEvent.click(toggleButton);
      expect(screen.getByText(unitTestTranslations.switch_account)).toBeInTheDocument();

      await fireEvent.click(toggleButton);
      expect(screen.queryByText(unitTestTranslations.switch_account)).not.toBeInTheDocument();
    });

    test('should close menu when clicking outside', async () => {
      renderComponent({ user: mockUser });
      const toggleButton = screen.getByRole('button', { name: /John Doe/ });

      await fireEvent.click(toggleButton);
      expect(screen.getByText(unitTestTranslations.switch_account)).toBeInTheDocument();

      await fireEvent.click(document.body);
      expect(screen.queryByText(unitTestTranslations.switch_account)).not.toBeInTheDocument();
    });
  });

  describe('Logged Out Actions', () => {
    test('should show Sign In and Settings options when logged out', async () => {
      renderComponent({ user: null });
      const toggleButton = screen.getByRole('button', {
        name: new RegExp(unitTestTranslations.not_signed_in)
      });
      await fireEvent.click(toggleButton);

      expect(
        screen.getByRole('button', { name: new RegExp(unitTestTranslations.sign_in) })
      ).toBeInTheDocument();
      // There are two "Settings" buttons, one in the menu and one for the dialog
      expect(
        screen.getAllByRole('button', { name: new RegExp(unitTestTranslations.settings) }).length
      ).toBeGreaterThan(0);
    });

    test('should call onLogin and close menu when Sign In is clicked', async () => {
      renderComponent({ user: null });
      const toggleButton = screen.getByRole('button', {
        name: new RegExp(unitTestTranslations.not_signed_in)
      });
      await fireEvent.click(toggleButton);

      const signInButton = screen.getByRole('button', {
        name: new RegExp(unitTestTranslations.sign_in)
      });
      await fireEvent.click(signInButton);

      expect(onLogin).toHaveBeenCalledTimes(1);
      expect(screen.queryByText(unitTestTranslations.sign_in)).not.toBeInTheDocument();
    });
  });

  describe('Logged In Actions', () => {
    test('should show correct menu options when logged in', async () => {
      renderComponent({ user: mockUser });
      const toggleButton = screen.getByRole('button', { name: /John Doe/ });
      await fireEvent.click(toggleButton);

      expect(
        screen.getByRole('button', { name: new RegExp(unitTestTranslations.settings) })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: new RegExp(unitTestTranslations.switch_account) })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: new RegExp(unitTestTranslations.sign_out) })
      ).toBeInTheDocument();
    });

    test('should call onLogout and close menu when Sign Out is clicked', async () => {
      renderComponent({ user: mockUser });
      const toggleButton = screen.getByRole('button', { name: /John Doe/ });
      await fireEvent.click(toggleButton);

      const signOutButton = screen.getByRole('button', {
        name: new RegExp(unitTestTranslations.sign_out)
      });
      await fireEvent.click(signOutButton);

      expect(onLogout).toHaveBeenCalledTimes(1);
      expect(screen.queryByText(unitTestTranslations.sign_out)).not.toBeInTheDocument();
    });

    test('should call onSettings and close the menu', async () => {
      renderComponent({ user: mockUser });
      const toggleButton = screen.getByRole('button', { name: /John Doe/ });
      await fireEvent.click(toggleButton);

      // Get the settings button from the menu
      const settingsButton = screen.getByRole('button', {
        name: new RegExp(unitTestTranslations.settings)
      });
      await fireEvent.click(settingsButton);

      expect(onSettings).toHaveBeenCalledTimes(1);
      // The menu should close, so the "Switch Account" button (another menu item) should disappear
      expect(screen.queryByText(unitTestTranslations.switch_account)).not.toBeInTheDocument();
    });

    test('should call onSwitchAccount and close menu', async () => {
      renderComponent({ user: mockUser });
      const toggleButton = screen.getByRole('button', { name: /John Doe/ });
      await fireEvent.click(toggleButton);

      const switchAccountButton = screen.getByRole('button', {
        name: new RegExp(unitTestTranslations.switch_account)
      });
      await fireEvent.click(switchAccountButton);

      expect(onSwitchAccount).toHaveBeenCalledTimes(1);
      expect(screen.queryByText(unitTestTranslations.switch_account)).not.toBeInTheDocument();
    });
  });
});
