export {};

const svelteInternalModule = (await import('svelte/internal/client')) as Record<string, unknown>;
const svelteReactivityModule = (await import('svelte/reactivity')) as Record<string, unknown>;

const getModuleValue = <T>(module: Record<string, unknown>, key: string): T | undefined =>
	(module[key] as T | undefined);

const stateImpl = getModuleValue<unknown>(svelteInternalModule, 'state') ??
	getModuleValue<unknown>(svelteReactivityModule, 'state');
const derivedImpl = getModuleValue<unknown>(svelteInternalModule, 'derived') ??
	getModuleValue<unknown>(svelteReactivityModule, 'derived');
const effectImpl = getModuleValue<unknown>(svelteInternalModule, 'effect') ??
	getModuleValue<unknown>(svelteReactivityModule, 'effect');
const SvelteDateImpl =
	getModuleValue<typeof Date>(svelteReactivityModule, 'SvelteDate') ?? class extends Date {};
const SvelteMapImpl =
	getModuleValue<MapConstructor>(svelteReactivityModule, 'SvelteMap') ?? Map;
const SvelteSetImpl =
	getModuleValue<SetConstructor>(svelteReactivityModule, 'SvelteSet') ?? Set;
const tagImpl =
	getModuleValue<(...args: unknown[]) => unknown>(svelteInternalModule, 'tag') ??
	(() => undefined);
const tagProxyImpl =
	getModuleValue<(value: unknown) => unknown>(svelteInternalModule, 'tag_proxy') ??
	((value: unknown) => value);
const traceImpl =
	getModuleValue<(...args: unknown[]) => { stop: () => void }>(
		svelteInternalModule,
		'trace'
	) ?? (() => ({ stop: () => undefined }));
const proxyImpl =
	getModuleValue<(value: unknown) => unknown>(svelteInternalModule, 'proxy') ??
	((value: unknown) => value);

const globalRecord = globalThis as Record<string, unknown>;

globalRecord.$state = stateImpl;
globalRecord.state = stateImpl;
globalRecord.$derived = derivedImpl;
globalRecord.derived = derivedImpl;
globalRecord.$effect = effectImpl;
globalRecord.effect = effectImpl;
globalRecord.SvelteDate = SvelteDateImpl;
globalRecord.SvelteMap = SvelteMapImpl;
globalRecord.SvelteSet = SvelteSetImpl;
globalRecord.tag = tagImpl;
globalRecord.tag_proxy = tagProxyImpl;
globalRecord.trace = traceImpl;
globalRecord.proxy = proxyImpl;
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
