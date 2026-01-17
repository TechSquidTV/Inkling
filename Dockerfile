# Build Frontend
FROM node:22-slim AS frontend-builder
WORKDIR /app/web
COPY web/package.json web/pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install
COPY web/ .
RUN pnpm build

# Build Backend
FROM golang:1.25-alpine AS backend-builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
# Copy frontend assets to the location Go expects for embedding
COPY --from=frontend-builder /app/web/dist ./cmd/server/dist
RUN CGO_ENABLED=0 go build -o bin/server cmd/server/main.go

# Final Image
FROM alpine:latest
WORKDIR /app
RUN apk add --no-cache ca-certificates
# Only copy the single binary
COPY --from=backend-builder /app/bin/server .

# Default environment variables
ENV PORT=8080
ENV DB_PATH=/app/data/app.db
ENV OIDC_ISSUER=""
ENV OIDC_CLIENT_ID=""
ENV OIDC_CLIENT_SECRET=""
ENV OIDC_REDIRECT_URL=""

# Create data directory for SQLite persistence
RUN mkdir -p /app/data

EXPOSE 8080
CMD ["./server", "--p", "8080", "--DBPath", "/app/data/app.db"]
