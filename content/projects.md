# ArchAgent — AI Architectural Design Platform
short: Turns plain-text design briefs into 3D renders, panoramic views, and itemised cost estimates through a 4-stage Google Gemini pipeline.
github: https://github.com/srinivas-rc0408/ArchAgent---Agentic-AI
tags: React, TypeScript, Google Gemini, Hugging Face FLUX, Three.js, Supabase

## Overview
An agentic AI platform that turns a plain-text design brief into 3D renders, panoramic views, and itemised cost estimates through a four-stage Google Gemini prompt-chaining pipeline.

## Highlights
- Built a 4-stage Google Gemini prompt-chaining pipeline that converts text design briefs into 3D renders, panoramic views, and itemised cost estimates.
- Combined two AI models — Google Gemini for design reasoning and Hugging Face FLUX for image generation — with an interactive Three.js 3D viewer, plus Supabase login and project storage.
- Fixed inaccurate cost estimates (LLM hallucinations) using few-shot prompting grounded in real INR price examples, and added one-click PDF report export with jsPDF.

**Tech:** React · TypeScript · Google Gemini · Hugging Face FLUX · Three.js · Supabase
_Apr – Jun 2026_

# AI Travel Planner
short: Builds personalised, day-by-day itineraries from just a destination, budget, and preferences — every stop mapped live.
github: https://github.com/srinivas-rc0408/AI-travel-planner-final
tags: React, Vite, Firebase, Google Gemini, Google Places API, React Leaflet

## Overview
An AI travel app that creates personalised, day-by-day itineraries from three inputs — destination, budget, and preferences — using structured JSON prompts with Google Gemini.

## Highlights
- Generated day-by-day itineraries from three inputs (destination, budget, preferences) using structured JSON prompts with Google Gemini.
- Integrated four Google services (Gemini, OAuth, Places API, Firebase Firestore) for secure sign-in, live location data, and trips saved across sessions.
- Plotted every recommended stop on interactive React Leaflet maps with live destination imagery.

**Tech:** React · Vite · Firebase · Google Gemini · Google Places API · React Leaflet
_Jun 2026_

# AI Finance Assistant
short: A personal-finance assistant with dashboard, portfolio, and transaction modules that answers finance questions with an LLM.
github: https://github.com/srinivas-rc0408/AI-Finance-Assistant
tags: Next.js, React, Prisma, Inngest, Tailwind CSS

## Overview
A personal-finance assistant built on Next.js with three modules — dashboard, portfolio, and transactions — that answers finance questions using prompt-engineered LLM responses.

## Highlights
- Built three modules (dashboard, portfolio, transactions) that answer finance questions with prompt-engineered LLM responses.
- Designed a relational Prisma database with 5+ models (accounts, transactions, stocks, portfolios) served through dedicated REST API endpoints.
- Used Inngest serverless functions to run background jobs asynchronously, keeping the dashboard responsive under load.

**Tech:** Next.js · React · Prisma · Inngest · Tailwind CSS
_2026_
