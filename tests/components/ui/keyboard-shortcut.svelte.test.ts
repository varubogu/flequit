import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, waitFor } from '@testing-library/svelte';
import KeyboardShortcut from '$lib/components/ui/keyboard-shortcut.svelte';

// navigator.platform と navigator.userAgent をモック
Object.defineProperty(window, 'navigator', {
  value: {
    platform: 'MacIntel',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
  },
  writable: true
});

describe('KeyboardShortcut', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('コンポーネントが正常にレンダリングされる', () => {
    expect(() => {
      render(KeyboardShortcut, {
        props: {
          keys: ['Ctrl', 'C']
        }
      });
    }).not.toThrow();
  });

  it('基本的なキーが表示される', () => {
    render(KeyboardShortcut, {
      props: {
        keys: ['Ctrl', 'C']
      }
    });

    const kbd = document.querySelector('kbd');
    expect(kbd).toBeInTheDocument();
    expect(kbd?.textContent).toContain('C');
  });

  it('複数のキーが+で区切られて表示される', () => {
    render(KeyboardShortcut, {
      props: {
        keys: ['Ctrl', 'Shift', 'P']
      }
    });

    const kbd = document.querySelector('kbd');
    expect(kbd?.textContent).toMatch(/.*\+.*\+.*/);
  });

  it('Macでcmdキーが⌘で表示される', () => {
    // Mac環境を設定
    Object.defineProperty(window, 'navigator', {
      value: {
        platform: 'MacIntel',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)'
      },
      writable: true
    });

    render(KeyboardShortcut, {
      props: {
        keys: ['cmd', 'C']
      }
    });

    const kbd = document.querySelector('kbd');
    expect(kbd?.textContent).toContain('⌘');
  });

  it('WindowsでcmdキーがCtrlで表示される', () => {
    // Windows環境を設定
    Object.defineProperty(window, 'navigator', {
      value: {
        platform: 'Win32',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
      },
      writable: true
    });

    render(KeyboardShortcut, {
      props: {
        keys: ['cmd', 'C']
      }
    });

    const kbd = document.querySelector('kbd');
    expect(kbd?.textContent).toContain('Ctrl');
  });

  it('Macでaltキーが⌥で表示される', () => {
    Object.defineProperty(window, 'navigator', {
      value: {
        platform: 'MacIntel',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)'
      },
      writable: true
    });

    render(KeyboardShortcut, {
      props: {
        keys: ['alt', 'F4']
      }
    });

    const kbd = document.querySelector('kbd');
    expect(kbd?.textContent).toContain('⌥');
  });

  it('Macでshiftキーが⇧で表示される', () => {
    Object.defineProperty(window, 'navigator', {
      value: {
        platform: 'MacIntel',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)'
      },
      writable: true
    });

    render(KeyboardShortcut, {
      props: {
        keys: ['shift', 'Tab']
      }
    });

    const kbd = document.querySelector('kbd');
    expect(kbd?.textContent).toContain('⇧');
  });

  it('特殊キーが正しいシンボルで表示される', () => {
    render(KeyboardShortcut, {
      props: {
        keys: ['enter']
      }
    });

    const kbd = document.querySelector('kbd');
    expect(kbd?.textContent).toContain('↵');
  });

  it('escapeキーが正しく表示される', () => {
    render(KeyboardShortcut, {
      props: {
        keys: ['escape']
      }
    });

    const kbd = document.querySelector('kbd');
    expect(kbd?.textContent).toContain('Esc');
  });

  it('方向キーが正しいシンボルで表示される', () => {
    render(KeyboardShortcut, {
      props: {
        keys: ['up', 'down', 'left', 'right']
      }
    });

    const kbd = document.querySelector('kbd');
    expect(kbd?.textContent).toContain('↑');
    expect(kbd?.textContent).toContain('↓');
    expect(kbd?.textContent).toContain('←');
    expect(kbd?.textContent).toContain('→');
  });

  it('spaceキーが正しいシンボルで表示される', () => {
    render(KeyboardShortcut, {
      props: {
        keys: ['space']
      }
    });

    const kbd = document.querySelector('kbd');
    expect(kbd?.textContent).toContain('␣');
  });

  it('tabキーが正しいシンボルで表示される', () => {
    render(KeyboardShortcut, {
      props: {
        keys: ['tab']
      }
    });

    const kbd = document.querySelector('kbd');
    expect(kbd?.textContent).toContain('⇥');
  });

  it('backspaceキーが正しいシンボルで表示される', () => {
    render(KeyboardShortcut, {
      props: {
        keys: ['backspace']
      }
    });

    const kbd = document.querySelector('kbd');
    expect(kbd?.textContent).toContain('⌫');
  });

  it('カスタムクラスが適用される', () => {
    const customClass = 'custom-shortcut-class';
    render(KeyboardShortcut, {
      props: {
        keys: ['Ctrl', 'C'],
        class: customClass
      }
    });

    const kbd = document.querySelector('kbd');
    expect(kbd).toHaveClass(customClass);
  });

  it('基本スタイルクラスが適用される', () => {
    render(KeyboardShortcut, {
      props: {
        keys: ['Ctrl', 'C']
      }
    });

    const kbd = document.querySelector('kbd');
    expect(kbd).toHaveClass(
      'bg-muted',
      'text-muted-foreground',
      'pointer-events-none',
      'inline-flex',
      'h-5',
      'items-center',
      'gap-1',
      'rounded',
      'border',
      'px-1.5',
      'font-mono',
      'font-medium',
      'select-none'
    );
  });

  it('hideOnMobile=trueでモバイル環境では非表示になる', () => {
    // モバイル環境を設定
    Object.defineProperty(window, 'navigator', {
      value: {
        platform: 'iPhone',
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X)'
      },
      writable: true
    });

    render(KeyboardShortcut, {
      props: {
        keys: ['Ctrl', 'C'],
        hideOnMobile: true
      }
    });

    const kbd = document.querySelector('kbd');
    expect(kbd).not.toBeInTheDocument();
  });

  it('hideOnMobile=falseでモバイル環境でも表示される', () => {
    // モバイル環境を設定
    Object.defineProperty(window, 'navigator', {
      value: {
        platform: 'iPhone',
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X)'
      },
      writable: true
    });

    render(KeyboardShortcut, {
      props: {
        keys: ['Ctrl', 'C'],
        hideOnMobile: false
      }
    });

    const kbd = document.querySelector('kbd');
    expect(kbd).toBeInTheDocument();
  });

  it('未知のキーは大文字で表示される', async () => {
    // デスクトップ環境を設定
    Object.defineProperty(window, 'navigator', {
      value: {
        platform: 'Win32',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      writable: true
    });

    render(KeyboardShortcut, {
      props: {
        keys: ['unknownkey'],
        hideOnMobile: false
      }
    });

    await waitFor(() => {
      const kbd = document.querySelector('kbd');
      expect(kbd).toBeInTheDocument();
      expect(kbd?.textContent).toContain('UNKNOWNKEY');
    });
  });

  it('キーの大文字小文字は統一される', async () => {
    // デスクトップ環境を設定
    Object.defineProperty(window, 'navigator', {
      value: {
        platform: 'Win32',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      writable: true
    });

    render(KeyboardShortcut, {
      props: {
        keys: ['ctrl', 'SHIFT', 'Alt', 'c'],
        hideOnMobile: false
      }
    });

    await waitFor(() => {
      const kbd = document.querySelector('kbd');
      expect(kbd).toBeInTheDocument();
      expect(kbd?.textContent).toContain('C');
    });
  });

  it('空のkeysでもエラーが発生しない', () => {
    expect(() => {
      render(KeyboardShortcut, {
        props: {
          keys: [],
          hideOnMobile: false
        }
      });
    }).not.toThrow();
  });

  it('単一のキーでも正しく表示される', async () => {
    // デスクトップ環境を設定
    Object.defineProperty(window, 'navigator', {
      value: {
        platform: 'Win32',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      writable: true
    });

    render(KeyboardShortcut, {
      props: {
        keys: ['F1'],
        hideOnMobile: false
      }
    });

    await waitFor(() => {
      const kbd = document.querySelector('kbd');
      expect(kbd).toBeInTheDocument();
      expect(kbd?.textContent?.trim()).toBe('F1');
      expect(kbd?.textContent).not.toContain('+');
    });
  });
});
