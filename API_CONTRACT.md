# MuslimEEN API Contract

## Base URL
```
https://api.muslimeen.org/v1
```

## Authentication

All API requests (except authentication endpoints) require a Bearer token in the Authorization header:
```
Authorization: Bearer {jwt_token}
```

## Response Format

All responses follow this structure:
```json
{
  "success": true,
  "data": {},
  "message": "Optional message",
  "error": null
}
```

Error responses:
```json
{
  "success": false,
  "data": null,
  "message": "Error description",
  "error": {
    "code": "ERROR_CODE",
    "details": {}
  }
}
```

## Endpoints

### Authentication

#### Validate Invitation Code
```
POST /auth/validate-invitation
```

Request:
```json
{
  "invitationCode": "string (12 characters)"
}
```

Response:
```json
{
  "success": true,
  "data": {
    "valid": true,
    "inviter": {
      "id": "usr_123",
      "name": "Yusuf Ibrahim",
      "trustScore": 890
    },
    "expiresAt": "2024-06-01T00:00:00Z"
  }
}
```

#### Login
```
POST /auth/login
```

Request:
```json
{
  "email": "user@example.com",
  "password": "string",
  "invitationCode": "string (optional, required for first login)",
  "biometricCredential": {} // Optional, for biometric login
}
```

Response:
```json
{
  "success": true,
  "data": {
    "token": "jwt_token_string",
    "user": {
      "id": "usr_001",
      "email": "user@example.com",
      "firstName": "Ahmed",
      "lastName": "Hassan",
      "fullName": "Ahmed Hassan",
      "role": "muslim_verified",
      "verificationTier": "full",
      "trustScore": 785,
      "badges": ["biometric", "two_witness", "institutional"]
    },
    "expiresAt": "2024-06-01T00:00:00Z"
  }
}
```

#### Logout
```
POST /auth/logout
```

Response:
```json
{
  "success": true,
  "data": null
}
```

### User Management

#### Get User Profile
```
GET /user/profile
```

