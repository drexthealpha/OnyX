---
name: e2e-testing
description: Playwright E2E testing patterns, Page Object Model, configuration, CI/CD integration, and flaky test strategies.
origin: ECC
---

# E2E Testing Patterns

Playwright patterns for stable, fast, and maintainable E2E test suites.

## When to Activate

- Testing ONYX web app (apps/web) or mobile (apps/mobile)
- Critical user flows: chat, intel feed, browser research, memory timeline
- Before submitting to Colosseum Frontier

## Test File Organization

```
tests/
├── e2e/
│   ├── chat/
│   │   ├── basic-chat.spec.ts
│   │   └── voice-mode.spec.ts
│   ├── intel/
│   │   └── feed.spec.ts
│   └── memory/
│       └── crystals.spec.ts
├── fixtures/
│   └── nerve.ts
└── playwright.config.ts
```

## Page Object Model

```typescript
import { Page, Locator } from '@playwright/test'

export class IntelPage {
  readonly page: Page
  readonly topicInput: Locator
  readonly briefCard: Locator

  constructor(page: Page) {
    this.page = page
    this.topicInput = page.locator('[data-testid="topic-input"]')
    this.briefCard = page.locator('[data-testid="brief-card"]')
  }

  async goto() {
    await this.page.goto('/intel')
    await this.page.waitForLoadState('networkidle')
  }

  async research(topic: string) {
    await this.topicInput.fill(topic)
    await this.page.keyboard.press('Enter')
    await this.briefCard.waitFor({ state: 'visible', timeout: 15000 })
  }
}
```

## Configuration

```typescript
// playwright.config.ts
import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  use: {
    baseURL: process.env.NERVE_URL ?? 'http://localhost:3001',
    trace: 'on-first-retry',
  },
})
```

## Anti-Flakiness Rules

- Always use `data-testid` attributes, never CSS selectors
- Prefer `waitFor` over `waitForTimeout`
- Mock external API calls in CI
- Use `page.waitForResponse` for network-dependent assertions