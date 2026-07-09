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
