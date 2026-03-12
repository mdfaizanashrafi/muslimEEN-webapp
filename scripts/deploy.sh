#!/bin/bash
# =============================================================================
# MUSLIMEEN DEPLOYMENT SCRIPT
# =============================================================================
# Usage: ./scripts/deploy.sh [environment]
#   environment: staging | production (default: staging)
#
# This script:
#   1. Validates environment
#   2. Runs pre-deployment checks
#   3. Triggers GitHub Actions workflow
#   4. Monitors deployment status
# =============================================================================

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT="${1:-staging}"
GITHUB_REPO="muslimeen/muslimeen"
WORKFLOW_FILE="ci-cd.yml"

# Functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Validate environment
validate_environment() {
    if [[ ! "$ENVIRONMENT" =~ ^(staging|production)$ ]]; then
        log_error "Invalid environment: $ENVIRONMENT"
        log_info "Usage: $0 [staging|production]"
        exit 1
    fi
    log_info "Deploying to: $ENVIRONMENT"
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check if gh CLI is installed
    if ! command -v gh &> /dev/null; then
        log_error "GitHub CLI (gh) is not installed"
        log_info "Install from: https://cli.github.com/"
        exit 1
    fi
    
    # Check if authenticated
    if ! gh auth status &> /dev/null; then
        log_error "Not authenticated with GitHub CLI"
        log_info "Run: gh auth login"
        exit 1
    fi
    
    log_success "Prerequisites check passed"
}

# Run pre-deployment checks
run_pre_checks() {
    log_info "Running pre-deployment checks..."
    
    # Check if on main branch for production
    if [[ "$ENVIRONMENT" == "production" ]]; then
        CURRENT_BRANCH=$(git branch --show-current)
        if [[ "$CURRENT_BRANCH" != "main" ]]; then
            log_error "Production deployments must be from 'main' branch"
            log_info "Current branch: $CURRENT_BRANCH"
            exit 1
        fi
        
        # Check for uncommitted changes
        if ! git diff-index --quiet HEAD --; then
            log_error "Uncommitted changes detected"
            log_info "Please commit or stash changes before deploying"
            exit 1
        fi
    fi
    
    log_success "Pre-deployment checks passed"
}

# Trigger deployment
trigger_deployment() {
    log_info "Triggering deployment workflow..."
    
    # Dispatch workflow
    if ! gh workflow run "$WORKFLOW_FILE" \
        --repo "$GITHUB_REPO" \
        --ref "${ENVIRONMENT}" \
        -f environment="$ENVIRONMENT"; then
        log_error "Failed to trigger deployment workflow"
        exit 1
    fi
    
    log_success "Deployment workflow triggered"
    
    # Get run ID
    sleep 2
    RUN_ID=$(gh run list \
        --workflow="$WORKFLOW_FILE" \
        --repo "$GITHUB_REPO" \
        --limit 1 \
        --json databaseId \
        --jq '.[0].databaseId')
    
    log_info "Run ID: $RUN_ID"
    log_info "Monitor at: https://github.com/$GITHUB_REPO/actions/runs/$RUN_ID"
}

# Monitor deployment
monitor_deployment() {
    log_info "Monitoring deployment..."
    
    gh run watch "$RUN_ID" --repo "$GITHUB_REPO" --interval 15
    
    # Check final status
    STATUS=$(gh run view "$RUN_ID" --repo "$GITHUB_REPO" --json conclusion --jq '.conclusion')
    
    if [[ "$STATUS" == "success" ]]; then
        log_success "Deployment completed successfully!"
        
        # Display deployment URLs
        log_info "Deployment URLs:"
        echo "  Backend:  https://api.muslimeen.org"
        echo "  Frontend: https://muslimeen.org"
    else
        log_error "Deployment failed with status: $STATUS"
        log_info "Check logs: https://github.com/$GITHUB_REPO/actions/runs/$RUN_ID"
        exit 1
    fi
}

# Main execution
main() {
    echo "================================"
    echo "  MuslimEEN Deployment Script"
    echo "================================"
    echo ""
    
    validate_environment
    check_prerequisites
    run_pre_checks
    trigger_deployment
    monitor_deployment
    
    echo ""
    log_success "Deployment to $ENVIRONMENT completed!"
}

# Run main function
main "$@"
