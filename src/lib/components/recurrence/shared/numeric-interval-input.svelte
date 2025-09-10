<script lang="ts">
  type Props = {
    value: number;
    onchange?: (value: number) => void;
  };

  let { value, onchange }: Props = $props();

  let inputValue = $state(String(value));

  $effect(() => {
    const parentValueStr = String(value);
    if (parentValueStr !== inputValue) {
      inputValue = parentValueStr;
    }
  });

  function handleKeyDown(event: KeyboardEvent) {
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
    )
      return;
    if ((event.ctrlKey || event.metaKey) && ['a', 'c', 'v', 'x'].includes(event.key.toLowerCase()))
      return;
    if (!/^[0-9]$/.test(event.key)) event.preventDefault();
  }

  function handleInput(event: Event) {
    const target = event.target as HTMLInputElement;
    setTimeout(() => {
      const sanitizedInput = target.value.replace(/[^0-9]/g, '');
      if (target.value !== sanitizedInput) target.value = sanitizedInput;

      inputValue = sanitizedInput;

      let newValue: number;
      if (sanitizedInput === '' || parseInt(sanitizedInput, 10) < 1) {
        newValue = 1;
      } else {
        newValue = parseInt(sanitizedInput, 10);
      }
      if (onchange) onchange(newValue);
    }, 0);
  }
</script>

<input
  type="number"
  value={inputValue}
  onkeydown={handleKeyDown}
  oninput={handleInput}
  min="1"
  step="1"
  class="border-border bg-background text-foreground flex-1 rounded border p-2"
  placeholder="1"
  data-testid="numeric-interval-input"
/>
