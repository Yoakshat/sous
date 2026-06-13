# Project: Sous

## Overview
Voice cooking companion for two college students (you + sister) living in San Francisco. Sunday: app searches the web for real recipes, suggests ~30 options (mostly Indian so ingredients overlap), you pick the week's meals, generates a smart consolidated grocery list. Cooking time: phone browser stays open, mic is always on — ask any question mid-cook and it talks back.

## Users
- 2 people: you + your sister
- Beginners — recipes should be simple, clear, forgiving
- Background: Indian, open to trying new cuisines
- Use case: weekly meal planning + real-time kitchen assistant

## Tech Stack
- **Next.js** (App Router) — web app, works in phone browser
- **Web Speech API** — built into Chrome on phones; handles mic input (SpeechRecognition) and voice output (SpeechSynthesis). Free, no external dependency.
- **DeepSeek** (`deepseek-chat`) — brain for recipe suggestions, grocery list consolidation, and cooking Q&A. OpenAI-compatible API, very cheap.
- **Firecrawl** — web search + full recipe page scraping
- **localStorage** — persists the week's selected recipes and grocery list; no login, no database for MVP
- **Tailwind CSS** — fast, mobile-first styling
- **Vercel** — deployment

## Architecture
```
Phone Browser
  └── Always-on mic (Web Speech API, continuous mode)
        └── Transcript chunks → DeepSeek (with full recipe context)
              └── DeepSeek decides: respond or ignore
                    └── Response spoken aloud (SpeechSynthesis)

Pages:
  /             → Recipe selection: ~30 options stream in, pick lunch + dinner for the week
  /schedule     → Mon–Sun meal plan, tap any meal to open the recipe
  /groceries    → Smart consolidated grocery list (DeepSeek merges duplicates, rounds to real amounts)
  /cook/[id]    → Full recipe with ingredients scaled to 2 people (math done in code, not AI)
```

## Key Files
- `app/api/recipes/route.ts` — streaming SSE endpoint, searches Firecrawl + extracts via DeepSeek
- `app/api/groceries/route.ts` — POST, consolidates raw ingredient list via DeepSeek
- `lib/scale.ts` — scales ingredient amounts from original servings → 2 people in code
- `app/page.tsx` — recipe selection with EventSource streaming
- `app/schedule/page.tsx` — weekly schedule Mon–Sun
- `app/groceries/page.tsx` — grocery checklist
- `app/cook/[id]/page.tsx` — recipe detail + (soon) voice cooking assistant

## How to Run
```
cd ~/projects/sous/main
npm run dev
# visit http://localhost:3000
```

Requires `.env.local`:
```
DEEPSEEK_API_KEY=...
FIRECRAWL_API_KEY=...
```

## MVP Scope
- [x] Recipe selection: ~30 options stream in from web, mostly Indian
- [x] Grocery list: smart consolidation, scaled to 2 people, rounded to real amounts
- [x] Weekly schedule: Mon–Sun with lunch + dinner per day
- [x] Recipe detail page with scaled ingredients
- [ ] Cooking mode: always-on mic, voice Q&A with DeepSeek
- [ ] Deployed on Vercel
