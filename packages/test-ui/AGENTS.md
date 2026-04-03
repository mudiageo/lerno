# 🧪 UI Test Workbench (@lerno/test-ui)

This package is a dedicated [SvelteKit](https://kit.svelte.dev/) application used as a workbench for developing and previewing components from `@lerno/ui`.

## 🚀 Purpose

- **Component Isolation**: Test components in a clean environment away from the main application.
- **Storytelling**: Document component states, variants, and edge cases.
- **Visual Regression**: Serve as the target for visual regression tests.

## 🏗️ Structure

- [src/routes/](./src/routes/): Contains pages for each component category (Buttons, Inputs, Modals, etc.).
- [src/lib/](./src/lib/): Shared testing utilities and mock data.

## 🛠️ Development Rules for Agents

- **Add New Previews**: Whenever you create or significantly update a component in `@lerno/ui`, add a corresponding preview page here.
- **Mock Data**: Use realistic mock data to demonstrate component behavior (e.g., loading states, error states).
- **Interactive Demos**: Implement interactive controls (e.g., toggles for different props) to showcase component flexibility.
- **Performance**: Monitor component performance and accessibility (using tools like Axe) within this workbench.
