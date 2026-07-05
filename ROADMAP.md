# ROADMAP.md — Build Phases
Rule: one phase per session. Verify in browser → commit → push → tick the box. Full prompts live in MASTER-PLAYBOOK.pdf (owner pastes them one at a time).

- [x] **Phase 1 — Database:** SQLite → Neon Postgres via Prisma. 3 API routes rewritten, same JSON contracts.
- [ ] **Phase 2 — Dead code purge:** duplicate CaseOpening, unreachable GameFeature/GamifiedOverlay, stray imports/dirs.
- [ ] **Phase 3 — Spider-Man to spec:** trim script, entry drop (1.png), 7-image carousel, web line, hammock scroll reveal.
- [ ] **Phase 4 — Interaction QA:** whileTap everywhere, modal behavior (X/outside/Escape), reduced-motion, zero `any`.
- [ ] **Phase 5 — Projects, real:** Project model + API + seed 4 real projects, detail page (short vs long info), admin persistence.
- [x] **Phase 6 — Documents & certs:** R2 presigned uploads, react-pdf viewer w/ ←→, certifications from DB + admin upload.
- [ ] **🚀 DEPLOY CHECKPOINT:** Vercel live, URL on resume. Same day Phase 6 passes.
- [ ] **Phase 7 — Visitor auth:** guest (localStorage) vs registered (email/password, bcrypt 12, jose JWT). No OAuth in v1.
- [ ] **Phase 8 — Gated downloads:** pdf-lib watermark + footer stamp, DownloadLog + estimatedCompany (port RecruiterTracker from `main`), register-to-download modal, rate limits.
- [ ] **Phase 9 — Nav & feedback:** /api/feedback + admin inbox, visited-✓ menu marks, scroll-to-top, real last-updated stamp.
- [ ] **Phase 10 — Game + hero videos:** Phaser driving game complete w/ unlock popups, joystick, minimap, GameSession logs; record 10s demos; hero popup cards.
- [ ] **Phase 11 — AI chatbot:** "Ask AI abt me", grounded strictly in content/, rate-limited.

## Owner content checklist (blocks Phases 5–6 if empty)
`content/about.md` · `content/projects.md` (4 projects: short 1–2 lines + long markdown each) · `content/education.md` · `content/experience.md` · `content/achievements.md` · `content/resume.pdf` · `content/cv.pdf` · `content/certificates/*.png|jpg` (+ name & year each) · `content/profile.jpg`
