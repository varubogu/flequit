# Svelte 5 Design Patterns

Svelte 5 (runes)-centered design patterns used in Flequit.

> Canonical implementation sources are `src/lib/stores/` and `src/lib/components/`. This document only describes principles and scope of application.

## Component Splitting Guidelines

- **Simple (up to about 100 lines)**: no logic class needed. Use `$state` / `$derived` / `$effect` directly
- **Medium (100-200 lines)**: separate logic with internal functions (do not export them). Share state with Context API
- **Large (over 200 lines)**: split by feature (header / content / footer, etc.). After splitting, each file should generally stay within 200 lines

## Anti-Patterns

- **Logic classes (`-logic.svelte.ts`)**: hiding runes inside classes makes components too thin -> use runes directly in components
- **Excessive service layers**: proxy-only layers multiply and make debugging difficult -> keep the minimum necessary layers (UI -> Store -> Backend)
- **Duplicate type definitions**: multiple types and conversion functions for the same concept -> use unified types (example: `RecurrenceRule`)

## State Management (Runes)

### `$state`: Reactive State

- Use for basic reactive state in stores
- Only valid inside `.svelte.ts` files

### `$derived`: Derived State

- Use for values computed from other state
- Derived calculations must use `$derived`. Do not synchronize with manual `$effect`

### `$effect`: Side Effects

- **Use for**: synchronization with external systems (localStorage / WebSocket / DOM event registration)
- **Do not use for**: derived calculations for internal state (that is `$derived`'s role)
- **Cleanup required**: when using timers, event listeners, or similar resources, return a cleanup function

Implementation references:

- Store example: `src/lib/stores/tasks.svelte.ts`
- Side-effect cleanup example: `src/lib/components/...`

### Class-Based Stores

Use class-based stores for complex state management. Singleton exports are the default. See [`store-and-service-architecture.md`](./store-and-service-architecture.md) for details.

## Component Design

### Props Definitions

Use Svelte 5 `$props()`. Type props with an explicit `interface Props`.

```svelte
<script lang="ts">
  interface Props {
    task: Task;
    readonly?: boolean;
    onUpdate?: (task: Task) => void;
  }
  let { task, readonly = false, onUpdate = () => {} }: Props = $props();
</script>
```

### Event Handling

- **Prefer callback functions** (received through props)
- Use CustomEvent (`createEventDispatcher`) only when needed (for example, when events must pass transparently across multiple layers)

### Snippets

Use the `Snippet` type to pass child content. Use it for modal and layout components. Write it with `{@render children()}` / `{#snippet name()}...{/snippet}`.

Implementation reference: `src/lib/components/shared/modal.svelte` (when applicable)

### Backend Calls from Components

- Components must not call `invoke` directly or import Infrastructure
- Components should call only the Services layer (`$lib/services/domain/...`)

See [`layers.md`](./layers.md) for details.

## Reactivity Best Practices

### 1. Minimize State

Only store "true inputs" in `$state`. Use `$derived` for values that can be derived. Duplicating state requires manual synchronization and becomes a source of bugs.

### 2. Use `$effect` Appropriately

- Use only for synchronization with external systems
- Do not use for internal state updates (use `$derived`)

### 3. Prevent Memory Leaks

Resources created inside `$effect` (event listeners / timers / subscriptions) must be released through the returned cleanup function.

## Performance Optimization

- **Expensive calculations**: memoized with `$derived`
- **Conditional rendering**: use `{#if}` and keep unnecessary elements completely out of rendering
- **Lists**: always specify a **key** with `{#each items as item (item.id)}`

## Error Handling (UI Layer)

- Stores should have `error` / `loading` state, and components should handle the three states with `{#if loading}` / `{:else if error}` / `{:else}`
- Operation services should use **optimistic updates + rollback on failure** (see [`store-and-service-architecture.md`](./store-and-service-architecture.md))

## Related Documents

- [Store & Service Architecture](./store-and-service-architecture.md)
- [Layer Architecture](./layers.md)
- [Component Implementation Rules](../../rules/frontend.md)
