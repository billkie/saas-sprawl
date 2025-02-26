# Quacco API Reference

This document outlines the API endpoints available in the Quacco platform, their request and response formats, and authentication requirements.

## Authentication

All API endpoints (except for authentication endpoints) require authentication using a valid Auth0 access token.

### Headers

Include the following headers with all authenticated requests:

```
Authorization: Bearer {access_token}
Content-Type: application/json
```

## Subscription Endpoints

### Get All Subscriptions

Retrieves all subscriptions for the authenticated user's company.

**Endpoint:** `GET /api/subscriptions`

**Authentication:** Required

**Response:**

```json
[
  {
    "id": "subscription_id",
    "vendorName": "Vendor Name",
    "description": "Subscription description",
    "status": "ACTIVE",
    "monthlyAmount": 99.99,
    "currency": "USD",
    "lastTransactionDate": "2023-01-15T12:00:00Z",
    "nextChargeDate": "2023-02-15T12:00:00Z",
    "paymentFrequency": "MONTHLY",
    "billingType": "CREDIT_CARD",
    "category": "PRODUCTIVITY",
    "autoRenewal": true,
    "notifyBefore": 14,
    "source": "MANUAL",
    "discoveredApps": [
      {
        "name": "App Name",
        "website": "https://app-website.com",
        "logoUrl": "https://app-website.com/logo.png",
        "source": "GOOGLE_WORKSPACE",
        "lastSeen": "2023-01-10T12:00:00Z"
      }
    ],
    "_count": {
      "billingLogs": 5
    }
  }
]
```

### Get Subscription by ID

Retrieves a specific subscription by ID.

**Endpoint:** `GET /api/subscriptions/{id}`

**Authentication:** Required

**Parameters:**
- `id`: Subscription ID

**Response:**

```json
{
  "id": "subscription_id",
  "vendorName": "Vendor Name",
  "description": "Subscription description",
  "status": "ACTIVE",
  "monthlyAmount": 99.99,
  "currency": "USD",
  "lastTransactionDate": "2023-01-15T12:00:00Z",
  "nextChargeDate": "2023-02-15T12:00:00Z",
  "paymentFrequency": "MONTHLY",
  "billingType": "CREDIT_CARD",
  "category": "PRODUCTIVITY",
  "autoRenewal": true,
  "notifyBefore": 14,
  "source": "MANUAL",
  "discoveredApps": [
    {
      "name": "App Name",
      "website": "https://app-website.com",
      "logoUrl": "https://app-website.com/logo.png",
      "source": "GOOGLE_WORKSPACE",
      "lastSeen": "2023-01-10T12:00:00Z"
    }
  ],
  "_count": {
    "billingLogs": 5
  }
}
```

### Create Subscription

Creates a new subscription.

**Endpoint:** `POST /api/subscriptions`

**Authentication:** Required

**Request Body:**

```json
{
  "vendorName": "Vendor Name",
  "description": "Subscription description",
  "monthlyAmount": 99.99,
  "currency": "USD",
  "paymentFrequency": "MONTHLY",
  "billingType": "CREDIT_CARD",
  "category": "PRODUCTIVITY",
  "autoRenewal": true,
  "notifyBefore": 14,
  "nextChargeDate": "2023-02-15T12:00:00Z",
  "planId": "default"
}
```

**Response:**

```json
{
  "id": "subscription_id",
  "vendorName": "Vendor Name",
  "description": "Subscription description",
  "status": "ACTIVE",
  "monthlyAmount": 99.99,
  "currency": "USD",
  "paymentFrequency": "MONTHLY",
  "billingType": "CREDIT_CARD",
  "category": "PRODUCTIVITY",
  "autoRenewal": true,
  "notifyBefore": 14,
  "source": "MANUAL",
  "createdAt": "2023-01-15T12:00:00Z"
}
```

### Update Subscription

Updates an existing subscription.

**Endpoint:** `PUT /api/subscriptions/{id}`

**Authentication:** Required

**Parameters:**
- `id`: Subscription ID

**Request Body:**

```json
{
  "planId": "new-plan",
  "status": "CANCELED",
  "startDate": "2023-01-15T12:00:00Z",
  "endDate": "2023-12-15T12:00:00Z"
}
```

**Response:**

```json
{
  "id": "subscription_id",
  "vendorName": "Vendor Name",
  "description": "Subscription description",
  "status": "CANCELED",
  "monthlyAmount": 99.99,
  "currency": "USD",
  "lastTransactionDate": "2023-01-15T12:00:00Z",
  "nextChargeDate": "2023-02-15T12:00:00Z",
  "paymentFrequency": "MONTHLY",
  "billingType": "CREDIT_CARD",
  "category": "PRODUCTIVITY",
  "autoRenewal": true,
  "notifyBefore": 14,
  "source": "MANUAL",
  "updatedAt": "2023-01-16T12:00:00Z"
}
```

