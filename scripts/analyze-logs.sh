#!/bin/bash
#
# Log Analysis Script
#
# Analyzes application logs for errors and patterns.
# Run this after deployment to check for issues.
#
# Usage: ./scripts/analyze-logs.sh [backend|frontend] [staging|production]
#

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Configuration
SERVICE="${1:-backend}"
ENVIRONMENT="${2:-staging}"
LOOKBACK_MINUTES="${3:-30}"

echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  LOG ANALYSIS - ${SERVICE^^} (${ENVIRONMENT^^})${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""
echo "Service: $SERVICE"
echo "Environment: $ENVIRONMENT"
echo "Lookback: $LOOKBACK_MINUTES minutes"
echo ""

# Track issues
ERRORS=0
WARNINGS=0

# ============================================================================
# ERROR PATTERNS
# ============================================================================

declare -A ERROR_PATTERNS=(
  ["auth"]='authentication failed|auth.*error|clerk.*error|unauthorized'
  ["database"]='database.*error|pg.*error|connection.*refused|timeout'
  ["api"]='api.*error|request.*failed|bad.*request|not.*found'
  ["server"]='server.*error|internal.*error|500|503'
  ["webhook"]='webhook.*failed|webhook.*error'
  ["clerk"]='clerk.*error|jwt.*error|token.*invalid'
)

# ============================================================================
# BACKEND LOG ANALYSIS
# ============================================================================

analyze_backend() {
  echo "1. BACKEND LOG ANALYSIS"
  echo "═══════════════════════"
  
  # Get logs via Render CLI (if available)
  if command -v render &> /dev/null; then
    echo "Fetching logs from Render..."
    
    # Note: In actual deployment, use Render API or dashboard
    # render logs --service muslimeen-api --tail 1000 > /tmp/backend_logs.txt
    
    echo -e "${YELLOW}⚠️  Manual step: Download logs from Render Dashboard${NC}"
    echo "   https://dashboard.render.com/web/services/muslimeen-api/logs"
    
  else
    echo -e "${YELLOW}⚠️  Render CLI not installed${NC}"
    echo "Install with: npm install -g @render/cli"
  fi
  
  # Check local logs if available
  if [ -f "backend/logs/app.log" ]; then
    echo ""
    echo "Analyzing local logs..."
    
    for category in "${!ERROR_PATTERNS[@]}"; do
      pattern="${ERROR_PATTERNS[$category]}"
      count=$(grep -iE "$pattern" backend/logs/app.log 2>/dev/null | wc -l)
      
      if [ $count -gt 0 ]; then
        echo -e "  ${RED}✗ $category errors: $count${NC}"
        ERRORS=$((ERRORS + count))
        
        # Show sample errors
        echo "  Sample errors:"
        grep -iE "$pattern" backend/logs/app.log 2>/dev/null | head -3 | sed 's/^/    /'
      else
        echo -e "  ${GREEN}✓ No $category errors${NC}"
      fi
    done
  fi
}

# ============================================================================
# FRONTEND LOG ANALYSIS
# ============================================================================

analyze_frontend() {
  echo ""
  echo "2. FRONTEND LOG ANALYSIS"
  echo "═══════════════════════"
  
  # Check build logs
  if [ -f "frontend/.next/build-log.txt" ]; then
    echo "Analyzing build logs..."
    
    ERROR_COUNT=$(grep -c "error" frontend/.next/build-log.txt 2>/dev/null || echo 0)
    WARNING_COUNT=$(grep -c "warning" frontend/.next/build-log.txt 2>/dev/null || echo 0)
    
    if [ $ERROR_COUNT -gt 0 ]; then
      echo -e "  ${RED}✗ Build errors: $ERROR_COUNT${NC}"
      ERRORS=$((ERRORS + ERROR_COUNT))
    else
      echo -e "  ${GREEN}✓ No build errors${NC}"
    fi
    
    if [ $WARNING_COUNT -gt 0 ]; then
      echo -e "  ${YELLOW}⚠ Build warnings: $WARNING_COUNT${NC}"
      WARNINGS=$((WARNINGS + WARNING_COUNT))
    fi
  fi
  
  # Check Vercel logs (if available)
  if command -v vercel &> /dev/null; then
    echo ""
    echo "Fetching Vercel logs..."
    echo -e "${YELLOW}⚠️  Check Vercel Dashboard for runtime logs${NC}"
    echo "   https://vercel.com/dashboard"
  fi
}

# ============================================================================
# ERROR SUMMARY
# ============================================================================

print_summary() {
  echo ""
  echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
  echo -e "${BLUE}  ANALYSIS SUMMARY${NC}"
  echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
  echo ""
  
  if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}╔═══════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║  ✅ NO ISSUES DETECTED                                    ║${NC}"
    echo -e "${GREEN}╚═══════════════════════════════════════════════════════════╝${NC}"
  elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}╔═══════════════════════════════════════════════════════════╗${NC}"
    echo -e "${YELLOW}║  ⚠ WARNINGS FOUND ($WARNINGS)                             ║${NC}"
    echo -e "${YELLOW}╚═══════════════════════════════════════════════════════════╝${NC}"
  else
    echo -e "${RED}╔═══════════════════════════════════════════════════════════╗${NC}"
    echo -e "${RED}║  ❌ ERRORS FOUND ($ERRORS)                                ║${NC}"
    echo -e "${RED}╚═══════════════════════════════════════════════════════════╝${NC}"
  fi
  
  echo ""
  echo "Statistics:"
  echo "  Errors: $ERRORS"
  echo "  Warnings: $WARNINGS"
  
  if [ $ERRORS -gt 0 ]; then
    echo ""
    echo "Action Required:"
    echo "  1. Review error logs above"
    echo "  2. Check Sentry for detailed stack traces"
    echo "  3. Rollback if critical errors found"
    echo "  4. Fix issues before proceeding"
  fi
  
  echo ""
}

# ============================================================================
# MAIN
# ============================================================================

case $SERVICE in
  backend)
    analyze_backend
    ;;
  frontend)
    analyze_frontend
    ;;
  *)
    echo "Usage: $0 [backend|frontend] [staging|production] [lookback_minutes]"
    exit 1
    ;;
esac

print_summary

exit $ERRORS
