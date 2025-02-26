# Changelog

All notable changes to the Ziruna SaaS Spend Management Platform will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Comprehensive documentation in the `docs` folder:
  - `PRD.md`: Product Requirements Document outlining all functional requirements
  - `Architecture.md`: Technical architecture documentation including stack, components, and infrastructure
  - `DevelopmentGuide.md`: Guide for developers working on the project
  - `APIReference.md`: Detailed API documentation with endpoints and examples
  - `CHANGELOG.md`: This changelog file
  - `TODO.md`: Detailed task list with checkboxes for project implementation

### Changed
- Moved `TODO.md` from root directory to `docs/` folder to keep all documentation files in one place

### Fixed
- Auth0 session dynamic rendering errors:
  - Added `dynamic = 'force-dynamic'` configuration to dashboard routes
  - Fixed "Route couldn't be rendered statically because it used `cookies`" build warnings
  - Properly configured Next.js to handle Auth0 authentication in dynamic routes
  - Enhanced middleware configuration with `unstable_allowDynamic` for Auth0 packages
  - Added modularized imports configuration in `next.config.js` for better Auth0 component handling
  - Integrated Next.js bundle analyzer for improved dependency management
  - Fixed critical build errors by changing Auth0 imports from `@auth0/nextjs-auth0` to `@auth0/nextjs-auth0/edge`
  - Replaced problematic modularizeImports with transpilePackages configuration
  - Added dynamic export to dashboard layout for proper Auth0 session handling
- TypeScript error in `lib/integrations.ts`:
  - Added explicit include of `discoveredApps` relation in the query to fix property type error
- QuickBooks integration build error:
  - Refactored QuickBooks client to use dynamic imports for OAuthClient
  - Implemented lazy loading of OAuthClient to prevent build-time errors
  - Added fallback mock implementation for build process
  - Updated route handlers to use the new async authorization methods

## [0.1.0] - 2024-06-01

### Added
- Initial project setup with Next.js 15, React, and TypeScript
- Auth0 integration for authentication
- Prisma ORM integration with PostgreSQL
- SaaS subscription management core functionality
- Dashboard for subscription overview
- Notifications system for renewal alerts
- Stripe integration for billing
- QuickBooks integration for financial data import
- Google Workspace integration for app discovery
- Background job processing with BullMQ and Redis
- Email notification system with SendGrid
- Shadcn UI components for consistent design
- Tailwind CSS for styling

### Fixed
- Next.js 15 compatibility issues with route handlers:
  - Updated route handlers to handle asynchronous params according to Next.js 15 migration guide
  - Modified `app/api/subscriptions/[id]/route.ts` to use async params pattern
  - Updated Auth0 route handler to support async params pattern
  - Fixed type definition in `types/next.d.ts` to reflect that route params are now a Promise

- Type errors in various components:
  - Added Route type annotations to all Next.js Link components:
    - Fixed `components/dashboard/side-nav.tsx` Link href type errors 
    - Fixed `components/dashboard/top-nav.tsx` Link href type errors
    - Fixed `components/notifications/notification-bell.tsx` Link href type errors
    - Fixed `app/auth/signin/page.tsx` Link href type errors

- Status comparison errors in `components/settings/billing-settings.tsx`:
  - Changed status comparison from lowercase 'active' to uppercase 'ACTIVE'
  - Fixed Badge variant conditional logic

- Missing parameter error in `components/subscriptions/add-subscription-button.tsx`:
  - Added the missing userId parameter to createSubscription function call

- Property name error in `components/subscriptions/subscription-list.tsx`:
  - Changed property reference from 'autoRenew' to 'autoRenewal' to match schema definition

- Integration service issues:
  - Added null check for 'discoveredApps' property in `lib/integrations.ts`
  - Fixed DiscoveredApp creation/update logic in Google Workspace integration

- BullMQ compatibility issues:
  - Replaced QueueScheduler with QueueEvents in `lib/queue/index.ts`
  - Updated job processing functions to accept zero arguments
  - Fixed queue initialization and cleanup functions

- Stripe API version update:
  - Updated Stripe API version from '2023-10-16' to '2025-01-27.acacia' in `lib/stripe.ts`

## [0.0.1] - 2024-05-15

### Added
- Project initialization
- Basic repository structure
- Initial Next.js setup with App Router
- Environment configuration
- Docker setup for local development
- CI/CD pipeline configuration with GitHub Actions
- Vercel deployment configuration 