# Gods-Eye — Data & Matching Pipeline

## Overview

Scraped profiles exist only to make the app feel alive on day 1. Real users are the product.

```
Scraped profiles → map looks populated on launch
Real user signs up → sees populated map + gets matches
Real user creates profile → becomes discoverable
More real users join → scraped profiles phase out
```

Scraped profiles can never receive connection requests. They exist as read-only seeds until a real user signs up and claims that identity (e.g. same Instagram handle → merge + promote to real user).

---

## Layer 1 — Natural Language Matching Engine

The core feature. A user describes who they want in plain English and gets ranked nearby profiles back.

```
User types: "someone into hiking, speaks Hindi, creative type"
        ↓
Embed query (OpenAI text-embedding-3-small)
        ↓
PostGIS: filter all visible profiles within 10km radius
        ↓
pgvector: cosine similarity between query embedding
          and all profile embeddings in that radius
        ↓
Re-rank by: intent match, recency, mutual connections
        ↓
Return top 20 ranked profiles (fuzzy location only)
```

Every profile is embedded once on ingest. The natural language query is embedded at search time. Same pipeline regardless of whether the profile came from GitHub, Instagram, or organic signup.

### Embedding input format
```
"{name}. {bio}. Interests: {interests}. Building: {what_building}."
```

Example:
```
"Aryan Kapoor. Designer turned founder, obsessed with minimal
interfaces and long runs. Interests: design systems, trail running,
Hindi music, startups. Building: a productivity app for async teams."
```

---

## Layer 2 — Profile Sources (Cold Start)

**Launch city: Bangalore**

The goal is a cross-section of actual people — not just developers. Bangalore has dense, active communities across all four sources below.

### Reddit — priority 1
- Public API: `reddit.com/user/[username]/about.json` — no scraping needed
- Target subreddits for Bangalore users:
  - `r/bangalore` — general city community, all types of people
  - `r/BangaloreSocial` — explicitly social/meetup intent
  - `r/india` — filter by users who post in Bangalore threads
- User post + comment history → rich interest signal
- Username → flair, bio, post topics → embed as interest vector
- No login required for public data
- Covers: normal people, students, professionals, creatives

### Meetup.com — priority 2
- Playwright scraper on public group pages
- Target Bangalore groups:
  - Hiking & trekking groups
  - Photography walks
  - Language exchange (Hindi, Kannada, English)
  - Startup & entrepreneur meetups
  - Art & music communities
  - Book clubs
- Group memberships = explicit interest tags handed to you
- City is always known
- Attendee name + bio + avatar visible on public event pages
- Covers: non-developers, high real-world intent

### GitHub API — priority 3
- Public REST API, no scraping needed
- `GET /search/users?q=location:Bangalore+repos:>5`
- Filter: written bio + >5 repos
- Covers: builder/founder segment only

### Quora — priority 4
- Public profiles with detailed bios
- "Knows about: photography, Bangalore food scene, indie music"
- City field often filled in
- Playwright scraper on public profile pages
- Covers: professionals, domain experts, opinionated people

### What we're NOT doing (yet)
- Instagram — aggressive bot detection, login walls, defer post-launch
- LinkedIn — ToS + legal risk, not worth it for v1
- Devfolio — too developer-focused, replaced by Reddit + Meetup

---

### Scraped profile schema
```ts
{
  name: string
  bio: string
  interests: string[]        // extracted from bio, group memberships, post history
  avatar_url: string
  source: 'reddit' | 'meetup' | 'github' | 'quora'
  source_url: string         // original profile URL
  location_city: string      // always 'bangalore' for launch
  fuzzy_point: Geography     // snapped to neighborhood grid within BLR polygon
  is_real_user: false        // never connectable until claimed
  is_synthetic: false
  embedding: Vector(1536)    // embedded on ingest
}
```

### Bangalore city polygon (bounding box for fuzzy coord assignment)
```
North: 13.1400° N
South: 12.8340° N
East:  77.7800° E
West:  77.4600° E
```
Fuzzy coords snapped to a 1km neighborhood grid — not random — so clusters look natural on the map.

---

## Layer 2b — Within-City Location Assignment (Scraped Profiles)

Scraped profiles have no real GPS. You know they're in Bangalore from the scraping filter. The problem is **where within Bangalore** to place them.

Location is resolved in priority order — first signal that hits wins.

### Priority 1 — Neighborhood extraction from text

Scan bio + post history + comments for known Bangalore neighborhood names. Reddit is the richest source — people constantly mention their area.

```
"Just moved to Indiranagar, looking for weekend hiking groups"
→ neighborhood: Indiranagar → centroid: (12.9784, 77.6408)

"Anyone in Koramangala want to grab coffee?"
→ neighborhood: Koramangala → centroid: (12.9352, 77.6245)
```

