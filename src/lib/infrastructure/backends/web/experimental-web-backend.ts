interface ImportMetaEnvLike {
  [key: string]: string | undefined;
}

interface ImportMetaLike {
  readonly env?: ImportMetaEnvLike;
}

const importMeta = import.meta as ImportMetaLike;
const WEB_BACKEND_FLAG = 'PUBLIC_ENABLE_EXPERIMENTAL_WEB_BACKEND';

/**
 * Web backend は開発中のため、明示的なフラグが有効なときだけ利用する。
 */
export function isExperimentalWebBackendEnabled(): boolean {
  return importMeta.env?.[WEB_BACKEND_FLAG] === 'true';
}
