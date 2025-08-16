<script lang="ts">
  import { getTranslationService } from '$lib/stores/locale.svelte';
  import Input from '$lib/components/ui/input.svelte';
  import { systemPrefersMode, userPrefersMode } from 'mode-watcher';
  import { themeStore } from '$lib/stores/theme-store.svelte';
  import { appearanceStore } from '$lib/stores/appearance-store.svelte';

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

      <div class="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
        <!-- Theme -->
        <div>
          <label for="theme-select" class="text-sm font-medium">{theme()}</label>
          <select
            id="theme-select"
            class="border-input bg-background text-foreground mt-1 block w-full rounded-md border px-3 py-2 text-sm"
            value={userPrefersMode.current}
            onchange={(e) => themeStore.setTheme(e.currentTarget.value as 'system' | 'light' | 'dark')}
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
            value={appearanceStore.settings.font}
            onchange={(e) => appearanceStore.setFont(e.currentTarget.value)}
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
            value={appearanceStore.settings.fontSize}
            oninput={(e) => {
              const target = e.currentTarget as HTMLInputElement;
              if (target) {
                const value = parseInt(target.value, 10);
                if (!isNaN(value)) {
                  appearanceStore.setFontSize(value);
                }
              }
            }}
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
            value={appearanceStore.settings.fontColor}
            onchange={(e) => appearanceStore.setFontColor(e.currentTarget.value)}
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
            value={appearanceStore.settings.backgroundColor}
            onchange={(e) => appearanceStore.setBackgroundColor(e.currentTarget.value)}
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
