# Expert Interview Evaluator

The Expert Interview Evaluator is a browser-based platform that transforms raw evaluation data into expert-curated insights for model teams. The system allows users to upload a CSV file containing questions and candidate answers, which are then converted into shareable interview links. Subject-matter experts interact with these links to evaluate and compare model responses through a natural conversation with an AI interviewer. The platform records their preferences and reasoning, then automatically analyzes the conversations to produce structured artifacts including scores, knowledge gaps, and prompt improvement suggestions. These insights are made available through an interactive dashboard and can be exported as CSV files.

-GPT4o

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
├── analysis-server/      # Server for processing interview analysis
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
