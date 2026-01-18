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

# Function to perform robust replacement across platforms
replace_in_file() {
    local pattern="$1"
    local replacement="$2"
    local file="$3"
    
    if [ ! -f "$file" ]; then return 0; fi
    
    # Use a temporary file for maximum compatibility instead of relying on sed -i
    # We use | as delimiter since it is unlikely to be in the project name or paths
    sed "s|$pattern|$replacement|g" "$file" > "$file.tmp" && mv "$file.tmp" "$file"
}

# 1. Update Go module path
echo "  → go.mod"
replace_in_file "module github.com/techsquidtv/inkling" "module $MODULE_PATH" "go.mod"

# 2. Update all Go import paths
echo "  → Updating Go import paths in all .go files"
find . -name "*.go" -type f -not -path "./vendor/*" | while read -r file; do
    replace_in_file "github.com/techsquidtv/inkling" "$MODULE_PATH" "$file"
done

# 3. Update Makefile PACKAGE variable
echo "  → Makefile"
replace_in_file "github.com/techsquidtv/inkling" "$MODULE_PATH" "Makefile"

# 4. Update internal/config/config.go
echo "  → internal/config/config.go"
replace_in_file "AppName = \"Inkling\"" "AppName = \"$PROJECT_NAME\"" "internal/config/config.go"
replace_in_file "ServiceName = \"inkling\"" "ServiceName = \"${PROJECT_NAME_KEBAB}\"" "internal/config/config.go"
replace_in_file "APITitle = \"Inkling API\"" "APITitle = \"$PROJECT_NAME API\"" "internal/config/config.go"
replace_in_file "APIKeyPrefix = \"ink_\"" "APIKeyPrefix = \"${API_PREFIX}_\"" "internal/config/config.go"
replace_in_file "DefaultDBName = \"inkling.db\"" "DefaultDBName = \"$DB_NAME\"" "internal/config/config.go"

# 5. Update web/src/constants.ts
echo "  → web/src/constants.ts"
replace_in_file "NAME: 'Inkling'" "NAME: '$PROJECT_NAME'" "web/src/constants.ts"
replace_in_file "ALT: 'Inkling Logo'" "ALT: '$PROJECT_NAME Logo'" "web/src/constants.ts"
replace_in_file "LOGGER_NAME: 'inkling'" "LOGGER_NAME: '$PROJECT_NAME_KEBAB'" "web/src/constants.ts"
if [ -n "$GITHUB_URL" ]; then
    replace_in_file "GITHUB: 'https://github.com/TechSquidTV/inkling'" "GITHUB: '$GITHUB_URL'" "web/src/constants.ts"
else
    replace_in_file "GITHUB: 'https://github.com/TechSquidTV/inkling'" "GITHUB: '#'" "web/src/constants.ts"
fi

# 6. Update metadata files
echo "  → web/package.json"
replace_in_file "\"name\": \"inkling\"" "\"name\": \"$PROJECT_NAME_KEBAB\"" "web/package.json"

echo "  → web/index.html"
replace_in_file "<title>Inkling</title>" "<title>$PROJECT_NAME</title>" "web/index.html"

echo "  → docker-compose.yml"
replace_in_file "inkling:" "$PROJECT_NAME_KEBAB:" "docker-compose.yml"

echo "  → Dockerfile"
replace_in_file "inkling.db" "$DB_NAME" "Dockerfile"

echo "  → .env.example"
replace_in_file "OTEL_SERVICE_NAME=inkling-api" "OTEL_SERVICE_NAME=${PROJECT_NAME_KEBAB}-api" ".env.example"

echo "  → README.md"
replace_in_file "# Inkling (Vibe App Template)" "# $PROJECT_NAME" "README.md"

# Clean up generated files
echo ""
echo -e "${BLUE}🧹 Cleaning generated files...${NC}"
rm -f openapi.json
rm -rf web/dist
rm -rf cmd/server/dist
mkdir -p cmd/server/dist
touch cmd/server/dist/.gitkeep
rm -f app.db
rm -f coverage.out
rm -f go.sum # Remove go.sum to prevent conflicts

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
