# Project: Sous

## Overview
Voice cooking companion for two college students (you + sister) living in San Francisco. Sunday: Claude suggests beginner-friendly recipes (mix of Indian and new cuisines), you pick the week's meals, app generates a consolidated grocery list. Cooking time: phone browser stays open, mic is always on — ask any question mid-cook and it talks back. Ignores ambient noise; responds only when it sounds like a question directed at it.

## Users
- 2 people: you + your sister
- Beginners — recipes should be simple, clear, forgiving
- Background: Indian, open to trying new cuisines
- Use case: weekly meal planning + real-time kitchen assistant

## Tech Stack
- **Next.js** (App Router) — web app, works in phone browser
- **Web Speech API** — built into Chrome on phones; handles mic input (SpeechRecognition) and voice output (SpeechSynthesis). Free, no external dependency.
- **Claude API** (`claude-sonnet-4-6`) — brain for recipe suggestions, grocery list generation, and cooking Q&A
- **localStorage** — persists the week's selected recipes and grocery list; no login, no database for MVP
- **Tailwind CSS** — fast, mobile-first styling
- **Vercel** — deployment

## Architecture
```
Phone Browser
  └── Always-on mic (Web Speech API, continuous mode)
        └── Transcript chunks → Claude (with full recipe context)
              └── Claude decides: respond or ignore
                    └── Response spoken aloud (SpeechSynthesis)

Pages:
  /          → Sunday planning: recipe suggestions + selection
  /groceries → Consolidated grocery list (print/share friendly)
  /cook/[id] → Cooking mode for a specific recipe — always-on voice
```

## Key Files
_To be filled in as we build._

## How to Run
_To be filled in as we build._

## MVP Scope (Week 1)
- [ ] Recipe suggestion screen (Claude picks 6, user selects)
- [ ] Grocery list generation from selected recipes
- [ ] Cooking mode: always-on mic, voice Q&A with Claude
- [ ] State persisted in localStorage (no login needed)
- [ ] Deployed on Vercel
