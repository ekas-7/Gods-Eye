# 👁️ God Eye

> Discover people nearby by interest — globe view, node graph, AI matching.

## Stack
- **Frontend**: Next.js 14 (App Router) + Three.js/globe.gl + D3 force graph
- **Database**: Neo4j (graph DB)
- **AI**: OpenAI embeddings + cosine similarity matching
- **Auth**: NextAuth.js
- **Styling**: Tailwind CSS + Framer Motion

---

## Quick Start

### 1. Install dependencies
```bash
npm install
```

### 2. Set up environment variables
```bash
cp .env.local.example .env.local
# Fill in: NEO4J_URI, NEO4J_PASSWORD, OPENAI_API_KEY, NEXTAUTH_SECRET
```

### 3. Start Neo4j
```bash
# Option A: Docker
docker run -p 7474:7474 -p 7687:7687 \
  -e NEO4J_AUTH=neo4j/yourpassword \
  neo4j:5

# Option B: Neo4j Desktop (download from neo4j.com)
```

### 4. Set up the database schema
```bash
npx ts-node scripts/setup-db.ts
```

### 5. Run the dev server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── auth/onboard/     # POST: create user + embed
│   │   ├── match/            # GET: AI-ranked nearby matches
│   │   ├── users/            # GET: users in zone (for globe)
│   │   ├── interests/        # GET/POST: interest management
│   │   └── graph/            # GET: graph data for D3
│   ├── globe/                # 3D globe page
│   ├── graph/                # Node graph page
│   ├── profile/              # User profile page
│   └── onboarding/           # Signup flow
├── components/
│   ├── globe/                # Three.js / globe.gl components
│   ├── graph/                # D3 force graph components
│   ├── profile/              # Profile cards, match cards
│   └── ui/                   # Shared UI (buttons, modals, etc.)
├── lib/
│   ├── neo4j/
│   │   ├── driver.ts         # Neo4j singleton + runQuery helper
│   │   └── queries.ts        # All Cypher queries
│   ├── ai/
│   │   └── matching.ts       # Embeddings + cosine similarity
│   └── location.ts           # Zone bucketing + distance utils
├── hooks/                    # React hooks (useGlobe, useMatch, etc.)
├── types/                    # TypeScript interfaces
└── styles/                   # Global CSS
```

## Privacy Design
- **No exact GPS stored** — coordinates bucketed to ~2km zones
- **Opt-in discovery** — users must complete onboarding to appear
- **Mutual interest gate** — profile revealed only after mutual match
- **Data deletion** — users can delete their node + all relationships

## Next Steps
1. Build the 3D Globe component (`src/components/globe/`)
2. Build the D3 node graph (`src/components/graph/`)
3. Build onboarding flow (`src/app/onboarding/`)
4. Add real-time with WebSockets or Supabase Realtime
