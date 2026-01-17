# Logging Guide

This guide describes the structured logging strategy used in Inkling. We use **Charm** for the backend and **LogTape** for the frontend to ensure consistent, searchable, and high-cardinality logs.

## Strategy Overview

Our logging strategy is built on three pillars:
1.  **Strict Typing**: We use standardized keys to ensure logs are consistent and easily searchable in log aggregators.
2.  **Context Propagation**: Metadata like `user_id` is automatically injected into logs via context (Go context on the backend, explicit or implicit context on the frontend).
3.  **Milestone "Fat" Logs**: Instead of logging every tiny detail, we emit a single, high-cardinality entry at major milestones (like the end of an API request).

---

## Backend Logging (Go + Charm)

We use [charmbracelet/log](https://github.com/charmbracelet/log) for structured logs.

### Key Concepts
- **Standard Keys**: Always use the constants defined in `internal/logging/logging.go` (e.g., `logging.UserID`, `logging.Status`).
- **Context-Aware**: Extract the logger from the request context using `logging.FromContext(ctx)`. This ensures consistent metadata throughout a request lifecycle.

### Example Usage in a Handler
```go
import "github.com/techsquidtv/inkling/internal/logging"

func MyHandler(ctx context.Context, input *MyInput) (*MyOutput, error) {
    logger := logging.FromContext(ctx)
    
    // Log a business event with strict keys
    logger.Info("performing action", logging.UserID, user.ID)
    
    if err := doSomething(); err != nil {
        logger.Error("action failed", logging.Error, err)
        return nil, err
    }
    
    return &MyOutput{}, nil
}
```

### Request Milestone Logs
The logging middleware automatically emits a "fat" log at the end of every request:
`INFO request completed method=GET path=/api/me status=200`

---

## Frontend Logging (React + LogTape)

We use [LogTape](https://logtape.org/) for browser-side logging.

### Key Concepts
- **Shared Logger**: Use the pre-configured logger from `@/lib/logger`.
- **Milestone Helper**: Use `logMilestone(message, data)` for high-cardinality events.
- **Strict Keys**: Use the `LogKeys` object for property names.

### Example Usage
```typescript
import { logger, LogKeys, logMilestone } from '@/lib/logger';

// Standard log
logger.debug("Component mounted");

// Milestone log with standard keys
logMilestone("user login initiated", {
  [LogKeys.METHOD]: "email",
  [LogKeys.PATH]: window.location.pathname,
});

// Using context
logger.with({ [LogKeys.USER_ID]: user.id }).info("profile updated");
```

### API Milestone Tracking
The `openapi-fetch` client in `web/src/lib/api.ts` is configured to log a single milestone entry for every network request automatically.

### Sentry Integration
LogTape is configured to send logs to Sentry using the `@logtape/sentry` sink. 
- **Breadcrumbs**: All logs (debug and above) are sent as Sentry breadcrumbs to give context to errors.
- **Error Issues**: Logs with level `error` or `fatal` automatically create Sentry Issues with full stack traces.
- **Trace Correlation**: Logs are automatically tagged with the current Sentry `trace_id` and `span_id`.

---

## Best Practices

1.  **Avoid PII**: Never log passwords, tokens, or sensitive personal information.
2.  **Use correct levels**:
    - `DEBUG`: Verbose development info.
    - `INFO`: Significant application milestones.
    - `WARN`: Recoverable errors or suspicious activity.
    - `ERROR`: Critical failures requiring attention.
3.  **Don't Log Duration**: Tracing is responsible for timing; logging is for state and events.
