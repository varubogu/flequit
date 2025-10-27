declare module 'svelte/internal/client' {
	export const state: unknown;
	export const derived: unknown;
	export const effect: unknown;
	export const tag: (...args: unknown[]) => unknown;
	export const tag_proxy: (value: unknown) => unknown;
	export const trace: (...args: unknown[]) => { stop: () => void };
	export const proxy: (value: unknown) => unknown;
}
