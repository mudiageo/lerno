<script lang="ts">
  import { goto } from '$app/navigation';
  import * as Command from '$lib/components/ui/command';
  import BookOpen from '@lucide/svelte/icons/book-open';
  import Zap from '@lucide/svelte/icons/zap';
  import FileText from '@lucide/svelte/icons/file-text';
  import Users from '@lucide/svelte/icons/users';
  import Search from '@lucide/svelte/icons/search';

  let { open = $bindable(false) }: { open?: boolean } = $props();
  let query = $state('');

  function navigate(href: string) {
    goto(href);
    open = false;
    query = '';
  }
</script>

<Command.Dialog bind:open>
  <Command.Input bind:value={query} placeholder="Search courses, topics, people..." />
  <Command.List>
    <Command.Empty>No results for "{query}"</Command.Empty>

    <Command.Group heading="Quick Actions">
      <Command.Item onSelect={() => navigate('/study/flashcards')}>
        <BookOpen class="mr-2 size-4" />
        Start Flashcard Session
      </Command.Item>
      <Command.Item onSelect={() => navigate('/study/quiz')}>
        <Zap class="mr-2 size-4" />
        Quick Quiz
      </Command.Item>
      <Command.Item onSelect={() => navigate('/study/mock-exam')}>
        <FileText class="mr-2 size-4" />
        Generate Mock Exam
      </Command.Item>
    </Command.Group>

    <Command.Group heading="Navigation">
      <Command.Item onSelect={() => navigate('/feed')}>
        <Search class="mr-2 size-4" />
        Feed
      </Command.Item>
      <Command.Item onSelect={() => navigate('/watch')}>
        <Search class="mr-2 size-4" />
        Watch Mode
      </Command.Item>
      <Command.Item onSelect={() => navigate('/communities')}>
        <Users class="mr-2 size-4" />
        Communities
      </Command.Item>
    </Command.Group>
  </Command.List>
</Command.Dialog>
