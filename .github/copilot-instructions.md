# Copilot Instructions

This document defines the coding standards, patterns, and practices for the Calhame CFO Dashboard codebase.

## Project Overview

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript (strict mode)
- **Monorepo**: Turborepo
- **Styling**: Tailwind CSS with class-variance-authority
- **Database**: PostgreSQL with node-postgres
- **Authentication**: Clerk
- **UI Components**: Radix UI primitives with shadcn/ui

## TypeScript Configuration

### Strict Mode
- Use strict TypeScript mode with all strict checks enabled
- All functions should have explicit return types
- Use `import type` for type-only imports

### Type Definitions
```typescript
// Use interfaces for props
interface ComponentProps {
  title: string;
  value: string;
  info?: string;
  className?: string;
}

// Export explicit return types for functions
export function calculatePercentage(value: number, total: number): number {
  if (total === 0) return 0;
  return parseFloat(((value / total) * 100).toFixed(2));
}
```

### Type Safety
- Define types in `packages/shared/src/types/` for cross-package usage
- Use TypeScript for all `.ts` and `.tsx` files
- Avoid `any` types unless absolutely necessary
- Use union types and type guards where appropriate

## Code Formatting

### General Rules
- **Indentation**: 2 spaces
- **Quotes**: Double quotes for strings
- **Semicolons**: Always use semicolons
- **Line Length**: Aim for 80-100 characters, but prioritize readability
- **Comparison**: Use `==` for numeric comparisons, `===` for strict equality

### Naming Conventions
- **Components**: PascalCase (e.g., `InfoCard.tsx`, `DashboardContainer.tsx`)
- **Hooks**: camelCase with `use` prefix (e.g., `use-mobile.ts`)
- **Utilities/Libs**: kebab-case (e.g., `accounting-formulas.ts`, `token-crypto.ts`)
- **Pages/Layouts**: Always `page.tsx` or `layout.tsx` in their directories
- **Variables/Functions**: camelCase
- **Constants**: UPPER_SNAKE_CASE for module-level constants
- **Interfaces/Types**: PascalCase

## Import Organization

### Import Order
1. Type imports (`import type`)
2. External libraries (React, Next.js, third-party)
3. Internal aliased imports (`@/...`)
4. Relative imports (`./`, `../`)

### Example
```typescript
import type { Metadata } from "next";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/accounting-formulas";
import InfoCard from "./InfoCard";
```

### Path Aliases
- Use `@/` for imports within the `apps/web` directory
- Examples: `@/components/ui/button`, `@/lib/utils`, `@/types/nav`

## React and Next.js Patterns

### Component Structure
```typescript
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

interface InfoCardProps {
  title: string;
  value: string;
  info?: string;
  className?: string;
}

export default function InfoCard({ title, value, info, className }: InfoCardProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div>{value}</div>
        {info && <p>{info}</p>}
      </CardContent>
    </Card>
  );
}
```

### Key Patterns
- **Functional Components**: Always use functional components with default export
- **Props**: Define interface for all component props, destructure in function signature
- **State**: Use `useState` for local state management
- **Effects**: Use `useEffect` for side effects
- **Server Components**: Mark async for data fetching in server components
- **Conditional Rendering**: Use `&&` for conditional rendering, ternary for if/else

### Server Components (Async Data Fetching)
```typescript
export default async function DashboardPage() {
  const { userId: clerkId } = await auth();
  const user = await getUserByClerkId(clerkId);
  const companies = await getCompaniesByUser(user.id);
  
  return (
    <DashboardContainer companies={companies} />
  );
}
```

### Client Components
- Mark with `"use client"` directive at top of file
- Use for interactive elements with state, effects, or event handlers
- Keep client components focused and minimal

## API Routes

### Route Structure
```typescript
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return Response.json(
        { error: { message: "Unauthorized" } },
        { status: 401 }
      );
    }
    
    const [{ id }, userResult] = await Promise.all([
      params,
      getUserByClerkId(clerkUserId)
    ]);
    
    await deleteRecord(id, userResult.id);
    
    return new Response(null, { status: 204 });
  } catch (error) {
    console.error("Error deleting record:", error);
    return Response.json(
      { error: { message: "Failed to delete record" } },
      { status: 500 }
    );
  }
}
```

