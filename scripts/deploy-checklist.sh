#!/bin/bash
# =============================================================================
# MUSLIMEEN PRODUCTION DEPLOYMENT CHECKLIST
# =============================================================================
# Run this script before deploying to production
# =============================================================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo "================================"
echo "  Production Deployment"
echo "  Pre-Deployment Checklist"
echo "================================"
echo ""

# Checklist items
checks=(
    "Code reviewed and approved"
    "All tests passing locally"
    "Database migrations tested"
    "Environment variables updated"
    "Feature flags configured"
    "Monitoring dashboards checked"
    "Rollback plan prepared"
    "Team notified"
)

completed=0
total=${#checks[@]}

for check in "${checks[@]}"; do
    read -p "[ ] $check - completed? (y/n): " response
    if [[ $response =~ ^[Yy]$ ]]; then
        echo -e "${GREEN}✓${NC} $check"
        ((completed++))
    else
        echo -e "${RED}✗${NC} $check - PLEASE COMPLETE BEFORE DEPLOYING"
    fi
    echo ""
done

echo "================================"
echo "  Checklist Summary"
echo "================================"
echo -e "Completed: ${GREEN}$completed/$total${NC}"
echo ""

if [ $completed -eq $total ]; then
    echo -e "${GREEN}All checks passed! Ready to deploy.${NC}"
    echo ""
    read -p "Proceed with deployment? (y/n): " deploy
    if [[ $deploy =~ ^[Yy]$ ]]; then
        ./scripts/deploy.sh production
    else
        echo "Deployment cancelled."
    fi
else
    echo -e "${RED}Please complete all checks before deploying.${NC}"
    exit 1
fi
