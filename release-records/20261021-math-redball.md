# Math navy pictogram and red ball — production release

Production Worker `life-help` is at `e488532a-4d8c-41cb-9d94-d8c04b59d9c4` (100%). Code SHA: `b179dd5d906c6191a6ddc47adb12943b3e959d55`. Staging version: `236f6aad-ad9a-4d42-ac57-f74199e9d1d9`. The source is on `work/math-redball-release-20261021`.

## Result

- Re-rendered all 455 main videos, 193 localized neutral alternatives and 3,240 posters. Existing mascot nodes now draw the LIFE.HELP navy (#0E2456) pictogram with a red (#B22132) ball. The face has no facial details or protruding rod. The compact figure dribbles and raises the ball; mathematical scene geometry, timings, formulas, IDs and curriculum metadata are preserved. Three original scenes have no mascot node; their video headers were refreshed as well.
- The Math dashboard links to `/motion`, with the learner’s grade and locale. The gallery supports playback, speed adjustment, stills and next-concept navigation. Existing 46 complete language packs were retained; this does not activate the separate seven-language/country expansion.
- Media revision queries refresh cached videos and posters. Immutable locale-pack hashes and overlay source-video hashes match the regenerated media. No private scene input or authoring context is served.

## Preserved live baseline

The live JIU source was uncommitted in the original working tree. Its 41 files were copied without modifying that tree and preserved in baseline commit `6b83e2e6`; their hashes remain unchanged. Math-only integration commit `a0a62414` was applied to that baseline, followed by the existing linked-card CSS fix. No English/Korean question-source change was introduced.

All 14 non-asset production bindings are identical to the previous live version, including learner/service authentication, JIU secrets, restricted email and KV. The final build follows the current JIU production profile: credentials are runtime bindings; no NEXT_PUBLIC Supabase credentials are embedded. The strict canonical clean-build scanner found zero real project refs or credentials; a separate exact-value scan found neither JIU secret. No fabricated key was used.

## Validation

- Typecheck passed; full vitest: 109 files / 1,570 tests passed. A preliminary run overlapped asset regeneration and missed one generated overlay; the completed, stable build was followed by a full successful rerun.
- Full FFmpeg decode of all 648 videos: H.264, 1280×720, 30 fps, 300 frames, 10 seconds. All 3,240 stills exist. Mathematical source scenes are byte-identical to their original input.
- Local browser: 46 locale galleries, video playback, 320/390/768/1280 widths, no horizontal overflow or page errors. Representatives of 43 scene families were visually inspected.
- Staging integrated runner: all 10 gates passed, run `STG-mvgvcyob-0726e7`; residue 0 and foreign rows untouched. Separate dashboard→video→next-concept journey passed.
- Production verification: 0% version override, 5% canary, then 100%. At 100%, without overrides: public site/locale-pack/media-hash checks and the 390px guest dashboard→video→next→reload journey passed; question XP unchanged and page errors 0. JIU public home/admin routes remained available. Authenticated production account login was not performed.
- English/Korean `/motion` correctly render Next.js not-found output with no math iframe. Streamed not-found responses can have status 200; the check verifies their actual not-found marker and absent iframe. The production browser timeout matches staging’s 20 seconds; the initial standalone default of 5 seconds was too short for the cold gallery.
- Worker compressed size: 5.78 MiB, unchanged budget <7.5 MiB. No production schema migration.

See `20261021-math-redball-checks.json` and public `math-motion/media-checks.json` for exact versions and media hashes. Mathematical/translation teacher review was not added by this visual replacement.

## Rollback

Restore `9b1aaed3-d1a2-42ee-8931-f15fc8d8716f` at 100% using `wrangler versions deploy ...@100 --name life-help --yes`. This preserves the prior JIU release. Do not use older pre-JIU rollback versions.
