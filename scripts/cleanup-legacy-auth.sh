#!/bin/bash
# Legacy Auth Cleanup Script
# 
# EXECUTE ONLY AFTER:
# - 100% user migration confirmed
# - 30 days stable operation
# - Full database backup created
#
# Usage: ./cleanup-legacy-auth.sh [dry-run|execute]

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
MODE="${1:-dry-run}"
BACKUP_DIR="backups/$(date +%Y%m%d_%H%M%S)"

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

confirm() {
    if [ "$MODE" = "execute" ]; then
        read -p "Are you sure you want to proceed? Type 'yes' to continue: " confirm
        if [ "$confirm" != "yes" ]; then
            log_info "Aborted by user"
            exit 0
        fi
    fi
}

# ============================================================================
# PRE-CHECKS
# ============================================================================

log_info "Starting cleanup in $MODE mode..."

if [ "$MODE" != "dry-run" ] && [ "$MODE" != "execute" ]; then
    log_error "Invalid mode. Use 'dry-run' or 'execute'"
    exit 1
fi

# Check we're in the right directory
if [ ! -d "frontend" ] || [ ! -d "backend" ]; then
    log_error "Must run from project root"
    exit 1
fi

log_info "Pre-checks passed"

# ============================================================================
# BACKUP (Execute mode only)
# ============================================================================

if [ "$MODE" = "execute" ]; then
    # Skip if backup already exists for today
    if [ -d "$BACKUP_DIR" ] && [ -f "$BACKUP_DIR/database.sql" ]; then
        log_warn "Backup already exists at $BACKUP_DIR"
        log_warn "Skipping backup creation (safe to re-run)"
    else
        log_info "Creating backup directory: $BACKUP_DIR"
        mkdir -p "$BACKUP_DIR"
        
        log_info "Backing up current code state..."
        # Only commit if there are changes
        if [ -n "$(git status --porcelain 2>/dev/null)" ]; then
            git add -A
            git commit -m "Pre-cleanup backup: $(date -Iseconds)" || true
        fi
        # Only create tag if it doesn't exist
        if ! git tag -l "pre-cleanup-$(date +%Y%m%d)" | grep -q "pre-cleanup"; then
            git tag "pre-cleanup-$(date +%Y%m%d)"
        fi
        
        log_info "Database backup..."
        # Assumes DATABASE_URL is set
        if [ -n "${DATABASE_URL:-}" ]; then
            pg_dump "$DATABASE_URL" > "$BACKUP_DIR/database.sql"
            log_info "Database backup created"
        else
            log_warn "DATABASE_URL not set, skipping database backup"
        fi
    fi
fi

# ============================================================================
# FRONTEND CLEANUP
# ============================================================================

log_info "=== FRONTEND CLEANUP ==="

# Delete legacy auth files
FILES_TO_DELETE=(
    "frontend/lib/auth-context.tsx"
    "frontend/lib/auth-final-guide.tsx"
    "frontend/lib/auth-usage-guide.tsx"
)

for file in "${FILES_TO_DELETE[@]}"; do
    if [ -f "$file" ]; then
        if [ "$MODE" = "execute" ]; then
            # Skip if already deleted (re-run safety)
            if [ ! -f "$file" ]; then
                log_info "Already deleted: $file"
            else
                rm "$file"
                log_info "Deleted: $file"
            fi
        else
            log_warn "Would delete: $file"
        fi
    else
        log_info "Already deleted (or never existed): $file"
    fi
done

