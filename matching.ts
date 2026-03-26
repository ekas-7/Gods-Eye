import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

// ─── EMBEDDINGS ──────────────────────────────────────────────────────────────

export async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text,
  })
  return response.data[0].embedding
}

// Build a rich text representation of a user for embedding
export function buildUserEmbeddingText(user: {
  name: string
  bio: string
  interests: string[]
}): string {
  return `
    Name: ${user.name}.
    Bio: ${user.bio}.
    Interests: ${user.interests.join(', ')}.
  `.trim()
}

// ─── SIMILARITY ──────────────────────────────────────────────────────────────

export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0
  let dot = 0, magA = 0, magB = 0
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i]
    magA += a[i] ** 2
    magB += b[i] ** 2
  }
  return dot / (Math.sqrt(magA) * Math.sqrt(magB))
}

// ─── MATCH SCORING ───────────────────────────────────────────────────────────

export interface MatchCandidate {
  userId: string
  name: string
  embedding: number[]
  sharedInterests: string[]
  distanceKm: number
}

export interface ScoredMatch extends MatchCandidate {
  score: number         // 0–100
  aiSimilarity: number  // 0–1
}

export function scoreMatches(
  myEmbedding: number[],
  candidates: MatchCandidate[]
): ScoredMatch[] {
  return candidates
    .map((c) => {
      const aiSimilarity = cosineSimilarity(myEmbedding, c.embedding)
      const interestScore = Math.min(c.sharedInterests.length / 5, 1) // cap at 5 shared
      const distanceScore = Math.max(0, 1 - c.distanceKm / 50)        // 0–50km range

      // Weighted blend
      const score = (
        aiSimilarity     * 0.5 +
        interestScore    * 0.35 +
        distanceScore    * 0.15
      ) * 100

      return { ...c, score: Math.round(score), aiSimilarity }
    })
    .sort((a, b) => b.score - a.score)
}

// ─── AI EXPLAIN ──────────────────────────────────────────────────────────────

export async function explainMatch(
  me: { name: string; interests: string[] },
  other: { name: string; interests: string[] }
): Promise<string> {
  const shared = me.interests.filter((i) => other.interests.includes(i))
  const prompt = `
    You are a connection assistant. Explain in one sentence (max 15 words) 
    why ${me.name} should connect with ${other.name}.
    Shared interests: ${shared.join(', ') || 'none yet'}.
    Other's interests: ${other.interests.join(', ')}.
    Be specific and friendly.
  `
  const res = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 40,
  })
  return res.choices[0].message.content ?? ''
}
