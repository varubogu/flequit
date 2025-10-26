const svelteInternal = await import('svelte/internal/client');
const svelteReactivity = await import('svelte/reactivity');

const stateImpl = svelteInternal.state ?? svelteReactivity.state;
const derivedImpl = svelteInternal.derived ?? svelteReactivity.derived;
const effectImpl = svelteInternal.effect ?? svelteReactivity.effect;
const SvelteDateImpl = svelteReactivity.SvelteDate ?? class extends Date {};
const SvelteMapImpl = svelteReactivity.SvelteMap ?? Map;
const SvelteSetImpl = svelteReactivity.SvelteSet ?? Set;

(global as Record<string, unknown>).$state = stateImpl;
(global as Record<string, unknown>).state = stateImpl;
(global as Record<string, unknown>).$derived = derivedImpl;
(global as Record<string, unknown>).derived = derivedImpl;
(global as Record<string, unknown>).$effect = effectImpl;
(global as Record<string, unknown>).effect = effectImpl;
(global as Record<string, unknown>).SvelteDate = SvelteDateImpl;
(global as Record<string, unknown>).SvelteMap = SvelteMapImpl as unknown as MapConstructor;
(global as Record<string, unknown>).SvelteSet = SvelteSetImpl as unknown as SetConstructor;
(global as Record<string, unknown>).tag = svelteInternal.tag ?? (() => undefined);
(global as Record<string, unknown>).tag_proxy = svelteInternal.tag_proxy ?? ((value: unknown) => value);
(global as Record<string, unknown>).trace = svelteInternal.trace ?? (() => ({ stop: () => undefined }));
(global as Record<string, unknown>).proxy = svelteInternal.proxy ?? ((value: unknown) => value);



// DOM API stubs that JSDOM does not provide
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

global.IntersectionObserver = class IntersectionObserver {
  root = null;
  rootMargin = '';
  thresholds: number[] = [];
  constructor() {}
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
};

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {}
  })
});

Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
  value: () => {},
  writable: true
});

// Tauri API mocks for testing environment
Object.defineProperty(window, '__TAURI_INTERNALS__', {
  value: {
    metadata: {
      currentWindow: { label: 'test-window' }
    },
    invoke: async () => ({}),
    transformCallback: () => {}
  },
  writable: true
});

// Console noise suppression (keep warn/error when necessary)
const originalConsole = console;
global.console = {
  ...originalConsole,
  log: () => {},
  debug: () => {},
  info: () => {},
  warn: (message: string, ...args: unknown[]) => {
    if (typeof message === 'string' && message.includes('Web backends:') && message.includes('not implemented')) {
      return;
    }
    if (typeof message === 'string' && message.includes('Tauri environment not available')) {
      return;
    }
    originalConsole.warn(message, ...args);
  }
};
