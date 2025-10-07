export type BackendErrorCategory =
  | 'network'
  | 'timeout'
  | 'not_found'
  | 'conflict'
  | 'validation'
  | 'unauthorized'
  | 'unknown';

export interface BackendErrorContext {
  operation: string;
  resourceType?: string;
  resourceId?: string;
}

export class BackendError extends Error {
  readonly category: BackendErrorCategory;
  readonly context: BackendErrorContext;
  readonly cause: unknown;

  constructor(
    message: string,
    {
      category = 'unknown',
      context,
      cause
    }: {
      category?: BackendErrorCategory;
      context: BackendErrorContext;
      cause?: unknown;
    }
  ) {
    super(message);
    this.name = 'BackendError';
    this.category = category;
    this.context = context;
    this.cause = cause;
  }
}

/**
 * 既存の例外をBackendErrorに変換するユーティリティ
 */
export function toBackendError(
  error: unknown,
  context: BackendErrorContext,
  category: BackendErrorCategory = 'unknown'
): BackendError {
  if (error instanceof BackendError) {
    return error;
  }

  if (error instanceof Error) {
    return new BackendError(error.message, { category, context, cause: error });
  }

  return new BackendError(String(error), { category, context, cause: error });
}

export function isBackendError(error: unknown): error is BackendError {
  return error instanceof BackendError;
}
