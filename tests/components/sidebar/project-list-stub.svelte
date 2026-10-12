<script lang="ts">
  let { isCollapsed = false }: { isCollapsed?: boolean } = $props();
</script>

<div data-testid="project-list-stub">{isCollapsed ? 'collapsed-list' : 'expanded-list'}</div>
