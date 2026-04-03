<script lang="ts">
  import { page } from "$app/state";
  import { goto } from "$app/navigation";

  const code = page.params.code;
  goto(`${code}/overview`);
</script>
