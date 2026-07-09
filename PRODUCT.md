# Product

## Register

brand

Note: the public portfolio is brand register (design IS the product). The `/admin` dashboard and auth flows are a separate, product-register utility surface — override register to `product` when working specifically inside `app/admin` or `src/components/admin`.

## Users

Primary audience: recruiters and hiring managers evaluating Srinivas for engineering roles. Their context: skimming many candidates quickly, looking for a fast read on technical credibility and a reason to remember this candidate over others. Secondary audience: developer peers and technical community members assessing craft.

## Product Purpose

A personal portfolio for Srinivas R C, an aspiring AI engineer building agentic systems and full-stack applications (based in Bengaluru, Karnataka). It exists to land interviews and job offers by demonstrating shipped technical depth while standing out from generic dev-portfolio templates. Success looks like: a recruiter remembers this site specifically and takes a next action (reach out, forward internally, book a call).

## Brand Personality

Bold, playful, technical. Dark near-black surface (#050508) with red-600 glow accents signals confidence and edge rather than safety. Game mechanics (case-opening/loot reveal, rewards, spring-physics hero drops, a dedicated Game page) express technical playfulness — the site itself is a demo of engineering craft, not just a description of it.

## Anti-references

- Generic templated developer-portfolio look (stock hero + bullet list of skills + boilerplate About section)
- Overly corporate / stiff agency aesthetics that would undercut the bold/playful direction

## Design Principles

1. **Show, don't tell** — project depth and interactive mechanics (the game, case opening, rewards) should demonstrate technical skill directly rather than asserting it in prose.
2. **Memorable over safe** — lean into the game-mechanic differentiation; don't sand it down toward generic-portfolio conventions.
3. **Credibility still wins** — the playful surface must never read as undercutting real, shippable engineering underneath it; polish and correctness are non-negotiable even where the tone is playful.
4. **Respect the visitor's time and senses** — heavy animation (slideshow, glow pulse, case opening) needs reduced-motion handling and clear escape hatches, especially for an audience skimming quickly.

## Accessibility & Inclusion

WCAG AA baseline. Honor `prefers-reduced-motion` for animation-heavy elements (hero slideshow/drop, glow-pulse, case-opening reveal). Ensure keyboard navigability through game and admin interactions, not just mouse/touch.
