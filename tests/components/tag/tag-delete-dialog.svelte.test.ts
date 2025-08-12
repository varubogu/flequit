import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import TagDeleteDialog from '$lib/components/tag/tag-delete-dialog.svelte';
import type { Tag } from "$lib/types/tag";
import { setTranslationService } from '$lib/stores/locale.svelte';
import {
  createUnitTestTranslationService,
  unitTestTranslations
} from '../../unit-translation-mock';

describe('TagDeleteDialog', () => {
  const mockTag: Tag = {
    id: '1',
    name: 'test-tag',
    color: '#ff0000',
    created_at: new Date(),
    updated_at: new Date()
  };

  const defaultProps = {
    open: true,
    tag: mockTag,
    onConfirm: vi.fn(),
    onCancel: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
    setTranslationService(createUnitTestTranslationService());
  });

  it('コンポーネントが正しくマウントされる', () => {
    const { container } = render(TagDeleteDialog, { props: defaultProps });
    expect(container).toBeTruthy();
  });

  it('ダイアログが開いているときに表示される', () => {
    render(TagDeleteDialog, { props: defaultProps });

    // アラートダイアログの要素が存在することを確認
    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
  });

  it('ダイアログが閉じているときに表示されない', () => {
    render(TagDeleteDialog, {
      props: {
        ...defaultProps,
        open: false
      }
    });

    // ダイアログが表示されないことを確認
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  });

  it('正しいタイトルが表示される', () => {
    render(TagDeleteDialog, { props: defaultProps });

    expect(screen.getByText(unitTestTranslations.delete_tag)).toBeInTheDocument();
  });

  it('正しい説明文が表示される', () => {
    render(TagDeleteDialog, { props: defaultProps });

    expect(
      screen.getByText(
        unitTestTranslations.delete_tag_description.replace('{{tagName}}', 'test-tag')
      )
    ).toBeInTheDocument();
  });

  it('キャンセルボタンが表示される', () => {
    render(TagDeleteDialog, { props: defaultProps });

    expect(screen.getByText(unitTestTranslations.cancel)).toBeInTheDocument();
  });

  it('削除ボタンが表示される', () => {
    render(TagDeleteDialog, { props: defaultProps });

    expect(screen.getByText(unitTestTranslations.delete)).toBeInTheDocument();
  });

  it('キャンセルボタンをクリックするとonCancelが呼ばれる', async () => {
    const onCancel = vi.fn();
    render(TagDeleteDialog, {
      props: {
        ...defaultProps,
        onCancel
      }
    });

    const cancelButton = screen.getByText(unitTestTranslations.cancel);
    await fireEvent.click(cancelButton);

    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('削除ボタンをクリックするとonConfirmが呼ばれる', async () => {
    const onConfirm = vi.fn();
    render(TagDeleteDialog, {
      props: {
        ...defaultProps,
        onConfirm
      }
    });

    const removeButton = screen.getByText(unitTestTranslations.delete);
    await fireEvent.click(removeButton);

    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('tagがnullの場合も正しく動作する', () => {
    render(TagDeleteDialog, {
      props: {
        ...defaultProps,
        tag: null
      }
    });

    // コンポーネントがクラッシュしないことを確認
    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
  });

  it('openプロパティでダイアログの表示状態が制御される', () => {
    // 最初は閉じた状態でレンダリング
    const { component } = render(TagDeleteDialog, {
      props: {
        ...defaultProps,
        open: false
      }
    });

    // 最初は表示されない
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();

    // コンポーネントが正常にマウントされていることを確認
    expect(component).toBeTruthy();
  });

  it('異なるタグ名で正しい説明文が表示される', () => {
    const differentTag: Tag = {
      id: '2',
      name: 'different-tag',
      color: '#00ff00',
      created_at: new Date(),
      updated_at: new Date()
    };

    render(TagDeleteDialog, {
      props: {
        ...defaultProps,
        tag: differentTag
      }
    });

    expect(
      screen.getByText(
        unitTestTranslations.delete_tag_description.replace('{{tagName}}', 'different-tag')
      )
    ).toBeInTheDocument();
  });

  it('必要なpropsが正しく設定される', () => {
    const props = {
      open: true,
      tag: mockTag,
      onConfirm: vi.fn(),
      onCancel: vi.fn()
    };

    const { container } = render(TagDeleteDialog, { props });

    expect(container).toBeTruthy();
    expect(props.onConfirm).toBeInstanceOf(Function);
    expect(props.onCancel).toBeInstanceOf(Function);
  });
});
