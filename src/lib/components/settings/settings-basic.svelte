<script lang="ts">
  import Button from '$lib/components/button.svelte';
  import { settingsStore, AVAILABLE_TIMEZONES } from '$lib/stores/settings.svelte';

  interface Props {
    settings: {
      weekStart: string;
      timezone: string;
      customDueDays: number[];
    };
  }

  let { settings }: Props = $props();

  function addCustomDueDay() {
    console.log('Add custom due day');
  }

  $effect(() => {
    settingsStore.setTimezone(settings.timezone);
  });
</script>

<section id="settings-basic">
  <div class="space-y-6">
    <div>
      <h3 class="text-lg font-medium mb-4">General Settings</h3>

      <div class="grid grid-cols-1 xl:grid-cols-2 gap-8">
        <!-- Week Start -->
        <div>
          <label for="week-start" class="text-sm font-medium">Week starts on</label>
          <select 
            id="week-start" 
            bind:value={settings.weekStart} 
            class="mt-1 block w-full rounded-md border border-input bg-background text-foreground px-3 py-2 text-sm"
          >
            <option value="sunday">Sunday</option>
            <option value="monday">Monday</option>
          </select>
        </div>

        <!-- Timezone -->
        <div>
          <label for="timezone-select" class="text-sm font-medium">Timezone</label>
          <select 
            id="timezone-select" 
            bind:value={settings.timezone} 
            class="mt-1 block w-full rounded-md border border-input bg-background text-foreground px-3 py-2 text-sm"
          >
            {#each AVAILABLE_TIMEZONES as tz}
              <option value={tz.value}>{tz.label}</option>
            {/each}
          </select>
          <p class="mt-1 text-xs text-muted-foreground">
            Current effective timezone: {settingsStore.effectiveTimezone}
          </p>
        </div>

        <!-- Custom Due Days -->
        <div class="xl:col-span-2">
          <div class="text-sm font-medium mb-3 block">Add Custom Due Date Button</div>
          <Button variant="outline" onclick={addCustomDueDay}>
            Add Custom Due Date
          </Button>
        </div>
      </div>
    </div>
  </div>
</section>