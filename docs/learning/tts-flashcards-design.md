# English listening and flashcards: design record (learning-only production port)

## What the content really is (inspected before coding)
The English course (`lib/learn/content/{demo,elementary,secondary}/english.json`, 59 lessons, 600+ questions) is Korean-instruction material with English target text. A lesson has `title`, `concept` (Korean explanation), `example` (a short English string), `questionIds`. A question has a Korean `prompt` (English words / stems inside it), options, a server-only answer key, hints and an explanation. The Vietnamese overlay replaces the learner-facing strings only.

Facts that bound the feature (all measured on the committed content):
* There is **no passage array, no sentence-level Korean translation and no vocabulary list**. The only canonical English passages are the quoted passage inside the 152 reading-question prompts (`글을 읽고 답하세요. "..." 질문: ...`; 64 elementary + 88 secondary).
* `lesson.example` is English text, sometimes with a relation: `ball → B` (right side = answer), `big ≈ large` (English synonym), `library = 도서관` (canonical meaning). Only 7 lessons carry an `english = meaning` pair (`en-l1`, `en-e1-l3`, `en-m2-l5`, `en-h1-l4`, `en-h2-l4`, `en-h2-l5`, `en-h3-l4`).
* `audioText` (43 elementary questions) is a canonical English word for the existing pronunciation button.

## Decisions
* **TTS consumes canonical content only.** `lib/learn/listen/segments.ts` derives segments from `lesson.example` and from the quoted reading passage by pure functions; there is no second content store and no runtime translation.
* **English + Korean listening** uses a segment's Korean only when the lesson text carries it (`english = meaning`). Reading passages have no canonical translation, so for them the mode is shown disabled with a one-line explanation and English-only plays. Nothing is invented. If sentence-level Korean is wanted for passages, that is a content-authoring task (translate and review 152 passages), not a code task; it is not part of this release.
* **Vocabulary / flashcards**: "Save word" is offered for English items of up to six words in the lesson example; the Korean meaning is stored only when canonical. A card without a canonical meaning says so instead of showing a made-up one. Identity = normalized English text (case and whitespace only), so the same word is never duplicated.
* **Persistence: LOCAL (device).** Saved words live in `localStorage` per site; no migration, no server write, no marketplace table. Limitation: signed-in learners do not get their list on another device. A learning-only server table is future work (separate migration, not part of this release).
* **Engine**: browser-native Speech Synthesis behind a provider-neutral `SpeechEngine` interface. No key, no network, no server, no audio storage, nothing recorded; lesson text never leaves the device. No cloud TTS, speech recognition, microphone or pronunciation scoring.
* **Safety of playback**: one shared `ListenPlayer`; a new session, Stop, a page hide / unload or an unmount cancels the previous session first (session token, so late callbacks of a cancelled session are ignored); English and the meaning are separate utterances with their own language and voice (best installed voice by language, exact then same primary language, never a vendor name); voices that load asynchronously are re-read on every utterance and on `voiceschanged`; an engine failure ends the session without a crash; with no speech support the controls are replaced by one note and the lesson works unchanged. Repeat counts 1, 2, 3, 5, 10 or a strictly validated custom 1..20 (`MAX_REPEAT`), never infinite. Speeds 0.75 / 1 / 1.25 (preference in `localStorage`).
* **Accessibility**: every control has a text or `aria-label`; the spoken segment is marked `aria-current` and has a border (not colour alone); keyboard: native buttons, selects, radios, Enter / Space flips a card, arrow keys move between cards.
* **Mobile**: controls wrap, repeat settings are inside a `<details>`, passage sentences are numbered chips; verified at 320 / 390 / 1280 px.

## Not in scope (unchanged)
Cloud TTS, speech recognition, recording, AI scoring, general audio uploads, spaced repetition, Adult Study content, any marketplace, payment, provider or push change.
