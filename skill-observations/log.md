# Skill Observation Log

Observations captured during task-oriented work. Each entry identifies a
potential skill improvement or new skill opportunity.

**Status key:** OPEN = not yet actioned | ACTIONED = skill updated/created |
DECLINED = user decided not to pursue

---

## 2026-07-07

### Observation 1: Browser click-through verification without Playwright via chromium CDP + Node built-in WebSocket

**Status:** OPEN
**Date:** 2026-07-07
**Session context:** Portfolio Section-1 bug-fix pass; needed real click-through verification of a Next.js prod build with no browser-automation deps installed
**Skill:** verify (potential complementary pattern) / New skill candidate: cdp-verify
**Type:** open-source
**Phase/Area:** end-to-end verification of UI interactions

**Issue:** The repo's rules forbid adding dependencies, but "verify the change works" required clicking buttons, opening modals, and reading console errors in a real browser. Node ≥22 ships a WebSocket client, and chromium's `--remote-debugging-port` exposes CDP, so a ~70-line scratchpad script (navigate → evaluate async JS → screenshot → collect console/network errors) covered the whole click-through with zero new deps. Pitfall found: naive text-based button selectors clicked the wrong element (mute instead of crate; header button instead of modal tab) producing FALSE bug reports — scoping queries to the modal container and using structural selectors fixed it.

**Suggested improvement:** Capture the cdp.mjs driver as a reusable snippet in a verification skill: chromium flags, WebSocket message plumbing, Runtime.evaluate with awaitPromise, screenshot capture, and the warning about scoping DOM queries to the dialog/container before clicking.

**Principle:** When automation deps are unavailable, the platform already ships the pieces (headless chromium + CDP + Node WebSocket); and in DOM-driving tests, a wrong-element click is indistinguishable from an app bug — always scope selectors to the component under test and verify what got clicked before reporting failure.

### Observation 2: Programmatic .click() bypasses hit-testing — invisible overlay bugs slip through DOM-driving tests

**Status:** OPEN
**Date:** 2026-07-07
**Session context:** Building a first-load overlay; an effect-cleanup race left the overlay mounted invisibly at z-200, swallowing all real clicks
**Skill:** verify / New skill candidate: cdp-verify
**Type:** open-source
**Phase/Area:** end-to-end verification of UI interactions

**Issue:** A full-screen overlay stayed mounted (opacity 0) after its dismiss timer was cancelled by its own effect's cleanup (setState in the effect re-ran the effect, whose cleanup cancelled the inner setTimeout). Every CDP flow test still passed because element.click() dispatches events directly to the target, bypassing browser hit-testing — a real user's clicks would all land on the invisible overlay. The bug surfaced only because a probe checked for the overlay element's continued presence, not because any click failed.

**Suggested improvement:** In browser-verification scripts, after dismissing any overlay/modal/loader, assert the element is actually unmounted (or pointer-events:none), and/or use document.elementFromPoint(x,y) on a target before clicking to verify what a real pointer would hit. Also: never schedule a state-machine transition inside an effect keyed on that same state — the transition re-runs the effect and its cleanup cancels the pending timer; give each transition its own effect.

**Principle:** Synthetic .click() proves the handler works, not that the element is reachable; overlay reachability must be asserted separately (presence check or elementFromPoint), and React state-machine steps must not be scheduled from effects their own transition will tear down.

### Observation 3: Screenshot latency makes animation-timing verification unreliable

**Date:** 2026-07-07
**Session context:** Verifying a multi-phase case-opening animation (1s open → 6.4s spin → reveal) in the browser preview
**Skill:** verify (system skill — route to complementary skill if actioned)
**Type:** open-source
**Phase/Area:** Browser verification of timed/animated UI

**Issue:** Preview screenshots arrived seconds after the trigger click, repeatedly capturing the final animation phase and making it look like intermediate phases were skipped. Two screenshot attempts produced a false "bug" signal before the cause was identified.

**Suggested improvement:** When verifying timed or multi-phase UI behavior, prefer an in-page polling eval that records DOM-state transitions with performance.now() timestamps over screenshots. Screenshots only for static visual states.

