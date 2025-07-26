<script lang="ts">
  import * as m from '$paraglide/messages.js';
  import { reactiveMessage } from '$lib/stores/locale.svelte';

  type Props = {
    value: number | undefined;
    oninput?: (event: Event) => void;
  };

  let { value = $bindable(), oninput }: Props = $props();

  const repeatCountLabel = reactiveMessage(m.repeat_count);
  const infiniteRepeatPlaceholder = reactiveMessage(m.infinite_repeat_placeholder);
  const infiniteRepeatDescription = reactiveMessage(m.infinite_repeat_description);


  // コンポーネントの入力フィールド用の内部状態（文字列として保持）
  let inputValue = $state(value === undefined ? '' : String(value));

  // 親コンポーネントから渡される `value` が変更されたときに、
  // 内部の `inputValue` を更新するためのエフェクト
  $effect(() => {
    const parentValueStr = value === undefined ? '' : String(value);
    if (parentValueStr !== inputValue) {
      inputValue = parentValueStr;
    }
  });

  function handleKeyDown(event: KeyboardEvent) {
    // Backspace, Delete, Tab, Escape, Enter, 矢印キーなどを許可
    if (
      [
        'Backspace',
        'Delete',
        'Tab',
        'Escape',
        'Enter',
        'ArrowLeft',
        'ArrowRight',
        'ArrowUp',
        'ArrowDown'
      ].includes(event.key)
    ) {
      return;
    }

    // Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X, Command+A などを許可
    if ((event.ctrlKey || event.metaKey) && ['a', 'c', 'v', 'x'].includes(event.key.toLowerCase())) {
      return;
    }

    // 数字以外のキー入力を防ぐ
    if (!/^[0-9]$/.test(event.key)) {
      event.preventDefault();
    }
  }

  function handleInput(event: Event) {
    const target = event.target as HTMLInputElement;

    // setTimeoutを使い、ブラウザのイベントサイクルが完了した直後に処理を実行する
    setTimeout(() => {
      const originalValue = target.value;
      const sanitizedInput = originalValue.replace(/[^0-9]/g, '');

      // DOMの値を直接更新して、画面表示を強制的にサニタイズ後のものにする
      if (target.value !== sanitizedInput) {
        target.value = sanitizedInput;
      }
      
      inputValue = sanitizedInput;

      if (sanitizedInput === '') {
        value = undefined;
      } else {
        let numValue = parseInt(sanitizedInput, 10);
        if (numValue <= 0) {
          // 0が入力された場合、フィールドをクリアするためにinputValueも空にする
          inputValue = '';
          value = undefined;
        } else {
          value = numValue;
        }
      }

      if (oninput) {
        oninput(event);
      }
    }, 0);
  }
</script>

<section class="space-y-3">
  <h3 class="text-lg font-semibold">{repeatCountLabel()}</h3>
  <div>
    <input
      type="number"
      value={inputValue}
      onkeydown={handleKeyDown}
      oninput={handleInput}
      min="0"
      step="1"
      class="w-full p-2 border border-border rounded bg-background text-foreground"
      placeholder={infiniteRepeatPlaceholder()}
    />
    <p class="text-sm text-muted-foreground mt-1">{infiniteRepeatDescription()}</p>
  </div>
</section>