Response:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "usr_001",
      "email": "ahmed@example.com",
      "firstName": "Ahmed",
      "lastName": "Hassan",
      "fullName": "Ahmed Hassan",
      "role": "muslim_verified",
      "verificationTier": "full",
      "trustScore": 785,
      "trustScoreHistory": [
        {"date": "2024-01-01", "score": 700},
        {"date": "2024-02-01", "score": 720}
      ],
      "bio": "Software Engineer | Islamic Finance Enthusiast",
      "location": "London, UK",
      "industry": "Technology",
      "skills": ["JavaScript", "Islamic Finance", "Project Management"],
      "endorsements": 47,
      "connections": 234,
      "profileViews": 128,
      "isWitnessEligible": true,
      "badges": ["biometric", "two_witness", "institutional"],
      "workHistory": [
        {
          "id": "wh_001",
          "company": "HalalTech Solutions",
          "title": "Senior Software Engineer",
          "startDate": "2022-03-01",
          "endDate": null,
          "current": true,
          "description": "Leading development of Shariah-compliant fintech"
        }
      ],
      "education": [
        {
          "id": "edu_001",
          "institution": "University of Manchester",
          "degree": "MSc Computer Science",
          "startDate": "2017-09-01",
          "endDate": "2019-05-01"
        }
      ],
      "createdAt": "2023-01-15T10:30:00Z",
      "lastLogin": "2024-05-20T08:45:00Z"
    }
  }
}
```

#### Update User Profile
```
PUT /user/profile
```

Request:
```json
{
  "firstName": "Ahmed",
  "lastName": "Hassan",
  "bio": "Updated bio",
  "location": "London, UK",
  "industry": "Technology",
  "skills": ["JavaScript", "Islamic Finance"]
}
```

Response:
```json
{
  "success": true,
  "data": {
    "user": { /* Updated user object */ }
  }
}
```

### Trust Score

#### Get Trust Score Details
```
GET /user/trust-score
```

Response:
```json
{
  "success": true,
  "data": {
    "score": 785,
    "maxScore": 1000,
    "tier": "high",
    "history": [
      {"date": "2024-01-01", "score": 700},
      {"date": "2024-02-01", "score": 720}
    ],
    "factors": [
      {
        "name": "Profile Completeness",
        "impact": 50,
        "positive": true,
        "percentage": 85
      },
      {
        "name": "Connection Quality",
        "impact": 30,
        "positive": true,
        "percentage": 70
      },
      {
        "name": "Community Contributions",
        "impact": 25,
        "positive": true,
        "percentage": 60
      },
      {
        "name": "Verification Level",
        "impact": 100,
        "positive": true,
        "percentage": 100
      }
    ],
    "communityAverage": 650,
    "percentile": 85
  }
}
```

### Notifications

#### Get Notifications
```
GET /user/notifications
```

Query Parameters:
- `unreadOnly` (boolean, optional) - Filter to unread only
- `limit` (number, optional) - Maximum results (default: 20)
- `offset` (number, optional) - Pagination offset

Response:
```json
{
  "success": true,
  "data": {
    "notifications": [
      {
        "id": "notif_001",
        "type": "connection_request",
        "title": "New Connection Request",
        "message": "Fatima Al-Rashid wants to connect",
        "read": false,
        "createdAt": "2024-05-20T09:00:00Z",
        "actor": {
          "id": "usr_002",
          "name": "Fatima Al-Rashid",
          "trustScore": 820
        },
        "actionUrl": "/connections/pending"
      }
    ],
    "unreadCount": 3,
    "total": 45
  }
}
```

#### Mark Notification as Read
```
PUT /user/notifications/{notificationId}/read
```

### Connections

#### Get Connections
```
GET /user/connections
```

Query Parameters:
- `status` (string, optional) - "connected", "pending", "suggested"
- `search` (string, optional) - Search by name
- `industry` (string, optional) - Filter by industry
- `limit` (number, optional)
- `offset` (number, optional)

Response:
```json
{
  "success": true,
  "data": {
    "connections": [
      {
        "id": "usr_004",
        "name": "Yusuf Ibrahim",
        "title": "Islamic Finance Consultant",
        "trustScore": 890,
        "mutualConnections": 12,
        "verified": true,
        "badges": ["biometric", "business"],
        "connectedAt": "2024-01-15T10:30:00Z"
      }
    ],
    "total": 234
  }
}
```

#### Send Connection Request
```
POST /user/connections
```

Request:
```json
{
  "userId": "usr_005",
  "message": "Optional personal message"
}
```

#### Accept/Reject Connection
```
PUT /user/connections/{connectionId}
```

Request:
```json
{
  "status": "accepted" // or "rejected"
}
```

### Feed

#### Get Feed
```
GET /feed
```

Query Parameters:
- `type` (string, optional) - "all", "jobs", "ventures", "connections", "endorsements"
- `limit` (number, optional)
- `offset` (number, optional)

Response:
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "feed_001",
        "type": "job_posting",
        "author": {
          "id": "usr_007",
          "name": "Islamic Bank of Britain",
          "trustScore": 950,
          "verified": true
        },
        "title": "Senior Islamic Finance Analyst",
        "content": "We are seeking an experienced analyst...",
        "location": "London, UK",
        "salary": "£60,000 - £80,000",
        "postedAt": "2024-05-20T08:00:00Z",
        "likes": 24,
        "comments": 8
      }
    ],
    "total": 156
  }
}
```

### Marketplace

#### Get Marketplace Items
```
GET /marketplace/{vertical}
```

Path Parameters:
- `vertical` - "earn", "build", "live", "protect"

Query Parameters:
- `category` (string, optional)
- `location` (string, optional)
- `trustScoreMin` (number, optional)
- `search` (string, optional)
- `limit` (number, optional)
- `offset` (number, optional)

