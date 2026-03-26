// ─── SCHEMA SETUP ───────────────────────────────────────────────────────────
// Run once on first boot via: npx ts-node scripts/setup-db.ts

export const SCHEMA_QUERIES = [
  // Constraints
  `CREATE CONSTRAINT user_id IF NOT EXISTS FOR (u:User) REQUIRE u.id IS UNIQUE`,
  `CREATE CONSTRAINT interest_name IF NOT EXISTS FOR (i:Interest) REQUIRE i.name IS UNIQUE`,
  `CREATE CONSTRAINT community_id IF NOT EXISTS FOR (c:Community) REQUIRE c.id IS UNIQUE`,
  `CREATE CONSTRAINT zone_id IF NOT EXISTS FOR (z:Zone) REQUIRE z.id IS UNIQUE`,

  // Indexes for fast lookup
  `CREATE INDEX user_email IF NOT EXISTS FOR (u:User) ON (u.email)`,
  `CREATE INDEX user_zone IF NOT EXISTS FOR (u:User) ON (u.zoneId)`,
  `CREATE INDEX interest_category IF NOT EXISTS FOR (i:Interest) ON (i.category)`,
]

// ─── CYPHER QUERIES ──────────────────────────────────────────────────────────

export const QUERIES = {

  // Create or update a user node
  UPSERT_USER: `
    MERGE (u:User {id: $id})
    SET u.name       = $name,
        u.email      = $email,
        u.bio        = $bio,
        u.avatarUrl  = $avatarUrl,
        u.zoneId     = $zoneId,
        u.latBucket  = $latBucket,
        u.lonBucket  = $lonBucket,
        u.updatedAt  = timestamp()
    RETURN u
  `,

  // Link user → interests (creates Interest node if not exists)
  SET_INTERESTS: `
    MATCH (u:User {id: $userId})
    WITH u
    UNWIND $interests AS interestName
      MERGE (i:Interest {name: interestName})
      MERGE (u)-[:LIKES]->(i)
    RETURN u
  `,

  // Store embedding vector on User node
  SET_EMBEDDING: `
    MATCH (u:User {id: $userId})
    SET u.embedding = $embedding
    RETURN u.id AS id
  `,

  // ── MATCHING ──────────────────────────────────────────────────────────────

  // Find users with at least 1 shared interest in nearby zones
  MATCH_BY_INTERESTS: `
    MATCH (me:User {id: $myId})-[:LIKES]->(i:Interest)<-[:LIKES]-(other:User)
    WHERE other.id <> $myId
      AND other.zoneId IN $nearbyZones
    WITH other, collect(i.name) AS sharedInterests, count(i) AS score
    RETURN other {
      .id, .name, .bio, .avatarUrl, .zoneId, .latBucket, .lonBucket
    } AS user,
    sharedInterests,
    score
    ORDER BY score DESC
    LIMIT $limit
  `,

  // Fetch all users in nearby zones (for globe/graph rendering)
  USERS_IN_ZONES: `
    MATCH (u:User)
    WHERE u.zoneId IN $zones
    OPTIONAL MATCH (u)-[:LIKES]->(i:Interest)
    RETURN u {
      .id, .name, .avatarUrl, .latBucket, .lonBucket, .zoneId
    } AS user,
    collect(i.name) AS interests
  `,

  // Full user profile with interests + community memberships
  GET_USER_PROFILE: `
    MATCH (u:User {id: $userId})
    OPTIONAL MATCH (u)-[:LIKES]->(i:Interest)
    OPTIONAL MATCH (u)-[:PART_OF]->(c:Community)
    RETURN u,
      collect(DISTINCT i.name) AS interests,
      collect(DISTINCT c { .id, .name }) AS communities
  `,

  // ── COMMUNITIES ───────────────────────────────────────────────────────────

  CREATE_COMMUNITY: `
    CREATE (c:Community {
      id: $id,
      name: $name,
      description: $description,
      zoneId: $zoneId,
      createdAt: timestamp()
    })
    WITH c
    MATCH (u:User {id: $creatorId})
    MERGE (u)-[:PART_OF {role: 'creator'}]->(c)
    RETURN c
  `,

  JOIN_COMMUNITY: `
    MATCH (u:User {id: $userId}), (c:Community {id: $communityId})
    MERGE (u)-[:PART_OF {role: 'member'}]->(c)
    RETURN c
  `,

  // ── TRENDING ──────────────────────────────────────────────────────────────

  // Top interests in a zone (for heatmap / trending panel)
  TRENDING_IN_ZONE: `
    MATCH (u:User)-[:LIKES]->(i:Interest)
    WHERE u.zoneId = $zoneId
    RETURN i.name AS interest, count(u) AS count
    ORDER BY count DESC
    LIMIT 10
  `,

  // ── RECRUITERS ────────────────────────────────────────────────────────────

  FIND_RECRUITERS_NEARBY: `
    MATCH (r:User)-[:LIKES]->(i:Interest {name: 'Recruiting'})
    WHERE r.zoneId IN $nearbyZones
    RETURN r { .id, .name, .bio, .avatarUrl, .zoneId } AS recruiter
    LIMIT 20
  `,
}