### API Patterns
- **Method Exports**: Export named async functions for HTTP methods (`GET`, `POST`, `DELETE`, etc.)
- **Authentication**: Always check `auth()` at the start of protected routes
- **Authorization**: Return 401 for unauthorized requests
- **Error Handling**: Wrap all route logic in try/catch
- **Error Logging**: Log errors with `console.error` before sending response
- **Error Responses**: Return JSON with `{ error: { message: string } }` structure
- **Success Responses**: Use appropriate status codes (200, 201, 204)
- **Business Logic**: Delegate to lib/queries functions, keep routes thin

## Database Queries

### Query Pattern
```typescript
import { pool } from "@/lib/db";
import type { PoolClient } from "pg";

export default async function getUserByClerkId(
  clerkId: string,
  client?: PoolClient
) {
  const database = client ?? pool;
  
  const result = await database.query(
    `SELECT id, email, created_at FROM users WHERE clerk_id = $1`,
    [clerkId]
  );
  
  if (result.rowCount === 0) {
    throw new Error("User not found");
  }
  
  return result.rows[0];
}
```

### Database Patterns
- **Location**: All queries in `apps/web/lib/queries/` organized by entity
- **Pool Client**: Accept optional `client?: PoolClient` for transaction support
- **Default Pool**: Use `const database = client ?? pool;`
- **Parameterization**: Always use parameterized queries (`$1`, `$2`, etc.)
- **Error Handling**: Throw descriptive errors for not found or validation failures
- **Upserts**: Use CTE pattern with `WITH updated AS ... inserted AS ...`
- **Encryption**: Encrypt sensitive data (tokens) before storing

### Transaction Pattern
```typescript
const client = await pool.connect();
try {
  await client.query("BEGIN");
  const user = await getUserByClerkId(clerkId, client);
  await updateUserRecord(user.id, data, client);
  await client.query("COMMIT");
} catch (error) {
  await client.query("ROLLBACK");
  throw error;
} finally {
  client.release();
}
```

## Error Handling

### In Library/Utility Functions
```typescript
export function getRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing ${name} env var`);
  }
  return value;
}
```

### In API Routes
```typescript
try {
  // Business logic
} catch (error) {
  console.error("Error performing operation:", error);
  return Response.json(
    { error: { message: "Failed to perform operation" } },
    { status: 500 }
  );
}
```

### In UI Components
```typescript
const [errorDialog, setErrorDialog] = useState<ErrorDialog | null>(null);

async function handleAction() {
  try {
    const res = await fetch("/api/endpoint", { method: "POST" });
    if (!res.ok) {
      const data = await res.json();
      setErrorDialog({
        title: "Action Failed",
        message: data.error?.message || "Unknown error"
      });
      return;
    }
    // Success handling
  } catch (error) {
    setErrorDialog({
      title: "Action Failed",
      message: "An unexpected error occurred"
    });
  }
}
```

### Error Handling Rules
- **Libs/Utils**: Throw descriptive errors
- **API Routes**: Catch all errors, log them, return JSON error responses
- **UI Components**: Use state for error dialogs, provide user-friendly messages
- **Error Messages**: Be descriptive but don't expose sensitive information
- **Logging**: Always log errors before handling them

## Styling

### Tailwind CSS
- Use Tailwind utility classes for all styling
- Avoid inline styles unless absolutely necessary
- Use semantic color tokens (`primary`, `secondary`, `muted-foreground`, etc.)
- Utilize responsive breakpoints (`sm:`, `md:`, `lg:`) as needed

### Class Utilities
```typescript
import { cn } from "@/lib/utils";
import { cx } from "class-variance-authority";

// For merging classes with proper overrides
<div className={cn("base-classes", className)} />

// For simple concatenation
<div className={cx("base-classes", conditionalClass && "extra-class")} />
```

### Component Variants (CVA)
```typescript
import { cva, type VariantProps } from "class-variance-authority";