Response:
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "svc_001",
        "provider": {
          "id": "usr_009",
          "name": "Dr. Amina Hassan",
          "trustScore": 945,
          "verified": true
        },
        "category": "Professional Services",
        "subcategory": "Medical",
        "title": "Halal Cosmetic Surgery Consultation",
        "description": "Board-certified surgeon specializing...",
        "rate": "£200 consultation",
        "location": "Manchester, UK",
        "endorsements": 34
      }
    ],
    "total": 1247
  }
}
```

#### Create Marketplace Listing
```
POST /marketplace/{vertical}
```

Request:
```json
{
  "category": "Professional Services",
  "title": "Service Title",
  "description": "Detailed description",
  "rate": "£100/hour",
  "location": "London, UK"
}
```

### Islamic Finance

#### Get Sadaqah Campaigns
```
GET /islamic-finance/sadaqah
```

Response:
```json
{
  "success": true,
  "data": {
    "campaigns": [
      {
        "id": "sdq_001",
        "name": "Emergency Relief Fund",
        "organization": "Muslim Aid UK",
        "description": "Providing emergency assistance...",
        "goal": 100000,
        "raised": 67000,
        "donors": 234,
        "daysLeft": 15,
        "imageUrl": "..."
      }
    ]
  }
}
```

#### Make Donation
```
POST /islamic-finance/sadaqah/{campaignId}/donate
```

Request:
```json
{
  "amount": 100,
  "currency": "GBP",
  "anonymous": false,
  "message": "Optional message"
}
```

#### Get Waqf List
```
GET /islamic-finance/waqf
```

Response:
```json
{
  "success": true,
  "data": {
    "waqf": [
      {
        "id": "wqf_001",
        "name": "Community Center Waqf",
        "location": "East London",
        "description": "Permanent endowment supporting...",
        "value": 2500000,
        "annualIncome": 75000,
        "beneficiaries": 1200
      }
    ]
  }
}
```

#### Calculate Zakat
```
POST /islamic-finance/zakat/calculate
```

Request:
```json
{
  "cash": 10000,
  "gold": 5000,
  "silver": 1000,
  "investments": 25000,
  "debts": 5000,
  "nisabType": "gold" // or "silver"
}
```

Response:
```json
{
  "success": true,
  "data": {
    "totalWealth": 36000,
    "deductibleDebts": 5000,
    "zakatableWealth": 31000,
    "nisabThreshold": 4000,
    "zakatPayable": true,
    "zakatAmount": 775,
    "distribution": {
      "poor": 193.75,
      "needy": 193.75,
      "zakatAdministrators": 193.75,
      "thoseWhoseHearts": 193.75
    }
  }
}
```

#### Get Qard Hasan Opportunities
```
GET /islamic-finance/qardhasan
```

Response:
```json
{
  "success": true,
  "data": {
    "loans": [
      {
        "id": "qh_001",
        "borrower": {
          "id": "usr_014",
          "name": "Small Business Owner",
          "trustScore": 720
        },
        "amount": 5000,
        "purpose": "Equipment purchase for halal catering business",
        "term": 12,
        "repaid": 2500,
        "lenders": 3
      }
    ]
  }
}
```

### Messaging

#### Get Conversations
```
GET /messages
```

Response:
```json
{
  "success": true,
  "data": {
    "conversations": [
      {
        "id": "conv_001",
        "participant": {
          "id": "usr_002",
          "name": "Fatima Al-Rashid",
          "avatar": "FA"
        },
        "lastMessage": {
          "content": "As-salamu alaykum...",
          "sentAt": "2024-05-20T09:30:00Z",
          "read": false
        },
        "unreadCount": 2
      }
    ]
  }
}
```

#### Get Messages
```
GET /messages/{conversationId}
```

Response:
```json
{
  "success": true,
  "data": {
    "messages": [
      {
        "id": "msg_001",
        "senderId": "usr_002",
        "content": "As-salamu alaykum Ahmed",
        "sentAt": "2024-05-20T09:30:00Z",
        "read": true
      }
    ]
  }
}
```

#### Send Message
```
POST /messages/{conversationId}
```

Request:
```json
{
  "content": "Message content"
}
```

## Error Codes

| Code | Description | HTTP Status |
|------|-------------|-------------|
| `INVALID_INVITATION` | Invitation code is invalid or expired | 400 |
| `INVALID_CREDENTIALS` | Email or password is incorrect | 401 |
| `UNAUTHORIZED` | Missing or invalid authentication | 401 |
| `FORBIDDEN` | User lacks required permissions | 403 |
| `NOT_FOUND` | Resource not found | 404 |
| `VALIDATION_ERROR` | Request validation failed | 422 |
| `RATE_LIMITED` | Too many requests | 429 |
| `SERVER_ERROR` | Internal server error | 500 |

## Rate Limits

- Authentication: 5 requests per minute
- General API: 100 requests per minute
- Messaging: 60 messages per minute

## Webhooks

The platform supports webhooks for real-time notifications:

### Events
- `connection.requested`
- `connection.accepted`
- `message.received`
- `trust_score.changed`
- `verification.completed`

### Webhook Payload
```json
{
  "event": "connection.requested",
  "timestamp": "2024-05-20T09:00:00Z",
  "data": {
    "userId": "usr_001",
    "connectionId": "usr_002"
  }
}
```

## Versioning

API versioning is handled through the URL path. Current version: `v1`

Breaking changes will result in a new version (v2, v3, etc.) with 6 months notice.
