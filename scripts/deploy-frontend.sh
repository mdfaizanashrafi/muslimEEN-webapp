#!/bin/bash
#
# Frontend Deployment Script for Vercel
# 
# Deploys the MuslimEEN frontend with verification.
#
# Usage: ./scripts/deploy-frontend.sh [staging|production]
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
FRONTEND_DIR="frontend"

if [ "$ENVIRONMENT" == "production" ]; then
  DOMAIN="https://muslimeen.org"
  VERCEL_ARGS="--prod"
else
  DOMAIN="https://muslimeen-staging.vercel.app"
  VERCEL_ARGS=""
fi

echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  FRONTEND DEPLOYMENT - ${ENVIRONMENT^^}${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""
echo "Target: $DOMAIN"
echo ""

# ============================================================================
# PRE-DEPLOYMENT CHECKS
# ============================================================================

echo -e "${BLUE}[1/6]${NC} Running pre-deployment checks..."

# Check if frontend directory exists
if [ ! -d "$FRONTEND_DIR" ]; then
  echo -e "${RED}❌ Frontend directory not found${NC}"
  exit 1
fi

# Check if node_modules exists
if [ ! -d "$FRONTEND_DIR/node_modules" ]; then
  echo -e "${YELLOW}⚠️  Installing dependencies...${NC}"
  cd $FRONTEND_DIR && npm install
  cd ..
fi

# Check if required env vars are set in .env.local
if [ ! -f "$FRONTEND_DIR/.env.local" ] && [ ! -f "$FRONTEND_DIR/.env.production" ]; then
  echo -e "${YELLOW}⚠️  No .env.local or .env.production file found${NC}"
  echo "Make sure environment variables are set in Vercel dashboard"
fi

echo -e "${GREEN}✓ Pre-deployment checks passed${NC}"

# ============================================================================
# BUILD
# ============================================================================

echo ""
echo -e "${BLUE}[2/6]${NC} Building frontend..."

cd $FRONTEND_DIR

# Run build
if npm run build; then
  echo -e "${GREEN}✓ Build successful${NC}"
else
  echo -e "${RED}❌ Build failed${NC}"
  exit 1
fi

cd ..

# ============================================================================
# LINT
# ============================================================================

echo ""
echo -e "${BLUE}[3/6]${NC} Running linter..."

cd $FRONTEND_DIR

if npm run lint; then
  echo -e "${GREEN}✓ Lint passed${NC}"
else
  echo -e "${YELLOW}⚠️  Lint warnings found${NC}"
fi

cd ..

# ============================================================================
# DEPLOY
# ============================================================================

echo ""
echo -e "${BLUE}[4/6]${NC} Deploying to Vercel..."

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
  echo -e "${YELLOW}⚠️  Vercel CLI not found. Installing...${NC}"
  npm install -g vercel
fi

# Deploy
cd $FRONTEND_DIR

if vercel $VERCEL_ARGS --yes; then
  echo -e "${GREEN}✓ Deployment successful${NC}"
else
  echo -e "${RED}❌ Deployment failed${NC}"
  exit 1
fi

cd ..

# ============================================================================
# VERIFY
# ============================================================================

echo ""
echo -e "${BLUE}[5/6]${NC} Verifying deployment..."

# Wait for deployment to be ready
echo "Waiting for deployment to be ready..."
sleep 10

# Check if site is accessible
MAX_RETRIES=6
RETRY_COUNT=0
SITE_READY=false

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
  HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$DOMAIN" 2>/dev/null || echo "000")
  
  if [ "$HTTP_STATUS" == "200" ]; then
    SITE_READY=true
    break
  fi
  
  echo "  Attempt $((RETRY_COUNT + 1))/$MAX_RETRIES: HTTP $HTTP_STATUS"
  sleep 5
  RETRY_COUNT=$((RETRY_COUNT + 1))
done

if [ "$SITE_READY" != true ]; then
  echo -e "${RED}❌ Site not accessible after $MAX_RETRIES attempts${NC}"
  exit 1
fi

echo -e "${GREEN}✓ Site is accessible (HTTP 200)${NC}"

# ============================================================================
# HEALTH CHECKS
# ============================================================================

echo ""
echo -e "${BLUE}[6/6]${NC} Running health checks..."

# Check main pages
PAGES=(
  "/"
  "/login"
  "/register"
)

for page in "${PAGES[@]}"; do
  echo "  Checking $page..."
  HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$DOMAIN$page" 2>/dev/null || echo "000")
  
  if [ "$HTTP_STATUS" == "200" ] || [ "$HTTP_STATUS" == "307" ] || [ "$HTTP_STATUS" == "308" ]; then
    echo -e "    ${GREEN}✓ $page (HTTP $HTTP_STATUS)${NC}"
  else
    echo -e "    ${YELLOW}⚠️ $page (HTTP $HTTP_STATUS)${NC}"
  fi
done

# ============================================================================
# SUMMARY
# ============================================================================

echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  DEPLOYMENT SUMMARY${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""

echo -e "${GREEN}╔═══════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  ✅ DEPLOYMENT COMPLETE                                   ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════════════════════╝${NC}"
echo ""
echo "Environment: $ENVIRONMENT"
echo "URL: $DOMAIN"
echo ""
echo "Next steps:"
echo "  1. Visit $DOMAIN to verify visually"
echo "  2. Check browser console for errors"
echo "  3. Test login functionality"
echo "  4. Check Vercel dashboard for analytics"
echo ""

exit 0