Full neighborhood → centroid lookup table lives in `scraper/utils/geo.ts`:

```
Koramangala      → 12.9352, 77.6245
Indiranagar      → 12.9784, 77.6408
HSR Layout       → 12.9116, 77.6389
Whitefield       → 12.9698, 77.7499
Jayanagar        → 12.9308, 77.5838
Malleswaram      → 13.0035, 77.5673
JP Nagar         → 12.9102, 77.5857
Marathahalli     → 12.9591, 77.7006
BTM Layout       → 12.9166, 77.6101
Electronic City  → 12.8399, 77.6770
Hebbal           → 13.0350, 77.5970
Yelahanka        → 13.1007, 77.5963
Bannerghatta     → 12.8639, 77.5762
Rajajinagar      → 12.9907, 77.5530
Bellandur        → 12.9259, 77.6761
Sarjapur         → 12.8616, 77.7143
```

### Priority 2 — Meetup venue as ground truth

Meetup profiles have real event venue addresses. If a person attended multiple events, use the most frequent venue's neighborhood.

```
Attended: 4 events in Koramangala, 1 in Indiranagar
→ neighborhood: Koramangala
```

This is the most accurate signal available without real GPS.

### Priority 3 — Weighted random by population density

If no neighborhood signal found, don't use a plain random point. Weight placement by where young professionals in Bangalore actually live:

```ts
const BLR_DENSITY_WEIGHTS = [
  { neighborhood: "Koramangala",  weight: 0.12, centroid: [12.9352, 77.6245] },
  { neighborhood: "Indiranagar",  weight: 0.10, centroid: [12.9784, 77.6408] },
  { neighborhood: "HSR Layout",   weight: 0.10, centroid: [12.9116, 77.6389] },
  { neighborhood: "Whitefield",   weight: 0.09, centroid: [12.9698, 77.7499] },
  { neighborhood: "BTM Layout",   weight: 0.08, centroid: [12.9166, 77.6101] },
  { neighborhood: "Marathahalli", weight: 0.07, centroid: [12.9591, 77.7006] },
  { neighborhood: "JP Nagar",     weight: 0.07, centroid: [12.9102, 77.5857] },
  { neighborhood: "Jayanagar",    weight: 0.06, centroid: [12.9308, 77.5838] },
  { neighborhood: "Malleswaram",  weight: 0.06, centroid: [13.0035, 77.5673] },
  { neighborhood: "Electronic City", weight: 0.06, centroid: [12.8399, 77.6770] },
  { neighborhood: "Hebbal",       weight: 0.05, centroid: [13.0350, 77.5970] },
  { neighborhood: "Bellandur",    weight: 0.05, centroid: [12.9259, 77.6761] },
  { neighborhood: "Rajajinagar",  weight: 0.04, centroid: [12.9907, 77.5530] },
  { neighborhood: "Yelahanka",    weight: 0.03, centroid: [13.1007, 77.5963] },
  { neighborhood: "Sarjapur",     weight: 0.02, centroid: [12.8616, 77.7143] },
]
// weights sum to 1.0
```

### Final step — jitter

After coord assignment from any of the above methods, add ±300m random jitter so profiles don't stack on the same centroid point:

```ts
fuzzy_point = {
  lat: centroid.lat + (Math.random() - 0.5) * 0.005,  // ~±300m
  lng: centroid.lng + (Math.random() - 0.5) * 0.005,
}
```

### Full resolution flow

```
Scraped profile
      ↓
1. Scan bio + posts for neighborhood keywords
      ↓ found → use centroid + jitter → done
      ↓ not found
2. Meetup: most frequent event venue neighborhood
      ↓ found → use centroid + jitter → done
      ↓ not found
3. Weighted random by BLR population density + jitter
      ↓
Store as fuzzy_point (never exposed as precise coords)
```

### Map roles by location confidence

| Confidence | Source | Map treatment |
|---|---|---|
| High (neighborhood extracted) | Reddit mention / Meetup venue | Show as dot in correct area |
| Medium (density-weighted random) | No location signal | Show as dot, less trusted cluster |
| Real GPS | Actual user | Full profile marker |

Scraped profiles at any confidence level are **never connectable** and **never show name/photo on map** — only anonymous cluster dots.

---

## Layer 3 — Real User Onboarding

When a real user signs up they go through:

```
Auth (Clerk)
        ↓
"Describe yourself" — freeform natural language input
        ↓
Optional: import from GitHub or Instagram
  → pre-fills bio, interests, avatar
        ↓
Intent signals: open to [ coffee chat | collaboration | mentorship | dating | friendship ]
        ↓
Location captured via browser Geolocation API
  → precise coords stored server-side only
  → fuzzed to neighborhood centroid served to clients
        ↓
Bio embedded → stored in pgvector
        ↓
User is discoverable (is_visible = true by default)
```

