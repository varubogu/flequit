<script lang="ts">
  import Input from '$lib/components/ui/input.svelte';
  import { reactiveMessage } from '$lib/stores/locale.svelte';
  import * as m from '$paraglide/messages';
  import { format } from 'date-fns';
  import { dateTimeFormatStore } from '$lib/stores/datetime-format.svelte';
  import type { DateTimeFormat } from '$lib/types/datetime-format';

  interface Props {
    testFormat: string;
    testFormatName: string;
    testDateTime: Date;
    editMode: 'manual' | 'new' | 'edit';
    selectedPreset: DateTimeFormat | null;
    formatNameEnabled: boolean;
    onTestFormatChange: (event: Event) => void;
    onFormatSelectionChange: (event: Event) => void;
  }

  let {
    testFormat = $bindable(),
    testFormatName = $bindable(),
    testDateTime,
    editMode,
    selectedPreset,
    formatNameEnabled,
    onTestFormatChange,
    onFormatSelectionChange
  }: Props = $props();

  const testFormatLabel = reactiveMessage(m.test_format);
  const preview = reactiveMessage(m.preview);
  const formatSelection = reactiveMessage(m.format_selection);
  const formatName = reactiveMessage(m.format_name);
  const enterFormatName = reactiveMessage(m.enter_format_name);

  let testFormatPreview = $derived(() => {
    try {
      return testFormat ? format(testDateTime, testFormat) : '';
    } catch (error) {
      return 'Invalid format';
    }
  });

  const allFormats = $derived(dateTimeFormatStore.allFormats);
</script>

<div class="space-y-4">
  <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
    <div>
      <label for="test-format" class="text-sm font-medium mb-2 block">{testFormatLabel()}</label>
      <Input
        id="test-format"
        bind:value={testFormat}
        oninput={onTestFormatChange}
        placeholder="yyyy年MM月dd日 HH:mm:ss"
      />
    </div>

    <div class="flex items-center gap-2 text-sm">
      <span class="font-medium">{preview()}:</span>
      <span class="px-2 py-1 bg-muted rounded">{testFormatPreview}</span>
    </div>
  </div>

  <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
    <div>
      <label for="format-selection" class="text-sm font-medium mb-2 block">{formatSelection()}</label>
      <select
        id="format-selection"
        value={selectedPreset?.id?.toString() || ''}
        onchange={onFormatSelectionChange}
        disabled={editMode !== 'manual'}
        class="w-full p-2 border border-input rounded-md bg-background text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {#each allFormats() as formatItem}
          <option value={formatItem.id.toString()}>
            {formatItem.name}{formatItem.format ? `: ${formatItem.format}` : ''}
          </option>
        {/each}
      </select>
    </div>

    <div class="space-y-3">
      <div>
        <label for="format-name" class="text-sm font-medium mb-2 block">{formatName()}</label>
        <input
          id="format-name"
          bind:value={testFormatName}
          placeholder={enterFormatName()}
          disabled={!formatNameEnabled}
          class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        />
      </div>
    </div>
  </div>
</div>
