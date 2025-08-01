<script lang="ts">
  import Input from '$lib/components/ui/input.svelte';
  import { getTranslationService } from '$lib/stores/locale.svelte';
  import { format } from 'date-fns';

  interface Props {
    currentFormat: string;
    testDateTime: Date;
    onFormatChange: (event: Event) => void;
  }

  let { currentFormat = $bindable(), testDateTime = $bindable(), onFormatChange }: Props = $props();

  const translationService = getTranslationService();
  const dateFormatLabel = translationService.getMessage('date_format');
  const preview = translationService.getMessage('preview');

  let dateTimeFormatPreview = $derived(() => {
    try {
      return format(testDateTime, currentFormat);
    } catch (error) {
      return 'Invalid format';
    }
  });
</script>

<div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
  <div>
    <label for="datetime-format" class="text-sm font-medium mb-2 block">{dateFormatLabel()}</label>
    <Input
      id="datetime-format"
      value={currentFormat}
      oninput={onFormatChange}
      placeholder="yyyy年MM月dd日 HH:mm:ss"
    />
  </div>
  
  <div class="flex items-center gap-2 text-sm">
    <span class="font-medium">{preview()}:</span>
    <span class="px-2 py-1 bg-muted rounded">{dateTimeFormatPreview}</span>
  </div>
</div>
