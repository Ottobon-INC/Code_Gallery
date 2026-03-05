# Coding Guidelines

**Platform:** Ottobon Enterprise Component Hub  
**Scope:** `apps/api` (TypeScript/Express) + `apps/web` (TypeScript/Next.js)  
**Last Updated:** 2026-03-06  

> These are **enforceable rules**, not suggestions. PRs that violate these guidelines will be rejected during code review.

---

## 1. TypeScript Standards

### 1.1 Strict Mode is Non-Negotiable

Both `apps/api/tsconfig.json` and `apps/web/tsconfig.json` must have:

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  }
}
```

### 1.2 No `any` — Ever

```typescript
// ❌ FORBIDDEN
function processComponent(data: any) { ... }

// ✅ CORRECT — define an interface
interface ComponentRow {
    id: string;
    title: string;
    description: string;
    raw_code: string;
}

function processComponent(data: ComponentRow) { ... }
```

The only permitted exception is Express/Multer middleware callbacks where the type declaration file is absent. In that case, use `// eslint-disable-next-line @typescript-eslint/no-explicit-any` with a comment explaining why.

### 1.3 Explicit Return Types on All Functions

```typescript
// ❌ Missing return type
async function getComponents() {
    return await query('SELECT ...');
}

// ✅ Explicit return type
async function getComponents(): Promise<ComponentRow[]> {
    const result = await query<ComponentRow>('SELECT ...');
    return result.rows;
}
```

### 1.4 Prefer Interfaces Over Type Aliases for Object Shapes

```typescript
// ✅ Preferred for objects
interface Component {
    id: string;
    title: string;
    image_url?: string; // optional fields use ?
}

// ✅ Use type for unions, intersections, or computed types
type ComponentStatus = 'draft' | 'published' | 'archived';
```

---

## 2. API Route Patterns (`apps/api`)

### 2.1 Every Mutating Route Must Validate with Zod

Input validation runs **before** any database query. Never trust `req.body` without a schema.

```typescript
import { z } from 'zod';
import { Router, Request, Response } from 'express';

const router = Router();

const CreateComponentSchema = z.object({
    title: z.string().min(1).max(200),
    description: z.string().min(1),
    raw_code: z.string().min(1),
    category: z.string().optional(),
    image_url: z.string().url().optional(),
});

router.post('/', async (req: Request, res: Response) => {
    const parsed = CreateComponentSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({
            success: false,
            error: 'Validation failed',
            details: parsed.error.flatten(),
        });
    }
    const { title, description, raw_code, category, image_url } = parsed.data;
    // ... DB query
});
```

### 2.2 Consistent Response Envelope

All API responses must use this shape:

```typescript
// Success
{ success: true, data: T }

// Error
{ success: false, error: string, details?: unknown }
```

```typescript
// ✅ Success
return res.status(200).json({ success: true, data: component });

// ✅ Error
return res.status(404).json({ success: false, error: 'Component not found.' });

// ❌ Never return raw data without the envelope
return res.json(component);
```

### 2.3 All Database Queries Use the `query<T>()` Helper

```typescript
import { query } from '../../config/db';

// ✅ Typed, parameterized, injection-safe
const result = await query<ComponentRow>(
    'SELECT id, title, description FROM components WHERE id = $1',
    [componentId]
);

// ❌ Never use string interpolation in SQL
const result = await query(`SELECT * FROM components WHERE id = '${componentId}'`);
```

### 2.4 Error Handling in Route Handlers

Every async route must wrap DB/external calls in try/catch:

```typescript
router.get('/:id', async (req: Request, res: Response) => {
    try {
        const result = await query<ComponentRow>(
            'SELECT * FROM components WHERE id = $1',
            [req.params.id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Not found.' });
        }
        return res.json({ success: true, data: result.rows[0] });
    } catch (err) {
        console.error('[components] GET /:id error:', err);
        return res.status(500).json({ success: false, error: 'Internal server error.' });
    }
});
```