const buttonVariants = cva(
  "base-classes-here",
  {
    variants: {
      variant: {
        default: "variant-classes",
        destructive: "destructive-classes",
        outline: "outline-classes"
      },
      size: {
        default: "default-size",
        sm: "small-size",
        lg: "large-size"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
);

function Button({ className, variant, size, ...props }: ButtonProps) {
  return (
    <button
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}
```

### UI Components
- Use Radix UI primitives wrapped with Tailwind styling (shadcn/ui pattern)
- All reusable UI components in `apps/web/components/ui/`
- Complex components compose from UI primitives

## Authentication and Authorization

### Clerk Integration
```typescript
import { auth } from "@clerk/nextjs/server";

// In server components/API routes
const { userId: clerkUserId } = await auth();
if (!clerkUserId) {
  // Handle unauthorized
}

// Get internal user
const user = await getUserByClerkId(clerkUserId);
```

### Authorization Pattern
1. Check Clerk authentication
2. Get internal user record
3. Verify user has access to requested resource
4. Return 401 for unauthenticated, 403 for unauthorized

## Project Structure

### Monorepo Organization
```
/
├── apps/
│   ├── web/           # Next.js frontend + API
│   └── worker/        # Background job worker
├── packages/
│   ├── shared/        # Shared types and constants
│   ├── typescript-config/
│   └── eslint-config/
└── infrastructure/    # Database schemas, Docker configs
```

### Web App Structure
```
apps/web/
├── app/               # Next.js app router
│   ├── api/          # API routes
│   ├── dashboard/    # Dashboard pages
│   └── ...
├── components/        # React components
│   ├── ui/           # Reusable UI primitives
│   ├── dashboard/    # Dashboard-specific
│   └── shared/       # Shared components
├── lib/              # Utilities and business logic
│   ├── queries/      # Database queries by entity
│   └── ...
├── hooks/            # Custom React hooks
└── types/            # TypeScript types
```

### File Organization
- **Queries**: Organize by entity in `lib/queries/{entity}/{operation}.ts`
- **Components**: Group by feature/domain
- **Types**: Domain-specific types in feature folders, shared in `packages/shared`

## Async/Await Best Practices

### Server Components
```typescript
export default async function Page() {
  const data = await fetchData();
  return <Component data={data} />;
}
```

### Parallel Requests
```typescript
const [user, companies, connections] = await Promise.all([
  getUserByClerkId(clerkId),
  getCompaniesByUser(userId),
  getAccountingConnections(userId)
]);
```

### Client-Side Async
```typescript
async function handleSubmit() {
  try {
    const response = await fetch("/api/endpoint", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message);
    }
    
    const result = await response.json();
    // Handle success
  } catch (error) {
    // Handle error
  }
}
```

## Additional Guidelines

### Environment Variables
- Use `process.env.VARIABLE_NAME` for env vars
- Validate required env vars at startup with helper function
- Never commit sensitive values (use `.env.local`)

### Constants
- Define shared constants in `packages/shared/src/constants/`
- Use `as const` for literal type inference
- Export as named exports

### Comments
- Use JSDoc for public API documentation
- Prefer self-documenting code over comments
- Comment complex business logic or non-obvious decisions

### Testing
- Write tests for critical business logic
- Use descriptive test names
- Keep tests focused and isolated

### Performance
- Use React.memo() sparingly and only when needed
- Implement proper loading states
- Optimize database queries (indexes, efficient joins)
- Use parallel requests where possible

## Common Patterns

### Form Handling
```typescript
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function Form() {
  const [formData, setFormData] = useState({ name: "", email: "" });
  const [loading, setLoading] = useState(false);
  
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      
      if (response.ok) {
        // Success handling
      }
    } catch (error) {
      // Error handling
    } finally {
      setLoading(false);
    }
  }
  
  return (
    <form onSubmit={handleSubmit}>
      <Input
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
      />
      <Button type="submit" disabled={loading}>
        Submit
      </Button>
    </form>
  );
}
```

### Data Formatting
```typescript
// Currency formatting
export function formatCurrency(value: number): string {
  return Number(value).toLocaleString();
}

// Percentage calculations
export function calculatePercentage(value: number, total: number): number {
  if (total === 0) return 0;
  return parseFloat(((value / total) * 100).toFixed(2));
}
```

### Conditional Rendering
```typescript
// Simple conditional
{isLoading && <Spinner />}

// Conditional with fallback
{data ? <DataDisplay data={data} /> : <NoData />}

// Multiple conditions
{isLoading ? (
  <Spinner />
) : error ? (
  <ErrorDisplay error={error} />
) : (
  <DataDisplay data={data} />
)}
```

## Summary

Follow these guidelines to maintain consistency and quality across the codebase:

1. **TypeScript**: Strict mode, explicit types, interfaces for props
2. **Formatting**: Double quotes, semicolons, consistent indentation
3. **Components**: Functional with default export, props interface, destructured params
4. **Imports**: Organized (type → external → aliased → relative)
5. **API Routes**: Async, Clerk auth, try/catch, JSON responses
6. **Database**: Parameterized queries, optional client for transactions
7. **Errors**: Throw in libs, catch in routes, user-friendly messages
8. **Styling**: Tailwind utilities, CVA for variants, semantic tokens
9. **Structure**: Organized by feature/domain, clear separation of concerns

When in doubt, refer to existing code in the codebase for examples that follow these patterns.
