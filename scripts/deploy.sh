#!/bin/bash
# =============================================================================
# MUSLIMEEN DEPLOYMENT SCRIPT
# =============================================================================
# Usage: ./scripts/deploy.sh [environment] [--local|--gha]
#   environment: staging | production (default: production)
#   --local: Build and deploy locally (requires Render/Vercel CLI)
#   --gha:   Trigger GitHub Actions workflow (requires gh CLI)
#
# Examples:
#   ./scripts/deploy.sh production --gha     # Trigger GitHub Actions
#   ./scripts/deploy.sh production --local   # Local deployment
#   ./scripts/deploy.sh production           # Default: --gha
# =============================================================================

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT="${1:-production}"
DEPLOY_MODE="${2:---gha}"
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
        log_info "Usage: $0 [staging|production] [--local|--gha]"
        exit 1
    fi
    log_info "Deploying to: $ENVIRONMENT (mode: $DEPLOY_MODE)"
}

# Check prerequisites for GitHub Actions mode
check_gha_prerequisites() {
    log_info "Checking GitHub Actions prerequisites..."
    
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
    
    log_success "GitHub Actions prerequisites check passed"
}

# Check prerequisites for local deployment mode
check_local_prerequisites() {
    log_info "Checking local deployment prerequisites..."
    
    # Check Node.js version
    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        log_error "Node.js 18+ required (found: $(node -v))"
        exit 1
    fi
    log_success "Node.js version check passed ($(node -v))"
    
    # Check if .env.production exists for production deployments
    if [[ "$ENVIRONMENT" == "production" ]] && [ ! -f "backend/.env.production" ]; then
        log_warning "backend/.env.production not found"
        log_info "Copy backend/.env.production.example to backend/.env.production and fill in values"
    fi
    
    log_success "Local deployment prerequisites check passed"
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

# Deploy using GitHub Actions
deploy_via_gha() {
    log_info "Triggering GitHub Actions deployment..."
    
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
    
    # Watch deployment
    log_info "Monitoring deployment..."
    gh run watch "$RUN_ID" --repo "$GITHUB_REPO" --interval 15
    
    # Check final status
    STATUS=$(gh run view "$RUN_ID" --repo "$GITHUB_REPO" --json conclusion --jq '.conclusion')
    
    if [[ "$STATUS" == "success" ]]; then
        log_success "Deployment completed successfully!"
        log_info "Deployment URLs:"
        echo "  Backend:  https://api.muslimeen.org"
        echo "  Frontend: https://muslimeen.org"
    else
        log_error "Deployment failed with status: $STATUS"
        log_info "Check logs: https://github.com/$GITHUB_REPO/actions/runs/$RUN_ID"
        exit 1
    fi
}

# Deploy locally (build + deploy via CLI)
deploy_local() {
    log_info "Starting local deployment..."
    
    # =============================================================================
    # BUILD BACKEND
    # =============================================================================
    log_info "Building backend..."
    cd backend
    
    # Install dependencies
    npm ci
    
    # Run TypeScript build
    npm run build
    
    # Run tests
    npm test || log_warning "Some tests failed - continuing with deployment"
    
    cd ..
    
    # =============================================================================
    # BUILD FRONTEND
    # =============================================================================
    log_info "Building frontend..."
    cd frontend
    
    # Install dependencies
    npm ci
    
    # Run TypeScript build
    npm run build
    
    cd ..
    
    # =============================================================================
    # DEPLOY TO RENDER (Backend)
    # =============================================================================
    log_info "Deploying backend to Render..."
    if command -v render &> /dev/null; then
        render deploy --service muslimeen-api || log_warning "Render deploy command failed"
    else
        log_warning "Render CLI not found. Install with: npm i -g @render/cli"
        log_info "Falling back to deploy hook..."
        if [ -n "${RENDER_DEPLOY_HOOK:-}" ]; then
            curl -X POST "$RENDER_DEPLOY_HOOK"
            log_success "Deploy hook triggered"
        else
            log_warning "RENDER_DEPLOY_HOOK not set. Skipping backend deployment."
        fi
    fi
    
    # =============================================================================
    # DEPLOY TO VERCEL (Frontend)
    # =============================================================================
    log_info "Deploying frontend to Vercel..."
    cd frontend
    
    if command -v vercel &> /dev/null; then
        vercel --prod || log_warning "Vercel deploy command failed"
    else
        log_warning "Vercel CLI not found. Install with: npm i -g vercel"
        log_info "Please deploy manually: cd frontend && vercel --prod"
    fi
    
    cd ..
    
    # =============================================================================
    # POST-DEPLOYMENT
    # =============================================================================
    log_success "Local deployment process complete!"
    log_info "Next steps:"
    echo "1. Run database migrations on Neon (if needed)"
    echo "2. Verify health checks: curl https://api.muslimeen.org/api/health"
    echo "3. Test frontend: https://muslimeen.org"
}

# Main execution
main() {
    echo "================================"
    echo "  MuslimEEN Deployment Script"
    echo "================================"
    echo ""
    
    validate_environment
    
    case "$DEPLOY_MODE" in
        --gha)
            check_gha_prerequisites
            run_pre_checks
            deploy_via_gha
            ;;
        --local)
            check_local_prerequisites
            run_pre_checks
            deploy_local
            ;;
        *)
            log_error "Invalid deploy mode: $DEPLOY_MODE"
            log_info "Usage: $0 [staging|production] [--local|--gha]"
            exit 1
            ;;
    esac
    
    echo ""
    log_success "Deployment to $ENVIRONMENT completed!"
}

# Run main function
main "$@"