### Identity merge (real user claiming a scraped profile)
If a scraped profile matches a signing-up user (same GitHub username, same Instagram handle, or high name+bio similarity) → merge records, promote `is_real_user` to `true`, preserve the embedding.

---

## Layer 4 — Cross-Platform Identity Resolution

The same person will appear across multiple sources — a GitHub user who also posts in r/bangalore and attends Meetup events. They must be collapsed into a single profile, not three separate seeds.

### How it works

```
All scraped profiles collected
        ↓
Deduplication pass (runs after all sources complete, before store.ts)
        ↓
For each profile pair, check signals in order:
  1. Exact match signals (definitive)
  2. Fuzzy match signals (probabilistic)
  3. Embedding similarity (fallback)
        ↓
If match confidence > threshold → merge into one canonical profile
        ↓
Merged profile inherits data from all sources
```

### Match signals

**Exact match (auto-merge, confidence = 1.0)**
- Same URL linked across profiles (e.g. GitHub link in Reddit bio, or personal website in both)
- Same username across platforms (e.g. `@pranav_k` on Reddit + `pranav_k` on GitHub)
- Same email (rare for scraped data, but possible on public profiles)

**Fuzzy match (flag for merge if 2+ signals hit)**
- Same full name + same city
- Same profile photo (perceptual hash comparison — pHash)
- Bio text similarity > 0.85 cosine similarity
- Same personal website or portfolio URL in any bio field

**Embedding similarity (last resort)**
- If two profiles from different sources have embedding cosine similarity > 0.92 → flag as probable duplicate for manual review
- Don't auto-merge on embedding alone — too many false positives

### Merge rules

When two profiles are merged:
```ts
{
  // Identity — take the richest
  name:      longest / most complete name wins
  avatar_url: prefer in order: GitHub > Reddit > Meetup > Quora
  bio:        concatenate all unique bios, re-embed the combined text

  // Interests — union of all sources
  interests: [...githubLanguages, ...redditSubreddits, ...meetupGroups]

  // Sources — keep all
  sources: ['github', 'reddit', 'meetup']   // was: source: 'github'
  source_urls: ['github.com/...', 'reddit.com/user/...']

  // Location — keep one fuzzy point, don't average
  fuzzy_point: first non-null fuzzy point found

  // Embedding — re-embed from merged bio + all interests
  embedding: embed(merged_bio + all_interests)
}
```

### Why re-embed after merge
A GitHub profile might say "Rust engineer, distributed systems."
The same person's Reddit history shows "photography, street food, indie music."
Combined embedding captures the full person — not just the professional face.

### Implementation

Runs as a step in the seeding pipeline:

```bash
# After all sources scraped, before store.ts
npx ts-node scraper/dedup.ts --input output/ --output output/merged-bangalore.json

# Then store the merged file
npx ts-node scraper/store.ts --file output/merged-bangalore.json
```

```
scraper/
├── dedup.ts    # cross-platform identity resolution
│               # exact match → auto merge
│               # fuzzy match → merge with flag
│               # embedding similarity → flag for review
└── phash.ts    # perceptual hash for avatar comparison
```

### Expected dedup rate
Across 950 raw profiles from 4 sources targeting the same city:
- Estimated 15–25% overlap (150–240 duplicate pairs)
- After dedup: ~700–800 unique canonical profiles for Bangalore launch

---

## Seeding Pipeline — Bangalore Launch

Target: **950 seeded profiles** across a diverse cross-section of Bangalore before opening waitlist.

```
1. Reddit scraper (300 profiles)
   → r/bangalore + r/BangaloreSocial users
   → filter: account age > 3mo, karma > 10
   → extract interests from bio + subreddit history
   → embed + write to output JSON
        ↓
2. GitHub API (300 profiles)
   → location:Bangalore repos:>5, must have bio
   → extract: bio, languages, pinned repos
   → embed + write to output JSON
        ↓
3. Meetup scraper (200 profiles)
   → Bangalore groups: hiking, photography, language exchange,
     startups, arts, book clubs
   → extract: name, bio, group memberships as interest tags
   → embed + write to output JSON
        ↓
4. Quora scraper (150 profiles)
   → users with city = Bangalore, detailed bios
   → embed + write to output JSON
        ↓
5. dedup.ts — cross-platform identity resolution
   → exact match: same username / URL → auto merge
   → fuzzy match: same name + city + photo hash → merge
   → embedding similarity > 0.92 → flag for manual review
   → re-embed merged profiles from combined bio + interests
   → output: merged-bangalore.json (~700-800 unique profiles)
        ↓
6. Manual review of merged JSON
   → spot check flagged duplicates, remove noise
        ↓
7. store.ts — ingest merged JSON into Postgres + pgvector
   → assign fuzzy BLR neighborhood coords
   → all profiles: is_real_user=false, is_synthetic=false
        ↓
8. Fill geographic gaps with Claude-generated synthetic profiles
   → is_synthetic: true, never shown to users
   → phased out as real users join
        ↓
9. Open waitlist + onboarding
   → real users replace seeds in their area
   → scraped profiles get claimed or age out after 90 days
```

