---
paths:
  - "rekaliber/**"
  - "**/rekaliber/**"
---

# Rekaliber AI Prompting Protocol

All Rekaliber outputs MUST comply with this protocol. Non-negotiable.

## Product Structure
- Core: SSO (Auth, Users, Organizations, Permissions)
- Modules: PMS, Workflows, Task Manager, Chat, Billing, IAS, AFM, P-MS
- ONE backend + ONE frontend, features behave as **independent modules**
- NEVER mix logic between modules. NEVER bypass SSO.

## Every Feature Output MUST Include These 7 Sections
1. **Business Context** — What does this feature do and who is it for?
2. **Module** — Exactly ONE module name
3. **Feature Request** — Specific endpoint/UI action + expected behavior
4. **API Contract** — Method + URL, Request JSON, Success response `{ "success": true, "message": "string", "data": {} }`, Error responses (401, 403, 404, 422)
5. **Rules & Permissions** — Who can perform this action?
6. **Data Impact** — What data is created/updated/deleted?
7. **Definition of Done** — Endpoint/UI works, validation included, errors handled, auth enforced, matches response format

## Backend Rules (Strict)
- Pattern: Controller → Request → Service/Action → Model
- JWT auth (auth:api) where required
- Consistent response: `{ "success": true, "message": "string", "data": {} }`
- NEVER: business logic in controllers, skip validation, break existing routes, mix modules

## Frontend Rules (Strict)
- Use services from `lib/api/services` — NEVER raw fetch/axios in components
- Respect existing layout: MainLayout, Sidebar, Navbar
- Modular, reusable UI with loading + error states
- Realtime: use existing Echo setup only (no custom sockets)

## Auto-Rejected
Vague requests ("make this better"), missing API contract, missing module, mixing multiple features in one request.
