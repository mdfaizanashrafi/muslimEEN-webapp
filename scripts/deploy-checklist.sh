#!/bin/bash
# MuslimEEN Deployment Checklist Script
# Run this before deploying to ensure everything is ready

echo "🔍 MuslimEEN Deployment Checklist"
echo "=================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

checks_passed=0
checks_failed=0

# Function to check if a file exists
check_file() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}✓${NC} $2 found"
        ((checks_passed++))
        return 0
    else
        echo -e "${RED}✗${NC} $2 not found"
        ((checks_failed++))
        return 1
    fi
}

# Function to check if a directory exists
check_dir() {
    if [ -d "$1" ]; then
        echo -e "${GREEN}✓${NC} $2 found"
        ((checks_passed++))
        return 0
    else
        echo -e "${RED}✗${NC} $2 not found"
        ((checks_failed++))
        return 1
    fi
}

echo "📁 Checking Project Structure..."
check_dir "frontend" "Frontend directory"
check_dir "backend" "Backend directory"
check_file "frontend/package.json" "Frontend package.json"
check_file "backend/package.json" "Backend package.json"

echo ""
echo "⚙️ Checking Configuration Files..."
check_file "frontend/next.config.js" "Next.js config"
check_file "render.yaml" "Render config"
check_file "vercel.json" "Vercel config"

echo ""
echo "📖 Checking Documentation..."
check_file "DEPLOYMENT_VERCEL_RENDER.md" "Deployment guide"

echo ""
echo "🔐 Checking Environment Variables..."
if [ -f "backend/.env" ]; then
    echo -e "${YELLOW}⚠${NC} backend/.env exists - make sure secrets are NOT committed to git"
    ((checks_passed++))
else
    echo -e "${GREEN}✓${NC} backend/.env not in repo (good)"
    ((checks_passed++))
fi

if [ -f "backend/.env.example" ]; then
    echo -e "${GREEN}✓${NC} backend/.env.example exists"
    ((checks_passed++))
else
    echo -e "${RED}✗${NC} backend/.env.example missing"
    ((checks_failed++))
fi

echo ""
echo "📦 Checking Node Dependencies..."
if [ -d "frontend/node_modules" ]; then
    echo -e "${GREEN}✓${NC} Frontend dependencies installed"
    ((checks_passed++))
else
    echo -e "${RED}✗${NC} Frontend dependencies missing - run: cd frontend && npm install"
    ((checks_failed++))
fi

if [ -d "backend/node_modules" ]; then
    echo -e "${GREEN}✓${NC} Backend dependencies installed"
    ((checks_passed++))
else
    echo -e "${RED}✗${NC} Backend dependencies missing - run: cd backend && npm install"
    ((checks_failed++))
fi

echo ""
echo "🧪 Checking Build Capability..."
echo "Testing frontend build (this may take a minute)..."
cd frontend
if npm run build > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} Frontend builds successfully"
    ((checks_passed++))
else
    echo -e "${RED}✗${NC} Frontend build failed - check for TypeScript errors"
    ((checks_failed++))
fi
cd ..

echo "Testing backend build..."
cd backend
if npm run build > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} Backend builds successfully"
    ((checks_passed++))
else
    echo -e "${RED}✗${NC} Backend build failed - check for TypeScript errors"
    ((checks_failed++))
fi
cd ..

echo ""
echo "=================================="
echo "📊 Summary"
echo "=================================="
echo -e "${GREEN}Passed: $checks_passed${NC}"
echo -e "${RED}Failed: $checks_failed${NC}"
echo ""

if [ $checks_failed -eq 0 ]; then
    echo -e "${GREEN}🎉 All checks passed! You're ready to deploy.${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Push code to GitHub: git push origin main"
    echo "2. Follow DEPLOYMENT_VERCEL_RENDER.md for deployment instructions"
    exit 0
else
    echo -e "${YELLOW}⚠️ Please fix the failed checks before deploying.${NC}"
    exit 1
fi
