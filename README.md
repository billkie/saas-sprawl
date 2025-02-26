# Quacco - SaaS Spend Management Platform

![Quacco Logo](./public/logo.svg)

Quacco is a modern SaaS Spend Management and Discovery Platform that helps organizations discover, track, and optimize their SaaS subscriptions.

## 🚀 Features

- **Subscription Management**: Track all your SaaS subscriptions in one place
- **Automated Discovery**: Discover SaaS applications through integration with Google Workspace and QuickBooks
- **Renewal Alerts**: Never miss a renewal with automated notifications
- **Spend Analytics**: Gain insights into your SaaS spend across categories
- **Team Collaboration**: Invite team members to manage subscriptions together
- **Customizable Categories**: Organize subscriptions by department, function, or custom categories

## 📋 Getting Started

### Prerequisites

- Node.js v18 or higher
- npm (latest version)
- Docker and Docker Compose (for local database and Redis)
- Git

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/your-org/saas-sprawl.git
   cd saas-sprawl
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Set up environment variables
   ```bash
   cp .env.example .env
   ```
   Edit the `.env` file with your own values.

4. Start the local services
   ```bash
   docker-compose up -d
   ```

5. Set up the database
   ```bash
   npm run db:push
   ```

6. Start the development server
   ```bash
   npm run dev
   ```
   The application should now be running at `http://localhost:3000`.

## 🏗️ Architecture

Quacco is built with a modern tech stack:

- **Frontend**: Next.js, React, Tailwind CSS, Shadcn UI
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL
- **Authentication**: Auth0
- **Background Jobs**: BullMQ with Redis
- **Email Service**: SendGrid
- **Payment Processing**: Stripe
- **Integrations**: QuickBooks, Google Workspace
- **Deployment**: Vercel

## 📚 Documentation

Detailed documentation is available in the `docs` folder:

- [Product Requirements Document](./docs/PRD.md): Functional requirements and specifications
- [Technical Architecture](./docs/Architecture.md): System architecture, tech stack, and components
- [Development Guide](./docs/DevelopmentGuide.md): Setup instructions and development workflow
- [API Reference](./docs/APIReference.md): API endpoints, request/response formats
- [Changelog](./docs/CHANGELOG.md): Version history and changes

## 🖥️ Screenshots

![Dashboard](./public/screenshots/dashboard.png)
*Main dashboard with subscription overview*

![Subscription List](./public/screenshots/subscriptions.png)
*Subscription management interface*

![Integrations](./public/screenshots/integrations.png)
*Integration management*

## ⚙️ Development

### Key Commands

```bash
# Development server
npm run dev

# Build for production
npm run build

# Run production build
npm start

# Run tests
npm test

# Lint code
npm run lint

# Format code
npm run format

# Database management
npm run db:push      # Push schema changes to database
npm run db:studio    # Open Prisma Studio
```

### Project Structure

```
saas-sprawl/
├── app/                  # Next.js App Router pages and API routes
├── components/           # React components
├── docs/                 # Documentation
├── hooks/                # Custom React hooks
├── lib/                  # Utility functions and services
├── prisma/               # Prisma schema and migrations
├── public/               # Static assets
├── styles/               # Global styles
└── types/                # TypeScript type definitions
```

## 📈 Roadmap

- [ ] AI-powered spend optimization recommendations
- [ ] Vendor contract management
- [ ] License utilization tracking
- [ ] SSO support for enterprise customers
- [ ] Additional integrations (Microsoft 365, Slack)
- [ ] Advanced analytics and reporting
- [ ] Mobile application

## 🤝 Contributing

Please read [CONTRIBUTING.md](./CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

## 📞 Contact

For support or inquiries, please contact us at support@quacco.com. 