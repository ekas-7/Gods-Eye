# Gods-Eye — Product Requirements Document

**Version:** 1.0
**Date:** 2026-03-28
**Status:** Draft

---

## 1. Problem Statement

Physical proximity and shared interest rarely overlap in a way people can act on. You walk past dozens of aligned people every day with no way to know they exist. Existing tools fail in distinct ways:

- **LinkedIn** — cold, transactional, professional-only
- **Dating apps** — narrow intent, gamified, exhausting
- **Twitter/X** — interest graph exists but no location layer
- **Meetup / events** — time-boxed, high friction, low signal

There is no tool that does all three: **proximity + interest + intent**.

---

## 2. Vision

> "Find the people near you who would change your life — before someone else does."

Gods-Eye is a proximity-aware, interest-driven people discovery platform. It uses a spatial globe view, a node-relationship graph, and AI-powered semantic matching to surface the most aligned people around you — with privacy as a first-class constraint.

---

## 3. Target User — v1 Focus

**Primary:** Builders, founders, and creatives who are actively working on something and want collaborators, mentors, or peers nearby.

**Why this segment first:**
- Comfortable with early-stage, rough products
- Clear and shareable value prop: "Find someone nearby building the same thing as you"
- Professional enough to reduce safety/liability risk
- Validates the matching infra before expanding to friendship/romance

**Secondary (v2+):** Friendships, romantic connections, recruiting

---

## 4. Core User Stories

### Discovery
- As a user, I want to see a globe/map of interest clusters near me so I can understand what kinds of people are around
- As a user, I want an AI-curated feed of people I'd likely vibe with, ranked by alignment — not follower count
- As a user, I want to filter by intent (open to: coffee chat / collaboration / mentorship) so I'm not wasting anyone's time

### Profile & Identity
- As a user, I want to describe myself in natural language (not just tags) so the AI can match me more accurately
- As a user, I want to control how visible I am and how precise my location appears to others
- As a user, I want to signal what I'm currently working on so potential collaborators can self-select

### Connection
- As a user, I want a low-friction way to express interest in meeting someone without it feeling creepy
- As a user, I want to see mutual interests visualized before I reach out so I have context for the conversation
- As a user, I want to see how I'm connected to someone (shared interests, mutual connections) in a graph view

---

## 5. Feature Scope

### v1 — Must Have

| Feature | Description |
|---|---|
| **User profile** | Name, bio (freeform), what you're building, interests, intent signals |
| **Interest embeddings** | Bio + interests embedded via AI for semantic matching |
| **Fuzzy location** | Neighborhood-level precision only — never exact address |
| **Globe / map view** | Anonymized interest clusters on an interactive globe; click to explore |
| **AI match feed** | Ranked list of nearby people by embedding cosine similarity |
| **Intent filters** | "Open to: coffee chats / co-founding / mentorship / side projects" |
| **Connection request** | Send a short note + request to connect; other user approves/declines |
| **Privacy controls** | Toggle visibility, pause discovery, control location granularity |
| **Waitlist + onboarding** | Email capture → onboarding flow → profile creation |

### v2 — Nice to Have

| Feature | Description |
|---|---|
| **Node graph view** | Your network rendered as an interactive relationship graph |
| **Mutual interest clustering** | "3 people near you are into Rust + startups" grouped cards |
| **Ambient presence** | Soft real-time signals — "active in your area this week" |
| **Friend/social mode** | Expand matching beyond builders to general friendships |
| **Events layer** | Surfaces local events where matched people are attending |

### Out of Scope (v1)
- Direct messaging / chat (use existing tools post-match)
- Public profiles / social feeds
- Romantic/dating matching
- Employer-facing recruiting tools
- Mobile app (web-first)

---

## 6. Technical Architecture

### Frontend (in progress)
- **Framework:** Next.js + TypeScript
- **Styling:** Tailwind CSS
- **Animation:** Framer Motion
- **Globe / Map:** Mapbox GL JS with `react-map-gl` — native 3D globe mode (`projection: 'globe'`), custom layers for cluster dots and interest heatmaps
- **Graph:** react-force-graph or D3.js — powered by Neo4j data

### Backend (to build)
- **Runtime:** Node.js (Next.js API routes) or separate service
- **Auth:** Clerk or NextAuth (email + OAuth)
- **Primary Database:** PostgreSQL + PostGIS (user profiles, auth, geo/proximity queries)
- **Vector store:** pgvector extension on Postgres (embeddings stored alongside user data)
- **Graph Database:** Neo4j (connections, mutual interests, network traversal — graph layer only)
- **Embeddings:** Claude API or OpenAI `text-embedding-3-small` for interest/bio embeddings

### Database Responsibility Split

| Layer | Database | Why |
|---|---|---|
| Users, profiles, auth | PostgreSQL | Relational data, battle-tested |
| Proximity / geo queries | PostgreSQL + PostGIS | Best-in-class radius queries |
| Interest embeddings + matching | pgvector (Postgres) | Cosine similarity at scale, co-located with user data |
| Connections + relationship graph | Neo4j | Graph traversal (friends-of-friends, interest clusters, shortest path) |
| Globe rendering | Mapbox GL JS | Native 3D globe, custom geo layers, better perf than Three.js for maps |

**Neo4j use cases specific to Gods-Eye:**
- "Who are the connections-of-connections of this user who share interest X?"
- "What's the shortest path between user A and user B through shared interests?"
- "Which interest clusters are most densely connected in this city?"