# Update api.ts to remove CSRF exports
if [ -f "frontend/lib/api.ts" ]; then
    log_info "Cleaning api.ts..."
    if [ "$MODE" = "execute" ]; then
        # Check if already processed (idempotent)
        if grep -q "LEGACY: export const setCsrfToken" frontend/lib/api.ts; then
            log_info "api.ts already cleaned (skipping)"
        else
            # Create backup (only if not exists)
            if [ ! -f "$BACKUP_DIR/api.ts.bak" ]; then
                cp frontend/lib/api.ts "$BACKUP_DIR/api.ts.bak"
            fi
            
            # Comment out CSRF exports (don't delete for compatibility)
            sed -i 's/^export const setCsrfToken/\/\/ LEGACY: export const setCsrfToken/' frontend/lib/api.ts
            sed -i 's/^export const clearCsrfToken/\/\/ LEGACY: export const clearCsrfToken/' frontend/lib/api.ts
            sed -i 's/^export const ensureCsrfToken/\/\/ LEGACY: export const ensureCsrfToken/' frontend/lib/api.ts
            sed -i 's/^export const getCsrfToken/\/\/ LEGACY: export const getCsrfToken/' frontend/lib/api.ts
            log_info "Updated: frontend/lib/api.ts"
        fi
    else
        log_warn "Would update: frontend/lib/api.ts"
    fi
fi

# ============================================================================
# BACKEND CLEANUP
# ============================================================================

log_info "=== BACKEND CLEANUP ==="

# Delete legacy service files
FILES_TO_DELETE=(
    "backend/src/modules/iam/services/AuthService.ts"
    "backend/src/modules/iam/services/JwtService.ts"
    "backend/src/modules/iam/services/PasswordService.ts"
    "backend/src/modules/iam/controllers/AuthController.ts"
    "backend/src/modules/iam/middleware/auth.ts"
    "backend/src/modules/iam/middleware/unifiedAuth.ts"
)

for file in "${FILES_TO_DELETE[@]}"; do
    if [ -f "$file" ]; then
        if [ "$MODE" = "execute" ]; then
            # Backup first (only if not exists)
            mkdir -p "$BACKUP_DIR/backend"
            if [ ! -f "$BACKUP_DIR/backend/$(basename "$file")" ]; then
                cp "$file" "$BACKUP_DIR/backend/"
            fi
            rm "$file"
            log_info "Deleted: $file"
        else
            log_warn "Would delete: $file"
        fi
    else
        log_info "Already deleted (or never existed): $file"
    fi
done

# Update auth routes
if [ -f "backend/src/modules/auth/routes.ts" ]; then
    log_info "Simplifying auth routes..."
    if [ "$MODE" = "execute" ]; then
        # Check if already simplified (idempotent)
        if grep -q "Clerk Only" backend/src/modules/auth/routes.ts; then
            log_info "routes.ts already simplified (skipping)"
        else
            # Backup (only if not exists)
            if [ ! -f "$BACKUP_DIR/routes.ts.bak" ]; then
                cp backend/src/modules/auth/routes.ts "$BACKUP_DIR/routes.ts.bak"
            fi
            
            # Create simplified version
            cat > backend/src/modules/auth/routes.ts << 'EOF'
/**
 * Auth Module Routes - Clerk Only
 * Minimal routes after legacy auth cleanup
 */

import { Router } from 'express';
import { clerkAuthenticate } from '../iam/middleware/clerkAuth';

const router = Router();

// Logout endpoint
router.post('/logout', clerkAuthenticate, (req, res) => {
  res.json({ success: true, message: 'Logged out successfully' });
});

// Current user endpoint
router.get('/me', clerkAuthenticate, (req, res) => {
  res.json({ success: true, user: (req as any).user });
});

export default router;
EOF
            log_info "Updated: backend/src/modules/auth/routes.ts"
        fi
    else
        log_warn "Would simplify: backend/src/modules/auth/routes.ts"
    fi
else
    log_info "routes.ts already removed or doesn't exist"
fi

# ============================================================================
# DATABASE CLEANUP
# ============================================================================

log_info "=== DATABASE CLEANUP ==="

if [ "$MODE" = "execute" ]; then
    log_info "Generating database cleanup SQL..."
    
    cat > "$BACKUP_DIR/cleanup-database.sql" << 'EOF'
-- Legacy Auth Database Cleanup
-- Run this after confirming all users migrated

-- 1. Drop refresh_tokens table
DROP TABLE IF EXISTS refresh_tokens;

