# Quacco Development Guide

## Getting Started

This guide provides instructions for setting up the Quacco development environment, understanding the code organization, and following best practices for development.

### Prerequisites

Before starting development, ensure you have the following installed:

- **Node.js** (v18 or higher)
- **npm** (latest version)
- **Docker** and **Docker Compose** (for local database and Redis)
- **Git**

### Environment Setup

#### 1. Clone the Repository

```bash
git clone https://github.com/your-org/saas-sprawl.git
cd saas-sprawl
```

#### 2. Install Dependencies

```bash
npm install
```

#### 3. Set Up Environment Variables

Create a `.env` file in the root directory based on the `.env.example` template:

```bash
cp .env.example .env
```

Update the following variables in your `.env` file:

- Database connection string
- Auth0 credentials
- Stripe keys
- SendGrid keys
- Third-party integration credentials

#### 4. Start Local Services

Start the PostgreSQL and Redis services using Docker:

```bash
docker-compose up -d
```

#### 5. Set Up the Database

Initialize the database with Prisma:

```bash
npm run db:push
```

For development data, seed the database:

```bash
npm run db:seed
```

#### 6. Start the Development Server

```bash
npm run dev
```

The application should now be running at `http://localhost:3000`.

## Project Structure

### Directory Structure

```
saas-sprawl/
├── app/                  # Next.js App Router pages and API routes
│   ├── api/              # API routes
│   ├── auth/             # Authentication pages
│   ├── dashboard/        # Dashboard pages
│   ├── layout.tsx        # Root layout
│   └── page.tsx          # Landing page
├── components/           # React components
│   ├── dashboard/        # Dashboard-specific components
│   ├── integrations/     # Integration-related components
│   ├── notifications/    # Notification components
│   ├── settings/         # Settings components
│   ├── subscriptions/    # Subscription components
│   └── ui/               # Reusable UI components
├── docs/                 # Documentation
├── hooks/                # Custom React hooks
├── lib/                  # Utility functions and services
│   ├── clients/          # Third-party API clients
│   ├── queue/            # Background job processing
│   └── utils/            # Utility functions
├── prisma/               # Prisma schema and migrations
│   ├── migrations/       # Database migrations
│   └── schema.prisma     # Database schema
├── public/               # Static assets
├── styles/               # Global styles
└── types/                # TypeScript type definitions
```

### Key Files

- `prisma/schema.prisma`: Database schema definition
- `app/layout.tsx`: Root layout with providers
- `middleware.ts`: Authentication middleware
- `lib/auth.ts`: Authentication utilities
- `lib/prisma.ts`: Prisma client instance

## Development Workflow

### Feature Development

1. **Create a Feature Branch**:
   ```bash
   git checkout -b feature/feature-name
   ```

2. **Implement the Feature**:
   - Add necessary components
   - Implement API endpoints
   - Update database schema if needed
   - Add tests

3. **Testing**:
   - Run unit tests: `npm test`
   - Run linting: `npm run lint`
   - Manually test in development environment

4. **Create a Pull Request**:
   - Push your branch: `git push origin feature/feature-name`
   - Create a PR in GitHub
   - Request reviews from team members

### Working with the Database

#### Schema Changes

1. Edit the schema in `prisma/schema.prisma`
2. Generate a migration:
   ```bash
   npx prisma migrate dev --name migration-name
   ```
3. Apply the migration to your local database:
   ```bash
   npx prisma migrate deploy
   ```

#### Using Prisma Studio

Prisma Studio provides a GUI for viewing and editing your database:

```bash
npm run db:studio
```

### Working with API Routes

API routes are located in the `app/api` directory and follow the Next.js App Router conventions:

- `app/api/route.ts`: Handles requests to `/api`
- `app/api/[param]/route.ts`: Handles dynamic routes like `/api/123`
- `app/api/auth/[auth0]/route.ts`: Auth0 authentication routes

## Code Conventions

### TypeScript

- Use strict type checking
- Define interfaces for all data structures
- Use type unions and intersections where appropriate
- Avoid the `any` type unless absolutely necessary

### React Components

- Use functional components
- Use React Hooks for state and effects
- Implement proper prop validation with TypeScript
- Follow the component file structure:
  1. Imports
  2. Types and interfaces
  3. Component function
  4. Helper functions
  5. Exports

### Styling

- Use Tailwind CSS for styling
- Use the Shadcn UI component library
- Follow the mobile-first approach
- Use the `cn` utility for conditional class names

### API Development

- Use proper HTTP status codes
- Validate input with Zod schemas
- Handle errors gracefully
- Return consistent JSON responses

## Testing Strategy

### Unit Tests

- Use Jest for unit testing
- Focus on testing utility functions and hooks
- Mock external dependencies

### Integration Tests

- Test API routes with Next.js testing utilities
- Ensure database operations work correctly
- Test authentication flows

### End-to-End Tests

- Use Playwright for E2E testing
- Test critical user flows
- Verify integrations work correctly

## Deployment

### Vercel Deployment

The application is configured for deployment on Vercel:

1. Connect your GitHub repository to Vercel
2. Configure environment variables in Vercel dashboard
3. Deploy from the main branch

### Environment Variables

Ensure all required environment variables are set in the Vercel project settings:

- `DATABASE_URL`
- `AUTH0_*` variables
- `STRIPE_*` variables
- `SENDGRID_*` variables
- Third-party API credentials

## Troubleshooting

### Common Issues

#### Database Connection Issues

- Verify your database connection string
- Ensure Docker containers are running
- Check for database migration errors

#### Auth0 Issues

- Verify Auth0 credentials
- Check callback URLs in Auth0 dashboard
- Ensure correct Auth0 tenant is being used

#### Integration Issues

- Verify API credentials
- Check OAuth redirect URIs
- Ensure correct scopes are requested

## Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Auth0 Next.js SDK](https://github.com/auth0/nextjs-auth0)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Shadcn UI](https://ui.shadcn.com/docs)

## Contributing

Please read the [CONTRIBUTING.md](./CONTRIBUTING.md) file for details on our code of conduct and the process for submitting pull requests. 