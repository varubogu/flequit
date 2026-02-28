import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/svelte';
import SettingsDialogSidebar from '$lib/components/settings/settings-dialog-sidebar.svelte';

type CategoryItem = {
  id: string;
  name: string;
  description: string;
};

const categories: CategoryItem[] = [
  { id: 'basic', name: 'General', description: 'General settings' },
  { id: 'appearance', name: 'Appearance', description: 'Theme and colors' }
];

function createProps(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    categories,
    selectedCategory: 'basic',
    searchQuery: '',
    onSelectCategory: vi.fn(),
    onSearchQueryChange: vi.fn(),
    isMobile: false,
    sidebarOpen: true,
    toggleSidebar: vi.fn(),
    searchLabel: 'Search settings...',
    ...overrides
  };
}

describe('SettingsDialogSidebar', () => {
  it('カテゴリ一覧と検索入力を表示する', () => {
    render(SettingsDialogSidebar, { props: createProps() });

    expect(screen.getByPlaceholderText('Search settings...')).toBeInTheDocument();
    expect(screen.getByText('General')).toBeInTheDocument();
    expect(screen.getByText('Appearance')).toBeInTheDocument();
    expect(screen.getByText('General settings')).toBeInTheDocument();
    expect(screen.getByText('Theme and colors')).toBeInTheDocument();
  });

  it('検索入力時に onSearchQueryChange を呼ぶ', async () => {
    const onSearchQueryChange = vi.fn();
    render(SettingsDialogSidebar, {
      props: createProps({ onSearchQueryChange })
    });

    const input = screen.getByPlaceholderText('Search settings...');
    await fireEvent.input(input, { target: { value: 'app' } });

    expect(onSearchQueryChange).toHaveBeenCalledWith('app');
  });

  it('デスクトップではカテゴリ選択時にサイドバーを閉じない', async () => {
    const onSelectCategory = vi.fn();
    const toggleSidebar = vi.fn();
    render(SettingsDialogSidebar, {
      props: createProps({ onSelectCategory, toggleSidebar, isMobile: false })
    });

    const categoryButton = screen.getByText('Appearance').closest('button');
    expect(categoryButton).not.toBeNull();
    await fireEvent.click(categoryButton!);

    expect(onSelectCategory).toHaveBeenCalledWith('appearance');
    expect(toggleSidebar).not.toHaveBeenCalled();
  });

  it('モバイルではカテゴリ選択時にサイドバーを閉じる', async () => {
    const onSelectCategory = vi.fn();
    const toggleSidebar = vi.fn();
    render(SettingsDialogSidebar, {
      props: createProps({ onSelectCategory, toggleSidebar, isMobile: true, sidebarOpen: true })
    });

    const categoryButton = screen.getByText('Appearance').closest('button');
    expect(categoryButton).not.toBeNull();
    await fireEvent.click(categoryButton!);

    expect(onSelectCategory).toHaveBeenCalledWith('appearance');
    expect(toggleSidebar).toHaveBeenCalledOnce();
  });

  it('モバイル表示でオーバーレイのクリックと Escape でサイドバーを閉じる', async () => {
    const toggleSidebar = vi.fn();
    const { container } = render(SettingsDialogSidebar, {
      props: createProps({ isMobile: true, sidebarOpen: true, toggleSidebar })
    });

    const overlay = container.querySelector('div[role="button"][tabindex="0"]');
    expect(overlay).not.toBeNull();

    await fireEvent.click(overlay!);
    await fireEvent.keyDown(overlay!, { key: 'Enter' });
    await fireEvent.keyDown(overlay!, { key: 'Escape' });

    expect(toggleSidebar).toHaveBeenCalledTimes(2);
  });

  it('モバイルでもサイドバーが閉じているとオーバーレイを表示しない', () => {
    const { container } = render(SettingsDialogSidebar, {
      props: createProps({ isMobile: true, sidebarOpen: false })
    });

    expect(container.querySelector('div[role="button"][tabindex="0"]')).toBeNull();
  });
});
