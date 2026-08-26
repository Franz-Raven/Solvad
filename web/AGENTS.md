<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

---

# Solvad Frontend - Coding Standards & Conventions

## Project Architecture

### Route Structure
- **`app/(public)/`** - Unauthenticated routes (landing, login, register)
- **`app/(authed)/`** - Protected routes requiring authentication
  - All role-based dashboards live here: `/solver`, `/seeker`, `/admin`
  - Layout includes `AuthProvider` and `AuthedNavigation` header
- Route groups `(public)` and `(authed)` are NOT part of the URL path

### Authentication System
**CRITICAL:** Every authenticated page must be protected by the authentication system:

1. **Middleware** (`middleware.ts`):
   - Server-side route protection
   - Validates `authToken` and `userRole` cookies
   - Redirects unauthorized users to `/landing`
   - Role-based path authorization

2. **Auth Context** (`context/auth-context.tsx`):
   - Client-side auth state management
   - Provides `useAuth()` hook with: `user`, `loading`, `logout`, `isAuthenticated`, `role`
   - Only wrap authenticated routes (already done in `(authed)/layout.tsx`)

3. **Auth Utils** (`lib/auth-utils.ts`):
   - Cookie management: `setAuthCookies()`, `clearAuthCookies()`
   - Storage management: `setAuthStorage()`, `clearAuthStorage()`
   - Dashboard routing: `getDashboardPath(role)`
   - Logout handler: `performLogout()`

**Security Pattern:**
- Cookies (`authToken`, `userRole`) - Server-side middleware validation
- LocalStorage (`user`, `token`) - Client-side state persistence
- JWT tokens are stateless - frontend clears tokens on logout (no backend call needed)

### File Organization (Feature Colocation)
We use a STRICT **Feature-Colocated Architecture**. Global folders are reserved ONLY for code shared across the entire application.

