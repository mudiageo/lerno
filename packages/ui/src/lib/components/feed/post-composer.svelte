<script lang="ts">
  import Image from '@lucide/svelte/icons/image';
  import X from '@lucide/svelte/icons/x';
  import Zap from '@lucide/svelte/icons/zap';
  import BookOpen from '@lucide/svelte/icons/book-open';
  import BarChart2 from '@lucide/svelte/icons/bar-chart-2';
  import Plus from '@lucide/svelte/icons/plus';
  import Trash2 from '@lucide/svelte/icons/trash-2';
  import Globe from '@lucide/svelte/icons/globe';
  import * as Avatar from '$lib/components/ui/avatar';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Textarea } from '$lib/components/ui/textarea';
  import * as Tabs from '$lib/components/ui/tabs';
  import { Badge } from '$lib/components/ui/badge';
  import { Separator } from '$lib/components/ui/separator';
  import * as Tooltip from '$lib/components/ui/tooltip';
  import * as RadioGroup from '$lib/components/ui/radio-group';
  import { Label } from '$lib/components/ui/label';

  let { user, onPost }: {
    user?: any;
    onPost?: (data: { postType: string; content: any }) => void;
  } = $props();

  let activeTab = $state('text');
  let body = $state('');
  let loading = $state(false);
  const maxLength = 500;
  const charCount = $derived(body.length);
  const nearLimit = $derived(charCount > maxLength * 0.8);
  const overLimit = $derived(charCount > maxLength);

  // Quiz state
  let quizQuestion = $state('');
  let quizOptions = $state([
    { id: 'a', text: '' },
    { id: 'b', text: '' },
    { id: 'c', text: '' },
    { id: 'd', text: '' },
  ]);
  let quizCorrect = $state('a');
  let quizExplanation = $state('');

  // Flashcard state
  let flashFront = $state('');
  let flashBack = $state('');

  // Poll state
  let pollQuestion = $state('');
  let pollOptions = $state([{ id: '1', text: '' }, { id: '2', text: '' }]);

  function addPollOption() {
    if (pollOptions.length < 6) {
      pollOptions = [...pollOptions, { id: String(pollOptions.length + 1), text: '' }];
    }
  }

  function removePollOption(id: string) {
    if (pollOptions.length > 2) pollOptions = pollOptions.filter(o => o.id !== id);
  }

  function getCanSubmit() {
    if (activeTab === 'text') return body.trim().length > 0 && !overLimit;
    if (activeTab === 'quiz') return quizQuestion.trim().length > 0 && quizOptions.every(o => o.text.trim().length > 0);
    if (activeTab === 'flashcard') return flashFront.trim().length > 0 && flashBack.trim().length > 0;
    if (activeTab === 'poll') return pollQuestion.trim().length > 0 && pollOptions.every(o => o.text.trim().length > 0);
    return false;
  }

  async function handleSubmit() {
    if (!getCanSubmit()) return;
    loading = true;
    try {
      let content: any;
      if (activeTab === 'text') content = { body };
      else if (activeTab === 'quiz') content = {
        question: quizQuestion,
        options: quizOptions.map(o => ({ id: o.id, text: o.text })),
        correctOptionId: quizCorrect,
        explanation: quizExplanation || undefined,
      };
      else if (activeTab === 'flashcard') content = { front: flashFront, back: flashBack };
      else if (activeTab === 'poll') content = {
        question: pollQuestion,
        options: pollOptions.map(o => ({ id: o.id, text: o.text })),
        totalVotes: 0,
      };

      onPost?.({ postType: activeTab, content });

      // Reset state
      body = ''; quizQuestion = ''; quizExplanation = ''; quizCorrect = 'a';
      quizOptions = [{ id: 'a', text: '' }, { id: 'b', text: '' }, { id: 'c', text: '' }, { id: 'd', text: '' }];
      flashFront = ''; flashBack = '';
      pollQuestion = ''; pollOptions = [{ id: '1', text: '' }, { id: '2', text: '' }];
    } finally {
      loading = false;
    }
  }

  function handleKeydown(e: KeyboardEvent) {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') handleSubmit();
  }
</script>

