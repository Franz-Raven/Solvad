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

### File Organization

```
app/
├── (public)/          # Unauthenticated routes
│   ├── landing/
│   ├── login/
│   └── register/
├── (authed)/          # Protected routes
│   ├── layout.tsx     # AuthProvider wrapper + AuthedNavigation
│   ├── solver/
│   ├── seeker/
│   └── admin/
components/
├── navigation.tsx          # Public header
├── authed-navigation.tsx   # Authenticated header
└── ui/                     # Shadcn components
lib/
├── api.ts                  # apiRequest wrapper (fetch)
├── auth-utils.ts           # Auth helper functions
└── api/
    └── auth.ts             # Auth API calls
types/
└── auth.ts                 # TypeScript type definitions
context/
└── auth-context.tsx        # Auth state management
```

## Theme & Design System

### Role-Based Color Schemes
**SOLVER (Students):**
- Primary: `#5CA87C` (jade green)
- Dark: `#288760`
- Background gradients: `from-[#B7E5BA]/20 via-background to-[#5CA87C]/10`

**SEEKER (Industry):**
- Primary: `blue-600`, `indigo-600`
- Background gradients: `from-blue-50 via-background to-indigo-50`

**ADMIN:**
- Primary: `purple-600`, `pink-600`
- Background gradients: `from-purple-50 via-background to-pink-50`

### Typography
- Font: Poppins (weights: 300, 400, 500, 600, 700)
- Large headings: `text-4xl md:text-5xl lg:text-6xl font-bold`
- Body text: `text-lg md:text-xl`

### Styling Standards
- Use Tailwind CSS classes exclusively
- Responsive breakpoints: `sm:`, `md:`, `lg:`, `xl:`
- Shadows: `shadow-md`, `shadow-xl`
- Rounded corners: `rounded-lg`, `rounded-xl`, `rounded-2xl`
- Borders: `border border-gray-200`

## API Integration

### Backend Connection
**Base URL:** `http://localhost:8080/api`

### API Client Setup (`lib/api.ts`)
Uses native `fetch` with automatic token injection:

```typescript
const API_BASE_URL = "http://localhost:8080/api";

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> | undefined),
  };

  // Automatically add auth token from localStorage
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  // Set Content-Type if not already set
  if (!("Content-Type" in headers) && !(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  const config: RequestInit = {
    ...options,
    headers,
  };

  const res = await fetch(url, config);

  // Parse response based on content type
  const contentType = res.headers.get("content-type") || "";
  let data: unknown = null;

  if (contentType.includes("application/json")) {
    data = await res.json().catch(() => null);
  } else {
    data = await res.text().catch(() => null);
  }

  // Handle errors
  if (!res.ok) {
    const errorMsg = /* extract error message from response */ ;
    throw new Error(errorMsg);
  }

  return data as T;
}
```

### API Function Pattern (`lib/api/*.ts`)
Create separate files for different API domains:

```typescript
// lib/api/auth.ts
import { apiRequest } from "../api";
import type { LoginPayload, RegisterPayload, AuthResponse } from "@/types/auth";

export async function login(payload: LoginPayload): Promise<AuthResponse> {
  return apiRequest<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function register(payload: RegisterPayload): Promise<AuthResponse> {
  return apiRequest<AuthResponse>("/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
```

### Using API Functions in Components
```typescript
import { login } from "@/lib/api/auth";
import { setAuthStorage, setAuthCookies, getDashboardPath } from "@/lib/auth-utils";

const handleLogin = async (data: LoginPayload) => {
  try {
    const response = await login(data);
    setAuthStorage(response);
    setAuthCookies(response.token, response.role);
    router.push(getDashboardPath(response.role));
  } catch (error) {
    console.error("Login failed:", error);
    // Handle error (show toast, etc.)
  }
};
```

## TypeScript Standards

### Type Definitions (`types/`)
All interfaces and types in dedicated files:

```typescript
// types/auth.ts
export type UserRole = "SOLVER" | "SEEKER" | "ADMIN";

export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  institution?: string;
  degreeProgram?: string;
}

export interface AuthResponse {
  token: string;
  role: UserRole;
  user: User;
}

export interface LoginPayload {
  email: string;
  password: string;
}
```

