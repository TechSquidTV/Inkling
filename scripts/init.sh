#!/bin/bash
set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Vibe App Template Initialization${NC}"
echo ""

# Check if already initialized
if [ -f .initialized ]; then
    echo -e "${RED}❌ This project has already been initialized.${NC}"
    echo "If you want to reinitialize, delete the .initialized file first."
    exit 1
fi

# Prompt for inputs
echo -e "${YELLOW}Please provide the following information:${NC}"
echo ""

read -p "Project name (display name, e.g., My Awesome App): " PROJECT_NAME
if [ -z "$PROJECT_NAME" ]; then
    echo -e "${RED}❌ Project name is required${NC}"
    exit 1
fi

read -p "Go module path (e.g., github.com/username/myapp): " MODULE_PATH
if [ -z "$MODULE_PATH" ]; then
    echo -e "${RED}❌ Module path is required${NC}"
    exit 1
fi

# Validate module path format
if ! echo "$MODULE_PATH" | grep -qE '^[a-zA-Z0-9._-]+(/[a-zA-Z0-9._-]+)+$'; then
    echo -e "${RED}❌ Invalid module path format. Expected format: github.com/username/repo${NC}"
    exit 1
fi

read -p "API key prefix (3-4 lowercase chars, e.g., maa): " API_PREFIX
if [ -z "$API_PREFIX" ]; then
    echo -e "${RED}❌ API key prefix is required${NC}"
    exit 1
fi

# Validate API prefix
if ! echo "$API_PREFIX" | grep -qE '^[a-z]{3,4}$'; then
    echo -e "${RED}❌ API prefix must be 3-4 lowercase letters${NC}"
    exit 1
fi

read -p "GitHub URL (optional, press enter to skip): " GITHUB_URL

# Derive lowercase name for package.json, docker, db, etc.
PROJECT_NAME_LOWER=$(echo "$PROJECT_NAME" | tr '[:upper:]' '[:lower:]' | tr ' ' '-')
PROJECT_NAME_KEBAB=$(echo "$PROJECT_NAME" | tr '[:upper:]' '[:lower:]' | tr ' ' '-')
DB_NAME="${PROJECT_NAME_KEBAB}.db"

# Confirm before proceeding
echo ""
echo -e "${BLUE}📋 Summary:${NC}"
echo "  Project Name:   $PROJECT_NAME"
echo "  Module Path:    $MODULE_PATH"
echo "  API Prefix:     ${API_PREFIX}_"
echo "  DB Name:        $DB_NAME"
echo "  Package Name:   $PROJECT_NAME_KEBAB"
if [ -n "$GITHUB_URL" ]; then
    echo "  GitHub URL:     $GITHUB_URL"
fi
echo ""

read -p "Proceed with initialization? (y/N): " CONFIRM
if [ "$CONFIRM" != "y" ] && [ "$CONFIRM" != "Y" ]; then
    echo "Initialization cancelled."
    exit 0
fi

echo ""
echo -e "${BLUE}🔄 Updating files...${NC}"

# Determine sed in-place flag (macOS vs Linux)
if [[ "$OSTYPE" == "darwin"* ]]; then
    SED_INPLACE=(-i '')
else
    SED_INPLACE=(-i)
fi

# 1. Update Go module path using Go tooling
echo "  → go.mod (using go mod edit)"
go mod edit -module "$MODULE_PATH"

# 2. Update all Go import paths
echo "  → Updating Go import paths in all .go files"
find . -name "*.go" -type f -not -path "./vendor/*" -exec sed "${SED_INPLACE[@]}" "s|github.com/techsquidtv/inkling|$MODULE_PATH|g" {} \;

# 3. Update Makefile PACKAGE variable
echo "  → Makefile"
sed "${SED_INPLACE[@]}" "s|github.com/techsquidtv/inkling|$MODULE_PATH|g" Makefile

# 4. Update internal/config/config.go
echo "  → internal/config/config.go"
sed "${SED_INPLACE[@]}" "s|AppName = \"Inkling\"|AppName = \"$PROJECT_NAME\"|g" internal/config/config.go
sed "${SED_INPLACE[@]}" "s|ServiceName = \"inkling\"|ServiceName = \"${PROJECT_NAME_KEBAB}\"|g" internal/config/config.go
sed "${SED_INPLACE[@]}" "s|APITitle = \"Inkling API\"|APITitle = \"$PROJECT_NAME API\"|g" internal/config/config.go
sed "${SED_INPLACE[@]}" "s|APIKeyPrefix = \"ink_\"|APIKeyPrefix = \"${API_PREFIX}_\"|g" internal/config/config.go
sed "${SED_INPLACE[@]}" "s|DefaultDBName = \"inkling.db\"|DefaultDBName = \"$DB_NAME\"|g" internal/config/config.go

# 5. Update web/src/constants.ts
echo "  → web/src/constants.ts"
sed "${SED_INPLACE[@]}" "s|NAME: 'Inkling'|NAME: '$PROJECT_NAME'|g" web/src/constants.ts
sed "${SED_INPLACE[@]}" "s|ALT: 'Inkling Logo'|ALT: '$PROJECT_NAME Logo'|g" web/src/constants.ts
sed "${SED_INPLACE[@]}" "s|LOGGER_NAME: 'inkling'|LOGGER_NAME: '$PROJECT_NAME_KEBAB'|g" web/src/constants.ts
if [ -n "$GITHUB_URL" ]; then
    sed "${SED_INPLACE[@]}" "s|GITHUB: 'https://github.com/TechSquidTV/inkling'|GITHUB: '$GITHUB_URL'|g" web/src/constants.ts
else
    sed "${SED_INPLACE[@]}" "s|GITHUB: 'https://github.com/TechSquidTV/inkling'|GITHUB: '#'|g" web/src/constants.ts
fi

# 6. Update metadata files
echo "  → web/package.json"
sed "${SED_INPLACE[@]}" "s|\"name\": \"inkling\"|\"name\": \"$PROJECT_NAME_KEBAB\"|g" web/package.json

echo "  → web/index.html"
sed "${SED_INPLACE[@]}" "s|<title>Inkling</title>|<title>$PROJECT_NAME</title>|g" web/index.html

echo "  → docker-compose.yml"
sed "${SED_INPLACE[@]}" "s|inkling:|$PROJECT_NAME_KEBAB:|g" docker-compose.yml

echo "  → Dockerfile"
sed "${SED_INPLACE[@]}" "s|inkling.db|$DB_NAME|g" Dockerfile

echo "  → .env.example"
sed "${SED_INPLACE[@]}" "s|OTEL_SERVICE_NAME=inkling-api|OTEL_SERVICE_NAME=${PROJECT_NAME_KEBAB}-api|g" .env.example

echo "  → README.md"
sed "${SED_INPLACE[@]}" "s|# Inkling (Vibe App Template)|# $PROJECT_NAME|g" README.md

# Clean up generated files
echo ""
echo -e "${BLUE}🧹 Cleaning generated files...${NC}"
rm -f openapi.json
rm -rf web/dist
rm -rf cmd/server/dist
rm -f app.db
rm -f coverage.out

# Run go mod tidy to ensure imports are correct
echo ""
echo -e "${BLUE}📦 Running go mod tidy...${NC}"
go mod tidy

# Mark as initialized
touch .initialized

echo ""
echo -e "${GREEN}✅ Project initialized successfully!${NC}"
echo ""
echo "Next steps:"
echo "  1. Run 'make install' to install dependencies"
echo "  2. Run 'make dev' to start development servers"
echo "  3. Replace web/public/app-logo.png with your logo"
echo ""
