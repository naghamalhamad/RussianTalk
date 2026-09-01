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

- **`src/pdfExport.js`** — The one shared "turn part of the page into
  a downloaded PDF" helper (`exportElementAsPDF(element, filename)`).
  Unlike `speech.js`, this one does need two small outside libraries
  (`jspdf`, `html2canvas`) since browsers don't offer a built-in way
  to save a file directly — see "How Exporting a Dialog Works" below.

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
  - `ChatPanel.jsx` — the actual chat bubbles, the word popover, and
    the per-sentence save button
  - `TicketGrid.jsx` — the flashcard "ticket" grid (reused in two places).
    Each ticket is a plain card showing the Russian text (a word, or a
    whole sentence) and English translation together — no flip, no
    audio icon here; that only happens in the training quiz (see
    `TrainingModal.jsx` below). A small "Word"/"Sentence" tag on each
    ticket shows which kind it is (see "How Sentence Flashcards Work"
    further down).
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
  needs to run: React itself, the build tool (Vite), the Supabase
  client, and the two small libraries behind PDF export (`jspdf`,
  `html2canvas`).

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
4. **Tracking a saved word or sentence?** → Track it by *its text plus
   its type* (`word` or `sentence`) — one word equals one flashcard,
   shared globally across every topic and conversation it appears in,
   and separately, one sentence equals one flashcard the same way. See
   "How Sentence Flashcards Work Alongside Word Flashcards" below.
   Don't re-introduce a "word + conversation" key (see "Things Not To
   Do" for why).
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
  start with `on` — e.g. `onSaveCard`, `onRemoveCard`, `onOpenTopic`.
  This is how a child screen tells the parent "the user did a thing,
  you decide what happens." (`onSaveCard`/`onRemoveCard` handle both
  word flashcards and sentence flashcards — see below.)

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

**Speed and pacing**: every utterance (single word, single sentence,
or a "Listen to full dialog" sequence) plays at a fixed `rate: 0.8` —
slower than the browser's default of 1 — since this is for learners,
not native-speed listening. `speakSequence` in `src/speech.js` also
waits `PAUSE_BETWEEN_SENTENCES_MS` (700ms) of silence after each
sentence finishes before starting the next one, so a full dialog
reads as separate beats instead of one run-on stream. Both constants
live at the top of `speech.js` — change them there, not per-call, so
every use of audio in the app stays in sync.