```text
app/
├── (public)/          # Unauthenticated routes
├── (authed)/          # Protected routes
│   ├── solver/
│   │   └── workspace/
│   │       └── [id]/
│   │           ├── api/             # LOCAL API: Only workspace-specific endpoints
│   │           │   └── workspace.ts 
│   │           ├── component/       # LOCAL COMPONENTS: Only used in workspace
│   │           │   └── SubtaskForm.tsx
│   │           └── page.tsx
components/
├── navigation.tsx          # Public header
├── authed-navigation.tsx   # Authenticated header
├── portal.tsx              # DOM Portal for Modals
└── ui/                     # Shared Shadcn components
lib/
├── api.ts                  # Core apiRequest fetch wrapper
└── api/
    └── auth.ts             # GLOBAL APIs only (Auth, generic utilities)


Theme & Design SystemUnified Green Color SchemeCRITICAL: All user roles (SOLVER, SEEKER, ADMIN) use the same green branding consistently. ALWAYS use CSS variables from globals.css instead of hardcoded hex values.  CSS Variables (from globals.css):  CSS--accent: oklch(0.63 0.09 162)           /* Light green */[cite: 6]
--secondary: oklch(0.50 0.10 162)        /* Medium green */[cite: 6]
--primary-foreground: oklch(0.30 0.08 162)  /* Dark green */[cite: 6]
Usage in Tailwind:  bg-accent, text-accent, border-accent - Light green (#5CA87C equivalent)  bg-secondary, text-secondary - Medium green  bg-primary-foreground, text-primary-foreground - Dark green (#288760 equivalent)  border-input instead of border-gray-300  bg-background instead of bg-white for semantic consistency  Common Patterns:  TypeScript// Gradients
className="bg-gradient-to-br from-accent to-primary-foreground"
className="bg-gradient-to-br from-accent to-secondary"

// Backgrounds with opacity
className="bg-gradient-to-br from-accent/20 via-background to-accent/10"

// Buttons
className="bg-accent hover:bg-secondary text-white"
className="bg-secondary hover:bg-primary-foreground text-white"

// Focus states
className="focus:ring-2 focus:ring-accent focus:border-transparent"

// Hover states  
className="hover:bg-accent/20"
className="hover:text-primary-foreground"
DO NOT:  ❌ Hardcode hex values like #5CA87C, #288760, #1A5140  ❌ Use absolute colors like bg-green-600, text-blue-500  ❌ Mix hardcoded values with CSS variables  DO:  ✅ Use semantic CSS variable classes: bg-accent, text-secondary, border-primary-foreground  ✅ Utilize opacity modifiers: bg-accent/20, text-secondary/80  ✅ Reference globals.css for all color decisions  TypographyFont: Poppins (weights: 300, 400, 500, 600, 700)  Large headings: text-4xl md:text-5xl lg:text-6xl font-bold  Body text: text-lg md:text-xl  Styling StandardsUse Tailwind CSS classes exclusively  Responsive breakpoints: sm:, md:, lg:, xl:  Shadows: shadow-md, shadow-xl  Rounded corners: rounded-lg, rounded-xl, rounded-2xl  Borders: border border-gray-200  API IntegrationBase apiRequest WrapperAll network requests MUST use the apiRequest<T> wrapper located in lib/api.ts. This automatically injects the JWT token, handles Content-Type headers (JSON vs FormData), and parses errors seamlessly.Feature-Specific APIs (Colocation)DO NOT use a monolithic global API file (e.g., lib/api/problem.ts).Instead, API calls must be colocated with the feature that uses them.Example: The Seeker Dashboard API belongs in seeker/dashboard/api/dashboard.ts:TypeScriptimport { apiRequest } from "@/lib/api";
import type { PaginatedProblemsResponse } from "@/types/problem";

export async function searchMyProblems(page: number, size: number): Promise<PaginatedProblemsResponse> {
  return apiRequest<PaginatedProblemsResponse>(`/problems/search?page=${page}&size=${size}`, { 
    method: "GET" 
  });
}
Advanced React PatternsModals & Z-Index Issues (The Portal Pattern)If a parent container uses CSS transforms (e.g., Tailwind's animate-in slide-in-from-bottom), fixed children inside it will get trapped and fail to cover the screen.Rule: Always wrap full-screen Modals or Overlays in the <Portal> component.TypeScriptimport Portal from "@/components/portal";

// Inside render:
{showModal && (
  <Portal>
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60">
       {/* Modal Content */}
    </div>
  </Portal>
)}
Concurrent Data FetchingWhen a page requires multiple independent API calls to render, never await them sequentially. Use Promise.allSettled to fetch them concurrently and fail gracefully.TypeScriptconst [problemResult, attemptResult] = await Promise.allSettled([
  getProblemById(id),
  getMyAttempt(id)
]);

// Hard fail for required data
if (problemResult.status === "fulfilled") setProblem(problemResult.value);
else throw new Error("Critical data failed to load");

// Soft fail (fallback) for optional data
setAttempt(attemptResult.status === "fulfilled" ? attemptResult.value : null);
Performance & Lazy LoadingHeavy components (like rich text editors, data tables, or hidden tabs) should NOT be downloaded on initial page load. Use next/dynamic to code-split and lazy-load them.TypeScriptimport dynamic from "next/dynamic";

const AuditTimelineTab = dynamic(() => import("./components/AuditTimelineTab").then(mod => mod.AuditTimelineTab), {
  loading: () => <div className="animate-pulse">Loading History...</div>,
  ssr: false // Optional: disable SSR for highly interactive/browser-only components
});
TypeScript StandardsType Definitions (types/)All interfaces and types in dedicated files:  TypeScript// types/auth.ts
export type UserRole = "SOLVER" | "SEEKER" | "ADMIN";[cite: 6]

export interface User {
  id: string;[cite: 6]
  email: string;[cite: 6]
  firstName: string;[cite: 6]
  lastName: string;[cite: 6]
  role: UserRole;[cite: 6]
  institution?: string;[cite: 6]
  degreeProgram?: string;[cite: 6]
}

export interface AuthResponse {
  token: string;[cite: 6]
  role: UserRole;[cite: 6]
  user: User;[cite: 6]
}

export interface LoginPayload {
  email: string;[cite: 6]
  password: string;[cite: 6]
}
Import PathsUse @/ alias for imports: import { useAuth } from "@/context/auth-context"  Never use relative paths like ../../lib/utils  Naming ConventionsFiles & FoldersComponents: kebab-case.tsx (e.g., authed-navigation.tsx)  Pages: page.tsx (Next.js convention)  API functions: kebab-case.ts (e.g., auth.ts)  Types: kebab-case.ts (e.g., auth.ts)  Variables & FunctionsVariables: camelCase (e.g., userRole, authToken)  Functions: camelCase (e.g., handleLogin, getDashboardPath)  Constants: UPPER_SNAKE_CASE (e.g., PUBLIC_PATHS, API_BASE_URL)  React components: PascalCase (e.g., AuthedNavigation, SolverDashboard)  React HooksCustom hooks: Prefix with use (e.g., useAuth)  State variables: Descriptive names (e.g., const [isLoading, setIsLoading] = useState(false))  Component StandardsClient ComponentsMark with "use client" directive when using:  useState, useEffect, useContext  Event handlers (onClick, onChange)  Browser APIs  Server ComponentsDefault in Next.js App Router - no directive needed[cite: 6]
Use for:[cite: 6]Static content[cite: 6]Data fetching at build time[cite: 6]SEO-critical pages[cite: 6]Component StructureTypeScript"use client";[cite: 6]

import { useState } from "react";[cite: 6]
import { useRouter } from "next/navigation";[cite: 6]
import Link from "next/link";[cite: 6]

export default function ComponentName() {
  // Hooks first[cite: 6]
  const router = useRouter();[cite: 6]
  const [state, setState] = useState();[cite: 6]

  // Event handlers[cite: 6]
  const handleClick = () => {};[cite: 6]

  // Render[cite: 6]
  return (
    <div>
      {/* Content */}[cite: 6]
    </div>
  );[cite: 6]
}
Security Checklist for New PagesAuthenticated Pages[ ] Page is inside app/(authed)/ directory[cite: 6][ ] Layout automatically provides AuthProvider and header[cite: 6][ ] Use useAuth() hook to access user data[cite: 6][ ] Middleware validates cookies server-side[cite: 6][ ] No manual auth checks needed (handled by route group)[cite: 6]Public Pages[ ] Page is inside app/(public)/ directory[cite: 6][ ] Uses public Navigation component (not AuthedNavigation)[cite: 6][ ] No useAuth() calls[cite: 6][ ] Login/register forms use setAuthCookies() and setAuthStorage() after success[cite: 6]API Calls[ ] Import from local feature api/* functions OR lib/api/* for global[ ] Type-safe with TypeScript interfaces[cite: 6][ ] Error handling with try/catch[cite: 6][ ] Auth token automatically added by apiRequest wrapper[cite: 6][ ] Use native fetch via apiRequest<T>() helper[cite: 6]Common PatternsRole-Specific Pages and FeaturesAdmin Features:[cite: 6]Add Industry Page (/admin/add-industry):[cite: 6]Creates SEEKER user accounts and SeekerProfile[cite: 6]Form fields: email, password, organizationName, contactPerson[cite: 6]No multi-step form (unlike public registration)[cite: 6]Uses CSS variables for theming (bg-accent, focus:ring-accent)[cite: 6]Accessible via "Add Industry" tab in admin navigation[cite: 6]Form Patterns:[cite: 6]Solver registration: 2-step form (credentials → profile details)[cite: 6]Admin add-industry: Single-step form (all fields on one page)[cite: 6]All forms use controlled components with useState[cite: 6]Password confirmation validation on client-side[cite: 6]Server-side validation on backend[cite: 6]DO NOT❌ Create monolithic global API files (e.g., a 500-line api/problems.ts).
❌ Create authentication logic outside the established system[cite: 6]
❌ Store sensitive data in localStorage without cookies[cite: 6]
❌ Use relative imports (../../) instead of @/ alias[cite: 6]
❌ Mix color themes across roles[cite: 6]
❌ Create new layout patterns - use route groups[cite: 6]
❌ Make API calls without TypeScript types[cite: 6]
❌ Bypass middleware protection[cite: 6]
❌ Create duplicate auth state management[cite: 6]
❌ Hardcode localhost:8080 in fetch requests—always use the apiRequest wrapper.ALWAYS DO✅ Colocate feature APIs and sub-components within their respective route directories.
✅ Wrap full-screen Modals in <Portal> to escape CSS stacking contexts.
✅ Use Promise.allSettled for parallel network requests.
✅ Lazy load non-critical tabs and heavy components using next/dynamic.
✅ Use established auth system (middleware + context + utils)[cite: 6]
✅ Follow role-based color schemes[cite: 6]
✅ Type all API payloads and responses[cite: 6]
✅ Use @/ import alias[cite: 6]
✅ Place authenticated pages in (authed) directory[cite: 6]
✅ Handle errors gracefully[cite: 6]
✅ Keep components focused and single-purpose[cite: 6]
✅ Test with all three user roles (SOLVER, SEEKER, ADMIN)[cite: 6]    