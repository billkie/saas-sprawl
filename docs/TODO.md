# Ziruna SaaS Spend Management Platform - TODOs

This document tracks the pending tasks and features that need to be implemented for the Ziruna platform.

## User Management & Authentication

- [ ] Complete team management functionality
  - [ ] User invitation system
  - [ ] Role assignment and permissions
- [ ] Implement company profiles management
  - [ ] Company settings page
  - [ ] Company information editing

## Dashboard & Visualization

- [ ] Implement trend indicators
  - [ ] Subscription count changes over time
  - [ ] Spend variations month-to-month
- [ ] Develop renewal calendar view
  - [ ] Interactive calendar UI
  - [ ] Export to external calendars
- [ ] Create spend analysis charts
  - [ ] Time-series visualizations
  - [ ] Category-based breakdown

## Subscription Management

- [ ] Enhance subscription categorization
  - [ ] Tagging system
  - [ ] Custom categories
- [ ] Implement department/team grouping
  - [ ] Department assignment
  - [ ] Department-based reporting
- [ ] Complete subscription filtering and sorting
  - [ ] Advanced filters
  - [ ] Multiple sort criteria

## Reports & Analytics

- [ ] Build spend analytics features
  - [ ] Month-over-month change tracking
  - [ ] Projected annual costs calculator
- [ ] Implement cost-saving opportunities identification
  - [ ] Duplicate subscription detection
  - [ ] Underutilized subscription alerts
- [ ] Create subscription analytics
  - [ ] Subscription growth visualization
  - [ ] Category distribution metrics
- [ ] Develop export capabilities
  - [ ] CSV/Excel export functionality
  - [ ] Custom report builder
- [ ] Implement scheduled report generation
  - [ ] Email delivery of reports
  - [ ] Report scheduling interface

## Integration Enhancements

- [ ] Improve QuickBooks integration
  - [ ] Recurring synchronization
  - [ ] Error handling and recovery
- [ ] Enhance Google Workspace integration
  - [ ] App utilization metrics
  - [ ] License usage tracking
- [ ] Prepare API structure for future integrations
  - [ ] Integration adapter pattern
  - [ ] Standardized data transformation

## Billing & Subscription Plans

- [ ] Complete subscription tier implementation
  - [ ] Basic tier features
  - [ ] Growth tier features
  - [ ] Enterprise tier features
- [ ] Implement usage limits tracking
  - [ ] Usage meters
  - [ ] Limit notifications
- [ ] Create upgrade paths notification
  - [ ] Approaching limit alerts
  - [ ] One-click upgrade process

## Performance & Technical

- [ ] Implement performance optimizations
  - [ ] Ensure dashboard loading < 3 seconds
  - [ ] Optimize component rendering
- [ ] Ensure API response time < 1 second
  - [ ] Endpoint benchmarking
  - [ ] Query optimization
- [ ] Complete security audits
  - [ ] Vulnerability assessment
  - [ ] GDPR compliance verification
- [ ] Implement database partitioning
  - [ ] Schema design for large customers
  - [ ] Query optimization for scale
- [x] Fix TypeScript errors
  - [x] Fix discoveredApps relation type error in lib/integrations.ts
  - [x] Fix QuickBooks OAuthClient constructor issue
  - [ ] Review other potential TypeScript issues

## Documentation & Testing

- [ ] Create end-user documentation
  - [ ] User guides
  - [ ] Tutorial videos
- [ ] Implement test coverage
  - [ ] Unit tests for critical functionality
  - [ ] Integration tests
  - [ ] E2E tests for critical flows
- [ ] Complete API endpoint tests
  - [ ] Request validation
  - [ ] Response validation

## Future Roadmap Items

- [ ] AI-powered spend optimization
  - [ ] Machine learning model for recommendations
  - [ ] Savings opportunity detection
- [ ] Vendor contract management
  - [ ] Contract storage
  - [ ] Terms and conditions tracking
- [ ] License utilization tracking
  - [ ] Usage metrics integration
  - [ ] Underutilized license detection
- [ ] SSO support for enterprise customers
  - [ ] SAML integration
  - [ ] Okta/OneLogin connectors
- [ ] Additional integrations
  - [ ] Slack/Microsoft Teams notifications
  - [ ] Okta user provisioning
  - [ ] OneLogin integration 