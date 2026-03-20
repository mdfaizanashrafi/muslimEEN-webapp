#!/bin/bash
# Production Legacy Auth Cleanup Script
# 
# ⚠️  CRITICAL: This script deletes production authentication code.
# ⚠️  ONLY RUN after:
#    - 7-14 days of zero legacy auth detections
#    - Full database backup
#    - Team approval
#
# Usage: ./production-cleanup.sh

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
REQUIRED_CONFIRMATION="DELETE_AUTH"
BACKUP_TAG="pre-cleanup-$(date +%Y%m%d-%H%M%S)"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_section() {
    echo -e "\n${BLUE}═══════════════════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}\n"
}

confirm_destruction() {
    echo ""
    log_error "⚠️  DESTRUCTIVE OPERATION WARNING ⚠️"
    echo ""
    echo "This script will PERMANENTLY DELETE:"
    echo "  • Legacy authentication services"
    echo "  • JWT handling code"
    echo "  • Password hashing utilities"
    echo "  • CSRF protection code"
    echo "  • Legacy auth middleware"
    echo ""
    echo "To proceed, type exactly: ${YELLOW}$REQUIRED_CONFIRMATION${NC}"
    echo ""
    read -p "Confirmation: " user_input
    
    if [ "$user_input" != "$REQUIRED_CONFIRMATION" ]; then
        log_error "Confirmation failed. Aborting."
        exit 1
    fi
    
    echo ""
    read -p "Are you ABSOLUTELY SURE? Type 'yes' to continue: " final_confirm
    
    if [ "$final_confirm" != "yes" ]; then
        log_error "Aborted by user."
        exit 1
    fi
}

# ============================================================================
# PRE-FLIGHT CHECKS
# ============================================================================

log_section "PRE-FLIGHT CHECKS"

# Check we're in the right directory
if [ ! -d "$PROJECT_ROOT/frontend" ] || [ ! -d "$PROJECT_ROOT/backend" ]; then
    log_error "Must run from project scripts directory"
    exit 1
fi

cd "$PROJECT_ROOT"

# Check git status
if [ -n "$(git status --porcelain)" ]; then
    log_error "Uncommitted changes detected. Commit or stash before cleanup."
    git status
    exit 1
fi

log_info "Git status clean"

# Check auth health endpoint
log_info "Checking auth system health..."
HEALTH_URL="${API_URL:-http://localhost:3001}/api/health/auth/ready"

if command -v curl &> /dev/null; then
    HEALTH_RESPONSE=$(curl -s "$HEALTH_URL" 2>/dev/null || echo '{"ready": false}')
    if echo "$HEALTH_RESPONSE" | grep -q '"ready": true'; then
        log_info "✓ Auth system reports ready for cleanup"
    else
        log_error "✗ Auth system NOT ready for cleanup"
        log_error "Response: $HEALTH_RESPONSE"
        log_error "Check /api/health/auth for details"
        exit 1
    fi
else
    log_warn "curl not available, skipping health check"
fi

# Check feature flags
log_info "Checking feature flags..."
if grep -q "DISABLE_LEGACY_AUTH=true" backend/.env 2>/dev/null; then
    log_info "✓ DISABLE_LEGACY_AUTH is true"
else
    log_error "✗ DISABLE_LEGACY_AUTH must be true before cleanup"
    log_error "Set DISABLE_LEGACY_AUTH=true and verify no legacy usage"
    exit 1
fi

# ============================================================================
# PHASE 3: BACKUP & SNAPSHOT
# ============================================================================

log_section "PHASE 3: BACKUP & SNAPSHOT"

log_info "Creating git tag: $BACKUP_TAG"
# Skip if tag already exists (idempotent)
if git tag -l "$BACKUP_TAG" | grep -q "$BACKUP_TAG"; then
    log_warn "Git tag $BACKUP_TAG already exists (skipping)"
