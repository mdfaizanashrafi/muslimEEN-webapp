#!/bin/bash
#
# Deployment Verification Script
# 
# Verifies backend deployment by checking health endpoints.
# Run this after deployment to confirm success.
#
# Usage: ./verify-deployment.sh [staging|production]
#

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT="${1:-staging}"

if [ "$ENVIRONMENT" == "production" ]; then
  BASE_URL="https://muslimeen-api.onrender.com"
else
  BASE_URL="https://muslimeen-api-staging.onrender.com"
fi

TIMEOUT=30
RETRIES=6
DELAY=5

echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  DEPLOYMENT VERIFICATION - ${ENVIRONMENT^^}${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""
echo "Target URL: $BASE_URL"
echo ""

# Function to check endpoint
check_endpoint() {
  local endpoint=$1
  local name=$2
  local expected_status=${3:-200}
  
  echo -e "${BLUE}[CHECK]${NC} $name ($endpoint)"
  
  local attempt=1
  local success=false
  
  while [ $attempt -le $RETRIES ]; do
    local response
    local status
    
    response=$(curl -s -o /dev/null -w "%{http_code}" --max-time $TIMEOUT "$BASE_URL$endpoint" 2>/dev/null || echo "000")
    
    if [ "$response" == "$expected_status" ]; then
      success=true
      break
    fi
    
    echo -e "  Attempt $attempt/$RETRIES: HTTP $response (expected $expected_status)"
    
    if [ $attempt -lt $RETRIES ]; then
      sleep $DELAY
    fi
    
    attempt=$((attempt + 1))
  done
  
  if [ "$success" == true ]; then
    echo -e "  ${GREEN}✅ OK${NC} (HTTP $response)"
    return 0
  else
    echo -e "  ${RED}❌ FAILED${NC} (HTTP $response)"
    return 1
  fi
}

# Function to check response content
check_response_content() {
  local endpoint=$1
  local name=$2
  local expected_content=$3
  
  echo -e "${BLUE}[CHECK]${NC} $name content"
  
  local response
  response=$(curl -s --max-time $TIMEOUT "$BASE_URL$endpoint" 2>/dev/null || echo "")
  
  if echo "$response" | grep -q "$expected_content"; then
    echo -e "  ${GREEN}✅ Contains: $expected_content${NC}"
    return 0
  else
    echo -e "  ${RED}❌ Missing: $expected_content${NC}"
    echo -e "  Response: ${response:0:200}"
    return 1
  fi
}

# Track failures
FAILED=0

# 1. Basic Health
echo ""
echo "1. BASIC HEALTH CHECKS"
echo "═══════════════════════"

if ! check_endpoint "/health" "Basic Health"; then
  FAILED=$((FAILED + 1))
fi

if ! check_response_content "/health" "Basic Health" "status"; then
  FAILED=$((FAILED + 1))
fi

# 2. Auth Health
echo ""
echo "2. AUTHENTICATION HEALTH"
echo "═══════════════════════"

if ! check_endpoint "/api/health/auth" "Auth Health"; then
  FAILED=$((FAILED + 1))
fi

if ! check_response_content "/api/health/auth" "Auth Health" "clerk"; then
  FAILED=$((FAILED + 1))
fi

# 3. Auth Ready Status
echo ""
echo "3. READINESS CHECK"
echo "═══════════════════════"

if ! check_endpoint "/api/health/auth/ready" "Auth Ready"; then
  FAILED=$((FAILED + 1))
fi

# 4. Status Endpoint
echo ""
echo "4. STATUS ENDPOINT"
echo "═══════════════════════"

if ! check_endpoint "/status" "Status"; then
  FAILED=$((FAILED + 1))
fi

if ! check_response_content "/status" "Status" "ok"; then
  FAILED=$((FAILED + 1))
fi

# 5. Root Endpoint
echo ""
echo "5. ROOT ENDPOINT"
echo "═══════════════════════"

if ! check_endpoint "/" "Root"; then
  FAILED=$((FAILED + 1))
fi

# Summary
echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  VERIFICATION SUMMARY${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
  echo -e "${GREEN}╔═══════════════════════════════════════════════════════════╗${NC}"
  echo -e "${GREEN}║  ✅ ALL CHECKS PASSED                                     ║${NC}"
  echo -e "${GREEN}╚═══════════════════════════════════════════════════════════╝${NC}"
  echo ""
  echo -e "${GREEN}Deployment to $ENVIRONMENT is VERIFIED and READY!${NC}"
  echo ""
  echo "Next steps:"
  echo "  1. Monitor error rates in Sentry"
  echo "  2. Check application logs"
  echo "  3. Test user-facing features"
  echo "  4. Monitor for 30 minutes"
  echo ""
  exit 0
else
  echo -e "${RED}╔═══════════════════════════════════════════════════════════╗${NC}"
  echo -e "${RED}║  ❌ VERIFICATION FAILED                                   ║${NC}"
  echo -e "${RED}╚═══════════════════════════════════════════════════════════╝${NC}"
  echo ""
  echo -e "${RED}$FAILED check(s) failed!${NC}"
  echo ""
  echo "Troubleshooting:"
  echo "  1. Check deployment logs in Render dashboard"
  echo "  2. Verify environment variables are set"
  echo "  3. Check database connection"
  echo "  4. Review application logs"
  echo ""
  echo "Roll back if needed:"
  echo "  Render Dashboard > muslimeen-api > Manual Deploy > Previous Build"
  echo ""
  exit 1
fi
