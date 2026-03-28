# Gods-Eye — Architecture Document

**Version:** 1.0
**Date:** 2026-03-28
**Status:** Draft

---

## 1. System Overview

Gods-Eye is a proximity + interest-based people discovery platform. The architecture is split into four distinct layers:

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT                               │
│         Next.js App (React, TypeScript, Tailwind)           │
│    Mapbox GL JS (3D Globe)  │  react-force-graph (Network)  │
└─────────────────┬───────────────────────────────────────────┘
                  │ HTTPS / REST / WebSocket
┌─────────────────▼───────────────────────────────────────────┐
│                      API LAYER                              │
│              Next.js API Routes / Edge Functions            │
│         Auth Middleware  │  Rate Limiter  │  Geo Filter     │
└──────┬──────────┬────────────────┬────────────────┬─────────┘
       │          │                │                │
┌──────▼──┐ ┌────▼──────┐ ┌───────▼──────┐ ┌──────▼──────┐
│Postgres │ │  pgvector │ │    Neo4j     │ │  AI / LLM   │
│+PostGIS │ │(embeddings│ │ (graph layer)│ │  (matching) │
│(primary)│ │+ matching)│ │             │ │             │
└─────────┘ └───────────┘ └─────────────┘ └─────────────┘
```

---

## 2. Frontend Architecture

### Stack
| Tool | Purpose |
|---|---|
| Next.js 14+ (App Router) | Framework, routing, SSR/SSG |
| TypeScript | Type safety |
| Tailwind CSS | Styling |
| Framer Motion | Animations |
| MapLibre GL JS + OpenFreeMap | 3D map, geo clustering, map layers (no token required) |
| react-force-graph | Node graph visualization (Neo4j data) |
| SWR or React Query | Data fetching, caching, revalidation |
| Zustand | Lightweight client state (auth state, map state) |

### Page Structure
```
app/
├── (marketing)/
│   └── page.tsx              ← Landing page (Hero, Interlude, Solution, CTA)
├── (app)/
│   ├── onboarding/
│   │   └── page.tsx          ← Profile setup wizard
│   ├── discover/
│   │   ├── page.tsx          ← Globe view + match feed
│   │   └── [userId]/
│   │       └── page.tsx      ← Individual profile view
│   ├── graph/
│   │   └── page.tsx          ← Node graph / network view
│   └── settings/
│       └── page.tsx          ← Privacy, visibility, location controls
├── api/
│   ├── auth/[...]/route.ts
│   ├── users/route.ts
│   ├── matches/route.ts
│   ├── connections/route.ts
│   ├── globe/clusters/route.ts
│   └── graph/route.ts
```

### Globe Layer (Mapbox)
```
Mapbox GL JS — projection: 'globe'
    │
    ├── Layer 1: Base globe (dark theme, minimal labels)
    ├── Layer 2: Interest cluster dots (GeoJSON source, circle layer)
    │             — opacity varies by cluster density
    │             — color coded by dominant interest category
    ├── Layer 3: Pulse animation on hover (custom WebGL layer)
    └── Layer 4: User's own 10km radius ring (fill-extrusion or circle)

Data source: /api/globe/clusters
  → returns GeoJSON FeatureCollection
  → each feature = anonymized neighborhood centroid + interest tags + count
  → never returns individual user coordinates
```

### Node Graph Layer (react-force-graph)
```
react-force-graph-2d or 3d
    │
    ├── Nodes: users (avatar, name, top interest)
    ├── Edges: shared interests (weighted by number of mutual interests)
    └── Clusters: auto-grouped by dominant interest

Data source: /api/graph
  → returns { nodes: [], links: [] }
  → powered by Neo4j Cypher query
  → scoped to user's 10km radius + their connection network
