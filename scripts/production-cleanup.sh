#!/bin/bash
# ============================================================================
# PRODUCTION CLEANUP SCRIPT
# Removes all seed scripts and admin creation scripts before deployment
# ============================================================================

set -e

echo "╔════════════════════════════════════════════════════════════╗"
echo "║  MuslimEEN Production Cleanup - Removing Dev Scripts       ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Files to remove (DANGEROUS for production)
DANGEROUS_FILES=(
  # Seed scripts that create test users
  "backend/scripts/seed-user.js"
  "backend/scripts/seed-user-clerk.ts"
  "backend/scripts/seed-invitation.js"
  "backend/database/seeds/seed.js"
  
  # Admin creation scripts (should be run manually only)
  "backend/scripts/create-admin.js"
  "backend/scripts/create-admin.ts"
  "backend/scripts/create-admin-clerk.ts"
  "backend/scripts/fix-admin-password.js"
)

REMOVED_COUNT=0
SKIPPED_COUNT=0

echo "Scanning for dangerous files..."
echo ""

for file in "${DANGEROUS_FILES[@]}"; do
  if [ -f "$file" ]; then
    echo -e "${RED}✗ REMOVING:${NC} $file"
    rm -f "$file"
    ((REMOVED_COUNT++))
  else
    ((SKIPPED_COUNT++))
  fi
done

echo ""
echo "────────────────────────────────────────────────────────────"
echo "Cleanup Summary:"
echo "  Files removed: $REMOVED_COUNT"
echo "  Files already absent: $SKIPPED_COUNT"
echo "────────────────────────────────────────────────────────────"
echo ""

# Verify no seed scripts remain
echo "Verifying no dangerous scripts remain..."
SEED_CHECK=$(find backend/scripts -name "*seed*" -type f 2>/dev/null | wc -l)
ADMIN_CHECK=$(find backend/scripts -name "*admin*" -type f 2>/dev/null | wc -l)

if [ "$SEED_CHECK" -gt 0 ]; then
  echo -e "${YELLOW}⚠ WARNING:${NC} Found $SEED_CHECK remaining seed-related files"
  find backend/scripts -name "*seed*" -type f
fi

if [ "$ADMIN_CHECK" -gt 0 ]; then
  echo -e "${YELLOW}⚠ WARNING:${NC} Found $ADMIN_CHECK remaining admin-related files"
  find backend/scripts -name "*admin*" -type f
fi

if [ "$SEED_CHECK" -eq 0 ] && [ "$ADMIN_CHECK" -eq 0 ]; then
  echo -e "${GREEN}✓ VERIFIED:${NC} No dangerous scripts found in backend/scripts/"
fi

echo ""
echo -e "${GREEN}✓ Production cleanup complete!${NC}"
echo ""
echo "Next steps:"
echo "  1. Commit these changes"
echo "  2. Deploy to production"
echo "  3. Verify no test users exist in Clerk dashboard"
echo "  4. Verify no test users exist in database"
echo ""
