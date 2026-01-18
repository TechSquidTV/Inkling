# Build variables
VERSION ?= v0.1.0
COMMIT ?= $(shell git rev-parse --short HEAD 2>/dev/null || echo "unknown")
BUILD_TIME ?= $(shell date -u +'%Y-%m-%dT%H:%M:%SZ')
PACKAGE = github.com/techsquidtv/inkling/internal/version

LDFLAGS = -X $(PACKAGE).Version=$(VERSION) -X $(PACKAGE).Commit=$(COMMIT) -X $(PACKAGE).BuildTime=$(BUILD_TIME)
BIN_DIR = bin
BINARY_NAME = server


.PHONY: all dev run build install lint format clean test test-backend test-frontend help dev-go dev-web build-go build-web test-go test-web lint-go lint-web format-go format-web deadcode deadcode-frontend deadcode-backend init

# Initialize new project from template
init:
	@if [ -f .initialized ]; then \
		echo "❌ This project has already been initialized."; \
		echo "To reinitialize, delete the .initialized file first."; \
		exit 1; \
	fi
	@chmod +x scripts/init.sh
	@./scripts/init.sh

all: format lint build

# Development
dev: openapi-gen
	@echo "Starting backend and frontend in development mode..."
	@make -j2 dev-backend dev-frontend

dev-backend:
	@mkdir -p cmd/server/dist
	@touch cmd/server/dist/index.html
	@if ! command -v air > /dev/null; then \
		echo "Air not found. Installing..."; \
		go install github.com/air-verse/air@latest; \
	fi
	@CLICOLOR_FORCE=1 FORCE_COLOR=1 air

dev-frontend:
	@cd web && pnpm dev

# OpenAPI Generation
openapi-gen:
	@echo "Generating OpenAPI spec..."
	@mkdir -p cmd/server/dist
	@touch cmd/server/dist/index.html
	@go run cmd/server/main.go openapi > openapi.json
	@echo "Generating frontend API types..."
	@cd web && pnpm openapi:generate

# Build
build: build-frontend build-go

build-frontend: openapi-gen
	@echo "Building frontend..."
	@cd web && pnpm build

build-go: build-frontend
	@echo "Preparing embedded assets..."
	@rm -rf cmd/server/dist
	@cp -r web/dist cmd/server/dist
	@echo "Building backend..."
	@mkdir -p $(BIN_DIR)
	@CGO_ENABLED=0 go build -ldflags "$(LDFLAGS)" -o $(BIN_DIR)/$(BINARY_NAME) cmd/server/main.go 2>&1 | grep -v "search path '/usr/local/lib' is not a directory" || true
	@echo "✅ Backend build complete: $(BIN_DIR)/$(BINARY_NAME)"


# Run
run: build
	@echo "Starting server..."
	@./$(BIN_DIR)/$(BINARY_NAME)

# Install
install: install-frontend install-backend

install-frontend:
	@echo "Installing frontend dependencies..."
	@cd web && pnpm install

install-backend:
	@echo "Installing backend dependencies..."
	@go mod tidy

# Update
update: update-frontend update-backend

update-frontend:
	@echo "Updating frontend dependencies..."
	@cd web && pnpm update
	@echo "✅ Frontend dependencies updated!"

update-backend:
	@echo "Updating backend dependencies..."
	@go get -u ./...
	@go mod tidy
	@echo "✅ Backend dependencies updated!"

# Linting
lint: lint-frontend lint-backend
	@echo "✨ All linting passed!"

lint-frontend:
	@echo "Linting frontend..."
	@cd web && pnpm lint
	@echo "✅ Frontend linting passed!"

lint-backend:
	@echo "Linting backend..."
	@go vet ./...
	@echo "✅ Backend linting passed!"

# Formatting
format: format-frontend format-backend
	@echo "✨ All formatting complete!"

format-frontend:
	@echo "Formatting frontend..."
	@cd web && pnpm format
	@echo "✅ Frontend formatting complete!"

format-backend:
	@echo "Formatting backend..."
	@go fmt ./...
	@echo "✅ Backend formatting complete!"

# Test
test: test-backend test-frontend
	@echo "✨ All tests passed!"

test-backend:
	@echo "Testing backend..."
	@go test ./... -v -race -coverprofile=coverage.out
	@echo "✅ Backend tests passed!"
	@echo "Coverage report:"
	@go tool cover -func=coverage.out | tail -n 1

test-frontend:
	@echo "Testing frontend..."
	@cd web && pnpm test:run
	@echo "✅ Frontend tests passed!"

# Clean
clean:
	@rm -rf $(BIN_DIR)
	@rm -rf web/dist
	@rm -rf cmd/server/dist
	@rm -f coverage.out

# Dead Code Detection
deadcode: deadcode-frontend deadcode-backend
	@echo "✨ Dead code check complete!"

deadcode-frontend:
	@echo "Checking for dead code in frontend..."
	@cd web && pnpm knip
	@echo "✅ Frontend dead code check complete!"

deadcode-backend:
	@echo "Checking for dead code in backend..."
	@if ! command -v deadcode > /dev/null; then \
		echo "deadcode not found. Installing..."; \
		go install golang.org/x/tools/cmd/deadcode@latest; \
	fi
	@deadcode ./...
	@echo "✅ Backend dead code check complete!"
