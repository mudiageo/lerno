<script lang="ts">
  export let size: 'sm' | 'md' | 'lg' = 'md';
  export let color: "primary" | "white" | "current" = "primary";

  const sizeClasses = {
    sm: "w-4 h-4 border-2",
    md: "w-8 h-8 border-3",
    lg: "w-12 h-12 border-4"
  };

  const colorClasses = {
    primary: "border-blue-200 border-t-blue-600 dark:border-blue-900 dark:border-t-blue-500",
    white: "border-white/30 border-t-white",
    current: "border-current/30 border-t-current"
  };
</script>

<div 
  class="inline-block rounded-full animate-spin {sizeClasses[size]} {colorClasses[color]}" 
  role="status"
>
  <span class="sr-only">Loading...</span>
</div>