<div class="border-b border-border px-4 py-3 bg-background">
  <div class="flex gap-3">
    <Avatar.Root class="size-9 shrink-0 mt-0.5">
      <Avatar.Image src={user?.image} alt={user?.name} />
      <Avatar.Fallback class="bg-brand-100 text-brand-700 dark:bg-brand-900 dark:text-brand-300 font-bold text-sm">
        {user?.name?.[0] ?? 'U'}
      </Avatar.Fallback>
    </Avatar.Root>

    <div class="flex-1 min-w-0">
      <Tabs.Root bind:value={activeTab}>
        <Tabs.List class="h-8 mb-2 bg-transparent p-0 gap-0 border-b border-border w-full justify-start rounded-none">
          <Tabs.Trigger value="text" class="h-8 px-3 text-xs rounded-none border-b-2 border-transparent data-[state=active]:border-brand-500 data-[state=active]:text-brand-600 dark:data-[state=active]:text-brand-400">
            Text
          </Tabs.Trigger>
          <Tabs.Trigger value="quiz" class="h-8 px-3 text-xs rounded-none border-b-2 border-transparent data-[state=active]:border-brand-500 data-[state=active]:text-brand-600 dark:data-[state=active]:text-brand-400">
            <Zap class="size-3 mr-1 inline" />Quiz
          </Tabs.Trigger>
          <Tabs.Trigger value="flashcard" class="h-8 px-3 text-xs rounded-none border-b-2 border-transparent data-[state=active]:border-brand-500 data-[state=active]:text-brand-600 dark:data-[state=active]:text-brand-400">
            <BookOpen class="size-3 mr-1 inline" />Card
          </Tabs.Trigger>
          <Tabs.Trigger value="poll" class="h-8 px-3 text-xs rounded-none border-b-2 border-transparent data-[state=active]:border-brand-500 data-[state=active]:text-brand-600 dark:data-[state=active]:text-brand-400">
            <BarChart2 class="size-3 mr-1 inline" />Poll
          </Tabs.Trigger>
        </Tabs.List>

        <!-- Text tab -->
        <Tabs.Content value="text" class="mt-0">
          <Textarea
            bind:value={body}
            onkeydown={handleKeydown}
            placeholder="Share something with your cohort..."
            class="min-h-[80px] resize-none border-0 shadow-none focus-visible:ring-0 p-0 text-sm placeholder:text-muted-foreground bg-transparent"
          />
        </Tabs.Content>

        <!-- Quiz tab -->
        <Tabs.Content value="quiz" class="mt-0 space-y-3 py-2">
          <Input
            bind:value={quizQuestion}
            placeholder="Ask a question..."
            class="text-sm h-9"
          />
          <div class="space-y-2">
            {#each quizOptions as option, i}
              <div class="flex items-center gap-2">
                <input
                  type="radio"
                  name="quiz-correct"
                  value={option.id}
                  bind:group={quizCorrect}
                  class="size-4 accent-brand-500 shrink-0"
                  id="opt-{option.id}"
                />
                <label for="opt-{option.id}" class="text-xs text-muted-foreground w-4 font-bold uppercase shrink-0">{option.id}</label>
                <Input
                  bind:value={option.text}
                  placeholder="Option {option.id.toUpperCase()}..."
                  class="text-xs h-8 flex-1"
                />
              </div>
            {/each}
          </div>
          <p class="text-[11px] text-muted-foreground">Select the radio button next to the correct answer.</p>
          <Input
            bind:value={quizExplanation}
            placeholder="Explanation (optional)..."
            class="text-xs h-8"
          />
        </Tabs.Content>

        <!-- Flashcard tab -->
        <Tabs.Content value="flashcard" class="mt-0 space-y-3 py-2">
          <div>
            <p class="text-[11px] font-semibold text-muted-foreground mb-1 uppercase tracking-wide">Front</p>
            <Textarea
              bind:value={flashFront}
              placeholder="Question or concept..."
              class="text-sm min-h-[60px] resize-none h-auto"
            />
          </div>
          <div>
            <p class="text-[11px] font-semibold text-muted-foreground mb-1 uppercase tracking-wide">Back</p>
            <Textarea
              bind:value={flashBack}
              placeholder="Answer or explanation..."
              class="text-sm min-h-[60px] resize-none h-auto"
            />
          </div>
        </Tabs.Content>

        <!-- Poll tab -->
        <Tabs.Content value="poll" class="mt-0 space-y-3 py-2">
          <Input
            bind:value={pollQuestion}
            placeholder="Ask a poll question..."
            class="text-sm h-9"
          />
          <div class="space-y-2">
            {#each pollOptions as option, i}
              <div class="flex items-center gap-2">
                <Input
                  bind:value={option.text}
                  placeholder="Option {i + 1}..."
                  class="text-xs h-8 flex-1"
                />
                {#if pollOptions.length > 2}
                  <button
                    class="size-7 rounded flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                    onclick={() => removePollOption(option.id)}
                  >
                    <Trash2 class="size-3.5" />
                  </button>
                {/if}
              </div>
            {/each}
          </div>
          {#if pollOptions.length < 6}
            <button
              class="flex items-center gap-1.5 text-xs text-brand-600 dark:text-brand-400 hover:underline"
              onclick={addPollOption}
            >
              <Plus class="size-3.5" />Add option
            </button>
          {/if}
        </Tabs.Content>
      </Tabs.Root>

      <div class="flex items-center justify-between mt-2 pt-2 border-t border-border/50">
        <div class="flex items-center gap-1">
          {#if activeTab === 'text'}
            <Tooltip.Root>
              <Tooltip.Trigger>
                <Button variant="ghost" size="icon" class="size-8 text-muted-foreground hover:text-brand-500">
                  <Image class="size-4" />
                </Button>
              </Tooltip.Trigger>
              <Tooltip.Content>Add image</Tooltip.Content>
            </Tooltip.Root>
            <Tooltip.Root>
              <Tooltip.Trigger>
                <Button variant="ghost" size="icon" class="size-8 text-muted-foreground hover:text-brand-500">
                  <Globe class="size-4" />
                </Button>
              </Tooltip.Trigger>
              <Tooltip.Content>Add link</Tooltip.Content>
            </Tooltip.Root>
          {/if}
        </div>

        <div class="flex items-center gap-2">
          {#if activeTab === 'text' && charCount > 0}
            <span class="text-xs font-mono {overLimit ? 'text-destructive' : nearLimit ? 'text-yellow-500' : 'text-muted-foreground'}">
              {maxLength - charCount}
            </span>
            <Separator orientation="vertical" class="h-4" />
          {/if}
          <Button
            size="sm"
            class="h-8 px-4 rounded-full bg-brand-500 hover:bg-brand-600 text-white font-semibold text-xs disabled:opacity-50"
            disabled={!getCanSubmit() || loading}
            onclick={handleSubmit}
          >
            {loading ? 'Posting...' : 'Post'}
          </Button>
        </div>
      </div>
    </div>
  </div>
</div>
