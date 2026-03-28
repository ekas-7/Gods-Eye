# Gods-Eye

> Discover people nearby by interest — 3D map view, node graph, AI matching.

---

## What it is

Gods-Eye is a proximity-aware, interest-driven people discovery platform for builders, founders, and creatives. It surfaces nearby people you'd actually want to meet — ranked by semantic alignment, not follower count.

Full product spec: [PRD.md](PRD.md)
Architecture decisions: [ARCH.md](ARCH.md)

---

## Current State

### Done
- Landing page (Hero, Search, Interlude, Solution, CTA sections)
- Auth via Clerk — redirects to `/discover` after sign-in/sign-up
- `/discover` page (protected, requires auth)
- 3D map view on `/discover` using MapLibre GL JS + OpenFreeMap tiles
  - Centered on user's real GPS location (browser geolocation)
  - 60° pitch, 3D building extrusions
  - Custom pulse marker at user position
  - No token or API key required

### In Progress / Not Started
- Onboarding flow (profile creation, interest input, intent signals)
- Embedding pipeline (bio → pgvector)
- Match feed (cosine similarity + PostGIS radius filter)
- Connection request flow
- Node graph view (react-force-graph + Neo4j)
- Privacy controls (visibility toggle, location granularity)

---

## Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router) + TypeScript |
| Styling | Tailwind CSS v4 |
| Animation | Framer Motion |
| Map | MapLibre GL JS + OpenFreeMap tiles (free, no token) |
| Auth | Clerk v7 |
| Primary DB | PostgreSQL + PostGIS + pgvector (Neon) |
| Graph DB | Neo4j AuraDB |
| AI matching | OpenAI `text-embedding-3-small` |
| Deployment | Vercel |

---

## Quick Start

```bash
cd frontend
npm install
cp .env.local.example .env.local   # fill in Clerk keys
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Environment variables

```env
# Required
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...

# Coming soon (not needed yet)
# DATABASE_URL=
# OPENAI_API_KEY=
```

No Mapbox token needed — the map uses OpenFreeMap which is free with no key.

---

## Project Structure

```
frontend/
├── app/
│   ├── page.tsx              # Landing page
│   ├── layout.tsx            # Root layout + ClerkProvider
│   ├── globals.css
│   └── discover/
│       └── page.tsx          # Protected map view (auth required)
├── components/
│   ├── map-view.tsx          # MapLibre GL 3D map, geolocation
│   ├── hero.tsx
│   ├── navbar.tsx
│   ├── search-section.tsx
│   ├── interlude-section.tsx
│   ├── solution-section.tsx
│   └── cta-section.tsx
├── hooks/
│   └── use-hls-video.ts
├── lib/
│   ├── animations.ts
│   └── utils.ts
└── middleware.ts             # Clerk auth middleware
```

---

## Build Phases

### Phase 0 — Landing + Waitlist
- [x] Landing page sections
- [x] Auth (Clerk) + redirect to /discover
- [x] 3D map view at user's location
- [ ] Email capture → stored in DB
- [ ] Basic analytics

### Phase 1 — Core Product
- [ ] Onboarding flow (profile, interests, intent, location)
- [ ] Embedding pipeline
- [ ] Match feed
- [ ] Globe/cluster layer on map
- [ ] Connection request flow
- [ ] Privacy controls

### Phase 2 — Polish
- [ ] Node graph view
- [ ] Mutual interest clusters
- [ ] Mobile polish
- [ ] Performance + caching
