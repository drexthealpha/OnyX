---
name: frontend-slides
description: Zero-dependency HTML presentations with animation-rich visual exploration. Built with vanilla HTML/CSS/JS for portability. Use when the user wants to create interactive slide decks or visual presentations.
origin: ECC
---

# Frontend Slides

Zero-dependency HTML presentations for creating animated, interactive slide decks.

## When to Activate

- Creating presentation slides for demos or talks
- Building visual explorations or interactive content
- Making animated explanations
- Any presentation where standard tools (PowerPoint, Keynote) aren't suitable

## Core Approach

Build slides with vanilla HTML/CSS/JS — no frameworks, no dependencies. This ensures:
- Portable: single HTML file works everywhere
- Fast: no bundle to download
- Customizable: full control over animations

## HTML Structure

```html
<section class="slide" data-slide="1">
  <div class="content">
    <h1>Slide Title</h1>
    <p>Content goes here</p>
  </div>
</section>
```

## CSS Animation Patterns

### Fade In
```css
.slide {
  opacity: 0;
  transition: opacity 0.5s ease;
}
.slide.active {
  opacity: 1;
}
```

### Slide Transitions
```css
.slide {
  transform: translateX(100%);
  transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}
.slide.active {
  transform: translateX(0);
}
```

### Stagger Children
```css
.slide.active .item {
  animation: fadeUp 0.5s ease forwards;
  opacity: 0;
}
.slide.active .item:nth-child(1) { animation-delay: 0.1s }
.slide.active .item:nth-child(2) { animation-delay: 0.2s }
.slide.active .item:nth-child(3) { animation-delay: 0.3s }
```

## JavaScript Navigation

```javascript
const slides = document.querySelectorAll('.slide')
let current = 0

document.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowRight' || e.key === ' ') {
    goToSlide(current + 1)
  } else if (e.key === 'ArrowLeft') {
    goToSlide(current - 1)
  }
})

function goToSlide(index) {
  slides[current].classList.remove('active')
  current = (index + slides.length) % slides.length
  slides[current].classList.add('active')
}
```

## ONYX Theme for Slides

```css
:root {
  --bg: #0d0d1f;
  --accent: #22d3ee;
  --fg: #ddddff;
  --success: #4ade80;
  --error: #f87171;
}
body {
  background: var(--bg);
  color: var(--fg);
  font-family: system-ui, sans-serif;
}
h1, h2, h3 {
  color: var(--accent);
}
```

## Interactive Examples

### Code Highlighting
```javascript
// Highlight current line
const codeLines = document.querySelectorAll('.code-line')
codeLines.forEach((line, i) => {
  if (i === currentLine) {
    line.classList.add('highlight')
  }
})
```

### Animated Charts
```javascript
// Simple bar chart animation
const bars = document.querySelectorAll('.bar')
bars.forEach((bar, i) => {
  const value = data[i]
  bar.style.height = '0%'
  setTimeout(() => {
    bar.style.transition = 'height 0.5s ease'
    bar.style.height = value + '%'
  }, i * 100)
})
```

## Presentation Tips

- Keep slides simple: one idea per slide
- Use animations to guide attention
- Code demos: highlight current execution line
- Live coding: show full code, then run