### AI Matching Pipeline
```
User bio + interests
       ↓
  Embedding model
       ↓
  pgvector store
       ↓
  Cosine similarity query (filtered by radius)
       ↓
  Ranked match feed
```

### Privacy / Geo Layer
- Store precise location server-side only
- Serve only neighborhood centroid to clients
- Location updates: passive (on app open) or opt-in live
- **Hard radius cap: 10km maximum** — no user-controlled expansion beyond this
- Rationale: keeps connections hyper-local and intentional; prevents the product becoming a broad social network

---

## 7. Matching Model — Design Decisions

| Decision | Choice | Reason |
|---|---|---|
| Interest input | Freeform text + optional tags | Freeform is richer for embeddings; tags help with cold-start |
| Embedding model | Claude or OpenAI `text-embedding-3-small` | Balance of quality and cost |
| Similarity metric | Cosine similarity on interest embeddings | Captures semantic alignment, not just keyword overlap |
| Location weight | Hard filter (radius), not soft ranking signal | Privacy — don't leak how close someone is |
| Re-ranking signals | Recency of activity, intent match, mutual connections | Prevents stale profiles dominating feed |

---

## 8. Privacy Principles

1. **Fuzzy-first** — location is always neighborhood-level or coarser on the client
2. **Opt-in visibility** — users are discoverable only when they explicitly turn it on
3. **No public profiles** — profiles are only visible to other authenticated users within radius
4. **Data minimalism** — collect only what's needed for matching; no behavioral tracking
5. **Right to disappear** — users can pause or delete their presence at any time

---

## 9. Pre-filled Data Strategy (Cold Start)

The globe and match feed must feel alive before real users exist. Strategy is layered:

### Primary — GitHub API (real builder profiles)
- Pull public profiles with `location` set to your launch city
- Extract: name, bio, top languages, pinned repos, website
- Embed bio + languages as interest vector
- Store with `source: 'github'`, `is_synthetic: false`
- GitHub API free tier: 5,000 req/hr — enough to seed hundreds of profiles per city
- **Filter:** only pull accounts with > 5 public repos and a written bio (quality signal)

### Secondary — Synthetic Profiles via Claude API
- Generate realistic builder personas: name, bio, what they're building, interest tags, coordinates within 10km of city center
- Embed and store identically to real profiles
- Flag as `is_synthetic: true` internally — never shown to users
- Swap out progressively as real users join and hit the same area
- Use for: filling geographic gaps where GitHub pull is sparse

### Tertiary — Waitlist Onboarding
- On signup, offer "import from GitHub" — pre-fills bio, languages, repos
- Lowers onboarding friction and seeds real data immediately
- OAuth with GitHub = verified identity + instant interest embedding

### Data Pipeline (seeding order)
```
1. Pick launch city (one city, go deep — not broad)
        ↓
2. Pull GitHub profiles within city → embed → store in Postgres + Neo4j
        ↓
3. Generate synthetic profiles to fill 10km radius gaps
        ↓
4. Waitlist users onboard → replace synthetic profiles in their area
        ↓
5. Organic growth — synthetic profiles fully phased out
```

### Launch City Recommendation
Pick a city with a dense builder community: Bangalore, San Francisco, London, or Berlin. Aim for 200–300 seeded profiles before opening waitlist invites.

---

## 10. Success Metrics — v1

| Metric | Target |
|---|---|
| Waitlist signups | 500 before launch |
| Profile completion rate | > 70% of signups complete a full profile |
| Match relevance (self-reported) | > 60% of users say their top 5 matches felt relevant |
| Connection request rate | > 20% of users send at least one request in first week |
| Week-1 retention | > 40% return within 7 days of onboarding |

---

## 11. Open Questions

1. **Globe UX** — are dots on the globe real anonymized users or synthetic cluster representations? Real is more compelling but harder to protect.
2. **Cold start** — how do we make the experience feel alive with < 100 users in a city? Consider seeding with synthetic profiles or invite-only cohorts.
3. **Abuse / safety** — what prevents misuse (stalking, spam)? Rate limiting on connection requests + report flow needed from day one.
4. **Name tension** — "Gods-Eye" implies surveillance; "privacy-first" says the opposite. Worth resolving in brand positioning before launch.
5. **Monetization** — freemium (limited matches/day), subscription (unlimited + graph), or B2B (team discovery)? Decide before v2.

---

## 12. Build Phases

### Phase 0 — Now (Landing + Waitlist)
- [x] Landing page with hero, interlude, solution, search, CTA sections
- [x] Auth via Clerk — post-auth redirect to /discover
- [x] /discover route (protected) with MapLibre GL 3D map at user's real location
- [ ] Working email capture → stored in DB
- [ ] Basic analytics (page views, conversion rate)

### Phase 1 — Core Product (v1)
- [ ] Onboarding flow (profile, interests, intent, fuzzy location)
- [ ] Profile creation (bio, interests, intent, fuzzy location)
- [ ] Embedding pipeline (bio → vector → pgvector)
- [ ] Match feed (cosine similarity, radius filter)
- [ ] Globe/cluster layer on map (anonymized interest clusters)
- [ ] Connection request flow
- [ ] Privacy controls

### Phase 2 — Polish + Expand
- [ ] Node graph view
- [ ] Mutual interest clusters
- [ ] Mobile-responsive polish
- [ ] Expand to friendship use case
- [ ] Performance + scale (caching, CDN, DB indices)
