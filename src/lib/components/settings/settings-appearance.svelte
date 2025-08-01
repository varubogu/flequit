<script lang="ts">
  import { getTranslationService } from '$lib/stores/locale.svelte';
  import Input from '$lib/components/ui/input.svelte';
  import { setMode, systemPrefersMode, userPrefersMode } from 'mode-watcher';
  import * as m from '$paraglide/messages.js';
  import { reactiveMessage } from '$lib/stores/locale.svelte';

  interface Props {
    settings: {
      font: string;
      fontSize: number;
      fontColor: string;
      backgroundColor: string;
    };
  }

  let { settings }: Props = $props();

  const translationService = getTranslationService();
  // Reactive messages
  const appearanceSettings = translationService.getMessage('appearance_settings');
  const theme = translationService.getMessage('theme');
  const system = translationService.getMessage('system');
  const light = translationService.getMessage('light');
  const dark = translationService.getMessage('dark');
  const font = translationService.getMessage('font');
  const defaultFont = translationService.getMessage('default_font');
  const systemFont = translationService.getMessage('system_font');
  const fontSize = translationService.getMessage('font_size');
  const fontColor = translationService.getMessage('font_color');
  const backgroundColor = translationService.getMessage('background_color');
</script>

<section id="settings-appearance">
  <div class="space-y-6">
    <div>
      <h3 class="mb-4 text-lg font-medium">{appearanceSettings()}</h3>

      <div class="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        <!-- Theme -->
        <div>
          <label for="theme-select" class="text-sm font-medium">{theme()}</label>
          <select
            id="theme-select"
            class="border-input bg-background text-foreground mt-1 block w-full rounded-md border px-3 py-2 text-sm"
            value={userPrefersMode.current}
            onchange={(e) => setMode(e.currentTarget.value as any)}
          >
            <option value="system">{system()} ({systemPrefersMode.current})</option>
            <option value="light">{light()}</option>
            <option value="dark">{dark()}</option>
          </select>
        </div>

        <!-- Font -->
        <div>
          <label for="font-select" class="text-sm font-medium">{font()}</label>
          <select
            id="font-select"
            bind:value={settings.font}
            class="border-input bg-background text-foreground mt-1 block w-full rounded-md border px-3 py-2 text-sm"
          >
            <option value="default">{defaultFont()}</option>
            <option value="system">{systemFont()}</option>
            <option value="arial">Arial</option>
            <option value="helvetica">Helvetica</option>
          </select>
        </div>

        <!-- Font Size -->
        <div>
          <label for="font-size" class="text-sm font-medium">{fontSize()}</label>
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
          <label for="font-color" class="text-sm font-medium">{fontColor()}</label>
          <select
            id="font-color"
            bind:value={settings.fontColor}
            class="border-input bg-background text-foreground mt-1 block w-full rounded-md border px-3 py-2 text-sm"
          >
            <option value="default">{defaultFont()}</option>
            <option value="black">Black</option>
            <option value="white">White</option>
          </select>
        </div>

        <!-- Background Color -->
        <div>
          <label for="background-color" class="text-sm font-medium">{backgroundColor()}</label>
          <select
            id="background-color"
            bind:value={settings.backgroundColor}
            class="border-input bg-background text-foreground mt-1 block w-full rounded-md border px-3 py-2 text-sm"
          >
            <option value="default">{defaultFont()}</option>
            <option value="white">White</option>
            <option value="black">Black</option>
          </select>
        </div>
      </div>
    </div>
  </div>
</section>
