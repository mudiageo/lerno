<script lang="ts">
  import { page } from "$app/state";
  import { redirect } from "@sveltejs/kit";

  // Redirect /courses/[code] → /courses/[code]/overview
  const code = page.params.code;
</script>

<script module lang="ts">
  export const load = () => {
    // This doesn't run client-side in Svelte 5 async components;
    // use a meta-redirect instead
  };
</script>

{@const _ = (() => { if (typeof window !== 'undefined') window.location.replace(`${window.location.pathname}/overview`); })()}
