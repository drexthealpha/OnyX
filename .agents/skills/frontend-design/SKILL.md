---
name: frontend-design
description: Create distinctive, production-grade frontend interfaces with high design quality. Use when the user asks to build web components, pages, or applications and the visual direction matters as much as the code quality.
origin: ECC
---

# Frontend Design

Use this when the task is not just "make it work" but "make it look designed."

This skill is for product pages, dashboards, app shells, components, or visual systems that need a clear point of view instead of generic AI-looking UI.

## When To Use

- building a landing page, dashboard, or app surface from scratch
- upgrading a bland interface into something intentional and memorable
- translating a product concept into a concrete visual direction
- implementing a frontend where typography, composition, and motion matter

## Core Principle

Pick a direction and commit to it. Safe-average UI is usually worse than a strong, coherent aesthetic with a few bold choices.

## Design Workflow

### 1. Frame the interface first

Before coding, settle: purpose, audience, emotional tone, visual direction, one thing the user should remember.

Possible directions: brutally minimal, editorial, industrial, luxury, playful, geometric, retro-futurist, soft and organic, maximalist.

Do not mix directions casually. Choose one and execute it cleanly.

### 2. Build the visual system

Define: type hierarchy, color variables, spacing rhythm, layout logic, motion rules, surface / border / shadow treatment.

Use CSS variables or the project's token system.

**ONYX tokens:** `--color-bg: #0d0d1f`, `--color-accent: #22d3ee`, `--color-fg: #ddddff`

### 3. Compose with intention

Prefer: asymmetry when it sharpens hierarchy, overlap when it creates depth, strong whitespace when it clarifies focus, dense layouts only when the product benefits from density.

### 4. Make motion meaningful

Use animation to reveal hierarchy, stage information, reinforce user action, create one or two memorable moments. One well-directed load sequence is stronger than twenty random hover effects.

## Strong Defaults

### Typography
- pick fonts with character
- pair a distinctive display face with a readable body face when appropriate

### Color
- commit to a clear palette
- one dominant field with selective accents
- ONYX: indigo field, cyan accent, white-lavender text

## Examples

```tsx
// ONYX dashboard card — correct
<div style={{background:'#0d0d1f', border:'1px solid #22d3ee33', borderRadius:12}}>
  <h2 style={{color:'#22d3ee', fontFamily:'mono'}}>Intel Brief</h2>
  <p style={{color:'#ddddff'}}>7 sources · score 0.91</p>
</div>
```