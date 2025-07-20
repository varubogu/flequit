import type { Component } from 'svelte';

export interface MenuItem {
  label: string;
  action: () => void;
  icon?: Component;
  disabled?: boolean;
  separator?: boolean;
}

interface ContextMenuState {
  show: boolean;
  x: number;
  y: number;
  options: MenuItem[];
}

class ContextMenuStore {
  private _state = $state<ContextMenuState>({
    show: false,
    x: 0,
    y: 0,
    options: []
  });

  get state() {
    return this._state;
  }

  open(x: number, y: number, options: MenuItem[]) {
    this._state.show = true;
    this._state.x = x;
    this._state.y = y;
    this._state.options = options;
  }

  close() {
    this._state.show = false;
  }
}

export const contextMenuStore = new ContextMenuStore();
