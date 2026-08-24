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

- **`src/speech.js`** — The one shared "read this out loud" helper.
  It uses the browser's own built-in narrator (no internet call, no
  extra software) to read Russian text aloud. Anything that needs to
  speak text calls the `speak()` function here — nothing else should
  talk to the browser's narrator directly.

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
  - `TicketGrid.jsx` — the flashcard "ticket" grid (reused in two places).
    Each ticket is a plain card showing the Russian word and English
    translation together — no flip, no audio icon here; that only
    happens in the training quiz (see `TrainingModal.jsx` below).
  - `GlobalFlashcards.jsx` — the "All flashcards" screen
  - `TrainingModal.jsx` — the "Train All" quiz popup: one flip-able card
    at a time, Russian word + 🔊 on the front, English translation on
    the back, flips when tapped
  - `EmptyState.jsx` — the small "nothing here yet" placeholder message
  - `SpeakerButton.jsx` — the reusable 🔊 button that reads a piece of
    text out loud when tapped. Any new "read this aloud" button
    anywhere in the app should reuse this component, not build its own.

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
6. **Need to read some text out loud?** → Use the existing
   `SpeakerButton` component and the `speak()` function in
   `src/speech.js`. Don't write a new way of talking to the browser's
   narrator.

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

## 4. How Audio Playback Works

The app can read Russian text out loud (the 🔊 buttons on each sentence
and each word). This uses the browser's own built-in narrator (called
the "Web Speech API" if you look it up) — the same kind of voice your
phone or computer already uses for things like reading messages aloud.
That means: no internet call, no API key, no added library — it fits
the app's "everything is local" rule perfectly.

How it's wired up:

- `src/speech.js` holds the one `speak(text)` function that actually
  talks to the browser's narrator, and tells it to read the text as
  Russian.
- `src/components/SpeakerButton.jsx` is the one reusable 🔊 button.
  Give it some text and a label, and it handles the rest.
- It's used in two places in `ChatPanel.jsx`: next to each speaker's
  name (reads the whole line), and inside the little translation popup
  that appears over a word (reads just that word). That popup opens
  either by hovering the word (on a computer) or tapping it (on a
  touchscreen, where there's no "hover") — either way, the same popup
  shows the translation, the 🔊 button, and the "Save as flashcard"
  button together, so you can hear a word before deciding to save it,
  on any device, without a separate icon cluttering the sentence text.

**An honest limitation, not a bug**: whether the audio actually sounds
right depends on whether the visitor's own phone or computer has a
Russian voice installed — that's controlled by their device, not by
this app, the same way a phone might or might not have a Russian
keyboard installed. No website can install a voice onto someone else's
device. If a visitor's device has no Russian voice, the button will
still try to speak, but it may read the text with a foreign accent
rather than sounding native. If you're building on this later, don't
try to detect or "fix" this — there's nothing to fix from the app's
side.

If you add more places that need to read text aloud, always reuse
`SpeakerButton` and `speak()` — don't write a second version of this.

**How the training quiz's audio button avoids flipping the card**:
the "Train All" quiz (`TrainingModal.jsx`) shows one flip-able card at
a time — tapping it anywhere flips it from the Russian word to the
English translation, using a real 3D CSS flip (`perspective` +
`rotateY` + `backface-visibility`, the same technique as everywhere
else a flip is needed in this app). The front also has a 🔊 button
(reusing `SpeakerButton`, not a new one) so a student can hear the
word before deciding to flip. This works with no extra code because
`SpeakerButton` already stops its click from "bubbling up" to
whatever it's sitting inside (`e.stopPropagation()`) — that's what
lets it live safely inside the word popover's "Save" button too. So
the card's own "tap anywhere to flip" handler never even hears about
a tap that landed on the speaker button; it only reacts to taps
elsewhere on the card. Nothing new was invented for this — it's the
same reuse pattern used everywhere else in this section.

Note this flip/audio behavior lives only in the training quiz. The
"All flashcards" ticket grid (`TicketGrid.jsx`) is deliberately plain
— it shows the Russian word and English translation together on one
static card, with no flip and no audio icon. If you're tempted to add
flip/audio there too, check with whoever's driving the product first —
it was tried once and explicitly moved to the training quiz instead.

**Reading a whole dialog out loud, one sentence after another**: the
"🔊 Listen to full dialog" button at the top of each conversation
(in `ChatPanel.jsx`) uses a second function in `src/speech.js`,
`speakSequence(texts, { onStepStart, onDone })`. Give it a list of
sentences and it reads them one at a time, only starting the next once
the browser reports the previous one finished — like a relay race, not
a fixed timer. `onStepStart(index)` fires right before each sentence
starts (that's what highlights the sentence currently being read, so a
student who glances at the screen can follow along — though the
feature works fine audio-only, without looking, which is the main use
case). `onDone()` fires exactly once no matter *why* it stopped:
it finished normally, someone pressed the stop button, or something
else interrupted it.

**The "only one thing talks at a time" rule lives in `speech.js`
itself**, not in any component: calling the ordinary `speak()`
function (tapping any single sentence or word) automatically stops a
`speakSequence()` that's mid-playback first. This is why tapping a
single word's speaker button while "Listen to full dialog" is running
correctly interrupts the full playback, without `ChatPanel.jsx` having
to know or care that a sequence was active — and it's also why
switching to a different dialog, or leaving the screen entirely, stops
playback automatically: those already call `stopSpeaking()`, which now
stops an in-progress sequence the same way. If you build another
playback feature later (auto-play the next dialog, a playback speed
setting, etc.), build it as another small function in `speech.js` that
calls `speak()`/`speakSequence()` the same way, so this "only one voice
at a time" guarantee keeps holding everywhere for free.

## 5. Things Not To Do

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
- **Don't build a second way of reading text out loud.** Reuse
  `SpeakerButton` and `src/speech.js` — see "How Audio Playback Works"
  above.
