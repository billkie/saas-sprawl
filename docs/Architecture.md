# Quacco - Technical Architecture

## System Architecture

### 1. Overview

Quacco is built using a modern, scalable web architecture following best practices for security, performance, and maintainability. This document outlines the technical architecture of the platform.

### 2. Technology Stack

#### 2.1 Frontend
- **Framework**: Next.js 15+ (App Router)
- **UI Library**: React 18+
- **Styling**: Tailwind CSS with Shadcn UI components
- **State Management**: React Context API, React Query for server state
- **Form Handling**: React Hook Form with Zod validation
- **Authentication**: Auth0 React SDK

#### 2.2 Backend
- **API Routes**: Next.js App Router API routes
- **Authentication**: Auth0 Next.js SDK
- **Database ORM**: Prisma
- **Database**: PostgreSQL
- **Job Scheduling**: BullMQ with Redis
- **Email Service**: SendGrid

#### 2.3 Infrastructure
- **Hosting**: Vercel
- **CI/CD**: GitHub Actions
- **Database Hosting**: Vercel Postgres / AWS RDS
- **Redis Hosting**: Upstash / Redis Labs
- **Monitoring**: Vercel Analytics

### 3. System Components

#### 3.1 Core Services
1. **Authentication Service**
   - Handles user authentication via Auth0
   - Manages user sessions and permissions
   - Syncs user data with the database

2. **Subscription Management Service**
   - Manages CRUD operations for subscriptions
   - Handles subscription categorization and tagging
   - Tracks subscription renewals

3. **Integration Service**
   - Manages connections to third-party services
   - Handles data synchronization and discovery
   - Processes and normalizes data from different sources

4. **Notification Service**
   - Manages in-app and email notifications
   - Handles notification preferences
   - Schedules renewal reminders

5. **Billing Service**
   - Handles platform subscription management via Stripe
   - Processes payments and upgrades
   - Manages usage limits and quotas

#### 3.2 Background Jobs
- **Scheduled Syncs**: Regular integration data synchronization
- **Renewal Checks**: Daily check for upcoming renewals
- **Usage Reports**: Monthly usage report generation
- **Data Backups**: Regular database backups

### 4. Database Schema

#### 4.1 Core Entities
- **User**: User account information
- **Company**: Organization details
- **CompanyUser**: User-company relationship with roles
- **Subscription**: SaaS subscription details
- **DiscoveredApp**: Automatically discovered applications
- **Notification**: User notifications
- **BillingLog**: Platform billing records
- **Integration**: Third-party integration configurations

#### 4.2 Key Relationships
- Users belong to Companies through CompanyUser junction table
- Companies have many Subscriptions
- Companies have many Integrations
- Subscriptions may have many DiscoveredApps
- Companies have many Notifications

#### 4.3 Schema Migrations
- Managed through Prisma migrations
- Version controlled in repository

### 5. API Design

#### 5.1 REST API Endpoints
- `/api/auth/*`: Authentication endpoints (handled by Auth0)
- `/api/subscriptions/*`: Subscription management
- `/api/integrations/*`: Integration management
- `/api/notifications/*`: Notification management
- `/api/billing/*`: Billing management

#### 5.2 API Security
- JWT token validation for all authenticated endpoints
- Role-based access control
- Rate limiting and request validation

### 6. Authentication Flow

#### 6.1 Sign-up Process
1. User initiates sign-up via Auth0
2. Auth0 handles authentication and returns to callback URL
3. System creates user record if not exists
4. System creates or associates company account
5. User is redirected to dashboard

#### 6.2 Authentication
1. Auth0 handles authentication flow
2. JWT tokens are validated on protected routes
3. User session is maintained with Auth0 session management

### 7. Integration Architecture

#### 7.1 QuickBooks Integration
1. OAuth 2.0 authorization flow for connection
2. Scheduled transaction data retrieval
3. Analyze transactions for recurring patterns
4. Map transactions to subscription records
5. Periodic refresh of data

#### 7.2 Google Workspace Integration
1. OAuth 2.0 authorization flow for connection
2. App usage data retrieval from Admin SDK
3. Discovery of third-party applications
4. Map applications to subscription records
5. Track application usage and licenses

### 8. Deployment Architecture

#### 8.1 Environment Strategy
- **Development**: Local development environment
- **Staging**: Production-like environment for testing
- **Production**: Live environment

#### 8.2 Deployment Workflow
1. Code changes are pushed to GitHub
2. CI/CD pipeline runs tests and builds
3. Successful builds are deployed to appropriate environment
4. Database migrations are applied
5. New version is monitored for issues

#### 8.3 Scaling Strategy
- Vercel's serverless architecture handles auto-scaling
- Database connection pooling for database scaling
- Read replicas for high-load scenarios
- Redis caching for performance optimization

### 9. Security Considerations

#### 9.1 Data Security
- All sensitive data encrypted at rest
- PII handled according to GDPR and privacy regulations
- Secure API keys and credentials management
- Regular security audits

#### 9.2 Authentication Security
- Auth0 handles secure authentication
- MFA support for users
- Strong password policies
- Session timeout management

#### 9.3 API Security
- Input validation on all API endpoints
- CSRF protection
- Rate limiting to prevent abuse
- API key rotation for third-party services

### 10. Monitoring and Logging

#### 10.1 Application Monitoring
- Error tracking and reporting
- Performance monitoring
- Usage analytics
- Endpoint performance tracking

#### 10.2 Logging Strategy
- Structured logging format
- Log levels (debug, info, warn, error)
- Sensitive data filtering
- Log retention policies

### Appendix

#### A. Third-Party Services
- **Auth0**: Authentication
- **Stripe**: Payment processing
- **SendGrid**: Email delivery
- **QuickBooks API**: Financial data integration
- **Google Workspace API**: Application discovery

#### B. Development Tooling
- TypeScript for type safety
- ESLint for code quality
- Prettier for code formatting
- Jest for testing
- GitHub for source control 