# Expert Interview Evaluator

This is a [T3 Stack](https://create.t3.gg/) project bootstrapped with `create-t3-app`.

## T3 Stack Overview

The T3 Stack is a web development stack created by Theo focusing on simplicity, modularity, and full-stack type safety. It consists of:

- **Next.js** - React framework for production
- **TypeScript** - Strongly typed programming language that builds on JavaScript
- **Tailwind CSS** - Utility-first CSS framework
- **tRPC** - End-to-end typesafe APIs without schemas or code generation
- **Prisma** - Type-safe ORM for TypeScript and Node.js
- **NextAuth.js** - Authentication library for Next.js

This stack follows three core axioms:

1. **Solve Problems** - Each technology added solves a specific problem
2. **Bleed Responsibly** - Use bleeding-edge tech in less risky parts of the stack
3. **Typesafety Isn't Optional** - Full typesafety between frontend and backend

## Project Structure

```
├── prisma/               # Prisma ORM configuration
│   └── schema.prisma     # Database schema definition
├── public/               # Static assets
├── src/
│   ├── app/              # Next.js App Router components
│   │   ├── _components/  # Shared React components
│   │   ├── api/          # API routes
│   │   ├── layout.tsx    # Root layout
│   │   └── page.tsx      # Homepage
│   ├── env.js            # Environment variable validation
│   ├── server/           # Server-side code
│   │   ├── api/          # tRPC API definitions
│   │   │   ├── root.ts   # tRPC router configuration
│   │   │   ├── routers/  # tRPC routers
│   │   │   └── trpc.ts   # tRPC context and procedure helpers
│   │   └── db.ts         # Database client
│   ├── styles/           # Global styles
│   └── trpc/             # tRPC client configuration
│       ├── react.tsx     # React integration
│       ├── server.ts     # Server-side tRPC setup
│       └── query-client.ts # TanStack Query client setup
```

## Key Technologies

### Next.js (v15)

- Uses the App Router for routing and React Server Components
- Supports server-side rendering, static site generation, and API routes

### TanStack Query + tRPC

- End-to-end typesafe API layer with integrated React Query
- Server procedures defined in `/src/server/api/routers/`
- tRPC router mounted in `/src/server/api/root.ts`
- Client-side tRPC hooks in `/src/trpc/react.tsx`

### Prisma ORM

- Type-safe database client for PostgreSQL
- Schema defined in `/prisma/schema.prisma`
- Database instance initialized in `/src/server/db.ts`

### Type Safety

- TypeScript for static type checking
- Zod for runtime validation (used in environment variables and tRPC inputs)
- End-to-end type safety from database to frontend with Prisma and tRPC

### Development Tools

- ESLint for code linting
- Prettier for code formatting
- TypeScript for type checking
- Tailwind CSS for styling

## Available Scripts

- `pnpm dev` - Start the development server with Turbo
- `pnpm build` - Build the application for production
- `pnpm start` - Start the production server
- `pnpm lint` - Run ESLint
- `pnpm format:check` - Check code formatting
- `pnpm format:write` - Fix code formatting
- `pnpm typecheck` - Run TypeScript type checking
- `pnpm db:push` - Push schema changes to the database
- `pnpm db:generate` - Generate Prisma client
- `pnpm db:studio` - Open Prisma Studio

## Environment Setup

The project uses `@t3-oss/env-nextjs` for environment variable validation. Required environment variables:

- `DATABASE_URL` - PostgreSQL connection string

## Deployment Options

- **Vercel** - Recommended deployment platform for Next.js apps
- **Netlify** - Alternative deployment platform
- **Docker** - For custom deployments

## Resources

- [T3 Stack Documentation](https://create.t3.gg/)
- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://prisma.io/docs)
- [tRPC Documentation](https://trpc.io/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

For more information or help, check the T3 community on [Discord](https://t3.gg/discord).