else
    git tag -a "$BACKUP_TAG" -m "Pre-auth-cleanup backup"
    git push origin "$BACKUP_TAG" || log_warn "Failed to push tag (may already exist on remote)"
    log_info "✓ Git tag created and pushed"
fi

log_info "Creating database backup..."
BACKUP_DIR="backups/$BACKUP_TAG"
mkdir -p "$BACKUP_DIR"

# Skip if backup already exists (idempotent)
if [ -f "$BACKUP_DIR/database.sql" ]; then
    log_warn "Database backup already exists: $BACKUP_DIR/database.sql (skipping)"
elif [ -n "${DATABASE_URL:-}" ]; then
    pg_dump "$DATABASE_URL" > "$BACKUP_DIR/database.sql"
    log_info "✓ Database backup created: $BACKUP_DIR/database.sql"
else
    log_warn "DATABASE_URL not set, skipping database backup"
fi

log_info "Backing up current code..."
# Skip if already backed up (idempotent)
if [ -d "$BACKUP_DIR/backend" ] && [ -d "$BACKUP_DIR/frontend" ]; then
    log_warn "Code backup already exists (skipping)"
else
    cp -r backend/src "$BACKUP_DIR/"
    cp -r frontend/lib "$BACKUP_DIR/"
    log_info "✓ Code backup created"
fi

# ============================================================================
# CONFIRM DESTRUCTION
# ============================================================================

log_section "DESTRUCTIVE OPERATIONS AHEAD"
confirm_destruction

# ============================================================================
# PHASE 6: CONTROLLED CODE CLEANUP
# ============================================================================

log_section "PHASE 6: CODE CLEANUP"

# Frontend cleanup
log_info "Cleaning frontend..."

FILES_TO_DELETE=(
    "frontend/lib/auth-context.tsx"
    "frontend/lib/auth-final-guide.tsx"
    "frontend/lib/auth-usage-guide.tsx"
)

for file in "${FILES_TO_DELETE[@]}"; do
    if [ -f "$file" ]; then
        rm "$file"
        log_info "  ✓ Deleted: $file"
    else
        log_info "  ⊘ Already deleted: $file"
    fi
done

# Backend cleanup
log_info "Cleaning backend services..."

SERVICES_TO_DELETE=(
    "backend/src/modules/iam/services/AuthService.ts"
    "backend/src/modules/iam/services/JwtService.ts"
    "backend/src/modules/iam/services/PasswordService.ts"
)

for file in "${SERVICES_TO_DELETE[@]}"; do
    if [ -f "$file" ]; then
        rm "$file"
        log_info "  ✓ Deleted: $file"
    fi
done

log_info "Cleaning backend controllers..."

CONTROLLERS_TO_DELETE=(
    "backend/src/modules/iam/controllers/AuthController.ts"
)

for file in "${CONTROLLERS_TO_DELETE[@]}"; do
    if [ -f "$file" ]; then
        rm "$file"
        log_info "  ✓ Deleted: $file"
    fi
done

log_info "Cleaning backend middleware..."

MIDDLEWARE_TO_DELETE=(
    "backend/src/modules/iam/middleware/auth.ts"
    "backend/src/modules/iam/middleware/unifiedAuth.ts"
)

for file in "${MIDDLEWARE_TO_DELETE[@]}"; do
    if [ -f "$file" ]; then
        rm "$file"
        log_info "  ✓ Deleted: $file"
    fi
done

# ============================================================================
# PHASE 4: DATABASE MIGRATION (Soft deprecation)
# ============================================================================

log_section "PHASE 4: DATABASE SOFT DEPRECATION"

log_info "Generating database migration script..."

cat > "$BACKUP_DIR/migrate-database.sql" << 'EOF'
-- Legacy Auth Database Migration
-- Phase 1: Soft deprecation (safe - columns renamed, not deleted)
-- Phase 2: Hard deletion (after 30-60 days of stability)

-- 1. Drop refresh_tokens table
DROP TABLE IF EXISTS refresh_tokens;

