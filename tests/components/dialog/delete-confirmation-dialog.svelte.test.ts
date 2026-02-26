import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render } from '@testing-library/svelte';
import DeleteConfirmationDialog from '$lib/components/dialog/delete-confirmation-dialog.svelte';

const baseProps = {
  open: true,
  title: '削除の確認',
  message: 'このアイテムを削除してもよろしいですか？',
  onConfirm: vi.fn(),
  onCancel: vi.fn()
};

describe('DeleteConfirmationDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders dialog content when open', () => {
    const { getByRole, getByText } = render(DeleteConfirmationDialog, baseProps);
    expect(getByRole('dialog')).toBeInTheDocument();
    expect(getByText(baseProps.title)).toBeInTheDocument();
    expect(getByText(baseProps.message)).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    const { queryByRole } = render(DeleteConfirmationDialog, { ...baseProps, open: false });
    expect(queryByRole('dialog')).toBeNull();
  });

  it('shows translation-backed button labels', () => {
    const { getByText } = render(DeleteConfirmationDialog, baseProps);
    expect(getByText('cancel')).toBeInTheDocument();
    expect(getByText('delete')).toBeInTheDocument();
  });

  it('invokes onConfirm when delete clicked', async () => {
    const onConfirm = vi.fn();
    const { getByText } = render(DeleteConfirmationDialog, { ...baseProps, onConfirm });
    await fireEvent.click(getByText('delete'));
    expect(onConfirm).toHaveBeenCalled();
  });

  it('invokes onCancel when cancel clicked', async () => {
    const onCancel = vi.fn();
    const { getByText } = render(DeleteConfirmationDialog, { ...baseProps, onCancel });
    await fireEvent.click(getByText('cancel'));
    expect(onCancel).toHaveBeenCalled();
  });

  it('renders destructive and secondary button classes', () => {
    const { getByText } = render(DeleteConfirmationDialog, baseProps);
    const cancelButton = getByText('cancel').closest('button');
    const deleteButton = getByText('delete').closest('button');
    expect(cancelButton?.className).toContain('secondary');
    expect(deleteButton?.className).toContain('destructive');
  });
});
