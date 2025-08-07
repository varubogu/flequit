<script lang="ts">
  import SettingsDraggableItemsContent from './settings-draggable-items-content.svelte';
  import { SettingsDraggableItemsLogic } from './settings-draggable-items-logic.svelte';

  // Initialize logic
  const logic = new SettingsDraggableItemsLogic();
</script>

<SettingsDraggableItemsContent {logic} />