### Delete Subscription

Deletes a subscription.

**Endpoint:** `DELETE /api/subscriptions/{id}`

**Authentication:** Required

**Parameters:**
- `id`: Subscription ID

**Response:**

Status code 204 No Content

## Integration Endpoints

### QuickBooks Integration

#### Initiate QuickBooks Connection

Initiates the OAuth flow for connecting to QuickBooks.

**Endpoint:** `POST /api/integrations/quickbooks`

**Authentication:** Required

**Response:**

```json
{
  "authUri": "https://appcenter.intuit.com/connect/oauth2?client_id=..."
}
```

#### Synchronize QuickBooks Data

Manually triggers a sync with QuickBooks data.

**Endpoint:** `GET /api/integrations/quickbooks/sync`

**Authentication:** Required

**Response:**

```json
{
  "message": "Successfully processed 5 recurring vendors",
  "totalTransactions": 150
}
```

### Google Workspace Integration

#### Initiate Google Workspace Connection

Initiates the OAuth flow for connecting to Google Workspace.

**Endpoint:** `POST /api/integrations/google`

**Authentication:** Required

**Response:**

```json
{
  "authUri": "https://accounts.google.com/o/oauth2/auth?client_id=..."
}
```

#### Synchronize Google Workspace Data

Manually triggers a sync with Google Workspace data.

**Endpoint:** `GET /api/integrations/google/sync`

**Authentication:** Required

**Response:**

```json
{
  "message": "Successfully processed 8 apps",
  "totalApps": 12
}
```

## Notification Endpoints

### Get All Notifications

Retrieves all notifications for the authenticated user.

**Endpoint:** `GET /api/notifications`

**Authentication:** Required

**Response:**

```json
[
  {
    "id": "notification_id",
    "type": "renewal",
    "title": "Subscription Renewal",
    "message": "Your Slack subscription will renew in 7 days.",
    "read": false,
    "createdAt": "2023-01-10T12:00:00Z",
    "data": {
      "subscriptionId": "subscription_id",
      "amount": 99.99,
      "currency": "USD",
      "renewalDate": "2023-01-17T12:00:00Z"
    }
  }
]
```

### Mark Notification as Read

Marks a notification as read.

**Endpoint:** `POST /api/notifications/{id}/read`

**Authentication:** Required

**Parameters:**
- `id`: Notification ID

**Response:**

```json
{
  "id": "notification_id",
  "read": true,
  "updatedAt": "2023-01-11T12:00:00Z"
}
```

### Mark All Notifications as Read

Marks all notifications as read.

**Endpoint:** `POST /api/notifications/mark-all-read`

**Authentication:** Required

**Response:**

```json
{
  "count": 5,
  "message": "Marked 5 notifications as read"
}
```

### Delete Notification

Deletes a notification.

**Endpoint:** `DELETE /api/notifications/{id}`

**Authentication:** Required

**Parameters:**
- `id`: Notification ID

**Response:**

Status code 204 No Content

## Billing Endpoints

### Create Checkout Session

Creates a checkout session for subscription upgrade.

**Endpoint:** `POST /api/billing/checkout`

**Authentication:** Required

**Request Body:**

```json
{
  "tier": "GROWTH"
}
```

**Response:**

```json
{
  "url": "https://checkout.stripe.com/pay/cs_test_..."
}
```

### Create Portal Session

Creates a customer portal session for managing subscriptions.

**Endpoint:** `POST /api/billing/portal`

**Authentication:** Required

**Response:**

```json
{
  "portalUrl": "https://billing.stripe.com/p/session/..."
}
```

## Error Responses

All API endpoints use the following error response format:

```json
{
  "error": "Error message",
  "details": "Additional error details or validation errors"
}
```

### Common Error Status Codes

- **400 Bad Request**: Invalid input or validation error
- **401 Unauthorized**: Missing or invalid authentication
- **403 Forbidden**: Insufficient permissions
- **404 Not Found**: Resource not found
- **500 Internal Server Error**: Server-side error

## Rate Limiting

API requests are subject to rate limiting:

- 100 requests per minute per user
- 1,000 requests per hour per user

Exceeding these limits will result in a 429 Too Many Requests response.

## Webhook Endpoints

### Stripe Webhook

Handles Stripe webhook events for subscription management.

**Endpoint:** `POST /api/billing/webhook`

**Authentication:** Stripe signature validation

**Headers:**
- `stripe-signature`: Signature header from Stripe

**Request Body:**
Stripe event object

**Response:**

```json
{
  "received": true
}
```

## API Versioning

The current API version is v1. The API version is included in the response headers:

```
X-API-Version: v1
```

Future API versions will be accessible via URL path versioning:

```
/api/v2/subscriptions
``` 