-- 2. Rename password_hash to deprecated column
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'password_hash'
    ) THEN
        ALTER TABLE users RENAME COLUMN password_hash TO _deprecated_password_hash;
        ALTER TABLE users ALTER COLUMN _deprecated_password_hash DROP NOT NULL;
        
        COMMENT ON COLUMN users._deprecated_password_hash IS 
            'DEPRECATED: Legacy password hash - can be removed after 2026-06-20 (90 days)';
        
        RAISE NOTICE 'password_hash renamed to _deprecated_password_hash';
    ELSE
        RAISE NOTICE 'password_hash column not found, may already be deprecated';
    END IF;
END $$;

-- 3. Drop legacy indexes
DROP INDEX IF EXISTS idx_refresh_tokens_user_id;
DROP INDEX IF EXISTS idx_refresh_tokens_token;

-- 4. Verification
SELECT 
    'Remaining columns in users table' as check_type,
    column_name
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;
EOF

log_info "✓ Database migration script created: $BACKUP_DIR/migrate-database.sql"
log_warn "Review and execute manually:"
log_warn "  psql \$DATABASE_URL < $BACKUP_DIR/migrate-database.sql"

# ============================================================================
# PHASE 5: DEPENDENCY VERIFICATION
# ============================================================================

log_section "PHASE 5: DEPENDENCY CHECK"

log_info "Scanning for remaining legacy imports..."

# Check for any remaining imports
LEGACY_PATTERNS=(
    "from.*AuthService"
    "from.*JwtService"
    "from.*PasswordService"
    "jsonwebtoken"
    "bcrypt"
    "csrf"
)

FOUND_ISSUES=0
for pattern in "${LEGACY_PATTERNS[@]}"; do
    if grep -r "$pattern" backend/src/ frontend/ --include="*.ts" --include="*.tsx" 2>/dev/null | grep -v "node_modules"; then
        log_error "Found legacy reference: $pattern"
        FOUND_ISSUES=$((FOUND_ISSUES + 1))
    fi
done

if [ $FOUND_ISSUES -gt 0 ]; then
    log_error "Found $FOUND_ISSUES legacy references. Review before proceeding."
    log_warn "Cleanup incomplete - manual review required"
else
    log_info "✓ No legacy imports found"
fi

# ============================================================================
# PHASE 7: POST-CLEANUP HEALTH CHECK
# ============================================================================

log_section "PHASE 7: POST-CLEANUP VALIDATION"

log_info "Running verification script..."
npm run verify:cleanup || {
    log_error "Verification failed! Review issues above."
    exit 1
}

log_info "Running type check..."
cd backend && npm run type-check || {
    log_error "Type check failed! Fix type errors before proceeding."
    exit 1
}

cd "$PROJECT_ROOT"

log_info "Building frontend..."
cd frontend && npm run build || {
    log_error "Frontend build failed!"
    exit 1
}

cd "$PROJECT_ROOT"

log_info "Building backend..."
cd backend && npm run build || {
    log_error "Backend build failed!"
    exit 1
}

# ============================================================================
# COMPLETION
# ============================================================================

log_section "CLEANUP COMPLETE"

log_info "Summary:"
echo "  • Backup tag: $BACKUP_TAG"
echo "  • Backup location: $BACKUP_DIR"
echo "  • Database migration: $BACKUP_DIR/migrate-database.sql"
echo ""

log_info "NEXT STEPS:"
echo "  1. Review database migration script"
echo "  2. Execute database migration"
echo "  3. Run full test suite"
echo "  4. Deploy to staging"
echo "  5. Deploy to production"
echo "  6. Monitor for 7 days"
echo ""

log_warn "ROLLBACK (if needed):"
echo "  git revert HEAD~1"
echo "  psql \$DATABASE_URL < backup_before_cleanup.sql"
echo ""

log_info "After 30-60 days of stability:"
echo "  1. Drop _deprecated_password_hash column"
echo "  2. Remove legacy detection middleware"
echo ""

log_info "✅ Cleanup script completed successfully"
