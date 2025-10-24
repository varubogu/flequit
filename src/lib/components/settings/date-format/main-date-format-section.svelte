<script lang="ts">
  import Input from '$lib/components/ui/input.svelte';
  import { useTranslation } from '$lib/hooks/use-translation.svelte';
  import { format } from 'date-fns';

  interface Props {
    currentFormat: string;
    testDateTime: Date;
    onFormatChange: (event: Event) => void;
  }

  let { currentFormat = $bindable(), testDateTime = $bindable(), onFormatChange }: Props = $props();

  const translationService = useTranslation();
  const dateFormatLabel = translationService.getMessage('date_format');
  const preview = translationService.getMessage('preview');

  let dateTimeFormatPreview = $derived(() => {
    try {
      return format(testDateTime, currentFormat);
    } catch {
      return 'Invalid format';
    }
  });
</script>

<div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
  <div>
    <label for="datetime-format" class="mb-2 block text-sm font-medium">{dateFormatLabel()}</label>
    <Input
      id="datetime-format"
      value={currentFormat}
      oninput={onFormatChange}
      placeholder="yyyy年MM月dd日 HH:mm:ss"
    />
  </div>

  <div class="flex items-center gap-2 text-sm">
    <span class="font-medium">{preview()}:</span>
    <span class="bg-muted rounded px-2 py-1">{dateTimeFormatPreview()}</span>
  </div>
</div>
