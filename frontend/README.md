# Gods-Eye — Frontend

Next.js 16 app. See the [root README](../README.md) for full project context.

## Setup

```bash
npm install
cp .env.local.example .env.local
npm run dev
```

## Environment Variables

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...
```

No map token needed — uses OpenFreeMap (free, no account).

## Key Files

| File | Purpose |
|---|---|
| `app/layout.tsx` | Root layout, ClerkProvider, post-auth redirect to `/discover` |
| `app/page.tsx` | Landing page |
| `app/discover/page.tsx` | Protected discover page (redirects to `/` if not authed) |
| `components/map-view.tsx` | MapLibre GL JS 3D map, centered on user's GPS location |
| `middleware.ts` | Clerk auth middleware |

## Map

Uses **MapLibre GL JS** with **OpenFreeMap Liberty** tiles — fully open source, no API key.

- Requests browser geolocation on mount
- 60° pitch + 3D building extrusions for depth
- White pulse marker at user's coordinates
- Falls back to Bengaluru if location denied

## Auth Flow

Clerk handles auth. After sign-in or sign-up, users are force-redirected to `/discover` via `signInForceRedirectUrl` / `signUpForceRedirectUrl` on `ClerkProvider`.

The `/discover` route does a server-side auth check and redirects back to `/` if unauthenticated.
