import { describe, test, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import SettingsAccount from '$lib/components/settings/settings-account.svelte';

describe('SettingsAccount Component', () => {
  const defaultSettings = {
    selectedAccount: 'local',
    accountIcon: null,
    accountName: '',
    email: '',
    password: '',
    serverUrl: ''
  };

  const cloudSettings = {
    selectedAccount: 'cloud',
    accountIcon: null,
    accountName: 'Test User',
    email: 'test@example.com',
    password: 'password123',
    serverUrl: 'https://api.example.com'
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('should render account settings section', () => {
    render(SettingsAccount, { settings: defaultSettings });

    expect(screen.getByText('Account Settings')).toBeInTheDocument();
  });

  test('should render account type selection', () => {
    render(SettingsAccount, { settings: defaultSettings });

    const accountTypeSelect = screen.getByLabelText('Account Type');
    expect(accountTypeSelect).toBeInTheDocument();

    const options = accountTypeSelect.querySelectorAll('option');
    expect(options[0]).toHaveTextContent('Local Account');
    expect(options[1]).toHaveTextContent('Cloud Account');
  });

  test('should show local account message when local is selected', () => {
    render(SettingsAccount, { settings: defaultSettings });

    expect(screen.getByText(/Using local account/)).toBeInTheDocument();
    expect(screen.getByText(/To access cloud features/)).toBeInTheDocument();
  });

  test('should not show cloud fields when local account is selected', () => {
    render(SettingsAccount, { settings: defaultSettings });

    expect(screen.queryByLabelText('Account Name')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Email Address')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Password')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Server URL')).not.toBeInTheDocument();
  });

  test('should show cloud fields when cloud account is selected', () => {
    render(SettingsAccount, { settings: cloudSettings });

    expect(screen.getByText('Organization')).toBeInTheDocument();
    expect(screen.getByText('Example Organization')).toBeInTheDocument();
    expect(screen.getByLabelText('Account Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Email Address')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByLabelText('Server URL')).toBeInTheDocument();
  });

  test('should render organization info for cloud account', () => {
    render(SettingsAccount, { settings: cloudSettings });

    expect(screen.getByText('Organization')).toBeInTheDocument();
    expect(screen.getByText('Example Organization')).toBeInTheDocument();

    // Check for organization icon
    const { container } = render(SettingsAccount, { settings: cloudSettings });
    const orgIcon = container.querySelector('.w-8.h-8.bg-primary.rounded-full');
    expect(orgIcon).toBeInTheDocument();
  });

  test('should render account icon upload button for cloud account', () => {
    render(SettingsAccount, { settings: cloudSettings });

    expect(screen.getByText('Account Icon')).toBeInTheDocument();
    expect(screen.getByText('Choose File')).toBeInTheDocument();
  });

  test('should render account type select with correct value', () => {
    const settings = { ...defaultSettings, selectedAccount: 'cloud' };
    render(SettingsAccount, { settings });

    const accountTypeSelect = screen.getByLabelText('Account Type') as HTMLSelectElement;
    expect(accountTypeSelect.value).toBe('cloud');
  });

  test('should render account name input with correct value', () => {
    const settings = { ...cloudSettings, accountName: 'New Name' };
    render(SettingsAccount, { settings });

    const accountNameInput = screen.getByLabelText('Account Name') as HTMLInputElement;
    expect(accountNameInput.value).toBe('New Name');
  });

  test('should render email input with correct value', () => {
    const settings = { ...cloudSettings, email: 'new@example.com' };
    render(SettingsAccount, { settings });

    const emailInput = screen.getByLabelText('Email Address') as HTMLInputElement;
    expect(emailInput.value).toBe('new@example.com');
  });

  test('should render password input with correct value', () => {
    const settings = { ...cloudSettings, password: 'newpassword' };
    render(SettingsAccount, { settings });

    const passwordInput = screen.getByLabelText('Password') as HTMLInputElement;
    expect(passwordInput.value).toBe('newpassword');
  });

  test('should render server URL input with correct value', () => {
    const settings = { ...cloudSettings, serverUrl: 'https://new-api.example.com' };
    render(SettingsAccount, { settings });

    const serverUrlInput = screen.getByLabelText('Server URL') as HTMLInputElement;
    expect(serverUrlInput.value).toBe('https://new-api.example.com');
  });

  test('should have correct input types', () => {
    render(SettingsAccount, { settings: cloudSettings });

    const emailInput = screen.getByLabelText('Email Address');
    const passwordInput = screen.getByLabelText('Password');

    expect(emailInput).toHaveAttribute('type', 'email');
    expect(passwordInput).toHaveAttribute('type', 'password');
  });

  test('should have correct default values for cloud account', () => {
    render(SettingsAccount, { settings: cloudSettings });

    const accountTypeSelect = screen.getByLabelText('Account Type') as HTMLSelectElement;
    const accountNameInput = screen.getByLabelText('Account Name') as HTMLInputElement;
    const emailInput = screen.getByLabelText('Email Address') as HTMLInputElement;
    const passwordInput = screen.getByLabelText('Password') as HTMLInputElement;
    const serverUrlInput = screen.getByLabelText('Server URL') as HTMLInputElement;

    expect(accountTypeSelect.value).toBe('cloud');
    expect(accountNameInput.value).toBe('Test User');
    expect(emailInput.value).toBe('test@example.com');
    expect(passwordInput.value).toBe('password123');
    expect(serverUrlInput.value).toBe('https://api.example.com');
  });

  test('should have responsive grid layout for cloud fields', () => {
    const { container } = render(SettingsAccount, { settings: cloudSettings });

    const gridContainer = container.querySelector(
      '.grid.grid-cols-1.md\\:grid-cols-2.xl\\:grid-cols-3'
    );
    expect(gridContainer).toBeInTheDocument();
  });

  test('should render section with correct id', () => {
    const { container } = render(SettingsAccount, { settings: defaultSettings });

    const section = container.querySelector('#settings-account');
    expect(section).toBeInTheDocument();
  });

  test('should have server URL field span multiple columns', () => {
    const { container } = render(SettingsAccount, { settings: cloudSettings });

    const serverUrlContainer = container.querySelector('.md\\:col-span-2');
    expect(serverUrlContainer).toBeInTheDocument();
    expect(serverUrlContainer?.querySelector('#server-url')).toBeInTheDocument();
  });
});
