export type EditMode = 'manual' | 'new' | 'edit';

export interface DuplicateCheckResult {
  isDuplicate: boolean;
  type?: 'format' | 'name';
  existingName?: string;
  existingFormat?: string;
}
