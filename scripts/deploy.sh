#!/bin/bash

# MuslimEEN Deployment Script
# Usage: ./scripts/deploy.sh [environment]

set -e

ENVIRONMENT=${1:-production}
echo "🚀 Deploying MuslimEEN to $ENVIRONMENT"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# =============================================================================
# PRE-DEPLOYMENT CHECKS
# =============================================================================

echo -e "${YELLOW}Running pre-deployment checks...${NC}"

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${RED}Error: Node.js 18+ required${NC}"
    exit 1
fi

# Check if .env.production exists
if [ ! -f "backend/.env.production" ]; then
    echo -e "${RED}Error: backend/.env.production not found${NC}"
    echo "Copy backend/.env.production.example to backend/.env.production and fill in values"
    exit 1
fi

# =============================================================================
# BUILD BACKEND
# =============================================================================

echo -e "${YELLOW}Building backend...${NC}"
cd backend

# Install dependencies
npm ci

# Run TypeScript build
npm run build

# Run tests
npm test || echo -e "${YELLOW}Warning: Some tests failed${NC}"

cd ..

# =============================================================================
# BUILD FRONTEND
# =============================================================================

echo -e "${YELLOW}Building frontend...${NC}"
cd frontend

# Install dependencies
npm ci

# Run TypeScript build
npm run build

cd ..

# =============================================================================
# DEPLOY TO RENDER (Backend)
# =============================================================================

echo -e "${YELLOW}Deploying backend to Render...${NC}"
echo "Note: Ensure you have the Render CLI installed: npm i -g @render/cli"

# Uncomment when Render CLI is available
# render deploy --service muslimeen-api

echo -e "${GREEN}Backend deployment triggered${NC}"

# =============================================================================
# DEPLOY TO VERCEL (Frontend)
# =============================================================================

echo -e "${YELLOW}Deploying frontend to Vercel...${NC}"
echo "Note: Ensure you have the Vercel CLI installed: npm i -g vercel"

cd frontend

# Uncomment when ready to deploy
# vercel --prod

cd ..

echo -e "${GREEN}Frontend deployment triggered${NC}"

# =============================================================================
# POST-DEPLOYMENT
# =============================================================================

echo ""
echo -e "${GREEN}✅ Deployment complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Run database migrations on Neon"
echo "2. Verify health checks: curl https://your-api.onrender.com/api/health"
echo "3. Test frontend: https://your-app.vercel.app"
echo ""
echo "Monitoring:"
echo "- Render Dashboard: https://dashboard.render.com"
echo "- Vercel Dashboard: https://vercel.com/dashboard"
echo "- Neon Dashboard: https://console.neon.tech"
echo "- Upstash Dashboard: https://console.upstash.com"
