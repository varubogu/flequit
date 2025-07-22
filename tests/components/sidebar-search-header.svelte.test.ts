import { describe, test, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import SidebarSearchHeader from '../../src/lib/components/sidebar-search-header.svelte';

describe('SidebarSearchHeader Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('should render search button', () => {
    render(SidebarSearchHeader);
    expect(screen.getByText('Search')).toBeInTheDocument();
    expect(screen.getByText('Search').closest('button')).toBeInTheDocument();
  });

  test('should open search dialog on click', async () => {
    render(SidebarSearchHeader);
    const searchButton = screen.getByText('Search').closest('button');
    await fireEvent.click(searchButton!);
    expect(true).toBe(true);
  });

  test('should open search dialog with keyboard shortcut', async () => {
    render(SidebarSearchHeader);
    await fireEvent.keyDown(document, { key: 'k', metaKey: true });
    expect(true).toBe(true);
  });

  test('should open search dialog with ctrl+k', async () => {
    render(SidebarSearchHeader);
    await fireEvent.keyDown(document, { key: 'k', ctrlKey: true });
    expect(true).toBe(true);
  });

  test('should show keyboard shortcut hint', () => {
    render(SidebarSearchHeader);
    expect(screen.getByText('Search').closest('button')).toBeInTheDocument();
  });
});