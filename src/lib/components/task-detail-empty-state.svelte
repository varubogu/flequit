<script lang="ts">
	import { reactiveMessage } from '$lib/stores/locale.svelte';
	import * as m from '$paraglide/messages';

  // Reactive messages
  const no_task_selected = reactiveMessage(m.no_task_selected);
  const select_task_to_view_details = reactiveMessage(m.select_task_to_view_details);

</script>

<div class="flex-1 flex items-center justify-center">
	<div class="text-center text-muted-foreground">
		<div class="text-6xl mb-4">📝</div>
		<h2 class="text-xl font-semibold mb-2">{no_task_selected()}</h2>
		<p>{select_task_to_view_details()}</p>
	</div>
</div>
