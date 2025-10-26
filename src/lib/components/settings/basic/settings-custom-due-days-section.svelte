<script lang="ts">
  import Button from '$lib/components/shared/button.svelte';
  import { useSettingsSection } from './hooks/use-settings-section.svelte';

  const { translationService } = useSettingsSection();

  // Reactive messages
  const addCustomDueDateButton = translationService.getMessage('add_custom_due_date_button');
  const addCustomDueDate = translationService.getMessage('add_custom_due_date');

  function addCustomDueDay() {
    // TODO: Implement custom due day functionality
  }
</script>

<div class="xl:col-span-3">
  <div class="mb-3 block text-sm font-medium">{addCustomDueDateButton()}</div>
  <Button variant="outline" onclick={addCustomDueDay}>
    {addCustomDueDate()}
  </Button>
</div>
