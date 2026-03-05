# Product Requirements Document

**Product:** Ottobon Enterprise Component Hub  
**Version:** 1.0  
**Status:** Production  
**Last Updated:** 2026-03-06  
**Owner:** Platform Engineering  

---

## 1. Problem Statement

Engineering teams repeatedly build the same UI components from scratch. A date picker built in Team A is rebuilt two months later by Team B. This duplication wastes developer time, creates inconsistent UX across products, and makes maintenance brittle.

**The Enterprise Component Hub eliminates this by providing a single, discoverable, injectable source of truth for all shared React/TypeScript UI components.**

---

## 2. Goals

| Goal | Success Metric |
|------|---------------|
| Reduce duplicate component builds | ≥30% reduction in "new component" tickets within 6 months of launch |
| Enable fast component discovery | Developer finds and injects the right component in <2 minutes |
| Provide ROI visibility | Analytics dashboard shows cumulative hours saved across all CLI injections |
| Incentivise contribution | Bounty board drives community-submitted components |

---

## 3. User Personas

### Persona 1 — The Component Consumer (Primary)

**Name:** Dev  
**Role:** Frontend Engineer  
**Goal:** Find an existing, battle-tested component and inject it into their project instead of building from scratch.  
**Behaviour:** Uses the search bar with natural language queries, browses by category, runs `hub add <id>` from the terminal.  
**Pain point:** Currently searches Confluence, Slack, GitHub, and asks teammates. Takes 30–60 minutes.

---

### Persona 2 — The Component Author (Primary)

**Name:** Author  
**Role:** Senior Frontend Engineer / Design System Engineer  
**Goal:** Publish high-quality components to the hub with documentation, source code, and a screenshot so others can discover and reuse them.  
**Behaviour:** Creates components via the web UI, uploads a screenshot, specifies category and stack.  
**Pain point:** No canonical place to share components. Currently pastes code into Slack.

---

### Persona 3 — The Platform Admin (Secondary)

**Name:** Admin  
**Role:** Platform Team / Engineering Manager  
**Goal:** Control who has access, manage component categories, monitor adoption analytics.  
**Behaviour:** Approves new user registrations, creates categories, reviews bounty board.  
**Pain point:** No visibility into which components are actually being used.

---

## 4. Functional Requirements

### 4.1 Authentication & Access Control

| ID | Requirement |
|----|-------------|
| FR-01 | Users must register with email and password. Passwords are bcrypt-hashed (cost ≥12). |
| FR-02 | New accounts default to `is_approved = false`. Login is blocked until an Admin approves. |
| FR-03 | Sessions are managed by NextAuth.js using JWT strategy. |
| FR-04 | Admin users have an `is_admin` flag. Admin routes (`/admin`) are guarded by Next.js middleware. |
| FR-05 | Unapproved users are redirected to `/pending-approval` regardless of requested URL. |

### 4.2 Component Management

| ID | Requirement |
|----|-------------|
| FR-06 | Authenticated users can create components with: title, description, source code (HTML/CSS/TypeScript), category, stack, and optional screenshot. |
| FR-07 | On component creation, the API generates a 1536-dim OpenAI embedding from the description and stores it in the `embedding` column. |
| FR-08 | Components are browsable by category filter. |
| FR-09 | Full component source code is accessible on the component detail page. |
| FR-10 | Each component has a unique UUID accessible to the CLI with `hub add <id>`. |

### 4.3 Semantic Search

| ID | Requirement |
|----|-------------|
| FR-11 | The search bar accepts natural language queries (e.g. "animated loading spinner"). |
| FR-12 | Queries are embedded via the same OpenAI model and matched against stored embeddings using cosine similarity (`match_components()` RPC). |
| FR-13 | Results are ranked by similarity score. Top 10 results are returned. |
| FR-14 | Components without an embedding (created before the AI feature) are excluded from semantic results. |

### 4.4 CLI Injection

| ID | Requirement |
|----|-------------|
| FR-15 | The CLI tool calls `GET /api/cli/fetch?id=<uuid>&userId=<uuid>`. |
| FR-16 | On successful fetch, `components.usage_count` is incremented by 1. |
| FR-17 | A `telemetry_logs` row is inserted with `component_id`, `user_id`, and `estimated_hours_saved`. |
| FR-18 | The component's `raw_code` is written to a file in the developer's local project. |

### 4.5 Image Uploads

| ID | Requirement |
|----|-------------|
| FR-19 | Authors can upload a screenshot (JPEG, PNG, GIF, WebP, SVG) when creating a component. |
| FR-20 | Images are posted as base64-encoded JSON to `POST /api/upload`. |
| FR-21 | The API decodes the image, uploads it to Supabase Storage (`component-images` bucket), and stores the permanent public URL in `components.image_url`. |
| FR-22 | File size limit is 5 MB. |

### 4.6 Bounty Board

| ID | Requirement |
|----|-------------|
| FR-23 | Any authenticated user can create a bounty (component request). |
| FR-24 | Bounties have status: `requested → in-progress → completed`. |
| FR-25 | Any user can claim an open bounty (`claimed_by` set to their user ID). |

### 4.7 Analytics

| ID | Requirement |
|----|-------------|
| FR-26 | The Analytics page aggregates `telemetry_logs` to show: most-used components, hours saved per component, and total platform ROI. |
| FR-27 | Data refreshes on page load. No real-time requirement. |

---

## 5. Non-Functional Requirements

| Category | Requirement |
|----------|-------------|
| **Performance** | Semantic search must respond in <500ms for a dataset of up to 10,000 components |
| **Availability** | API uptime target: 99.5% (managed by hosting provider SLA) |
| **Security** | `SUPABASE_SERVICE_KEY` never exposed to the browser. All SQL parameterised. |
| **Scalability** | HNSW index handles 1M+ vectors without query degradation |
| **Auditability** | `telemetry_logs` is an immutable ledger — rows are never updated or manually deleted |
| **Developer Experience** | New developer fully onboarded in<20 minutes following `docs/03-developer/developer-onboarding.md` |

---

## 6. Out of Scope (v1.0)

- Component versioning or diff history
- Real-time collaboration or live preview
- Public/external component sharing (this is an internal tool)
- Mobile-native app
- Component automated testing or rendering validation