**Principle:** Verification tools have their own latency; for time-sensitive behavior, instrument inside the page (timestamped state log) rather than observing from outside, or the tool's lag masquerades as an application bug.

### Observation 4: Synthetic keyboard events without keyCode silently fail against canvas game engines

**Date:** 2026-07-07
**Session context:** Verifying rewritten car physics in a Phaser driving game via browser eval
**Skill:** verify (system skill — route to complementary skill if actioned)
**Type:** open-source
**Phase/Area:** Browser verification of games / canvas apps

**Issue:** `new KeyboardEvent('keydown', {code, key})` dispatched to window was ignored by the game engine (Phaser keys off legacy `keyCode`), producing "distance 0" and a false signal that the new physics were broken. Patching `keyCode` via Object.defineProperty made the same test pass.

**Suggested improvement:** When driving an app through synthetic input during verification, first prove the input channel is received (a movement/state delta from a known-good baseline) before attributing failures to the code under test. For keyboard events include legacy keyCode/which.

**Principle:** A failed verification has two suspects — the code and the test harness. Confirm the harness's stimulus actually lands before debugging the application.

### Observation 5: Browser image cache masks regenerated-asset fixes during verification

**Date:** 2026-07-08
**Session context:** Cleaning checkerboard artifacts out of a PNG asset and verifying the fix in the browser preview
**Skill:** verify (system skill — route to complementary skill if actioned)
**Type:** open-source
**Phase/Area:** Browser verification of static asset changes

**Issue:** After regenerating an image asset, page reloads and even a dev-server restart + optimizer-cache purge kept showing the old image in screenshots. The server was serving clean bytes all along (verified by decoding a cache-bypassed fetch); the <img> element painted from the browser HTTP cache because its URL was unchanged. Several diagnostic loops were spent suspecting server-side caches.

**Suggested improvement:** When verifying a regenerated static asset, verify at the bytes level first (fetch with cache:'reload' and decode/sample pixels), and force the DOM element to repaint with a cache-busting query param. Screenshot only after that. Don't infer staleness from response size without an old-size baseline.

**Principle:** Asset verification has three cache layers (server, optimizer, browser element); prove which layer serves stale content before purging any of them — and a "same output" signal is only meaningful against a recorded baseline.

### Observation 6: Idle game entities die before a visual can be captured

**Date:** 2026-07-09
**Session context:** Verifying nitro flames / drift smoke in Phaser games via the preview harness
**Skill:** verify (system skill — route to complementary skill if actioned)
**Type:** open-source
**Phase/Area:** Browser verification of live/auto-advancing games

**Issue:** Repeatedly tried to screenshot a game effect (drift smoke, nitro flames) but the player entity kept dying while idle (a hazard reached the stationary player), so screenshots caught the death overlay instead of the effect. Wasted several cycles. State inspection via a dev scene hook (reading emitter.emitting, energy drain, positions) proved the mechanic worked far more reliably than screenshots.

**Suggested improvement:** For continuously-advancing games, prefer asserting on engine state through a dev-only scene hook (window.__scene = this in dev) over screenshots for mechanics that require the player to survive. Reserve screenshots for static/menu states, or first freeze the world (pause hazards / set invuln) before capturing.

**Principle:** When the system under test advances on its own clock, snapshot tools race the simulation; instrument the state instead of racing it, or halt the clock before observing.

### Observation 7: DOM-snapshot mirrors of React/Next.js sites cannot rehydrate

**Status:** OPEN
**Date:** 2026-07-10
**Session context:** Previewing an offline mirror of a Next.js terminal-portfolio site; all buttons/inputs were dead despite zero console errors and all assets returning 200.
**Skill:** New skill candidate: offline-site-repair (or fold into a debugging skill)
**Type:** open-source
**Phase/Area:** Diagnosis of dead interactivity in saved/mirrored SPA pages

