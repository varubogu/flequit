import {
  CustomDateFormatTauriService,
  type CustomDateFormatService
} from '$lib/infrastructure/backends/tauri/custom-date-format-tauri-service';
import type { CustomDateFormat } from '$lib/types/settings';

export interface CustomDateFormatGateway {
  create(format: CustomDateFormat): Promise<CustomDateFormat | null>;
  getAll(): Promise<CustomDateFormat[]>;
  update(format: CustomDateFormat): Promise<CustomDateFormat | null>;
  delete(id: string): Promise<boolean>;
}

export function resolveCustomDateFormatGateway(
  service: CustomDateFormatService = new CustomDateFormatTauriService()
): CustomDateFormatGateway {
  return service;
}