**Differentiating the two roles by voice**: every dialog line has a
`side` (`'left'` for the other person — waiter, cashier, staff,
friend...; `'right'` for "You," the learner's own line). `speech.js`
uses this to try to give the `'left'` role a distinct, male-sounding
voice — `findMaleVoice()` matches the visitor's own installed Russian
voices by name (there's no gender field on a Web Speech voice, so this
is a best-effort name match, e.g. "Pavel," "Dmitri"). `'right'` lines,
and anything with no side at all (a saved flashcard, which has no
"other role"), always keep the browser's own default voice —
unchanged from before. `speak()` and `speakSequence()` both take a
`side`, and `SpeakerButton` forwards a `side` prop the same way it
already forwards `text`/`label`.

**Another honest limitation, same as above**: whether a *different*
Russian voice is actually available at all depends on the visitor's
own device — many devices (this sandbox included) ship with exactly
one Russian voice, in which case both roles keep sounding the same,
same as before this feature existed. This isn't a bug to chase; there
is nothing this app can install on someone else's device. If you
touch `MALE_VOICE_NAME_HINTS` in `speech.js`, keep in mind it's a
plain substring match against whatever the OS/browser happens to name
its voices — there's no reliable "ask the browser for a male voice"
API to use instead.

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

## 5. How Sentence Flashcards Work Alongside Word Flashcards

A student can save two kinds of flashcard: a single word (the original
feature) or a whole sentence. Both use the exact same flashcard shape
— `{ word, tr, dialogId, topicId, type }` — the only new thing is
`type`, which is either `'word'` or `'sentence'`. For a sentence
flashcard, the `word` field just holds the whole Russian sentence
instead of one word; nothing else about the shape changes.

Because of that, almost nothing had to be duplicated:

- **The training quiz's flip card doesn't know or care.** It just
  puts `.word` on the front (with a speaker button) and `.tr` on the
  back — that was already true before sentence flashcards existed, so
  `TrainingModal.jsx` needed zero changes to support them.
- **Saving/removing is one function each**, `saveCard`/`removeCard`
  in `App.jsx` (exposed to screens as `onSaveCard`/`onRemoveCard`),
  used for both kinds. They accept a `type` (defaulting to `'word'`
  if you don't pass one), and treat "is this already saved" as
  matching *both* the text and the type — so a word and a sentence
  are never confused with each other, even in the unlikely case their
  text matched.
- **The sentence-save button** (the 🔖 icon next to each sentence's
  🔊 button in `ChatPanel.jsx`) reuses the exact same
  save/remove/require-login decision the word popover already made —
  it's not a new rule, just the existing one applied to a sentence's
  text instead of a word's.
- **The "All flashcards" list** (`TicketGrid.jsx`) shows a small
  "Word" or "Sentence" tag on each ticket (reusing the same
  blue/green color tokens used elsewhere in the app) so the two kinds
  are easy to tell apart while still living in the same list.

**Database note**: sentence flashcards need one extra column
(`type`) in the Supabase `flashcards` table, added via a one-time SQL
script (handed over the same way the original table setup was).
Word-saving was deliberately built to keep working normally even
before that SQL has been run — only saving a *sentence* depends on
it; trying to save one before the column exists just fails quietly
(the same as any other database hiccup this app already handles) and
doesn't affect word flashcards at all.

## 6. How Exporting a Dialog Works

The "⬇️ Download PDF" button next to "Listen to full dialog" in
`ChatPanel.jsx` downloads a real PDF file directly — no print dialog,
no "Save as PDF" step for the student to find. Browsers don't give a
web page any way to save a file without going through the print
dialog on their own, so this needed two small libraries:
`html2canvas` (takes a snapshot of the conversation exactly as
styled) and `jsPDF` (turns that snapshot into a downloadable file,
split across as many A4 pages as it needs). The shared logic lives in
`src/pdfExport.js`, in one function, `exportElementAsPDF(element,
filename, { title, subtitle })` — give it any DOM element, a
filename, and an optional title/subtitle and it handles the rest.

**Only the conversation lines are snapshotted, not the title/sub
block** — `ChatPanel.jsx` wraps just the `d.lines.map(...)` bubbles in
their own `linesRef`, separate from `panelRef` (the whole panel,
still used for other things). That's because the PDF draws its own
branded header instead of reusing the on-screen title — see below.

**The PDF has a real header and footer, drawn directly by `jsPDF`
(not part of the screenshot).** The header — a small amber "RusTalk"
mark and tagline, the dialog's title and subtitle, a divider line —
only appears on **page 1**, like a document cover, not repeated on
every page. The footer (a divider, "RusTalk," and "Page X of Y") does
repeat on every page. Everything is drawn with `jsPDF`'s own
text/shape calls in `src/pdfExport.js`'s `drawHeader`/`drawFooter`
helpers, using the same named colors as `src/styles.css` (amber, ink,
ink-soft, line) so it matches the app's look without picking new
colors. A `margin` (40pt) keeps the header, footer, and every page of
content off the paper's edge.

Because only page 1 reserves space for the header, **page 1 fits less
conversation content than later pages do** — `exportElementAsPDF`
tracks two different content-area heights (`firstSlicePx` vs.
`laterSlicePx`) and picks the right one per page instead of assuming
every page has the same amount of room.

**Why each page gets its own cropped slice of the screenshot,
instead of one giant image redrawn on every page**: pasting the same
tall image on every page and trusting the physical page edge to crop
it only works if nothing else needs to live below that image — but
the footer does. So each page instead gets a freshly cropped,
correctly-sized slice of the original canvas (via an offscreen `<canvas>` and
`drawImage` with a source rectangle), sized to fit exactly between the
(page-specific) content top and the footer. This was a real bug the
first time this was built: the footer's reserved space and the
image's actual boundary didn't agree, so page content visibly
overlapped the footer text. If you touch the pagination math again,
keep the slice-per-page approach - don't go back to one full-height
image with page-edge clipping, and keep accounting for page 1 having
less room than the rest.

Those two libraries are fairly large, so `ChatPanel.jsx` only fetches
them the moment someone actually clicks the button (`await
import('../pdfExport.js')`), instead of loading them for every
visitor up front. This is the same "only pay for what you use"
thinking as the rest of the app, just applied to code size instead of
network calls.

Right before snapshotting, `ChatPanel.jsx` sets a local `isExporting`
flag that does two things while it's true: it hides everything that
isn't the conversation itself (the "Listen"/"Download" buttons, word
and sentence save icons, the hint text), and it forces every English
translation line to show — normally `.translation-line` only shows
on hover or tap, which doesn't mean anything for a still snapshot, so
export mode shows it unconditionally. Nothing is actually removed
from the dialog; the controls just reappear the moment the download
finishes. Everything else (the chat bubble colors, fonts, layout) is
untouched, so the exported page looks like the same conversation,
just with every translation visible at once and the app's controls
stripped away.

If you add a new interactive-only control to `ChatPanel.jsx` later
(another button, another icon), hide it the same way — wrap it in
`{!isExporting && (...)}` — otherwise it'll show up uselessly in the
downloaded PDF.

## 7. How ID-Only Login Works

Logging in used to mean typing an email and a password. Now a student just
types one ID (e.g. `nagham`) and hits Continue — no password field exists
anywhere in the UI. This was a deliberate, explicit product decision, not an
oversight, and it comes with a real, accepted tradeoff: **anyone who knows
or guesses another student's ID can log in as them and see or delete their
saved flashcards.** That's fine for a low-stakes classroom setting, which is
the only setting this app is meant for — don't "fix" it by adding a
password back in.

**Why this still uses Supabase Auth under the hood.** Every flashcard is
protected by a Row Level Security policy keyed on `auth.uid() = user_id` —
that's the entire reason one student can't see another's flashcards in the
database. Supabase Auth is what hands out that `auth.uid()`, and it always
wants an email + password pair, even though neither is ever shown to a
student. So `src/auth.js` fakes both:

- `idToEmail(id)` turns the typed ID into a fake address like
  `nagham@id.rustalk.local` — never a real inbox, never emailed to anyone.
- Every account, for every student, is created and signed in with the exact
  same fixed password (a constant in `src/auth.js`). It's effectively public
  (like the anon key already committed in `supabaseClient.js`) — the ID is
  the only thing standing between a student's account and anyone else, by
  design.

**`signInWithId(id)`** (`src/auth.js`) is the single entry point for both
logging in and signing up, because from a student's point of view there's
no difference: they just type their ID.
1. It first tries to log in with that ID's fake email + the shared password.
2. If no account exists yet, it signs one up instead — the first person to
   type a given ID is the one who claims it. From then on, typing that same
   ID again always logs into that same account.

**Required one-time Supabase setting.** The fake email addresses this
relies on can never receive a confirmation link, so the project's
Authentication → Providers → Email → "Confirm email" setting must be
switched **off** in the Supabase dashboard. This can't be done from the
app's code — it's a project setting. If it's still on, `signInWithId` will
detect that sign-up succeeded but no session came back, and surfaces a
message telling whoever runs the site to turn it off, instead of leaving
the student stuck with no explanation. (This also means the earlier
"confirmation email" behavior from when accounts used real email addresses
no longer applies — there is no real email to confirm anymore.)

- **Don't reintroduce a password field.** The user explicitly chose
  "ID alone, no password" after being shown the tradeoff above.
- **Don't validate ID uniqueness with a separate check.** Supabase's own
  email-uniqueness constraint on the derived fake email already does this —
  the first sign-up for a given ID succeeds and claims it; that's the
  intended mechanism, not a gap to close.

## 8. Things Not To Do

- **Saved words are tracked globally by word text — one word equals
  one flashcard, no matter how many topics or conversations it appears
  in.** If you save "please" in one conversation, it shows as already
  saved everywhere else "please" appears too, and there is only ever
  one "please" flashcard in the list. This is an intentional design
  choice, not an oversight — don't "fix" it by pairing the word with
  which conversation it came from. (Sentence flashcards follow the
  same "global by text" rule, just in their own separate `type`, so a
  saved sentence and a saved word never collide with each other — see
  "How Sentence Flashcards Work Alongside Word Flashcards" above.)
- **Don't write a new save/remove function for a new kind of
  flashcard.** `saveCard`/`removeCard` in `App.jsx` already handle any
  flashcard shaped like `{ word, tr, dialogId, topicId, type }` — add
  a new `type` value and reuse them, the same way sentence flashcards
  reused them instead of getting their own `saveSentence`/
  `removeSentence` functions.

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
