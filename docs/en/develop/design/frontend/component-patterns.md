# Component Design Patterns

## Recommended Patterns

### Simple Components (~100 lines)
- Do not use logic classes
- Use $state, $derived, $effect directly

### Medium Components (100-200 lines)
- Separate logic with internal functions (not exported)
- Share state with Context API

### Large Components (200+ lines)
- Split by functionality (header/content/footer, etc.)
- Share state with Context API
- Keep each split component under 200 lines
