import { describe, test, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';

// Mock child components
vi.mock('$lib/components/settings-dialog.svelte', () => ({
  default: vi.fn(() => ({ $set: vi.fn(), $destroy: vi.fn() }))
}));

// Import after mocks
import UserProfile from '../../src/lib/components/user-profile.svelte';

// Mock user data
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

describe('UserProfile Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Component Rendering', () => {
    test('should render without errors', () => {
      const { container } = render(UserProfile);
      expect(container).toBeDefined();
    });

    test('should have proper container structure', () => {
      const { container } = render(UserProfile);
      const userProfileContainer = container.querySelector('.user-profile-container');
      expect(userProfileContainer).toBeInTheDocument();
    });
  });

  describe('Not Logged In State', () => {
    test('should display "Not signed in" when no user provided', () => {
      render(UserProfile);
      expect(screen.getByText('Not signed in')).toBeInTheDocument();
    });

    test('should show Users icon for non-logged in state', () => {
      const { container } = render(UserProfile);
      const usersIcon = container.querySelector('[class*="lucide-users"]');
      expect(usersIcon).toBeInTheDocument();
    });

    test('should display sign in option when menu is opened', async () => {
      render(UserProfile);
      
      // Click to open menu
      const menuButton = screen.getByRole('button');
      await fireEvent.click(menuButton);
      
      expect(screen.getByText('Sign In')).toBeInTheDocument();
    });
  });

  describe('Logged In State', () => {
    test('should display user name and email when logged in', () => {
      render(UserProfile, { props: { user: mockUser } });
      
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('john.doe@example.com')).toBeInTheDocument();
    });

    test('should display user initials when no avatar provided', () => {
      render(UserProfile, { props: { user: mockUser } });
      
      expect(screen.getByText('JD')).toBeInTheDocument();
    });

    test('should display avatar image when provided', () => {
      render(UserProfile, { props: { user: mockUserWithAvatar } });
      
      const avatarImage = screen.getByAltText('Jane Smith');
      expect(avatarImage).toBeInTheDocument();
      expect(avatarImage.getAttribute('src')).toBe('https://example.com/avatar.jpg');
    });

    test('should show logged in menu options', async () => {
      render(UserProfile, { props: { user: mockUser } });
      
      // Click to open menu
      const menuButton = screen.getByRole('button');
      await fireEvent.click(menuButton);
      
      expect(screen.getByText('Settings')).toBeInTheDocument();
      expect(screen.getByText('Switch Account')).toBeInTheDocument();
      expect(screen.getByText('Sign Out')).toBeInTheDocument();
    });
  });

  describe('Menu Interaction', () => {
    test('should toggle menu visibility on button click', async () => {
      render(UserProfile, { props: { user: mockUser } });
      
      const menuButton = screen.getByRole('button');
      
      // Menu should be closed initially
      expect(screen.queryByText('Settings')).not.toBeInTheDocument();
      
      // Click to open menu
      await fireEvent.click(menuButton);
      expect(screen.getByText('Settings')).toBeInTheDocument();
      
      // Click again to close menu
      await fireEvent.click(menuButton);
      expect(screen.queryByText('Settings')).not.toBeInTheDocument();
    });

    test('should show chevron icon in correct orientation', async () => {
      const { container } = render(UserProfile, { props: { user: mockUser } });
      
      const chevronIcon = container.querySelector('[class*="lucide-chevron-up"]');
      expect(chevronIcon).toBeInTheDocument();
      
      // Check rotation class changes when menu opens
      const menuButton = screen.getByRole('button');
      await fireEvent.click(menuButton);
      
      // Chevron should have rotation class when menu is open
      const rotatedChevron = container.querySelector('[class*="rotate-180"]');
      expect(rotatedChevron).toBeInTheDocument();
    });
  });

  describe('Callback Functions', () => {
    test('should call onLogin when Sign In is clicked', async () => {
      const onLogin = vi.fn();
      render(UserProfile, { props: { onLogin } });
      
      // Open menu
      const menuButton = screen.getByRole('button');
      await fireEvent.click(menuButton);
      
      // Click Sign In
      const signInButton = screen.getByText('Sign In');
      await fireEvent.click(signInButton);
      
      expect(onLogin).toHaveBeenCalledTimes(1);
    });

    test('should call onLogout when Sign Out is clicked', async () => {
      const onLogout = vi.fn();
      render(UserProfile, { props: { user: mockUser, onLogout } });
      
      // Open menu
      const menuButton = screen.getByRole('button');
      await fireEvent.click(menuButton);
      
      // Click Sign Out
      const signOutButton = screen.getByText('Sign Out');
      await fireEvent.click(signOutButton);
      
      expect(onLogout).toHaveBeenCalledTimes(1);
    });

    test('should call onSettings when Settings is clicked', async () => {
      const onSettings = vi.fn();
      render(UserProfile, { props: { user: mockUser, onSettings } });
      
      // Open menu
      const menuButton = screen.getByRole('button');
      await fireEvent.click(menuButton);
      
      // Click Settings
      const settingsButton = screen.getByText('Settings');
      await fireEvent.click(settingsButton);
      
      expect(onSettings).toHaveBeenCalledTimes(1);
    });

    test('should call onSwitchAccount when Switch Account is clicked', async () => {
      const onSwitchAccount = vi.fn();
      render(UserProfile, { props: { user: mockUser, onSwitchAccount } });
      
      // Open menu
      const menuButton = screen.getByRole('button');
      await fireEvent.click(menuButton);
      
      // Click Switch Account
      const switchAccountButton = screen.getByText('Switch Account');
      await fireEvent.click(switchAccountButton);
      
      expect(onSwitchAccount).toHaveBeenCalledTimes(1);
    });
  });

  describe('Menu Auto-Close Behavior', () => {
    test('should close menu after login action', async () => {
      const onLogin = vi.fn();
      render(UserProfile, { props: { onLogin } });
      
      // Open menu
      const menuButton = screen.getByRole('button');
      await fireEvent.click(menuButton);
      expect(screen.getByText('Sign In')).toBeInTheDocument();
      
      // Click Sign In
      const signInButton = screen.getByText('Sign In');
      await fireEvent.click(signInButton);
      
      // Menu should be closed
      expect(screen.queryByText('Sign In')).not.toBeInTheDocument();
    });

    test('should close menu after logout action', async () => {
      const onLogout = vi.fn();
      render(UserProfile, { props: { user: mockUser, onLogout } });
      
      // Open menu
      const menuButton = screen.getByRole('button');
      await fireEvent.click(menuButton);
      expect(screen.getByText('Sign Out')).toBeInTheDocument();
      
      // Click Sign Out
      const signOutButton = screen.getByText('Sign Out');
      await fireEvent.click(signOutButton);
      
      // Menu should be closed
      expect(screen.queryByText('Sign Out')).not.toBeInTheDocument();
    });

    test('should close menu after settings action', async () => {
      const onSettings = vi.fn();
      render(UserProfile, { props: { user: mockUser, onSettings } });
      
      // Open menu
      const menuButton = screen.getByRole('button');
      await fireEvent.click(menuButton);
      expect(screen.getByText('Settings')).toBeInTheDocument();
      
      // Click Settings
      const settingsButton = screen.getByText('Settings');
      await fireEvent.click(settingsButton);
      
      // Menu should be closed
      expect(screen.queryByText('Settings')).not.toBeInTheDocument();
    });
  });

  describe('Utility Functions', () => {
    test('should generate correct initials for single name', () => {
      render(UserProfile, { props: { user: { ...mockUser, name: 'John' } } });
      expect(screen.getByText('J')).toBeInTheDocument();
    });

    test('should generate correct initials for multiple names', () => {
      render(UserProfile, { props: { user: { ...mockUser, name: 'John Michael Doe' } } });
      expect(screen.getByText('JM')).toBeInTheDocument();
    });

    test('should handle empty name gracefully', () => {
      expect(() => {
        render(UserProfile, { props: { user: { ...mockUser, name: '' } } });
      }).not.toThrow();
    });
  });

  describe('Props Handling', () => {
    test('should handle missing callback props gracefully', () => {
      expect(() => {
        render(UserProfile, { props: { user: mockUser } });
      }).not.toThrow();
    });

    test('should handle undefined user prop', () => {
      expect(() => {
        render(UserProfile, { props: { user: undefined } });
      }).not.toThrow();
    });

    test('should handle null user prop', () => {
      expect(() => {
        render(UserProfile, { props: { user: null } });
      }).not.toThrow();
      
      expect(screen.getByText('Not signed in')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    test('should have proper button role for main toggle', () => {
      render(UserProfile, { props: { user: mockUser } });
      
      const toggleButton = screen.getByRole('button');
      expect(toggleButton).toBeInTheDocument();
    });

    test('should have proper alt text for avatar images', () => {
      render(UserProfile, { props: { user: mockUserWithAvatar } });
      
      const avatarImage = screen.getByAltText('Jane Smith');
      expect(avatarImage).toBeInTheDocument();
    });

    test('should have proper menu structure', async () => {
      render(UserProfile, { props: { user: mockUser } });
      
      // Open menu
      const menuButton = screen.getByRole('button');
      await fireEvent.click(menuButton);
      
      // Menu items should be buttons
      const menuItems = screen.getAllByRole('button');
      expect(menuItems.length).toBeGreaterThan(1);
    });
  });

  describe('Visual States', () => {
    test('should show user info in menu when logged in', async () => {
      render(UserProfile, { props: { user: mockUser } });
      
      // Open menu
      const menuButton = screen.getByRole('button');
      await fireEvent.click(menuButton);
      
      // Should show user info twice (main area and menu header)
      const nameElements = screen.getAllByText('John Doe');
      const emailElements = screen.getAllByText('john.doe@example.com');
      
      expect(nameElements.length).toBeGreaterThanOrEqual(2);
      expect(emailElements.length).toBeGreaterThanOrEqual(2);
    });

    test('should show different menu for logged in vs logged out', async () => {
      // Test logged out state
      render(UserProfile);
      expect(screen.getByText('Not signed in')).toBeInTheDocument();
      
      // Test logged in state
      const { rerender } = render(UserProfile, { props: { user: mockUser } });
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('john.doe@example.com')).toBeInTheDocument();
    });
  });

  describe('Component State Management', () => {
    test('should manage menu visibility state correctly', async () => {
      const { component } = render(UserProfile, { props: { user: mockUser } });
      
      expect(component).toBeDefined();
      
      // Test that menu opens and closes
      const menuButton = screen.getByRole('button');
      
      // Initially closed
      expect(screen.queryByText('Settings')).not.toBeInTheDocument();
      
      // Open
      await fireEvent.click(menuButton);
      expect(screen.getByText('Settings')).toBeInTheDocument();
      
      // Close
      await fireEvent.click(menuButton);
      expect(screen.queryByText('Settings')).not.toBeInTheDocument();
    });

    test('should manage settings dialog state', () => {
      const { component } = render(UserProfile, { props: { user: mockUser } });
      
      // Settings dialog management should be present
      expect(component).toBeDefined();
    });
  });
});