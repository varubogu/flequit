# Anti-Patterns Collection

## ❌ Logic Class Pattern (-logic.svelte.ts)
Problem: Encapsulating runes in classes makes components unnecessarily thin
Alternative: Use runes directly in components

## ❌ Excessive Service Layer
Problem: Proliferation of proxy-only layers makes debugging difficult
Alternative: Minimal necessary layers (UI → Store → Backend)

## ❌ Type Duplication
Problem: Multiple types for same concept and proliferation of conversion functions
Alternative: Adopt unified types (e.g., RecurrenceRule)
