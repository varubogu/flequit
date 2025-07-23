import { getLocale, setLocale as paraglidSetLocale, type Locale } from '$paraglide/runtime';

// ロケール変更通知用のカウンター
let localeChangeCounter = $state(0);

export const localeStore = {
  get locale() {
    // カウンターを参照することで、変更時に依存関係が更新される
    localeChangeCounter;
    return getLocale();
  },
  
  setLocale(newLocale: string) {
    paraglidSetLocale(newLocale as Locale, { reload: false });
    // カウンターを増やして、依存している全てのコンポーネントに再評価を促す
    localeChangeCounter++;
  }
};

// メッセージ関数をreactiveにラップするヘルパー関数
export function reactiveMessage<T extends (...args: any[]) => string>(messageFn: T): T {
  return ((...args: any[]) => {
    // localeStore.localeを参照して依存関係を作成
    localeStore.locale;
    return messageFn(...args);
  }) as T;
}