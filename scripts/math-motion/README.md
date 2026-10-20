# LIFE.HELP math motion renderer

The original mathematical scene nodes are unchanged. `moa` is the legacy node identifier; the renderer draws an original navy (#0E2456) pictogram with a red (#B22132) ball, without a face or facial protrusions. Its compact animation stays within the existing illustration area.

Compile `render.swift` using the macOS Swift SDK, set `MATH_FFMPEG` to FFmpeg, and pass a working directory containing `render-scenes.json`, `videos/`, and `posters/`. An optional second argument selects comma-separated episode IDs or `all`. Each video has 300 frames at 30 fps and five stills. The 193 neutral language variants use the corresponding scenes with localized text and formula nodes removed; their overlay coordinates and translation keys are preserved.

Renderer inputs stay outside `public/`; no authoring context is exported. The public `media-checks.json` records actual media hashes and full-decode verification. The gallery uses an explicit media version to refresh cached videos and posters.