The global error handler in `app.ts` is a **last resort**, not a substitute for try/catch in routes.

---

## 3. React / Next.js Standards (`apps/web`)

### 3.1 Component File Structure

Every React component file follows this order:

```typescript
// 1. External imports
import React, { useState, useEffect } from 'react';

// 2. Internal imports (types, utils, other components)
import { Component } from '../types';

// 3. Interface definitions (props)
interface ComponentCardProps {
    component: Component;
    onLike: (id: string) => void;
}

// 4. The component (named export preferred)
export function ComponentCard({ component, onLike }: ComponentCardProps): React.JSX.Element {
    // ...
}

// 5. Default export (for Next.js pages only)
export default ComponentCard;
```

### 3.2 No Inline Styles

```tsx
// ❌ FORBIDDEN
<div style={{ backgroundColor: '#1a1a2e', padding: '16px' }}>

// ✅ Use CSS modules, global CSS, or className
<div className="component-card">
```

### 3.3 No Prop Drilling Beyond 2 Levels

If you find yourself passing a prop through 3+ layers of components, use React Context or refactor with composition.

```tsx
// ❌ Bad — drilling user through 3 layers
<Layout user={user}>
  <Sidebar user={user}>
    <UserAvatar user={user} />
  </Sidebar>
</Layout>

// ✅ Use context
const { user } = useSession(); // inside UserAvatar
```

### 3.4 Data Fetching — Client Components

All API calls from client components use `fetch` with `NEXT_PUBLIC_API_URL`:

```typescript
const API_URL = process.env.NEXT_PUBLIC_API_URL;

const response = await fetch(`${API_URL}/api/components`, {
    headers: {
        'Content-Type': 'application/json',
    },
});

if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
}

const json = await response.json();
```

---

## 4. Naming Conventions

| Context | Convention | Example |
|---------|-----------|---------|
| React components | `PascalCase` | `ComponentCard`, `NewComponentModal` |
| Hooks | `camelCase` with `use` prefix | `useComponents`, `useSession` |
| Utility functions | `camelCase` | `formatDate`, `generateSlug` |
| Constants | `UPPER_SNAKE_CASE` | `MAX_UPLOAD_SIZE`, `API_URL` |
| Database columns | `snake_case` | `author_id`, `created_at`, `image_url` |
| TypeScript interfaces | `PascalCase` | `Component`, `ComponentRow`, `ApiResponse` |
| Route files | `camelCase` | `crud.ts`, `fetch.ts`, `index.ts` |
| CSS classes | `kebab-case` | `component-card`, `sidebar-nav` |

---

## 5. Git & Commit Standards

### Branch Naming

```
feature/<short-description>    # e.g. feature/image-upload
fix/<short-description>        # e.g. fix/embedding-null-crash
chore/<short-description>      # e.g. chore/update-dependencies
docs/<short-description>       # e.g. docs/api-reference
```

### Commit Messages (Conventional Commits)

```
feat(api): add image upload endpoint using Supabase Storage
fix(web): resolve component card image not rendering on deploy
chore(deps): upgrade @supabase/supabase-js to 2.45
docs: add Phase 2 architecture diagrams
```

Format: `<type>(<scope>): <short description>`  
Types: `feat`, `fix`, `chore`, `docs`, `refactor`, `test`, `perf`

---

## 6. Security Rules

| Rule | Rationale |
|------|-----------|
| Never put `SUPABASE_SERVICE_KEY` in `apps/web` | Exposes admin DB access to every browser user |
| Always use `$1`-style SQL parameters | Prevents SQL injection |
| Hash passwords with bcrypt, cost ≥ 12 | Protects against brute force |
| Never log the full `req.body` in production | May contain passwords or tokens |
| Validate file uploads by MIME type, not extension | Extensions can be spoofed |
| `NODE_ENV=production` must set `ssl: { rejectUnauthorized: true }` | Prevents MITM on DB connections |
