<script lang="ts">
  import Button from '$lib/components/shared/button.svelte';
  import Input from '$lib/components/ui/input.svelte';
  import { format } from 'date-fns';
  import DateFormatEditor from '$lib/components/settings/date-format/date-format-editor.svelte';
  import { useSettingsSection } from './hooks/use-settings-section.svelte';

  interface Props {
    dateFormat: string;
  }

  let { dateFormat }: Props = $props();

  const { translationService, settingsStore } = useSettingsSection();

  // Reactive messages
  const dateFormatLabel = translationService.getMessage('date_format');
  const preview = translationService.getMessage('preview');
  const editDateFormat = translationService.getMessage('edit_date_format');

  let showDateFormatDialog = $state(false);
  let previewDate = new Date();

  const settingPreview = $derived(() => {
    try {
      return format(previewDate, dateFormat);
    } catch {
      return 'Invalid format';
    }
  });

  function handleDateFormatChange(event: Event) {
    const target = event.target as HTMLInputElement;
    settingsStore.setDateFormat(target.value);
  }

  function openDateFormatDialog() {
    showDateFormatDialog = true;
  }
</script>

<div class="xl:col-span-3">
  <h4 class="mb-4 text-lg font-medium">{dateFormatLabel()}</h4>

  <div class="space-y-4">
    <div>
      <label for="date-format-setting" class="mb-2 block text-sm font-medium">
        {dateFormatLabel()}
      </label>
      <Input
        id="date-format-setting"
        value={dateFormat}
        oninput={handleDateFormatChange}
        placeholder="yyyy年MM月dd日 HH:mm:ss"
      />
    </div>

    <!-- Setting Preview -->
    <div class="flex items-center gap-2 text-sm">
      <span class="font-medium">{preview()}:</span>
      <span class="bg-muted rounded px-2 py-1">{settingPreview()}</span>
    </div>

    <div class="flex gap-2">
      <Button variant="outline" size="sm" onclick={openDateFormatDialog}>
        {editDateFormat()}
      </Button>
    </div>
  </div>
</div>

<!-- Date Format Editor Dialog -->
{#if showDateFormatDialog}
  <DateFormatEditor bind:open={showDateFormatDialog} />
{/if}
