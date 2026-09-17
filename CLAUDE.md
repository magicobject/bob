# Standing instructions for this repo

## Build numbers: tag every commit, and log it on /updates.html
The pre-commit hook (`.githooks/pre-commit`, wired up via `npm install`'s `prepare` script) runs `scripts/bump-build-number.mjs`, which bumps `build-number.json` on every commit (same date → counter +1; new date → counter resets to 1) and stamps the new number into the `<span class="build-number">` footer of **whichever of `public/index.html`, `public/404.html` and `public/updates.html` are already staged for that commit** — never edit that span by hand, and don't expect a page's footer to advance in a commit that doesn't touch it. (An earlier version patched and `git add`ed all three pages unconditionally, regardless of what was staged — that silently swept an unrelated, still-unstaged edit into a commit whose message didn't mention it, build `2026.09.17.001`. Fixed by only touching a page's footer when it's already part of the commit.) Two more things go with the build number:

1. **Before committing**, work out what the new build number will be (read `build-number.json`, apply the same same-date/new-date rule above) and add a new entry at the *top* of the changelog list in `public/updates.html` — that build number, the author, today's date, and a one-line summary of the change. Each entry's `changelog-meta` div is `<span class="changelog-build">`, then `<span class="changelog-author">`, then `<span class="changelog-date">`. Link the page(s) the change touched (`<a href="index.html">...</a>`, relative, same folder). Newest entry first. Since `public/updates.html` needs to be staged anyway for its footer to bump, and it's always part of the commit that adds the entry, this works out naturally.
2. **After committing**, tag it with that same build number and push the tag: `git tag build-<date>.<NNN>` (e.g. `build-2026.09.16.001`, matching the footer's "Build 2026.09.16.001" text exactly), then `git push origin build-<date>.<NNN>`.

`/updates.html` is a real, reachable page — it's just not linked from anywhere on the site, and is marked `robots: noindex, nofollow` for exactly that reason. It's a build log for whoever knows the URL, not user-facing content. It's still swept by the accessibility test suite (`test/accessibility.spec.ts`), same as every other page.

## Before any push to origin
- Run `npm test` (Playwright suite, includes `test/accessibility.spec.ts`) and `npm run audit` (`npm audit --audit-level=high`, also enforced by `.githooks/pre-push`). Fix real findings — don't suppress, downgrade, or skip them to get a push out.
- Report the number of tests run and time taken, prefixed "bob:" (e.g. "bob: 15 tests passed in 3.2s").

## Accessibility
- Every page must pass an axe-core scan with zero violations. New pages need an entry in `test/support/pages.ts`.
- Any new heading needs to fit the existing outline (no skipped levels).
- Any new text/background colour pairing must clear WCAG AA contrast (4.5:1 normal text, 3:1 large text/UI) — compute it, don't eyeball it. A generic `nth-of-type(even)` striping rule once silently overrode `.contact-section`'s dark background on higher specificity, leaving white text on a light background — striping is done with an explicit `.section-alt` class instead, for exactly that reason.

## Security
- Keep `npm run audit` clean before any push.
- The inline JSON-LD `<script>` in `public/index.html` is allow-listed in `public/_headers` by SHA-256 hash (`script-src 'self' 'sha256-...'`), not `'unsafe-inline'`. **Any edit to that script's content requires recomputing the hash** — see the method used previously (hash the exact bytes between `>` and `</script>`, not a trimmed/reformatted copy) — and updating `_headers` to match, or the script is silently blocked in production. `npm run serve` does NOT apply `_headers` (Cloudflare-only convention) — this class of bug won't show up locally without `npx wrangler dev`.
- Don't add third-party scripts, trackers, or embeds without adding whatever they need to `public/_headers`'s CSP first.

## Multi-developer workflow
`users.json` (repo root) is the roster — each entry has `firstName`, `lastName` and `github`. Before adding a changelog entry, resolve the author automatically: run `gh api user --jq .login`, look it up in `users.json`, use that person's `firstName` + `lastName`. If the logged-in account isn't in `users.json`, stop and ask — add them to the roster first rather than guessing.

## Site structure
This is a hand-authored single-page static site — `public/index.html`, `public/404.html`, `public/updates.html`, `public/css/style.css`, `public/js/main.js`. There is no templating build step (unlike kington-parishes): edit the HTML/CSS/JS directly. Photos go through `node scripts/optimize-images.mjs`, which reads full-res originals from the gitignored `originals/` folder and writes the sized/compressed output actually served from `public/images/`.
