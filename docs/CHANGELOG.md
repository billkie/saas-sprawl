# Changelog

All notable changes to the Quacco SaaS Spend Management Platform will be documented in this file.

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
- Complete Auth0 authentication flow with company onboarding:
  - Added dedicated signup page that redirects to Auth0 with signup hint
  - Created company information collection during onboarding
  - Implemented company creation in database during signup process
  - Updated API endpoints to handle Auth0 authentication correctly
  - Added direct login/signup routes with custom Auth0 authorization URLs
  - Implemented proper error handling for authentication flow
- Client-side authentication components:
  - Created reusable AuthButton component for login and signup handling
  - Implemented proper client-side redirects using Next.js router

### Changed
- Moved `TODO.md` from root directory to `docs/` folder to keep all documentation files in one place
- Updated Auth0 integration to use version 3.5.0 for better compatibility with Next.js App Router
- Improved user onboarding flow to include company information collection
- Updated environment variables to use the correct domain (quacco.com)
- Simplified Auth0 route handlers to avoid TypeScript errors with custom handlers
- Refactored authentication flow to use client components with proper Auth0 SDK integration

### Fixed
- Auth0 session dynamic rendering errors:
  - Added `dynamic = 'force-dynamic'` configuration to dashboard routes
  - Added `dynamic = 'force-dynamic'` configuration to onboarding page to fix cookie usage error
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
- Fixed Auth0 login/signup flow:
  - Updated company-signup route to use the correct Auth0 SDK parameters
  - Fixed blank sign-in and sign-up pages by properly configuring Auth0 redirects
  - Fixed TypeScript errors in Auth0 handler parameters
  - Properly configured environment variables for Auth0 integration
  - Resolved build errors related to incompatible Auth0 handler options
  - Implemented custom login/signup routes with proper state parameter serialization
  - Added error handling to authentication routes for better user experience
- Fixed authentication flow issues with signup and login:
  - Updated login button to correctly point to `/api/auth/login` instead of `/login`
  - Updated signup button to correctly point to `/api/auth/login?screen_hint=signup` instead of `/signup`
  - This resolves issues with signup and login on dev.quacco.com
- Resolved conflicting Auth0 implementations:
  - Removed custom login/signup route handlers that were conflicting with Auth0 SDK
  - Enhanced API route handler to properly support all Auth0 operations
  - Added explicit returnTo and redirectUri parameters to Auth0 handler to ensure proper redirection
- Completely revamped Auth0 implementation following best practices:
  - Created client-side AuthButton component for proper programmatic authentication
  - Simplified Auth0 route handler configuration to avoid type conflicts
  - Updated sign in and sign up pages to use the client component instead of direct links
- Fixed critical Auth0 build error:
  - Resolved `TypeError: Cannot read properties of undefined (reading 'headers')` during build
  - Implemented dynamic imports for Auth0 SDK to prevent execution during build time
  - Added `dynamic = 'force-dynamic'` flag to Auth0 API route
  - Refactored Auth0 route handler to use request-based API compatible with App Router
  - Separated GET and POST handler implementations for better build compatibility
- Fixed TypeScript type error in Auth0 route handler:
  - Resolved type mismatch with params in route handler functions
  - Added explicit RouteParams type to match Next.js App Router expectations
  - Updated handler to use the proper context object structure
  - Fixed build error related to Promise type mismatch in params
- Restructured Auth0 route implementation for compatibility with Next.js App Router:
  - Separated Auth0 SDK initialization into dedicated auth-handler.ts file
  - Implemented build-safe dynamic imports with error handling
  - Simplified route handler structure to align with App Router requirements
  - Added explicit route validation for better error handling
  - Implemented proper error responses for failed authentication
- Resolved Next.js 15 async parameter type error in Auth0 handler:
  - Fixed critical type mismatch error with route parameters in Auth0 route handler
  - Refactored Auth0 integration to properly handle async parameters in Next.js 15
  - Integrated Auth0 handler directly into route file with proper parameter type handling
  - Simplified authentication flow by removing unnecessary dynamic imports
  - Added proper TypeScript typing to match Next.js 15 App Router requirements
- Fixed critical Next.js 15 Promise-based route params type issue:
  - Completely refactored Auth0 route handler to match Next.js 15's exact type expectations
  - Changed route parameter definition to use Promise type correctly: `params: Promise<{ auth0: string }>`
  - Implemented proper Promise resolution with `await params` pattern
  - Created a reusable handler function to encapsulate Auth0 logic while maintaining type safety
  - Separated Auth0 configuration from handler instantiation to avoid type conflicts
- Fixed Auth0 login and signup functionality errors:
  - Completely refactored Auth0 route handler to properly handle all Auth0 operations
  - Added support for `screen_hint=signup` parameter to enable signup functionality
  - Enhanced AuthButton component with loading state and improved error handling
  - Fixed 500 error during login by properly configuring auth parameters
  - Fixed 404 error during signup by correctly passing screen_hint to Auth0
  - Added specific returnTo paths for login and signup flows
  - Improved error handling with status code preservation and detailed error messages
  - Added Auth0 profile handling for user information retrieval
  - Ensured proper redirect_uri configuration in Auth0 login parameters
- Implemented final Auth0 integration fix for login and signup:
  - Fixed login 500 error: "Cannot destructure property 'params' of 'n' as it is undefined"
  - Fixed signup 404 error: "Auth route 'signup' not found"
  - Completely rewrote Auth0 handler using the official Auth0 factory pattern
  - Added dedicated signup handler with proper screen_hint configuration
  - Simplified route handlers to eliminate parameter destructuring issues
  - Updated AuthButton component to use the correct signup/login endpoints
  - Applied the exact pattern from Auth0's official Next.js App Router documentation
  - Removed all custom route handling code that was causing conflicts
  - Added proper error context forwarding for Auth0 operations
- Implemented definitive Auth0 build and runtime fix:
  - Resolved the final build error: "Cannot read properties of undefined (reading 'headers')"
  - Implemented true dynamic imports for Auth0 SDK to completely prevent build-time evaluation
  - Fixed Auth0 handler initialization to only occur at runtime, not during build
  - Corrected request parameter type to use standard Web Request interface
  - Eliminated context parameter that was causing destructuring errors
  - Maintained dedicated signup route with proper screen_hint configuration
  - Ensured proper login/signup functionality while fixing build errors
  - Applied the most reliable pattern for Next.js App Router + Auth0 integration
  - Fully complies with Next.js 15 build requirements and Auth0 SDK expectations

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