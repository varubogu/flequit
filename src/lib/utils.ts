import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type { Component } from "svelte";

export function cn(...inputs: any[]) {
  return twMerge(clsx(inputs));
}

// Type utilities for UI components
export type WithElementRef<T = {}> = T & {
  ref?: HTMLElement | null;
};

export type WithoutChildrenOrChild<T = {}> = Omit<T, 'children' | 'child'>;

export type WithoutChild<T = {}> = Omit<T, 'child'>;