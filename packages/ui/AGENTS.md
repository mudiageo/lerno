# 🎨 UI Component Library (@lerno/ui)

This package contains the shared UI components and design system for Lerno, built with [Svelte 5](https://svelte.dev/) and [Tailwind CSS](https://tailwindcss.com/).

## 🚀 Design Principles

- **Svelte 5 Runes**: Always use `$state`, `$derived`, `$effect`, and `$props`. Do NOT use Svelte 4 store patterns or `export let`.
- **Bits UI**: Use [Bits UI](https://bits-ui.com/) for accessible primitives (Accordions, Dialogs, etc.).
- **Lucide Icons**: Use `@lucide/svelte` for all icons.
- **Glassmorphism**: Favor high-premium aesthetics with vibrant colors and subtle transparency.

## 🏗️ Structure

Components are organized in [src/lib/components/](./src/lib/components/):
- `ui/`: Fundamental atoms (Button, Card, Input).
- `layout/`: Shell components (Sidebar, TopNav, BottomNav).
- `feed/`: Social and post-related cards.
- `study/`: Quiz sessions and learning trackers.
- `watch/`: Video player and upload components.

## 🛠️ Development Rules for Agents

- **Snippets**: Use `@render` for passing content chunks instead of slots where possible (Standard Svelte 5 pattern).
- **Styling**: Always use Tailwind classes. Avoid `<style>` blocks in Svelte components unless absolutely necessary.
- **Responsiveness**: Always prioritize mobile-first designs with `md:` and `lg:` modifiers.
- **Lucide Alignment**: Ensure icons are properly sized using the `size` prop or Tailwind `w-X h-X` classes.

## 🧪 Testing
Run `vp test` to execute component unit tests.
