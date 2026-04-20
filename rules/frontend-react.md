---
paths:
  - "**/*.tsx"
  - "**/*.jsx"
  - "**/components/**"
  - "**/app/**"
---

# Frontend React/Next.js Conventions

- Use services from `lib/api/services` — NEVER raw fetch/axios in components
- Data fetching via TanStack Query (useQuery/useMutation) with service layer
- State management: Zustand for client state, TanStack Query for server state
- UI components: shadcn/ui + Tailwind CSS
- Respect existing layout: MainLayout, Sidebar, Navbar
- All interactive elements must have loading + error states
- Forms use react-hook-form + zod validation
- Next.js App Router: prefer server components, use 'use client' only when needed
- Images: next/image with proper width/height
- Realtime: use existing Echo/socket setup only — no custom WebSocket connections
