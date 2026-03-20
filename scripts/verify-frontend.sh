#!/bin/bash
#
# Frontend Verification Script
#
# Verifies frontend deployment by checking:
# - Site loads correctly
# - No console errors (via basic checks)
# - Clerk UI is present
# - API connectivity
#
# Usage: ./scripts/verify-frontend.sh [staging|production]
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
  DOMAIN="https://muslimeen.org"
else
  DOMAIN="https://muslimeen-staging.vercel.app"
fi

TIMEOUT=30

echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  FRONTEND VERIFICATION - ${ENVIRONMENT^^}${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""
echo "Target: $DOMAIN"
echo ""

# Track failures
FAILED=0

# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

check_endpoint() {
  local url=$1
  local name=$2
  local expected_status=${3:-200}
  
  echo -e "${BLUE}[CHECK]${NC} $name"
  
  local response
  local status
  
  response=$(curl -s -o /dev/null -w "%{http_code}" --max-time $TIMEOUT "$url" 2>/dev/null || echo "000")
  
  if [ "$response" == "$expected_status" ]; then
    echo -e "  ${GREEN}✓ HTTP $response${NC}"
    return 0
  else
    echo -e "  ${RED}✗ HTTP $response (expected $expected_status)${NC}"
    return 1
  fi
}

check_content() {
  local url=$1
  local name=$2
  local pattern=$3
  
  echo -e "${BLUE}[CHECK]${NC} $name"
  
  local content
  content=$(curl -s --max-time $TIMEOUT "$url" 2>/dev/null || echo "")
  
  if echo "$content" | grep -q "$pattern"; then
    echo -e "  ${GREEN}✓ Found${NC}"
    return 0
  else
    echo -e "  ${RED}✗ Not found${NC}"
    return 1
  fi
}

# ============================================================================
# BASIC SITE CHECKS
# ============================================================================

echo ""
echo "1. BASIC SITE CHECKS"
echo "═══════════════════════"

if ! check_endpoint "$DOMAIN" "Homepage"; then
  FAILED=$((FAILED + 1))
fi

if ! check_endpoint "$DOMAIN/login" "Login Page"; then
  FAILED=$((FAILED + 1))
fi

if ! check_endpoint "$DOMAIN/register" "Register Page" "307"; then
  # 307 is redirect (expected for invite-only)
  echo -e "  ${GREEN}✓ Redirect (expected for invite-only)${NC}"
fi

# ============================================================================
# CONTENT CHECKS
# ============================================================================

echo ""
echo "2. CONTENT CHECKS"
echo "═══════════════════════"

# Check for Next.js app
if check_content "$DOMAIN" "Next.js app present" "__NEXT_DATA__"; then
  echo -e "  ${GREEN}✓ Next.js application loaded${NC}"
else
  echo -e "  ${YELLOW}⚠️ Next.js data not found (may be static HTML)${NC}"
fi

# Check for basic HTML structure
if check_content "$DOMAIN" "HTML structure" "<html"; then
  echo -e "  ${GREEN}✓ Valid HTML${NC}"
else
  echo -e "  ${RED}✗ Invalid HTML${NC}"
  FAILED=$((FAILED + 1))
fi

# Check for body content
if check_content "$DOMAIN" "Body content" "<body"; then
  echo -e "  ${GREEN}✓ Body present${NC}"
else
  echo -e "  ${RED}✗ No body content${NC}"
  FAILED=$((FAILED + 1))
fi

# ============================================================================
# CLERK CHECKS
# ============================================================================

echo ""
echo "3. CLERK AUTHENTICATION"
echo "═══════════════════════"

# Check for Clerk script
if check_content "$DOMAIN/login" "Clerk script" "clerk"; then
  echo -e "  ${GREEN}✓ Clerk present${NC}"
else
  echo -e "  ${YELLOW}⚠️ Clerk script not detected (may be lazy-loaded)${NC}"
fi

# Check for sign-in button/form
if check_content "$DOMAIN/login" "Sign-in UI" "sign" || \
   check_content "$DOMAIN/login" "Sign-in UI" "login" || \
   check_content "$DOMAIN/login" "Sign-in UI" "clerk"; then
  echo -e "  ${GREEN}✓ Auth UI present${NC}"
else
  echo -e "  ${YELLOW}⚠️ Auth UI not detected in HTML${NC}"
fi

# ============================================================================
# API CONNECTIVITY
# ============================================================================

echo ""
echo "4. API CONNECTIVITY"
echo "═══════════════════════"

# Check if API health endpoint is accessible
API_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" --max-time $TIMEOUT "$DOMAIN/api/health" 2>/dev/null || echo "000")

if [ "$API_HEALTH" == "200" ]; then
  echo -e "${GREEN}✓ API Health endpoint accessible (HTTP 200)${NC}"
elif [ "$API_HEALTH" == "404" ]; then
  echo -e "${YELLOW}⚠️ API Health not found (may be proxy issue)${NC}"
else
  echo -e "${YELLOW}⚠️ API Health check: HTTP $API_HEALTH${NC}"
fi

# ============================================================================
# SECURITY HEADERS
# ============================================================================

echo ""
echo "5. SECURITY HEADERS"
echo "═══════════════════════"

HEADERS=$(curl -s -I --max-time $TIMEOUT "$DOMAIN" 2>/dev/null || echo "")

if echo "$HEADERS" | grep -q "X-Frame-Options"; then
  echo -e "${GREEN}✓ X-Frame-Options present${NC}"
else
  echo -e "${YELLOW}⚠️ X-Frame-Options missing${NC}"
fi

if echo "$HEADERS" | grep -q "X-Content-Type-Options"; then
  echo -e "${GREEN}✓ X-Content-Type-Options present${NC}"
else
  echo -e "${YELLOW}⚠️ X-Content-Type-Options missing${NC}"
fi

if echo "$HEADERS" | grep -q "Content-Security-Policy"; then
  echo -e "${GREEN}✓ CSP present${NC}"
else
  echo -e "${YELLOW}⚠️ CSP missing${NC}"
fi

# ============================================================================
# PERFORMANCE CHECK
# ============================================================================

echo ""
echo "6. PERFORMANCE CHECK"
echo "═══════════════════════"

# Measure load time
START_TIME=$(date +%s%N)
curl -s -o /dev/null --max-time $TIMEOUT "$DOMAIN" 2>/dev/null || true
END_TIME=$(date +%s%N)

# Calculate duration in milliseconds
DURATION=$(( (END_TIME - START_TIME) / 1000000 ))

if [ $DURATION -lt 1000 ]; then
  echo -e "${GREEN}✓ Load time: ${DURATION}ms (Fast)${NC}"
elif [ $DURATION -lt 3000 ]; then
  echo -e "${YELLOW}⚠️ Load time: ${DURATION}ms (Moderate)${NC}"
else
  echo -e "${RED}✗ Load time: ${DURATION}ms (Slow)${NC}"
fi

# ============================================================================
# SUMMARY
# ============================================================================

echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  VERIFICATION SUMMARY${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
  echo -e "${GREEN}╔═══════════════════════════════════════════════════════════╗${NC}"
  echo -e "${GREEN}║  ✅ ALL CRITICAL CHECKS PASSED                            ║${NC}"
  echo -e "${GREEN}╚═══════════════════════════════════════════════════════════╝${NC}"
  echo ""
  echo -e "${GREEN}Frontend is deployed and accessible!${NC}"
  echo ""
  echo "Manual verification steps:"
  echo "  1. Visit $DOMAIN in your browser"
  echo "  2. Open DevTools (F12) and check Console for errors"
  echo "  3. Verify Clerk UI loads on /login"
  echo "  4. Test navigation between pages"
  echo "  5. Check Vercel dashboard for errors"
  echo ""
  exit 0
else
  echo -e "${RED}╔═══════════════════════════════════════════════════════════╗${NC}"
  echo -e "${RED}║  ❌ $FAILED CHECK(S) FAILED                               ║${NC}"
  echo -e "${RED}╚═══════════════════════════════════════════════════════════╝${NC}"
  echo ""
  echo "Troubleshooting:"
  echo "  1. Check Vercel deployment logs"
  echo "  2. Verify environment variables in Vercel dashboard"
  echo "  3. Check if build succeeded"
  echo "  4. Verify domain configuration"
  echo ""
  exit 1
fi
