// ─── USER ────────────────────────────────────────────────────────────────────

export interface User {
  id: string
  name: string
  email: string
  bio: string
  avatarUrl?: string
  zoneId: string
  latBucket: number
  lonBucket: number
  interests: string[]
  communities: Community[]
  createdAt: number
}

export interface UserProfile extends User {
  matchScore?: number
  sharedInterests?: string[]
  matchReason?: string
}

// ─── INTEREST ────────────────────────────────────────────────────────────────

export type InterestCategory =
  | 'tech'
  | 'design'
  | 'startup'
  | 'sports'
  | 'music'
  | 'dating'
  | 'recruiting'
  | 'education'
  | 'other'

export interface Interest {
  name: string
  category: InterestCategory
  count?: number  // how many users in zone have this interest
}

// ─── COMMUNITY ───────────────────────────────────────────────────────────────

export interface Community {
  id: string
  name: string
  description: string
  zoneId: string
  memberCount?: number
  interests?: string[]
}

// ─── GLOBE / MAP ─────────────────────────────────────────────────────────────

export interface GlobeNode {
  id: string
  name: string
  avatarUrl?: string
  lat: number   // bucketed
  lon: number   // bucketed
  interests: string[]
  category: InterestCategory
  matchScore?: number
}

export interface GlobeCluster {
  zoneId: string
  lat: number
  lon: number
  count: number
  topInterests: string[]
}

// ─── GRAPH ───────────────────────────────────────────────────────────────────

export interface GraphNode {
  id: string
  label: string
  type: 'user' | 'interest' | 'community'
  lat?: number
  lon?: number
  color?: string
  size?: number
}

export interface GraphLink {
  source: string
  target: string
  type: 'LIKES' | 'PART_OF' | 'NEAR'
  weight?: number
}

export interface GraphData {
  nodes: GraphNode[]
  links: GraphLink[]
}

// ─── API ─────────────────────────────────────────────────────────────────────

export interface MatchResult {
  user: UserProfile
  score: number
  sharedInterests: string[]
  reason?: string
}

export interface ApiResponse<T> {
  data?: T
  error?: string
  status: number
}
