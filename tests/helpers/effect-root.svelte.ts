/**
 * `.ts` テストから `$state` / `$effect` を動かすための effect root。
 * Svelte の公開 API である `$effect.root` を使い、内部モジュールには依存しない。
 */
export function runEffectRoot(fn: () => void): () => void {
  return $effect.root(fn);
}
