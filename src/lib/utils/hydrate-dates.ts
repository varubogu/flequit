// 汎用の日付ハイドレータ
// 規約に基づき深いオブジェクトを走査して、日付文字列をDateへ変換する

type PlainObject = Record<string, unknown>;

const ISO_DATE_REGEX = /^(\d{4})-(\d{2})-(\d{2})([Tt ](\d{2}):(\d{2})(:(\d{2})(\.(\d{1,6}))?)?([Zz]|([+\-](\d{2}):(\d{2})))?)?$/;

const shouldHydrateKey = (key: string): boolean => {
  // 命名規約: createdAt / updatedAt / ...At / ...Date
  return /(?:^|.*)(?:At|Date)$/.test(key);
};

const toDateIfIso = (value: unknown): unknown => {
  if (typeof value !== 'string') return value;
  if (!ISO_DATE_REGEX.test(value)) return value;
  const d = new Date(value);
  return isNaN(d.getTime()) ? value : d;
};

export function hydrateDatesDeep<T>(input: T): T {
  if (input === null || input === undefined) return input;

  // プリミティブ/Dateはそのまま
  if (typeof input !== 'object') return input;
  if (input instanceof Date) return input;

  // 配列
  if (Array.isArray(input)) {
    return input.map((v) => hydrateDatesDeep(v)) as unknown as T;
  }

  // プレーンオブジェクト
  const obj = input as PlainObject;
  const out: PlainObject = {};
  for (const [k, v] of Object.entries(obj)) {
    let next = v;
    if (shouldHydrateKey(k)) {
      next = toDateIfIso(v);
    }
    out[k] = hydrateDatesDeep(next);
  }
  return out as T;
}
