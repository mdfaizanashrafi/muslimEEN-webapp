# Swagger/OpenAPI Documentation

## Overview

The MuslimEEN API is documented using OpenAPI 3.0.3 specification. The documentation is available through Swagger UI when the server is running.

## Accessing the Documentation

Once the server is running, access the interactive API documentation at:

```
http://localhost:3001/api-docs
```

## File Structure

```
backend/src/
├── openapi.yaml          # Complete OpenAPI 3.0.3 specification
├── config/
│   ├── swagger.ts        # Swagger configuration and setup
│   └── README.md         # This file
└── server.ts             # Server with Swagger UI endpoint
```

## OpenAPI Specification

The `openapi.yaml` file contains the complete API specification including:

- **Info**: API title, version, description, contact info
- **Servers**: Development and production URLs
- **Security**: Bearer JWT authentication scheme
- **Tags**: Organized by functionality (Auth, User, Profile, etc.)
- **Paths**: All API endpoints with:
  - HTTP methods (GET, POST, PUT, DELETE)
  - Request/response schemas
  - Example requests and responses
  - Error responses (400, 401, 403, 404, 429, 500)
- **Components**: Reusable schemas and response components

### Tags

| Tag | Description |
|-----|-------------|
| Authentication | User login, registration, logout |
| User | User profile management |
| Profile | Profile operations |
| Trust Score | Trust score management |
| Connections | Network connections |
| Notifications | User notifications |
| Invitations | Invitation management |
| Marketplace | Marketplace listings (EARN, BUILD, LIVE, PROTECT) |
| Islamic Finance | Sadaqah, Waqf, Qard Hasan, Zakat |
| Verification | Identity and business verification |
| Admin | Administrative endpoints |
| System | Health and status endpoints |

## Using Swagger UI

### Authentication

1. Click the "Authorize" button in the top right
2. Enter your JWT token: `Bearer <your-token>`
3. Click "Authorize" and close the dialog
4. All authenticated requests will now include the token

### Making Requests

1. Select an endpoint from the list
2. Click "Try it out"
3. Fill in any required parameters
4. Click "Execute"
5. View the response

## Updating the Documentation

When adding new endpoints:

1. Add the path to `openapi.yaml`
2. Define request/response schemas in `components/schemas`
3. Add appropriate tags for organization
4. Include example requests and responses

## Configuration

The `swagger.ts` file exports:

- `swaggerSpec`: The loaded OpenAPI specification
- `swaggerUiOptions`: UI customization options
- `getSwaggerSpec()`: Function to retrieve the spec

## Security

The Swagger UI endpoint (`/api-docs`) is publicly accessible in development but should be restricted in production if needed. The API itself still requires authentication for protected endpoints.

## Related

- [API Contract](../../API_CONTRACT.md) - Detailed API specification
- [Backend README](../../BACKEND_README.md) - Backend integration guide
