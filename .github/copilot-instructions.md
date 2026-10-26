# AniList Metro agent instructions

Read [CLAUDE.md](../CLAUDE.md), [AGENTS.md](../AGENTS.md), and
[rules.txt](../rules.txt) before changing code.

## Required behavior

- Treat `index.html` as the primary legacy-first entry and `index_v2.html` as a
  comparison/reference entry.
- Preserve every declared localStorage key, required global, API contract, and
  zero-indexed panorama section.
- Prefer focused edits and reuse existing helpers. Do not introduce a framework,
  build system, dependency, or invented API.
- Follow the Metro rules: flat surfaces, square corners, no shadows, lowercase
  UI, and responsive desktop/mobile layouts.
- Keep tile editing locked behind the explicit edit control.
- Run static checks and document manual browser validation for UI changes.

## Safe cleanup

- Do not delete Markdown or text documentation.
- Do not use broad recursive deletion or reset commands.
- Before removing an HTML/reference file, verify it is not an active entry,
  source reference, or linked documentation.
- Hooks may warn or validate; they must never expose secrets or rewrite user
  data.
