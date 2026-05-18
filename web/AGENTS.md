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

### Unified Green Color Scheme
**CRITICAL:** All user roles (SOLVER, SEEKER, ADMIN) use the same green branding consistently. **ALWAYS use CSS variables from globals.css instead of hardcoded hex values.**

**CSS Variables (from globals.css):**
```css
--accent: oklch(0.63 0.09 162)           /* Light green */
--secondary: oklch(0.50 0.10 162)        /* Medium green */
--primary-foreground: oklch(0.30 0.08 162)  /* Dark green */
```

**Usage in Tailwind:**
- `bg-accent`, `text-accent`, `border-accent` - Light green (#5CA87C equivalent)
- `bg-secondary`, `text-secondary` - Medium green
- `bg-primary-foreground`, `text-primary-foreground` - Dark green (#288760 equivalent)
- `border-input` instead of `border-gray-300`
- `bg-background` instead of `bg-white` for semantic consistency

**Common Patterns:**
```tsx
// Gradients
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
```

**DO NOT:**
- ❌ Hardcode hex values like `#5CA87C`, `#288760`, `#1A5140`
- ❌ Use absolute colors like `bg-green-600`, `text-blue-500`
- ❌ Mix hardcoded values with CSS variables

**DO:**
- ✅ Use semantic CSS variable classes: `bg-accent`, `text-secondary`, `border-primary-foreground`
- ✅ Utilize opacity modifiers: `bg-accent/20`, `text-secondary/80`
- ✅ Reference globals.css for all color decisions

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
import type { LoginPayload, SolverRegisterPayload, SeekerRegisterPayload, AuthResponse } from "@/types/auth";

export async function loginUser(payload: LoginPayload): Promise<AuthResponse> {
  return apiRequest<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function registerSolver(payload: SolverRegisterPayload): Promise<AuthResponse> {
  return apiRequest<AuthResponse>("/auth/register/solver", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function registerSeeker(payload: SeekerRegisterPayload): Promise<AuthResponse> {
  return apiRequest<AuthResponse>("/auth/register/seeker", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
```

### Using API Functions in Components
```typescript
import { loginUser, registerSolver } from "@/lib/api/auth";
import { setAuthStorage, setAuthCookies, getDashboardPath } from "@/lib/auth-utils";

const handleLogin = async (data: LoginPayload) => {
  try {
    const response = await loginUser(data);
    setAuthStorage(response);
    setAuthCookies(response.token, response.role);
    router.push(getDashboardPath(response.role));
  } catch (error) {
    console.error("Login failed:", error);
    // Handle error (show toast, etc.)
  }
};

const handleSolverRegistration = async (data: SolverRegisterPayload) => {
  try {
    const response = await registerSolver(data);
    setAuthStorage(response);
    setAuthCookies(response.token, response.role);
    router.push(getDashboardPath(response.role));
  } catch (error) {
    console.error("Registration failed:", error);
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
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  institution?: string;
  degreeProgram?: string;
}

// Common fields for all registrations
export interface BaseRegisterPayload {
  email: string;
  password: string;
}

// Solver-specific registration (students)
export interface SolverRegisterPayload extends BaseRegisterPayload {
  firstName: string;
  lastName: string;
  institution: string;
  degreeProgram: string;
}

// Seeker-specific registration (industry partners)
export interface SeekerRegisterPayload extends BaseRegisterPayload {
  organizationName: string;
  contactPerson: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  userId: string;
  email: string;
  role: UserRole;
}
```
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

### Role-Specific Pages and Features

**Admin Features:**
- **Add Industry Page** (`/admin/add-industry`):
  - Creates SEEKER user accounts and SeekerProfile
  - Form fields: email, password, organizationName, contactPerson
  - No multi-step form (unlike public registration)
  - Uses CSS variables for theming (bg-accent, focus:ring-accent)
  - Accessible via "Add Industry" tab in admin navigation

**Form Patterns:**
- Solver registration: 2-step form (credentials → profile details)
- Admin add-industry: Single-step form (all fields on one page)
- All forms use controlled components with `useState`
- Password confirmation validation on client-side
- Server-side validation on backend

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
