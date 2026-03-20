#!/bin/bash
#
# Quick Health Check Script
#
# Performs quick health checks on all services.
# Use this for rapid status verification.
#
# Usage: ./scripts/health-check.sh [production|staging]
#

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
ENVIRONMENT="${1:-staging}"

if [ "$ENVIRONMENT" == "production" ]; then
  BACKEND_URL="https://muslimeen-api.onrender.com"
  FRONTEND_URL="https://muslimeen.org"
else
  BACKEND_URL="https://muslimeen-api-staging.onrender.com"
  FRONTEND_URL="https://muslimeen-staging.vercel.app"
fi

TIMEOUT=10

echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  QUICK HEALTH CHECK - ${ENVIRONMENT^^}${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""

FAILED=0

check_endpoint() {
  local url=$1
  local name=$2
  local expected_code=${3:-200}
  
  local status
  status=$(curl -s -o /dev/null -w "%{http_code}" --max-time $TIMEOUT "$url" 2>/dev/null || echo "000")
  
  if [ "$status" == "$expected_code" ]; then
    echo -e "${GREEN}✓${NC} $name: HTTP $status"
    return 0
  else
    echo -e "${RED}✗${NC} $name: HTTP $status (expected $expected_code)"
    return 1
  fi
}

# Backend Health
echo "Backend: $BACKEND_URL"
echo "─────────────────────────────────────────────────────────────"

check_endpoint "$BACKEND_URL/health" "Basic Health" || FAILED=$((FAILED + 1))
check_endpoint "$BACKEND_URL/api/health/auth" "Auth Health" || FAILED=$((FAILED + 1))
check_endpoint "$BACKEND_URL/api/health/ready" "Auth Ready" || FAILED=$((FAILED + 1))

# Frontend Health
echo ""
echo "Frontend: $FRONTEND_URL"
echo "─────────────────────────────────────────────────────────────"

check_endpoint "$FRONTEND_URL" "Homepage" || FAILED=$((FAILED + 1))
check_endpoint "$FRONTEND_URL/login" "Login Page" 307 || true  # 307 is redirect, acceptable
check_endpoint "$FRONTEND_URL/status" "Status Endpoint" || FAILED=$((FAILED + 1))

# Summary
echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"

if [ $FAILED -eq 0 ]; then
  echo -e "${GREEN}✅ ALL HEALTH CHECKS PASSED${NC}"
  exit 0
else
  echo -e "${RED}❌ $FAILED CHECK(S) FAILED${NC}"
  exit 1
fi