---

## Build Order

| Step | What | Why first |
|---|---|---|
| 1 | Embedding + search pipeline | This is the actual product — everything else feeds into it |
| 2 | GitHub seeder script | Zero legal risk, best data quality, covers builder segment |
| 3 | Onboarding flow | Lets real users join and start replacing seeds |
| 4 | Instagram / Devfolio scraper | Volume + lifestyle data for non-builder profiles |
| 5 | Identity merge logic | Promotes scraped → real when user claims profile |

---

## Browser Automation Scraper

Playwright-based scraper for authentic profile data. Lives at `scraper/` in the repo root.

### Structure

```
scraper/
├── index.ts              # CLI entry point — run all sources or one
├── reddit.ts             # Reddit public API + profile scraper
├── meetup.ts             # Meetup.com group + attendee scraper
├── github.ts             # GitHub API seeder
├── quora.ts              # Quora public profile scraper
├── dedup.ts              # Cross-platform identity resolution
├── embed.ts              # Embed profiles via OpenAI
├── store.ts              # Write to Postgres + pgvector
├── utils/
│   ├── geo.ts            # Snap coords to BLR neighborhood grid
│   └── phash.ts          # Perceptual hash for avatar dedup
└── types.ts              # Shared profile schema
```

### Usage

```bash
# Run all sources for Bangalore
npx ts-node scraper/index.ts --city bangalore

# Run individual sources
npx ts-node scraper/index.ts --source reddit  --city bangalore --limit 300
npx ts-node scraper/index.ts --source meetup  --city bangalore --limit 200
npx ts-node scraper/index.ts --source github  --city bangalore --limit 300
npx ts-node scraper/index.ts --source quora   --city bangalore --limit 150

# Inspect output before writing to DB
npx ts-node scraper/index.ts --source reddit --city bangalore --dry-run

# Write collected JSON to DB
npx ts-node scraper/store.ts --file output/reddit-bangalore-2026-03-29.json
```

### Source summary

| Source | Method | Risk | Data quality | Target profiles (BLR) |
|---|---|---|---|---|
| Reddit | Public API | None | High | 300 |
| Meetup | Playwright | Low | High | 200 |
| GitHub | Official API | None | High | 300 |
| Quora | Playwright | Low | Medium | 150 |
| Instagram | Playwright | High | High | Deferred |

### Reddit scraper — how it works
```
1. Pull recent posts from r/bangalore, r/BangaloreSocial
2. Collect unique usernames from post authors + commenters
3. For each username:
   GET reddit.com/user/{username}/about.json  → name, bio, karma
   GET reddit.com/user/{username}/submitted.json → post titles (interest signal)
   GET reddit.com/user/{username}/comments.json → comment topics (interest signal)
4. Filter: account age > 3 months, comment karma > 10 (removes bots)
5. Extract interests from: bio + subreddits posted in + post titles
6. Assign fuzzy BLR coordinates
```

### Meetup scraper — how it works
```
1. Search meetup.com for Bangalore groups across categories:
   - Outdoors (hiking, trekking, cycling)
   - Social (language exchange, board games, book clubs)
   - Tech (startups, design, AI)
   - Arts (photography, music, theatre)
2. For each group → scrape member list (public)
3. For each member → name, bio, avatar, other groups joined
4. Group memberships become interest tags
5. Assign fuzzy BLR coordinates
```

### Output
Scraper writes to a local JSON file first for inspection before anything hits the DB:
```
scraper/output/[source]-bangalore-[date].json
```
A separate `store.ts` step ingests the JSON into Postgres + pgvector after manual review.

---

## Open Questions

1. **Location for scraped profiles** — randomized within city polygon is fine for cold start, but clusters will look artificial. Use neighborhood-level grid snapping instead?
2. **Scraped profile visibility** — show them in map clusters (anonymized) but block connection requests until claimed? Or hide entirely and only use for matching signal?
3. **Age-out policy** — scraped profiles unclaimed after 90 days get soft-deleted?
4. **Embedding refresh** — re-embed profiles when interests are updated. Sync (blocks save) or async queue?
