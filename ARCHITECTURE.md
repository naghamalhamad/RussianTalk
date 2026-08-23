# How RusTalk Is Built (Plain Language)

This document explains how the app is put together, written for someone
who doesn't code. If you're about to add a feature, read the "Pattern
For Adding New Features" and "Things Not To Do" sections below first.

This describes the app as it stands today. It reflects a deliberate
product decision: saved words are global, shared across every
conversation (see the "Things Not To Do" section for why this isn't
the same as the "please" bug that was fixed earlier the same day).

## 1. Folder Structure — What Each Piece Is For

Think of the app like a small restaurant. Some files are the building
itself, some are the recipe book, some are the staff who do specific
jobs.

- **`index.html`** — The front door / picture frame. It's the one page
  a browser actually opens; almost everything else gets loaded inside
  it. You'll basically never need to touch this.

- **`src/main.jsx`** — The light switch. A few lines that just turn the
  app on and mount it into the page. Never touch this either.

- **`src/App.jsx`** — The restaurant manager. It doesn't cook or serve
  anything itself, but it keeps track of the two things that matter
  across the *whole* app: which screen you're currently looking at
  (topic list / a topic / all flashcards), and the master list of
  saved flashcards. It hands both down to whichever screen is showing.

- **`src/data.js`** — The recipe book / phrasebook. Every topic
  ("Cafés," "Shopping," etc.) and every conversation script (with the
  Russian text, the English translation, and which words are
  clickable) lives here, and *only* here. If you're adding a new
  conversation, this is the only file with actual Russian content in
  it.

- **`src/selectors.js`** — The one shared recipe card for "how do I
  count/find saved words for a topic or a dialog?" Any time you need
  to answer a question like "how many words has the user saved from
  this topic," you look it up here — you don't write that calculation
  again from scratch somewhere else. (This file didn't exist until
  today; it replaced four separate copies of the same calculation.)

- **`src/styles.css`** — The one shared paint-and-furniture catalog.
  All the colors, fonts, and spacing used anywhere in the app are
  defined once at the top (as named "tokens," like "amber" or
  "ink-soft") and every screen just points at those names instead of
  picking its own colors.

- **`src/components/`** — The staff, each with one job:
  - `TopBar.jsx` — the header bar with the logo and the Flashcards button
  - `Home.jsx` — the grid of topic cards you see first
  - `TopicView.jsx` — a single topic's screen (the Dialogs/Flashcards tabs)
  - `DialogMenu.jsx` — the sidebar list of conversations within a topic
  - `ChatPanel.jsx` — the actual chat bubbles, plus the word popover
  - `TicketGrid.jsx` — the flashcard "ticket" grid (reused in two places)
  - `GlobalFlashcards.jsx` — the "All flashcards" screen
  - `TrainingModal.jsx` — the flip-card quiz popup
  - `EmptyState.jsx` — the small "nothing here yet" placeholder message

- **`.github/workflows/deploy.yml`** — The auto-publish robot. Every
  time changes are pushed to `main`, this automatically rebuilds the
  app and puts it live on the public website link. You don't run this
  by hand.

- **`package.json`** — The shopping list of outside tools the app
  needs to run (currently just React itself and the build tool, Vite —
  nothing extra).

- **`vite.config.js`** — Settings for the tool that packages the app
  up for the web. Rarely needs touching.

## 2. The Pattern For Adding New Features

A simple checklist for "where does my change go?":

1. **Adding a new conversation or topic?** → Only `src/data.js`. Don't
   put Russian text or dialog content anywhere else.
2. **Adding a new screen, or a new reusable visual piece (a button
   style, a card, a modal)?** → A new file in `src/components/`, one
   component per file.
3. **Need to count, find, or filter saved flashcards in some new way?**
   → Add the calculation to `src/selectors.js` and reuse it. Don't
   write a fresh `flashcards.filter(...)` inline in a component if a
   similar one might already exist (or should exist) in that file.
4. **Tracking a saved word?** → Track it by *the word text alone* — one
   word equals one flashcard, shared globally across every topic and
   conversation it appears in. Don't re-introduce a "word +
   conversation" key (see below for why).
5. **A screen needs to remember something only it cares about** (like
   "which tab is selected" or "which dialog is open")? → Keep that
   local to that screen's own file, the same simple way every other
   screen does it. Only things that matter *everywhere* (like the
   saved-flashcards list) belong up in `App.jsx`.

## 3. Naming Conventions

So new code blends in with the existing style:

- **Component files**: One component per file, filename in
  `PascalCase` (capitalized, no spaces) matching the component's name
  exactly — e.g. `TicketGrid.jsx` contains and exports `TicketGrid`.
- **Regular variables and functions**: `camelCase` (lowercase first
  word, capitalized after) — e.g. `dialogId`, `savedWords`,
  `startTraining`.
- **Dialog IDs** (inside `data.js`): lowercase words joined with
  dashes, describing the scene — e.g. `"coffee-formal"`,
  `"buying-ticket"`.
- **Topic IDs**: a single lowercase word — e.g. `"cafes"`,
  `"shopping"`.
- **"Something happened" functions passed between screens**: always
  start with `on` — e.g. `onSaveWord`, `onRemoveWord`, `onOpenTopic`.
  This is how a child screen tells the parent "the user did a thing,
  you decide what happens."

## 4. Things Not To Do

- **Saved words are tracked globally by word text — one word equals
  one flashcard, no matter how many topics or conversations it appears
  in.** If you save "please" in one conversation, it shows as already
  saved everywhere else "please" appears too, and there is only ever
  one "please" flashcard in the list. This is an intentional design
  choice, not an oversight — don't "fix" it by pairing the word with
  which conversation it came from.

  (Earlier the same day, the app briefly tracked words per-conversation
  instead — a fix for what looked like a bug: saving "please" in one
  conversation made it show as saved, and deletable, in a completely
  different one. After reviewing it, the per-conversation behavior was
  deliberately reversed back to global-by-word-text, because "one word,
  one flashcard, everywhere it appears" is the intended design for this
  app. If you're reading this and considering "fixing" the global
  behavior again, don't — it's a confirmed decision, not a leftover
  bug.)
- **Never write a new counting/filtering function for flashcards if
  one already exists in `src/selectors.js`.** Add a new one there
  instead of copy-pasting the filter logic into a component. That
  duplication (the same calculation written out four separate times)
  is exactly what was cleaned up today.
- **Don't introduce a different way of remembering things** (a new
  state-management library, global variables, browser storage, etc.)
  for just one screen. Every screen currently uses the same plain,
  simple technique (React's built-in `useState`). Mixing styles is how
  codebases become confusing to work on.
- **Don't fetch dialog content from the internet or an API.** All
  content is deliberately kept as plain data in `src/data.js` so the
  app stays simple, fast, and works without any backend.
- **Don't leave debug leftovers in.** No `console.log` statements,
  commented-out code, or half-finished features should be committed —
  there currently are none; keep it that way.