### Import Paths
- Use `@/` alias for imports: `import { useAuth } from "@/context/auth-context"`
- Never use relative paths like `../../lib/utils`

## Naming Conventions

### Files & Folders
- Components: `kebab-case.tsx` (e.g., `authed-navigation.tsx`)
- Pages: `page.tsx` (Next.js convention)
- API functions: `kebab-case.ts` (e.g., `auth.ts`)
- Types: `kebab-case.ts` (e.g., `auth.ts`)

### Variables & Functions
- Variables: `camelCase` (e.g., `userRole`, `authToken`)
- Functions: `camelCase` (e.g., `handleLogin`, `getDashboardPath`)
- Constants: `UPPER_SNAKE_CASE` (e.g., `PUBLIC_PATHS`, `API_BASE_URL`)
- React components: `PascalCase` (e.g., `AuthedNavigation`, `SolverDashboard`)

### React Hooks
- Custom hooks: Prefix with `use` (e.g., `useAuth`)
- State variables: Descriptive names (e.g., `const [isLoading, setIsLoading] = useState(false)`)

## Component Standards

### Client Components
Mark with `"use client"` directive when using:
- `useState`, `useEffect`, `useContext`
- Event handlers (`onClick`, `onChange`)
- Browser APIs

### Server Components
Default in Next.js App Router - no directive needed
Use for:
- Static content
- Data fetching at build time
- SEO-critical pages

### Component Structure
```typescript
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function ComponentName() {
  // Hooks first
  const router = useRouter();
  const [state, setState] = useState();

  // Event handlers
  const handleClick = () => {};

  // Render
  return (
    <div>
      {/* Content */}
    </div>
  );
}
```

## Security Checklist for New Pages

### Authenticated Pages
- [ ] Page is inside `app/(authed)/` directory
- [ ] Layout automatically provides `AuthProvider` and header
- [ ] Use `useAuth()` hook to access user data
- [ ] Middleware validates cookies server-side
- [ ] No manual auth checks needed (handled by route group)

### Public Pages
- [ ] Page is inside `app/(public)/` directory
- [ ] Uses public `Navigation` component (not `AuthedNavigation`)
- [ ] No `useAuth()` calls
- [ ] Login/register forms use `setAuthCookies()` and `setAuthStorage()` after success

### API Calls
- [ ] Import from `lib/api/*` functions
- [ ] Type-safe with TypeScript interfaces
- [ ] Error handling with try/catch
- [ ] Auth token automatically added by `apiRequest` wrapper
- [ ] Use native `fetch` via `apiRequest<T>()` helper

## Form Handling

### Pattern
```typescript
const [formData, setFormData] = useState<LoginPayload>({
  email: "",
  password: "",
});

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  try {
    const response = await login(formData);
    // Handle success
  } catch (error) {
    // Handle error
  }
};
```

### Validation
- Client-side: Basic validation before API call
- Server-side: Backend validates all inputs
- Display errors: Toast notifications or inline error messages

## Common Patterns

### Redirects After Login
```typescript
import { getDashboardPath } from "@/lib/auth-utils";
router.push(getDashboardPath(response.role));
```

### Logout
```typescript
import { performLogout } from "@/lib/auth-utils";
await performLogout();
router.push("/landing");
```

### Protected Navigation
```typescript
import { useAuth } from "@/context/auth-context";
const { user, isAuthenticated } = useAuth();

if (!isAuthenticated) {
  // Middleware handles redirect, but you can show loading state
  return <div>Loading...</div>;
}
```

## DO NOT

❌ Create authentication logic outside the established system
❌ Store sensitive data in localStorage without cookies
❌ Use relative imports (`../../`) instead of `@/` alias
❌ Mix color themes across roles
❌ Create new layout patterns - use route groups
❌ Make API calls without TypeScript types
❌ Bypass middleware protection
❌ Create duplicate auth state management

## ALWAYS DO

✅ Use established auth system (middleware + context + utils)
✅ Follow role-based color schemes
✅ Type all API payloads and responses
✅ Use `@/` import alias
✅ Place authenticated pages in `(authed)` directory
✅ Use `lib/api/*` functions for backend calls
✅ Handle errors gracefully
✅ Keep components focused and single-purpose
✅ Test with all three user roles (SOLVER, SEEKER, ADMIN)
