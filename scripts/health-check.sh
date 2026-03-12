#!/bin/bash
# =============================================================================
# MUSLIMEEN HEALTH CHECK SCRIPT
# =============================================================================
# Usage: ./scripts/health-check.sh [environment]
#   environment: local | staging | production (default: local)
#
# This script performs comprehensive health checks on all services.
# =============================================================================

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
ENVIRONMENT="${1:-local}"

# Service URLs based on environment
case "$ENVIRONMENT" in
    local)
        BACKEND_URL="http://localhost:3001"
        FRONTEND_URL="http://localhost:8080"
        ;;
    staging)
        BACKEND_URL="https://api-staging.muslimeen.org"
        FRONTEND_URL="https://staging.muslimeen.org"
        ;;
    production)
        BACKEND_URL="https://api.muslimeen.org"
        FRONTEND_URL="https://muslimeen.org"
        ;;
    *)
        echo -e "${RED}Invalid environment: $ENVIRONMENT${NC}"
        echo "Usage: $0 [local|staging|production]"
        exit 1
        ;;
esac

# Counters
CHECKS_PASSED=0
CHECKS_FAILED=0

# Functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[PASS]${NC} $1"
    ((CHECKS_PASSED++))
}

log_error() {
    echo -e "${RED}[FAIL]${NC} $1"
    ((CHECKS_FAILED++))
}

# Check HTTP endpoint
check_endpoint() {
    local name="$1"
    local url="$2"
    local expected_status="${3:-200}"
    
    log_info "Checking $name at $url..."
    
    HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$url" || echo "000")
    
    if [[ "$HTTP_STATUS" == "$expected_status" ]] || [[ "$HTTP_STATUS" == "307" && "$expected_status" == "200" ]]; then
        log_success "$name is healthy (HTTP $HTTP_STATUS)"
        return 0
    else
        log_error "$name failed (HTTP $HTTP_STATUS, expected $expected_status)"
        return 1
    fi
}

# Check API health endpoint
check_api_health() {
    log_info "Checking API health endpoint..."
    
    RESPONSE=$(curl -s "$BACKEND_URL/api/health" || echo "{}")
    
    # Check if response is valid JSON
    if ! echo "$RESPONSE" | jq -e . > /dev/null 2>&1; then
        log_error "Invalid JSON response from health endpoint"
        return 1
    fi
    
    # Check success field
    SUCCESS=$(echo "$RESPONSE" | jq -r '.success // false')
    if [[ "$SUCCESS" == "true" ]]; then
        log_success "API health check passed"
        echo "$RESPONSE" | jq .
        return 0
    else
        log_error "API health check failed"
        echo "$RESPONSE" | jq .
        return 1
    fi
}

# Check database connectivity
check_database() {
    log_info "Checking database connectivity..."
    
    # This would require a specific endpoint or direct DB connection
    # For now, we check if the health endpoint includes DB status
    RESPONSE=$(curl -s "$BACKEND_URL/api/health" || echo "{}")
    DB_STATUS=$(echo "$RESPONSE" | jq -r '.data.database // "unknown"')
    
    if [[ "$DB_STATUS" == "connected" ]]; then
        log_success "Database is connected"
        return 0
    else
        log_error "Database status: $DB_STATUS"
        return 1
    fi
}

# Check frontend assets
check_frontend() {
    log_info "Checking frontend..."
    
    check_endpoint "Frontend" "$FRONTEND_URL" "200"
}

# Main execution
main() {
    echo "================================"
    echo "  MuslimEEN Health Check"
    echo "  Environment: $ENVIRONMENT"
    echo "================================"
    echo ""
    
    # Check dependencies
    if ! command -v curl &> /dev/null; then
        echo -e "${RED}curl is required but not installed${NC}"
        exit 1
    fi
    
    if ! command -v jq &> /dev/null; then
        echo -e "${YELLOW}Warning: jq not installed. Some checks may fail.${NC}"
    fi
    
    # Run checks
    check_endpoint "Backend" "$BACKEND_URL" "200"
    check_frontend
    
    if command -v jq &> /dev/null; then
        check_api_health
        check_database
    fi
    
    # Summary
    echo ""
    echo "================================"
    echo "  Health Check Summary"
    echo "================================"
    echo -e "${GREEN}Passed: $CHECKS_PASSED${NC}"
    echo -e "${RED}Failed: $CHECKS_FAILED${NC}"
    echo ""
    
    if [[ $CHECKS_FAILED -eq 0 ]]; then
        echo -e "${GREEN}All health checks passed!${NC}"
        exit 0
    else
        echo -e "${RED}Some health checks failed!${NC}"
        exit 1
    fi
}

main "$@"
