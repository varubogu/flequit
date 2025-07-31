import { invoke } from '@tauri-apps/api/core';

interface BackendService {
  greet: () => Promise<void>;
}

export const backendService = (): BackendService => {
  // TODO: より良い方法があれば改善
  // @ts-ignore
  if (window.__TAURI_INTERNALS__) {
    return {
      greet: async () => {
        const message = await invoke('greet', { name: 'World' });
        console.log(`tauri.greet ${message}`);
      }
    };
  } else {
    return {
      greet: async () => {
        console.log('tauri not available');
      }
    };
  }
}
