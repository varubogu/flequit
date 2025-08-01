import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
export function cn(...inputs: unknown[]) {
  return twMerge(clsx(inputs));
}

// Type utilities for UI components
export type WithElementRef<T = object, U = HTMLElement> = T & {
  ref?: U | null;
};

export type WithoutChildrenOrChild<T = object> = Omit<T, 'children' | 'child'>;

export type WithoutChild<T = object> = Omit<T, 'child'>;

export type WithoutChildren<T = object> = Omit<T, 'children'>;