-- 2. Rename password_hash column (soft delete - can be removed after 90 days)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'password_hash'
    ) THEN
        ALTER TABLE users RENAME COLUMN password_hash TO _deprecated_password_hash;
        ALTER TABLE users ALTER COLUMN _deprecated_password_hash DROP NOT NULL;
    END IF;
END $$;

-- 3. Drop legacy indexes
DROP INDEX IF EXISTS idx_refresh_tokens_user_id;
DROP INDEX IF EXISTS idx_refresh_tokens_token;

-- 4. Add comment for future reference
COMMENT ON COLUMN users._deprecated_password_hash IS 
    'Legacy password hash - can be removed after 2026-06-20';

-- 5. Verify cleanup
SELECT 
    'Users with clerk_id' as check_name,
    COUNT(*) as count
FROM users 
WHERE clerk_id IS NOT NULL
UNION ALL
SELECT 
    'Users without clerk_id' as check_name,
    COUNT(*) 
FROM users 
WHERE clerk_id IS NULL;
EOF
    
    log_info "SQL script created: $BACKUP_DIR/cleanup-database.sql"
    log_warn "Review and execute manually: psql muslimeen < $BACKUP_DIR/cleanup-database.sql"
else
    log_warn "Would generate: cleanup-database.sql"
fi

# ============================================================================
# CONFIG CLEANUP
# ============================================================================

log_info "=== CONFIG CLEANUP ==="

if [ -f "backend/.env" ]; then
    if [ "$MODE" = "execute" ]; then
        # Check if already processed (idempotent)
        if grep -q "^# REMOVED: JWT_SECRET=" backend/.env; then
            log_info ".env already cleaned (skipping)"
        else
            # Backup (only if not exists)
            if [ ! -f "$BACKUP_DIR/.env.bak" ]; then
                cp backend/.env "$BACKUP_DIR/.env.bak"
            fi
            
            # Comment out legacy env vars (only if not already commented)
            sed -i 's/^JWT_SECRET=/# REMOVED: JWT_SECRET=/' backend/.env
            sed -i 's/^JWT_EXPIRES_IN=/# REMOVED: JWT_EXPIRES_IN=/' backend/.env
            sed -i 's/^CSRF_SECRET=/# REMOVED: CSRF_SECRET=/' backend/.env
            sed -i 's/^BCRYPT_ROUNDS=/# REMOVED: BCRYPT_ROUNDS=/' backend/.env
            
            log_info "Updated: backend/.env"
        fi
    else
        log_warn "Would update: backend/.env (comment out legacy vars)"
    fi
fi

# ============================================================================
# DEPENDENCY CLEANUP
# ============================================================================

log_info "=== DEPENDENCY CLEANUP ==="

if [ "$MODE" = "execute" ]; then
    log_info "To remove legacy dependencies, run:"
    log_info "  cd backend && npm uninstall jsonwebtoken bcrypt"
    log_warn "Test thoroughly after removing dependencies!"
fi

# ============================================================================
# SUMMARY
# ============================================================================

log_info "=== CLEANUP $MODE COMPLETE ==="

if [ "$MODE" = "dry-run" ]; then
    echo ""
    log_warn "This was a DRY RUN - no changes made"
    log_info "Run with 'execute' to perform actual cleanup:"
    log_info "  ./cleanup-legacy-auth.sh execute"
    echo ""
    log_warn "MAKE SURE YOU HAVE:"
    echo "  ✓ Full database backup"
    echo "  ✓ All users migrated to Clerk"
    echo "  ✓ 30 days stable operation"
    echo "  ✓ Rollback plan tested"
else
    echo ""
    log_info "Cleanup executed successfully!"
    log_info "Backup location: $BACKUP_DIR"
    echo ""
    log_warn "NEXT STEPS:"
    echo "  1. Run database cleanup SQL"
    echo "  2. Remove legacy npm packages"
    echo "  3. Run full test suite"
    echo "  4. Deploy to staging"
    echo "  5. Deploy to production"
    echo ""
    log_warn "ROLLBACK:"
    echo "  git revert HEAD~1  # If needed"
fi
