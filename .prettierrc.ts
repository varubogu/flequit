import type { Config } from 'prettier';

const config: Config = {
	plugins: ['prettier-plugin-svelte', 'prettier-plugin-tailwindcss'],
	useTabs: true,
	singleQuote: true,
	trailingComma: 'none',
	printWidth: 100,
	svelteSortOrder: 'options-scripts-styles-markup',
	svelteStrictMode: false,
	svelteBracketNewLine: true,
	svelteIndentScriptAndStyle: true,
	tailwindFunctions: ['cn', 'cva'],
	overrides: [
		{
			files: '*.svelte',
			options: {
				parser: 'svelte'
			}
		}
	]
};

export default config;
