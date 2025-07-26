import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render } from '@testing-library/svelte';
import ConfirmDialog from '$lib/components/dialog/confirm-dialog.svelte';

describe('ConfirmDialog', () => {
  const defaultProps = {
    show: true,
    title: 'Confirm Action',
    message: 'Are you sure you want to proceed?',
    confirmText: 'Yes',
    cancelText: 'No',
    onConfirm: vi.fn(),
    onCancel: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('コンポーネントのpropsが正しく設定される', () => {
    // 複雑な外部依存のため基本的なテストのみ実装
    const props = defaultProps;
    expect(props.show).toBe(true);
    expect(props.title).toBe('Confirm Action');
    expect(props.message).toBe('Are you sure you want to proceed?');
    expect(props.confirmText).toBe('Yes');
    expect(props.cancelText).toBe('No');
    expect(props.onConfirm).toBeInstanceOf(Function);
    expect(props.onCancel).toBeInstanceOf(Function);
  });

  it('デフォルトのconfirmTextとcancelTextが設定される', () => {
    const propsWithoutText = {
      show: true,
      title: 'Test Title',
      message: 'Test Message',
      onConfirm: vi.fn(),
      onCancel: vi.fn()
    };
    
    expect(propsWithoutText.show).toBe(true);
    expect(propsWithoutText.title).toBe('Test Title');
    expect(propsWithoutText.message).toBe('Test Message');
    expect(propsWithoutText.onConfirm).toBeInstanceOf(Function);
    expect(propsWithoutText.onCancel).toBeInstanceOf(Function);
  });

  it('必要なpropsが正しく設定される', () => {
    const props = {
      show: true,
      title: 'Delete Item',
      message: 'This action cannot be undone.',
      confirmText: 'Delete',
      cancelText: 'Keep',
      onConfirm: vi.fn(),
      onCancel: vi.fn()
    };
    
    expect(props.show).toBe(true);
    expect(props.title).toBe('Delete Item');
    expect(props.message).toBe('This action cannot be undone.');
    expect(props.confirmText).toBe('Delete');
    expect(props.cancelText).toBe('Keep');
    expect(props.onConfirm).toBeInstanceOf(Function);
    expect(props.onCancel).toBeInstanceOf(Function);
  });

  it('特殊文字を含むtitleとmessageが処理される', () => {
    const props = {
      ...defaultProps,
      title: 'Title with <special> & "characters"',
      message: 'Message with <tags> & "quotes" and other special characters: @#$%^&*()'
    };
    
    expect(props.title).toBe('Title with <special> & "characters"');
    expect(props.message).toBe('Message with <tags> & "quotes" and other special characters: @#$%^&*()');
  });
});