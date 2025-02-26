# Ziruna - SaaS Spend Management Platform

## Product Requirements Document

### 1. Introduction

#### 1.1 Purpose
Ziruna is a SaaS Spend Management and Discovery Platform designed to help organizations discover, track, and optimize their SaaS subscriptions. This document outlines the functional requirements and specifications for the platform.

#### 1.2 Scope
The platform will provide tools for SaaS subscription discovery, management, and cost optimization, along with integrations with third-party platforms for automated discovery.

#### 1.3 Target Users
- IT Administrators
- Finance Managers
- Procurement Teams
- Department Heads
- CIOs and CFOs

### 2. User Management

#### 2.1 Authentication & Authorization
- **Auth0 Integration**: Users should be able to sign up and log in using OAuth providers through Auth0
- **User Roles**: Support for different user roles (Owner, Admin, Member)
- **Team Management**: Ability to invite team members and assign roles
- **Company Profiles**: Each user belongs to a company account

#### 2.2 User Profile
- Users can view and edit their profile information
- User details include name, email, and profile picture
- Profile pictures are managed by the authentication provider

### 3. Dashboard

#### 3.1 Overview Dashboard
- **Summary Metrics**: Display total active subscriptions, monthly spend, and upcoming renewals
- **Trend Indicators**: Show changes in subscription count and spend over time
- **Quick Access**: Provide shortcuts to the most used features

#### 3.2 Data Visualization
- Graphical representation of subscription distribution by category
- Spend analysis charts showing costs over time
- Renewal calendar view

### 4. Subscription Management

#### 4.1 Subscription Tracking
- **Subscription List**: Display all tracked subscriptions with filtering and sorting options
- **Subscription Details**: View detailed information about each subscription:
  - Vendor information
  - Cost and billing details
  - Payment frequency
  - Renewal dates
  - Integration source (if discovered)
  - Category and tags

#### 4.2 Subscription CRUD Operations
- **Create**: Manually add new subscriptions with all relevant details
- **Read**: View subscription details and history
- **Update**: Edit subscription information, update status
- **Delete**: Remove subscriptions from tracking

#### 4.3 Subscription Categorization
- Assign categories to subscriptions
- Tag subscriptions for better organization
- Group subscriptions by department/team

### 5. Renewal Management

#### 5.1 Renewal Tracking
- Track upcoming renewals
- Set notification periods for renewals
- Mark auto-renewal status for each subscription

#### 5.2 Renewal Calendar
- Visual calendar view of upcoming renewals
- Export renewal schedule to external calendars

### 6. Integrations

#### 6.1 QuickBooks Integration
- Connect to QuickBooks accounts
- Automatically discover subscriptions from financial transactions
- Sync vendor and payment information
- Recurring synchronization of data

#### 6.2 Google Workspace Integration
- Connect to Google Workspace accounts
- Discover third-party applications used in the organization
- Track app usage and licenses
- Identify potential redundant applications

#### 6.3 Future Integrations
- API structure to support additional integrations
- Potential integrations with other accounting systems and SSO providers

### 7. Notifications

#### 7.1 Notification System
- In-app notification center
- Filter notifications by type and read/unread status
- Mark notifications as read individually or in bulk
- Delete notifications

#### 7.2 Notification Types
- **Renewal Notifications**: Alerts for upcoming subscription renewals
- **Discovery Notifications**: Alerts when new apps are discovered
- **System Notifications**: Platform updates and information

#### 7.3 Email Notifications
- Email delivery for critical notifications
- Customizable email preferences

### 8. Billing & Subscription Plans

#### 8.1 Platform Subscription Tiers
- **Basic**: Limited number of tracked subscriptions, basic features
- **Growth**: Increased subscription limit, additional features
- **Enterprise**: Unlimited subscriptions, all premium features

#### 8.2 Payment Processing
- Stripe integration for subscription payments
- Support for credit card payments
- Billing management portal

#### 8.3 Usage Limits
- Track usage against plan limits
- Provide upgrade paths when approaching limits

### 9. Reports & Analytics

#### 9.1 Spend Analytics
- Total spend by category
- Month-over-month spend changes
- Projected annual costs
- Cost-saving opportunities

#### 9.2 Subscription Analytics
- Growth of subscription count over time
- Distribution by category, department, and payment frequency
- Utilization metrics (if available)

#### 9.3 Export Capabilities
- Export data to CSV/Excel
- Schedule regular reports

### 10. Technical Requirements

#### 10.1 Performance
- Dashboard loading time < 3 seconds
- Support for companies with up to 500 subscriptions
- API response time < 1 second

#### 10.2 Security
- Data encryption in transit and at rest
- Regular security audits
- GDPR and data privacy compliance

#### 10.3 Scalability
- Horizontal scaling capabilities
- Database partitioning for large customers

#### 10.4 Availability
- 99.9% uptime target
- Scheduled maintenance windows

### 11. Future Enhancements (Roadmap)

#### 11.1 Advanced Features
- AI-powered spend optimization recommendations
- Vendor contract management
- License utilization tracking
- SSO support for enterprise customers

#### 11.2 Additional Integrations
- Slack/Microsoft Teams notifications
- SSO providers (Okta, OneLogin)
- Additional financial systems

### 12. Implementation Timeline

#### 12.1 Phase 1: Core Platform (Q1)
- User management
- Basic dashboard
- Manual subscription tracking
- Notification system

#### 12.2 Phase 2: Integrations (Q2)
- QuickBooks integration
- Google Workspace integration
- Enhanced analytics

#### 12.3 Phase 3: Advanced Features (Q3-Q4)
- AI recommendations
- Additional integrations
- Enterprise features

### Appendix

#### A. Glossary of Terms
- **SaaS**: Software as a Service
- **Subscription**: A recurring payment for access to a software application
- **Integration**: Connection to a third-party platform to import data
- **Renewal**: The continuation of a subscription after its current term

#### B. User Personas
1. **Finance Manager**: Focuses on cost tracking and optimization
2. **IT Administrator**: Prioritizes security and application management
3. **Department Head**: Interested in departmental spend and app usage 