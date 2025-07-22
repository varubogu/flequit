<script lang="ts">
  import Input from '$lib/components/ui/input.svelte';
  import { setMode, systemPrefersMode, userPrefersMode } from 'mode-watcher';

  interface Props {
    settings: {
      font: string;
      fontSize: number;
      fontColor: string;
      backgroundColor: string;
    };
  }

  let { settings }: Props = $props();
</script>

<section id="settings-appearance">
  <div class="space-y-6">
    <div>
      <h3 class="text-lg font-medium mb-4">Appearance Settings</h3>

      <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        <!-- Theme -->
        <div>
          <label for="theme-select" class="text-sm font-medium">Theme</label>
          <select
            id="theme-select"
            class="mt-1 block w-full rounded-md border border-input bg-background text-foreground px-3 py-2 text-sm"
            value={userPrefersMode.current}
            onchange={(e) => setMode(e.currentTarget.value as any)}
          >
            <option value="system">System ({systemPrefersMode.current})</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </div>

        <!-- Font -->
        <div>
          <label for="font-select" class="text-sm font-medium">Font</label>
          <select 
            id="font-select" 
            bind:value={settings.font} 
            class="mt-1 block w-full rounded-md border border-input bg-background text-foreground px-3 py-2 text-sm"
          >
            <option value="default">Default</option>
            <option value="system">System Font</option>
            <option value="arial">Arial</option>
            <option value="helvetica">Helvetica</option>
          </select>
        </div>

        <!-- Font Size -->
        <div>
          <label for="font-size" class="text-sm font-medium">Font Size</label>
          <Input
            id="font-size"
            type="number"
            bind:value={settings.fontSize}
            min="10"
            max="24"
            class="mt-1"
          />
        </div>

        <!-- Font Color -->
        <div>
          <label for="font-color" class="text-sm font-medium">Font Color</label>
          <select 
            id="font-color" 
            bind:value={settings.fontColor} 
            class="mt-1 block w-full rounded-md border border-input bg-background text-foreground px-3 py-2 text-sm"
          >
            <option value="default">Default</option>
            <option value="black">Black</option>
            <option value="white">White</option>
          </select>
        </div>

        <!-- Background Color -->
        <div>
          <label for="background-color" class="text-sm font-medium">Background Color</label>
          <select 
            id="background-color" 
            bind:value={settings.backgroundColor} 
            class="mt-1 block w-full rounded-md border border-input bg-background text-foreground px-3 py-2 text-sm"
          >
            <option value="default">Default</option>
            <option value="white">White</option>
            <option value="black">Black</option>
          </select>
        </div>
      </div>
    </div>
  </div>
</section>