```

---

## 3. Backend Architecture

### API Layer
- **Next.js API Routes** for all endpoints (collocated with frontend, simple deployment)
- **Middleware:** Auth check (Clerk JWT verification) on all `/api/(app)/*` routes
- **Rate limiting:** Upstash Redis — 100 req/min per user, 10 connection requests/day
- **Geo filter:** All queries hard-capped at 10km radius server-side (never trust client radius)

### Auth Flow
```
User lands on /onboarding
        ↓
Clerk handles auth (email OTP or OAuth)
        ↓
On first login → redirect to profile setup
        ↓
OAuth import options:
  [GitHub]  [LinkedIn]  [Instagram Basic Display]
        ↓
Pre-fill: name, bio, profile photo, interests
        ↓
User confirms + adds intent signals ("open to: collaboration")
        ↓
Bio embedded → stored in pgvector
Location captured (browser Geolocation API) → fuzzied → stored in PostGIS
        ↓
User is discoverable (if visibility = ON)
```

### OAuth Profile Import
| Provider | API | Data Pulled |
|---|---|---|
| GitHub | REST API v3 (no auth needed for public) | Bio, languages, pinned repos, location |
| LinkedIn | OAuth 2.0 + Profile API | Name, headline, location, photo |
| Instagram | Basic Display API | Bio, profile photo |

All imports require explicit user authorization. No scraping.

---

## 4. Database Architecture

### 4.1 PostgreSQL + PostGIS (Primary DB)

Handles: user data, auth, geo queries, session, waitlist

```sql
-- Core tables

users
  id            UUID PRIMARY KEY
  clerk_id      TEXT UNIQUE
  name          TEXT
  bio           TEXT
  building      TEXT          -- "what I'm working on"
  intent        TEXT[]        -- ['coffee', 'collab', 'mentorship']
  is_visible    BOOLEAN DEFAULT true
  is_synthetic  BOOLEAN DEFAULT false
  source        TEXT          -- 'organic' | 'github' | 'synthetic'
  created_at    TIMESTAMPTZ

locations
  user_id       UUID REFERENCES users(id)
  point         GEOGRAPHY(Point, 4326)   -- precise, server-only
  fuzzy_point   GEOGRAPHY(Point, 4326)   -- neighborhood centroid, served to clients
  updated_at    TIMESTAMPTZ

interests
  id            UUID PRIMARY KEY
  user_id       UUID REFERENCES users(id)
  tag           TEXT
  source        TEXT    -- 'manual' | 'github_language' | 'bio_extracted'

waitlist
  id            UUID PRIMARY KEY
  email         TEXT UNIQUE
  created_at    TIMESTAMPTZ

connections
  id            UUID PRIMARY KEY
  from_user     UUID REFERENCES users(id)
  to_user       UUID REFERENCES users(id)
  status        TEXT    -- 'pending' | 'accepted' | 'declined'
  note          TEXT
  created_at    TIMESTAMPTZ
```

**Key PostGIS query — nearby users within 10km:**
```sql
SELECT u.id, u.name, u.bio, l.fuzzy_point,
       ST_Distance(l.point, ST_MakePoint($lon, $lat)::geography) AS distance_m
FROM users u
JOIN locations l ON l.user_id = u.id
WHERE u.is_visible = true
  AND u.is_synthetic = false
  AND ST_DWithin(
        l.point,
        ST_MakePoint($lon, $lat)::geography,
        10000   -- hard 10km cap in meters
      )
ORDER BY distance_m ASC;
```

### 4.2 pgvector (Embeddings + Matching)

Lives as an extension on the same Postgres instance.

```sql
user_embeddings
  user_id       UUID REFERENCES users(id)
  embedding     VECTOR(1536)    -- OpenAI / Claude embedding dimension
  updated_at    TIMESTAMPTZ

-- Index for fast ANN search
CREATE INDEX ON user_embeddings
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);
```

**Key pgvector query — top matches by semantic similarity within radius:**
```sql
-- Step 1: get nearby user IDs via PostGIS (10km)
-- Step 2: rank by embedding cosine similarity

SELECT u.id, u.name, u.bio,
       1 - (e.embedding <=> $query_embedding) AS similarity
FROM user_embeddings e
JOIN users u ON u.id = e.user_id
WHERE u.id = ANY($nearby_user_ids)   -- pre-filtered by PostGIS
  AND u.is_visible = true
ORDER BY e.embedding <=> $query_embedding   -- cosine distance ASC
LIMIT 20;
```

### 4.3 Neo4j (Graph Layer)

Handles: connection graph, mutual interest traversal, network visualization

**Node types:**
```
(:User { id, name, bio })
(:Interest { tag })
(:City { name })
```

**Relationship types:**
```
(:User)-[:CONNECTED_TO]->(:User)          -- accepted connection
(:User)-[:INTERESTED_IN]->(:Interest)     -- interest tags
(:User)-[:LOCATED_IN]->(:City)            -- city-level only
(:Interest)-[:RELATED_TO]->(:Interest)    -- interest similarity graph
```

**Key Cypher queries:**

```cypher
// Friends-of-friends who share an interest
MATCH (me:User {id: $userId})-[:CONNECTED_TO*2]-(potential:User)
MATCH (potential)-[:INTERESTED_IN]->(i:Interest)<-[:INTERESTED_IN]-(me)
WHERE NOT (me)-[:CONNECTED_TO]-(potential)
RETURN potential, collect(i.tag) AS sharedInterests
LIMIT 10

// Shortest path between two users through shared interests
MATCH path = shortestPath(
  (a:User {id: $userA})-[:CONNECTED_TO|INTERESTED_IN*]-(b:User {id: $userB})
)
RETURN path

// Most connected interest clusters in a city
MATCH (u:User)-[:LOCATED_IN]->(:City {name: $city})
MATCH (u)-[:INTERESTED_IN]->(i:Interest)
RETURN i.tag, count(u) AS count
ORDER BY count DESC
LIMIT 10
```

**Sync strategy:** Neo4j is updated async (via background job) whenever:
- A connection is accepted (write to Postgres → trigger Neo4j sync)
- A user updates their interests
- A new user is created

PostgreSQL is always source of truth. Neo4j is a read-optimized projection.

---

## 5. AI Matching Pipeline

```
┌─────────────────────────────────────────────────────┐
│                  EMBEDDING PIPELINE                 │
│                                                     │
│  User bio + interests + what they're building       │
│                    ↓                                │
│  Concatenate into single text blob                  │
│  e.g. "Building a fintech app. Interested in:       │
│         React, distributed systems, design."        │
│                    ↓                                │
│  POST to embedding model                            │
│  (OpenAI text-embedding-3-small, 1536 dims)         │
│  or (Claude embeddings when available)              │
│                    ↓                                │
│  Store vector in pgvector (user_embeddings table)   │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│                  MATCHING PIPELINE                  │
│                                                     │
│  User opens match feed                              │
│                    ↓                                │
│  1. PostGIS: get all visible users within 10km      │
│                    ↓                                │
│  2. pgvector: cosine similarity against their       │
│     embeddings, ranked highest → lowest             │
│                    ↓                                │
│  3. Re-rank signals applied:                        │
│     - Intent match (both open to "collaboration")   │
│     - Recency (active in last 30 days boosted)      │
│     - Neo4j: mutual connections (small boost)       │
│                    ↓                                │
│  4. Return top 20 ranked profiles                   │
│     (fuzzy location only, never exact coords)       │
└─────────────────────────────────────────────────────┘
```

---

## 6. Data Seeding Pipeline (Cold Start)

```
┌─────────────────────────────────────────────────────┐
│               SEEDING PIPELINE (one-time)           │
│                                                     │
│  1. Pick launch city                                │
│                    ↓                                │
│  2. GitHub API pull                                 │
│     GET /search/users?q=location:{city}+repos:>5    │
│     Filter: must have bio, > 5 repos                │
│     Extract: name, bio, languages, location         │
│                    ↓                                │
│  3. Embed each profile bio                          │
│                    ↓                                │
│  4. Assign fuzzy coordinates within city bounds     │
│     (random point within city polygon, not exact)   │
│                    ↓                                │
│  5. Store in Postgres (is_synthetic=false,          │
│     source='github') + pgvector + Neo4j             │
│                    ↓                                │
│  6. Fill geo gaps with Claude-generated synthetic   │
│     profiles (is_synthetic=true)                    │
│                    ↓                                │
│  7. Real users onboard via OAuth → replace          │
│     synthetic profiles in their area                │
└─────────────────────────────────────────────────────┘
```

**OAuth import on onboarding:**
```
User signs up
    ↓
"Speed up your setup — connect a profile"
    [GitHub]  [LinkedIn]  [Instagram]
    ↓
GitHub: pulls bio, top languages, pinned repos
LinkedIn: pulls headline, location, photo
Instagram: pulls bio, photo
    ↓
Pre-fill profile form (user can edit before saving)
    ↓
Embed → store → discoverable
```

---

## 7. Privacy & Security Architecture

### Location Privacy
```
Browser Geolocation API → precise lat/lng
        ↓
Server receives precise coords
        ↓
Stored in locations.point (server-only, never sent to clients)
        ↓
Snap to neighborhood centroid grid (±500m–1km jitter)
        ↓
Stored in locations.fuzzy_point
        ↓
Only fuzzy_point ever leaves the server
```

### Visibility Model
- `is_visible = false` → user does not appear in any query, globe, or feed
- Pausing discovery: sets `is_visible = false`, preserves all data
- Deletion: hard delete all rows + Neo4j nodes + embeddings within 30 days

### API Security
- All app routes require valid Clerk JWT
- Geo queries always enforce 10km cap server-side — client cannot override
- Connection requests rate-limited: 10/day per user
- Profile views rate-limited: 100/day per user
- No endpoint exposes `locations.point` (precise coords) — only `fuzzy_point`

---

## 8. Infrastructure & Deployment

```
Vercel                        ← Next.js frontend + API routes
  │
  ├── Neon (Postgres)         ← Primary DB + PostGIS + pgvector
  ├── Neo4j AuraDB            ← Managed Neo4j cloud instance
  ├── Upstash Redis           ← Rate limiting + caching
  ├── Clerk                   ← Auth + OAuth
  └── OpenAI API              ← Embeddings
```

**Why this stack:**
- All managed services — no DevOps overhead for v1
- Neon is serverless Postgres with pgvector support built-in
- Neo4j AuraDB free tier covers v1 scale
- Vercel + Neon have a native integration (zero-config connection)

---

## 9. Key Architectural Decisions & Rationale

| Decision | Choice | Why |
|---|---|---|
| Postgres as primary DB | Yes | Relational data + PostGIS + pgvector in one place |
| Neo4j as secondary | Yes | Graph traversal Postgres can't do elegantly |
| Neo4j as source of truth | No | Postgres owns truth; Neo4j is a projection |
| MapLibre over Mapbox | MapLibre GL JS + OpenFreeMap | Same API, fully open source, no token or billing |
| Radius cap on client | No — server enforced | Client can lie; always enforce in SQL |
| Real-time location tracking | No | Privacy violation; passive update on app open only |
| Direct messaging in-app | No (v1) | Scope creep; use existing tools post-match |
| Scraping LinkedIn/Instagram | No | ToS violation; use OAuth import instead |
| Synthetic profiles visible | No | Flagged `is_synthetic=true`, excluded from all user-facing queries |

---

## 10. Open Technical Questions

1. **Embedding refresh** — when a user updates their bio, how quickly do we re-embed? Sync (slow onboarding) vs. async queue (stale for a few minutes)?
2. **Globe clustering** — use Mapbox's built-in `cluster` source property or server-side clustering (e.g. k-means on interest vectors) for richer interest-aware clusters?
3. **Neo4j sync lag** — acceptable to have ~1min eventual consistency for graph data? Or does the connection graph need to be real-time?
4. **Embedding model** — OpenAI `text-embedding-3-small` (cheap, fast) vs. `text-embedding-3-large` (higher quality)? Run an offline eval on sample bios before deciding.
5. **Fuzzy location granularity** — ±500m jitter or snap to fixed neighborhood grid? Grid is more predictable and harder to triangulate.