**Issue:** An offline mirror saved the post-hydration DOM snapshot (telltale: `<next-route-announcer>` in the HTML) instead of the raw server HTML. React silently suspends and never hydrates — no errors, no failed requests, making it look like nothing is wrong. Diagnostic chain that worked: check for React fiber keys on elements → check `__next_f` queue consumed vs. `window.next` absent → spot post-hydration artifacts in saved HTML → curl the live site's raw HTML and diff flight payloads (they were identical) → replace index.html with raw server HTML → full interactivity restored.

**Suggested improvement:** Capture as a checklist: (1) dead SPA + zero errors + all 200s ⇒ suspect hydration never ran; (2) grep saved HTML for post-hydration artifacts (next-route-announcer, mutated app state baked into markup); (3) fix = fetch raw server HTML (curl, no JS) and keep the mirrored static assets.

**Principle:** "Save Page As"-style mirrors of client-rendered apps capture the rendered output, not the bootable input. When hydration data (RSC flight payload) and chunks are intact, swapping in the raw server HTML is a one-file fix — no need to reconstruct the app.

### Observation 8: White-labeling a scraped site — find the source repo first, and 3D assets carry identity too

**Status:** OPEN
**Date:** 2026-07-10
**Session context:** White-labeling a terminal-portfolio site the user had only as a scraped static mirror (minified bundles, no server code).
**Skill:** New skill candidate: offline-site-repair (extends obs #7)
**Type:** open-source
**Phase/Area:** Codebase discovery before content replacement

**Issue:** The user believed they had "cloned a repository" but actually had a production-build mirror. Editing minified chunks would have been fragile and the API route (server code) was unrecoverable from the mirror. A 30-second GitHub API search on the original author's username found the real MIT-licensed source repo, making the whole task tractable. Separately: after replacing every text occurrence, the author's face/name still shipped in a GLB 3D model's embedded PNG texture — grep can't see identity data inside binary assets. Fixed by parsing the GLB (12-byte header + JSON chunk + BIN chunk), regenerating the texture with ImageMagick at identical dimensions/layout, and repacking all bufferViews with 4-byte alignment.

**Suggested improvement:** White-label checklist: (1) verify the artifact is source, not a build — if a build, search GitHub for the author's source repo and check its license before editing anything; (2) after text replacement, audit binary assets (GLB/GLTF textures, images, favicons, OG images, PWA manifest icons) for baked-in identity; (3) grep for the author across metadata layers separately: JSON-LD, OpenGraph, twitter cards, rss, llms.txt, manifest, robots — they duplicate the same identity in ~8 places.

**Principle:** Identity lives in three layers — text, metadata, and binary assets — and each needs its own sweep. And when handed a derived artifact (build output, mirror, export), the first move is locating the upstream source; an hour of clever patching loses to a minute of provenance hunting.

### Observation 9: Attached-file references don't always resolve at their literal path — check Trash and sibling repos

**Status:** OPEN
**Date:** 2026-07-11
**Session context:** User attached "@/home/superior/Downloads/SRINIVAS RC Resume.pdf" and said "I uploaded the profile img to the public folder." Neither was at the stated path: the resume had been moved to ~/.local/share/Trash/files/, and an earlier profile.jpg the user "uploaded" landed in the wrong repo (srinivas-portfolio/public instead of the actual project at Downloads/.../portfolio.sh/public).

**Suggested improvement:** When a referenced attachment isn't at its literal path, before asking the user, run a fallback search: (1) `find` the basename across ~/Downloads, ~/Desktop, ~/Documents; (2) check ~/.local/share/Trash/files/; (3) check sibling/parallel repos when the project has a same-named twin. Recover from Trash with a copy (not move) so the original stays. Only ask the user if all fallbacks miss.

**Principle:** A user's mental model of "where I put the file" is often wrong (trashed, downloaded-but-not-moved, saved to a look-alike directory). A 3-location mechanical search resolves most of these silently and beats a round-trip question.

### Observation 10: Global re-theme of a hardcoded-color codebase — script the sed, preserve semantic exceptions

**Status:** OPEN
**Date:** 2026-07-11
**Session context:** "Eradicate matrix green, replace with cyber blue" across a codebase that hardcodes Tailwind color classes (green-400 etc.) and hex values everywhere instead of CSS variables — ~17 files, 350+ occurrences.

**Suggested improvement:** For a global color swap with no theme tokens: (1) write ONE python/sed pass with an explicit old→new map for both Tailwind classes (green-400→cyan-400, green-800→cyan-800…) and raw hex/rgba; (2) enumerate SEMANTIC exceptions that must NOT change — traffic-light window dots (red/yellow/green), error-state reds, brand/flag colors — and restore them after the blanket pass; (3) finish with a grep sweep for stragglers (green-100/200, inline style hex, rgba tuples the class-map missed). Verify computed colors in-browser (getComputedStyle returns lab()/rgb, so assert on distinct values, not names).

**Principle:** A codebase without design tokens makes re-theming a search-and-replace problem, not a config change. The reliable pattern is blanket-map → restore-semantic-exceptions → grep-for-stragglers, because the danger isn't the 350 mechanical swaps — it's the 3 colors that carried meaning (status, brand) and should have survived.

### Observation 11: AnimatePresence mode="sync" reflow — reveal panel drops then rises

**Status:** OPEN
**Date:** 2026-07-23
**Session context:** Portfolio Loot Vault (CS2-style case opening). User reported "after opening the case it goes down and then comes up to the right position."
**Skill:** verify / frontend-design (motion)
**Type:** open-source
**Phase/Area:** Diagnosing layout shift in multi-phase animated UI

**Issue:** Three phase panels (idle/spinning/reveal) rendered as normal-flow siblings inside one AnimatePresence with the default mode="sync". During the SPINNING→REVEAL crossfade both panels are mounted simultaneously; the entering reveal card sat BELOW the still-exiting roulette strip in flow, then jumped up when the strip unmounted — read by the user as "drops then rises." Verified the fix by sampling the reveal card's getBoundingClientRect().top every frame via rAF for 9s: after the fix, top was stable at 316px across all 316 samples (range 0).

**Suggested improvement:** When AnimatePresence must keep mode="sync" (to avoid the blank gap of mode="wait"), stack the presence children in a single CSS grid cell (`display:grid` on the wrapper, `grid-area:1/1` on each child, plus `self-center`) so the outgoing and incoming panels OVERLAP instead of stacking in flow. Absolute positioning also overlaps but collapses the wrapper to 0 height; grid keeps the wrapper sized to the tallest child.

**Principle:** A visible "jump to final position" at the end of a transition is usually a flow-reflow artifact, not an animation-curve problem — two presence siblings coexisting in normal flow push each other. Overlapping them in one grid cell removes the reflow without changing the crossfade. And per-frame rAF sampling of a bounding rect is the reliable way to prove a position is stable, since a single screenshot can't distinguish "never moved" from "already settled."

### Observation 12: "Make it pro" QA — the highest-impact finding was placeholder CONTENT, not code

**Status:** OPEN
**Date:** 2026-07-23
**Session context:** Owner asked for a from-scratch QA pass — "make everything buttery smooth, buttons/animations pro." Portfolio was functionally clean (all routes 200, no errors, responsive, consistent motion.button+whileTap).
**Skill:** verify / impeccable
**Type:** open-source
**Phase/Area:** Prioritising a broad "polish everything" request

**Issue:** The instinct on a "make it pro" request is to tweak animations/buttons. But the app's buttons/animations were already consistent and on-brand; manufacturing changes would have risked regressions (reinvention = slop). The single highest-impact issue was that the live Projects page still shipped PLACEHOLDER content (content/projects.md literally said "[PLACEHOLDER]"). Separately, the content-sourced seed upserted-by-slug without pruning, so replacing the content file would have left the 4 stale placeholder rows alongside the 3 real ones (7 total). Fixed by adding a prune (deleteMany where slug notIn currentSlugs) so the DB mirrors the source file.

**Suggested improvement:** On a broad "polish/make it pro" request, run a content-vs-chrome triage FIRST: grep the repo/DB for placeholder/lorem/TODO content before touching styling — shipping filler on a portfolio outweighs any micro-animation. And any seed that treats a content file as source-of-truth must prune rows absent from the file, not just upsert; upsert-only silently accumulates stale records across content edits.

**Principle:** "Make it look pro" is often satisfied by fixing what the interface SAYS, not how it animates. Verify the content is real before polishing the chrome. And "sync from a source file" means upsert + prune — an upsert-only sync is a one-way accumulator that drifts from its source.

### Observation 13: A "wow" entry animation needs a display floor, or cached loads flash it in ~100ms

**Status:** OPEN
**Date:** 2026-07-24
**Session context:** Added an Arc-Reactor boot animation to an existing first-load screen that dismissed the instant critical assets (image + fonts) resolved.
**Skill:** verify / frontend-design (motion)
**Type:** open-source
**Phase/Area:** Building + verifying intro/loader animations

**Issue:** On localhost (cached assets) the loader dismissed in ~100ms, so the new boot animation was never actually seen — and was impossible to screenshot. Two compounding traps: (1) the feature is pointless without a minimum display time, and (2) screenshot latency (~1s) meant even a correctly-timed sleep landed after a sub-second loader had gone. Fix: add a display floor (min 1.8s, gated off for reduced motion) raced under the existing fail-open cap. For verification, an escape hatch (sessionStorage flag that suppresses auto-dismiss) held the loader open so it could be captured deterministically regardless of latency. Also hit stale-bundle confusion: HMR/dev-server served pre-edit code across reloads until a full server restart.

**Suggested improvement:** When building an intro/boot animation gated on asset readiness, always add a minimum-display floor (~1.5-2.5s) under the fail-open cap, and skip it for prefers-reduced-motion. To verify time-boxed UI, add a temporary hold flag (sessionStorage-keyed so it survives navigation) rather than fighting screenshot latency; remove it before shipping. When dev changes "don't seem to apply," suspect a stale compiled bundle and restart the server before debugging logic.

**Principle:** An animation that plays faster than it can be perceived is a non-feature — readiness-gated intros need a perceptual floor, not just a ceiling. And verification tooling has its own latency; for sub-second UI, make the state hold still (a deterministic hold hook) instead of trying to catch it mid-flight.

### Observation 14: "My deployment isn't showing changes" — verify the build ran before assuming a code/branch bug

**Status:** OPEN
**Date:** 2026-07-24
**Session context:** User insisted their Vercel deployment wasn't loading their changes and asked to "push it so it deploys." The instinct is to suspect a wrong-branch config or a build failure.
**Skill:** systematic-debugging / verify
**Type:** open-source
**Phase/Area:** Diagnosing "deployment not updating" complaints

**Issue:** The deployment was actually fine. Two fast, authoritative checks settled it without any Vercel dashboard access: (1) WebFetch the live URL and diff a known-recent string (the rewritten hero copy) — it was present, proving the production branch was the working branch, not the stale donor `main`; (2) `gh api repos/OWNER/REPO/commits/SHA/status` and `.../deployments` showed every recent commit as state=success in the Production environment, and the just-pushed commit as "pending" (building). The real cause of "not loaded" was a once-per-session intro animation gated on sessionStorage — a normal revisit skips it, which reads as "my change didn't deploy."

**Suggested improvement:** For any "deployment isn't updating" report, before touching code or branch config: (a) fetch the live URL and grep for a string only the new code has; (b) query the platform's commit-status / deployments API via gh to confirm the commit built and to which environment. Only if those show a real failure should you dig into build logs or branch settings. And remember sessionStorage/localStorage-gated one-time UI (intros, onboarding, cookie banners) looks "gone" on revisit — test it in a fresh/incognito context.

**Principle:** "It didn't deploy" is a hypothesis, not a fact — confirm the artifact is live before changing anything. The live URL plus the platform's deployment API are the ground truth, and both are reachable without dashboard access. Once-per-session UI is the most common false alarm behind "my change disappeared."
