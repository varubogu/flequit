<script lang="ts">
  let { isDrawerMode = false }: { isDrawerMode?: boolean } = $props();
</script>

<p>detail-stub {isDrawerMode ? 'drawer' : 'page'}</p>
