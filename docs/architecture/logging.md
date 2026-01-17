# Logging Architecture

## Overview
Inkling provides real-time log streaming via Server-Sent Events (SSE).

> **Related**: For information about how to *emit* logs, see [Logging Guide](../guides/logging.md).
> This document focuses on how logs are *collected and streamed* to the UI.

## Logging Stack
- **Backend**: [Charm Log](https://github.com/charmbracelet/log) - Structured logging for Go
- **Frontend**: [LogTape](https://logtape.org/) - Structured logging for React
- **Streaming**: SSE (Server-Sent Events) for real-time log delivery

## Modes

### Docker Mode (`ENABLE_DOCKER_LOGS=true`)
- **Requires**: `/var/run/docker.sock` mounted to container.
- **Security**: ⚠️ Dev-only. Grants root access to host.
- **Features**:
  - Streams logs from all containers (app, db, etc.)
  - Includes historical logs (last 50 lines)
  - Parses Docker's binary stream format

### Application Mode (`ENABLE_DOCKER_LOGS=false`, default)
- **Security**: ✅ Safe for production.
- **Features**:
  - Streams only Go backend logs (via Charm)
  - No historical buffer (shows logs from connection time onward)
  - Integrated with existing structured logging

## UI Status Indicators
The log viewer UI displays connection status:
- 🟢 **Connected**: Actively receiving logs
- 🟡 **Connecting**: Attempting to establish connection
- 🔴 **Disconnected**: Connection failed (manual refresh required)

## Enabling Docker Logs (Dev Only)

1. Uncomment the volume in `docker-compose.yml`:
   ```yaml
   - /var/run/docker.sock:/var/run/docker.sock:ro
   ```

2. Set environment variable:
   ```bash
   export ENABLE_DOCKER_LOGS=true
   ```

3. Restart: `make dev`

## Production Recommendations
- Keep `ENABLE_DOCKER_LOGS=false`.
- For centralized logging, use CloudWatch, Loki, or similar.
- Consider log retention policies (Docker only keeps limited history).

## Architecture Details

### Log Collection Flow (Docker Mode)
```
Docker Daemon → Docker Client (Go SDK) → SSE Handler → Browser EventSource
```

### Log Collection Flow (Application Mode)
```
Charm Logger → Ring Buffer → SSE Handler → Browser EventSource
```

Both flows use the same `LogService` interface for abstraction.

## Implementation

### Backend

**Service Interface** (`internal/logs/service.go`):
```go
type Service interface {
    StreamLogs(ctx context.Context, service string, tail int) (<-chan string, error)
}
```

**Implementations**:
- `AppLogService` - Ring buffer capturing Charm log output
- `DockerLogService` - Docker SDK client streaming container logs

**Handler** (`internal/api/handlers/logs.go`):
- SSE endpoint at `/api/logs/stream?service=<name>`
- Uses raw Chi router (SSE cannot be properly documented in OpenAPI)

### Frontend

**Hook** (`web/src/hooks/use-log-stream.ts`):
- Uses native `EventSource` API
- Tracks connection status
- Accumulates log lines in state

**Component** (`web/src/components/log-status-indicator.tsx`):
- Visual indicator of connection state
- Color-coded status (green/yellow/red)

## Troubleshooting

| Issue | Solution |
| :--- | :--- |
| "No container found" in Docker mode | Check that container name contains the service string |
| Logs not updating | Check browser console for EventSource errors |
| Connection immediately drops | Verify backend is running and SSE endpoint is accessible |
| Only seeing new logs, no history | This is expected in Application mode |
