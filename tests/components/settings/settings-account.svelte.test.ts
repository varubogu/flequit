import { describe, test, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import SettingsAccount from '$lib/components/settings/account/settings-account.svelte';

// Mock translation service
vi.mock('$lib/stores/locale.svelte', () => ({
  getTranslationService: () => ({
    getMessage: (key: string) => {
      return () => {
        const messages: Record<string, string> = {
          account_settings: 'Account Settings',
          account_type: 'Account Type',
          local_account: 'Local Account',
          cloud_account: 'Cloud Account',
          local_account_description:
            'Using local account. To access cloud features, please select Cloud Account.'
        };
        return messages[key] || key;
      };
    }
  })
}));

describe('SettingsAccount Component', () => {
  const defaultSettings = {
    lastSelectedAccount: 'local'
  };

  const cloudSettings = {
    lastSelectedAccount: 'cloud'
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('basic rendering', () => {
    test('should render account settings section', () => {
      render(SettingsAccount, { settings: defaultSettings });

      expect(screen.getByText('Account Settings')).toBeInTheDocument();
    });

    test('should render section with correct id', () => {
      const { container } = render(SettingsAccount, { settings: defaultSettings });

      const section = container.querySelector('#settings-account');
      expect(section).toBeInTheDocument();
    });

    test('should render account type selection', () => {
      render(SettingsAccount, { settings: defaultSettings });

      const accountTypeSelect = screen.getByLabelText('Account Type');
      expect(accountTypeSelect).toBeInTheDocument();

      const options = accountTypeSelect.querySelectorAll('option');
      expect(options).toHaveLength(2);
      expect(options[0]).toHaveTextContent('Local Account');
      expect(options[1]).toHaveTextContent('Cloud Account');
    });
  });

  describe('local account functionality', () => {
    test('should show local account description when local is selected', () => {
      render(SettingsAccount, { settings: defaultSettings });

      expect(screen.getByText(/Using local account/)).toBeInTheDocument();
    });

    test('should have correct default value for local account', () => {
      render(SettingsAccount, { settings: defaultSettings });

      const accountTypeSelect = screen.getByLabelText('Account Type') as HTMLSelectElement;
      expect(accountTypeSelect.value).toBe('local');
    });

    test('should display correct message for local account', () => {
      render(SettingsAccount, { settings: defaultSettings });

      expect(
        screen.getByText(
          'Using local account. To access cloud features, please select Cloud Account.'
        )
      ).toBeInTheDocument();
    });
  });

  describe('cloud account functionality', () => {
    test('should show cloud coming soon message when cloud is selected', () => {
      render(SettingsAccount, { settings: cloudSettings });

      expect(
        screen.getByText('Cloud account functionality will be available in future versions.')
      ).toBeInTheDocument();
    });

    test('should have correct value for cloud account selection', () => {
      render(SettingsAccount, { settings: cloudSettings });

      const accountTypeSelect = screen.getByLabelText('Account Type') as HTMLSelectElement;
      expect(accountTypeSelect.value).toBe('cloud');
    });

    test('should not show local account message when cloud is selected', () => {
      render(SettingsAccount, { settings: cloudSettings });

      expect(screen.queryByText(/Using local account/)).not.toBeInTheDocument();
    });
  });

  describe('styling and layout', () => {
    test('should apply correct CSS classes to main container', () => {
      const { container } = render(SettingsAccount, { settings: defaultSettings });

      const spaceContainer = container.querySelector('.space-y-6');
      expect(spaceContainer).toBeInTheDocument();
    });

    test('should apply correct CSS classes to select element', () => {
      render(SettingsAccount, { settings: defaultSettings });

      const select = screen.getByLabelText('Account Type');
      expect(select).toHaveClass('border-input');
      expect(select).toHaveClass('bg-background');
      expect(select).toHaveClass('text-foreground');
      expect(select).toHaveClass('mt-1');
      expect(select).toHaveClass('block');
      expect(select).toHaveClass('w-full');
      expect(select).toHaveClass('rounded-md');
      expect(select).toHaveClass('border');
      expect(select).toHaveClass('px-3');
      expect(select).toHaveClass('py-2');
      expect(select).toHaveClass('text-sm');
    });

    test('should apply correct CSS classes to description paragraph', () => {
      const { container } = render(SettingsAccount, { settings: defaultSettings });

      const description = container.querySelector('p');
      expect(description).toHaveClass('text-muted-foreground');
      expect(description).toHaveClass('bg-muted');
      expect(description).toHaveClass('max-w-2xl');
      expect(description).toHaveClass('rounded-lg');
      expect(description).toHaveClass('p-4');
      expect(description).toHaveClass('text-sm');
    });

    test('should limit select width with max-w-md', () => {
      const { container } = render(SettingsAccount, { settings: defaultSettings });

      const selectContainer = container.querySelector('.max-w-md');
      expect(selectContainer).toBeInTheDocument();
      expect(selectContainer?.querySelector('#account-type')).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    test('should have proper label association', () => {
      render(SettingsAccount, { settings: defaultSettings });

      const label = screen.getByLabelText('Account Type');
      expect(label).toHaveAttribute('id', 'account-type');
    });

    test('should use semantic HTML elements', () => {
      const { container } = render(SettingsAccount, { settings: defaultSettings });

      const section = container.querySelector('section');
      const heading = container.querySelector('h3');
      const label = container.querySelector('label');
      const select = container.querySelector('select');

      expect(section).toBeInTheDocument();
      expect(heading).toBeInTheDocument();
      expect(label).toBeInTheDocument();
      expect(select).toBeInTheDocument();
    });

    test('should have proper heading hierarchy', () => {
      const { container } = render(SettingsAccount, { settings: defaultSettings });

      const heading = container.querySelector('h3');
      expect(heading).toHaveClass('mb-4', 'text-lg', 'font-medium');
      expect(heading?.textContent).toBe('Account Settings');
    });
  });

  describe('integration with translation service', () => {
    test('should use translation service for all text', () => {
      render(SettingsAccount, { settings: defaultSettings });

      expect(screen.getByText('Account Settings')).toBeInTheDocument();
      expect(screen.getByText('Account Type')).toBeInTheDocument();
      expect(screen.getByText('Local Account')).toBeInTheDocument();
      expect(screen.getByText('Cloud Account')).toBeInTheDocument();
    });

    test('should display correct message for local account', () => {
      render(SettingsAccount, { settings: defaultSettings });
      expect(
        screen.getByText(
          'Using local account. To access cloud features, please select Cloud Account.'
        )
      ).toBeInTheDocument();
    });

    test('should display correct message for cloud account', () => {
      render(SettingsAccount, { settings: cloudSettings });
      expect(
        screen.getByText('Cloud account functionality will be available in future versions.')
      ).toBeInTheDocument();
    });
  });

  describe('component lifecycle', () => {
    test('should mount and unmount cleanly', () => {
      const { unmount } = render(SettingsAccount, { settings: defaultSettings });

      expect(() => unmount()).not.toThrow();
    });

    test('should handle prop updates without errors', () => {
      const { rerender } = render(SettingsAccount, { settings: defaultSettings });

      // Update settings should not throw
      expect(() => rerender({ settings: cloudSettings })).not.toThrow();
      expect(() => rerender({ settings: defaultSettings })).not.toThrow();
    });

    test('should maintain consistency across rerenders', () => {
      const { rerender } = render(SettingsAccount, { settings: defaultSettings });

      rerender({ settings: defaultSettings });
      rerender({ settings: cloudSettings });
      rerender({ settings: defaultSettings });

      const select = screen.getByLabelText('Account Type') as HTMLSelectElement;
      expect(select.value).toBe('local');
    });
  });

  describe('edge cases', () => {
    test('should handle unknown account type', () => {
      const unknownSettings = {
        lastSelectedAccount: 'unknown'
      };

      expect(() => {
        render(SettingsAccount, { settings: unknownSettings });
      }).not.toThrow();

      // Should show cloud message for non-local accounts
      expect(
        screen.getByText('Cloud account functionality will be available in future versions.')
      ).toBeInTheDocument();
    });

    test('should handle empty settings object', () => {
      const emptySettings = {
        lastSelectedAccount: ''
      };

      expect(() => {
        render(SettingsAccount, { settings: emptySettings });
      }).not.toThrow();

      // Should show cloud message for non-local accounts
      expect(
        screen.getByText('Cloud account functionality will be available in future versions.')
      ).toBeInTheDocument();
    });
  });
});
