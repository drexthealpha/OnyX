---
name: api-design
description: REST API design patterns including resource naming, status codes, pagination, filtering, error responses, versioning, and rate limiting for production APIs.
origin: ECC
---

# API Design Patterns

Conventions and best practices for designing consistent, developer-friendly REST APIs.

## When to Activate

- Designing new API endpoints
- Reviewing existing API contracts
- Adding pagination, filtering, or sorting
- Implementing error handling for APIs
- Planning API versioning strategy

## URL Structure

```
GET    /api/v1/users
GET    /api/v1/users/:id
POST   /api/v1/users
PUT    /api/v1/users/:id
PATCH  /api/v1/users/:id
DELETE /api/v1/users/:id

# Sub-resources for relationships
GET    /api/v1/users/:id/orders

# Actions that don't map to CRUD
POST   /api/v1/orders/:id/cancel
POST   /api/v1/auth/login
```

## HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | OK |
| 201 | Created (POST) |
| 204 | No Content (DELETE) |
| 400 | Bad Request (validation) |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 429 | Rate Limited |
| 500 | Server Error |

## Error Response Shape

```json
{
  "error": "ValidationError",
  "message": "topic must be at least 3 characters",
  "code": "INVALID_TOPIC",
  "requestId": "req_abc123"
}
```

## Pagination

```
GET /api/v1/crystals?limit=20&cursor=eyJpZCI6MTIzfQ==
Response:
{
  "data": [...],
  "pagination": {
    "cursor": "eyJpZCI6MTQ0fQ==",
    "hasMore": true,
    "total": 1240
  }
}
```