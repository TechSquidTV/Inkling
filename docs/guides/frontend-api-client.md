# Frontend API Client Guide

The frontend uses a strongly-typed API client generated from the backend's OpenAPI specification. This ensures type safety for all API requests and responses.

## Location
The client is exported from `web/src/lib/api.ts`.

## Usage

Import the `client` from `@/lib/api`.

```typescript
import { client } from '@/lib/api'

// GET request
const { data, error } = await client.GET('/me')

if (error) {
  console.error(error.detail) // strongly typed error
} else {
  console.log(data.email) // strongly typed data
}

// POST request
await client.POST('/keys', {
  body: {
    name: 'My API Key' // typed input body
  }
})
```

## Authentication
The client automatically handles authentication.
- **Request**: The `Authorization` header is injected automatically if a token exists in `localStorage`.
- **Response**: If a 401 Unauthorized response is received, an `auth:unauthorized` event is dispatched, which is handled by the `AuthProvider` to log the user out.

## Configuration
The base URL is configured in `web/src/constants.ts` under `APP_CONFIG.API_BASE_URL`.
- In the browser, it resolves relative to `window.location.origin` (e.g. `/api`).
- in other environments (SSR/Tests), it defaults to `http://localhost/api` or `http://localhost:8080`.

## Updating Types
When the backend API changes:
1. Run `make openapi-gen` in the root directory.
   - This generates `openapi.json` from the Go code.
   - Then generates `web/src/lib/api-types.ts` from `openapi.json`.
2. The frontend types will automatically update.
