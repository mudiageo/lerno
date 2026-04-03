<script lang="ts">
  import { page } from "$app/state";
  import { goto } from "$app/navigation";

  const code = page.params.code;
  $effect(() => {
    goto(`/courses/${page.params.code}/overview`, { replaceState: true });
  });
</script>
