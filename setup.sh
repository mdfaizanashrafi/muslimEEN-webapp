#!/bin/bash
# MuslimEEN - One-Command Setup Script
# Usage: ./setup.sh
# Supports: Linux, macOS, WSL

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m' # No Color
BOLD='\033[1m'

# Logging functions
log_info() { echo -e "${BLUE}ℹ $1${NC}"; }
log_success() { echo -e "${GREEN}✓ $1${NC}"; }
log_warning() { echo -e "${YELLOW}⚠ $1${NC}"; }
log_error() { echo -e "${RED}✗ $1${NC}"; }
log_step() { echo -e "\n${CYAN}${BOLD}▶ $1${NC}"; }

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Default values
DB_NAME="muslimeen"
DB_USER="muslimeen"
DB_PASSWORD=""
POSTGRES_USER="postgres"
POSTGRES_PASSWORD=""
SKIP_DB_SETUP=false

# Display MuslimEEN Logo
show_banner() {
    echo ""
    echo -e "${CYAN}${BOLD}"
    echo "    ███╗   ███╗██╗   ██╗███████╗██╗     ██╗███████╗███████╗███╗   ██╗"
    echo "    ████╗ ████║██║   ██║██╔════╝██║     ██║██╔════╝██╔════╝████╗  ██║"
    echo "    ██╔████╔██║██║   ██║███████╗██║     ██║█████╗  █████╗  ██╔██╗ ██║"
    echo "    ██║╚██╔╝██║██║   ██║╚════██║██║     ██║██╔══╝  ██╔══╝  ██║╚██╗██║"
    echo "    ██║ ╚═╝ ██║╚██████╔╝███████║███████╗██║██║     ███████╗██║ ╚████║"
    echo "    ╚═╝     ╚═╝ ╚═════╝ ╚══════╝╚══════╝╚═╝╚═╝     ╚══════╝╚═╝  ╚═══╝"
    echo -e "${NC}"
    echo -e "  ${MAGENTA}Muslim Economic Empowerment Network${NC}"
    echo -e "  ${YELLOW}Professional Networking for the Muslim Community${NC}"
    echo ""
    echo -e "${GREEN}${BOLD}════════════════════════════════════════════════════════════════${NC}"
    echo -e "  ${BOLD}Development Environment Setup${NC}"
    echo -e "${GREEN}${BOLD}════════════════════════════════════════════════════════════════${NC}"
    echo ""
}

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check Node.js version
check_node_version() {
    local version=$(node -v | cut -d'v' -f2)
    local major=$(echo "$version" | cut -d'.' -f1)
    
    if [ "$major" -ge 18 ]; then
        return 0
    else
        return 1
    fi
}

# Check prerequisites
check_prerequisites() {
    log_step "Checking Prerequisites"
    
    local missing=()
    
    # Check Node.js
    if command_exists node; then
        if check_node_version; then
            log_success "Node.js $(node -v) installed"
        else
            log_error "Node.js version must be >= 18.0.0 (found $(node -v))"
            missing+=("Node.js >= 18")
        fi
    else
        log_error "Node.js not found"
        missing+=("Node.js >= 18")
    fi
    
    # Check npm
    if command_exists npm; then
        log_success "npm $(npm -v) installed"
    else
        log_error "npm not found"
        missing+=("npm")
    fi
    
    # Check PostgreSQL
    if command_exists psql; then
        log_success "PostgreSQL $(psql --version | awk '{print $3}') installed"
    else
        log_warning "PostgreSQL not found - database setup will be skipped"
        SKIP_DB_SETUP=true
    fi
    
    # Check if PostgreSQL is running
    if [ "$SKIP_DB_SETUP" = false ]; then
        if pg_isready -h localhost -p 5432 >/dev/null 2>&1; then
            log_success "PostgreSQL is running on localhost:5432"
        else
            log_warning "PostgreSQL is not running on localhost:5432"
            log_info "Attempting to start PostgreSQL..."
            
            # Try to start PostgreSQL (various methods)
            if command_exists systemctl; then
                sudo systemctl start postgresql 2>/dev/null || true
            elif command_exists service; then
                sudo service postgresql start 2>/dev/null || true
            elif command_exists brew; then
                brew services start postgresql 2>/dev/null || true
            elif [ -f "/etc/init.d/postgresql" ]; then
                sudo /etc/init.d/postgresql start 2>/dev/null || true
            fi
            
            # Check again
            sleep 2
            if pg_isready -h localhost -p 5432 >/dev/null 2>&1; then
                log_success "PostgreSQL started successfully"
            else
                log_warning "Could not start PostgreSQL automatically"
                SKIP_DB_SETUP=true
            fi
        fi
    fi
    
    # Display missing dependencies
    if [ ${#missing[@]} -ne 0 ]; then
        echo ""
        log_error "Missing required dependencies:"
        for dep in "${missing[@]}"; do
            echo "  • $dep"
        done
        echo ""
        log_info "Please install the missing dependencies and try again:"
        echo ""
        echo "  macOS (with Homebrew):"
        echo "    brew install node@18"
        echo ""
        echo "  Ubuntu/Debian:"
        echo "    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -"
        echo "    sudo apt-get install -y nodejs"
        echo ""
        echo "  Windows:"
        echo "    Download from: https://nodejs.org/en/download/"
        echo ""
        exit 1
    fi
    
    if [ "$SKIP_DB_SETUP" = true ]; then
        echo ""
        log_warning "Database setup will be skipped. You can run it later with:"
        echo "  npm run migrate"
        echo ""
    fi
}

# Prompt for input with default value
prompt_input() {
    local prompt="$1"
    local default="$2"
    local var_name="$3"
    local is_password="${4:-false}"
    
    if [ -n "$default" ]; then
        prompt="$prompt [$default]: "
    else
        prompt="$prompt: "
    fi
    
    if [ "$is_password" = true ]; then
        read -rs -p "$prompt" value
        echo ""
    else
        read -p "$prompt" value
    fi
    
    if [ -z "$value" ] && [ -n "$default" ]; then
        value="$default"
    fi
    
    eval "$var_name='$value'"
}

# Setup environment files
setup_environment() {
    log_step "Setting Up Environment"
    
    # Backend .env
    local backend_env="$SCRIPT_DIR/backend/.env"
    local backend_env_example="$SCRIPT_DIR/backend/.env.example"
    
    if [ -f "$backend_env" ]; then
        log_info "Backend .env file already exists"
        read -p "  Overwrite? (y/N): " overwrite
        if [[ ! "$overwrite" =~ ^[Yy]$ ]]; then
            log_info "Skipping backend .env setup"
        else
            create_backend_env
        fi
    else
        create_backend_env
    fi
    
    # Frontend .env (optional)
    local frontend_env="$SCRIPT_DIR/frontend/.env.local"
    if [ ! -f "$frontend_env" ]; then
        log_info "Creating frontend .env.local file"
        cat > "$frontend_env" << EOF
# MuslimEEN Frontend Environment
NEXT_PUBLIC_API_URL=http://localhost:3001/api
EOF
        log_success "Frontend .env.local created"
    fi
}

# Create backend .env file
create_backend_env() {
    local backend_env="$SCRIPT_DIR/backend/.env"
    
    log_info "Configuring backend environment"
    echo ""
    
    # Generate random secrets
    local jwt_secret="dev-jwt-secret-$(openssl rand -hex 16 2>/dev/null || date +%s%N | sha256sum | head -c 32)"
    local csrf_secret="dev-csrf-secret-$(openssl rand -hex 16 2>/dev/null || date +%s%N | sha256sum | head -c 32)"
    
    # Prompt for database settings if not skipping DB setup
    if [ "$SKIP_DB_SETUP" = false ]; then
        echo -e "${CYAN}Database Configuration:${NC}"
        prompt_input "  Database name" "$DB_NAME" "DB_NAME"
        prompt_input "  Database user" "$DB_USER" "DB_USER"
        prompt_input "  Database password" "" "DB_PASSWORD" true
        
        if [ -z "$DB_PASSWORD" ]; then
            DB_PASSWORD="muslimeen123"
            log_info "Using default password: $DB_PASSWORD"
        fi
    else
        # Use defaults for DB when skipping
        DB_PASSWORD="${DB_PASSWORD:-muslimeen123}"
    fi
    
    # Create .env file
    cat > "$backend_env" << EOF
# MuslimEEN Backend Environment Configuration
# Generated: $(date)

# Server Configuration
NODE_ENV=development
PORT=3001

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=$DB_NAME
DB_USER=$DB_USER
DB_PASSWORD=$DB_PASSWORD

# JWT Configuration
JWT_SECRET=$jwt_secret
JWT_EXPIRES_IN=24h

# Security
BCRYPT_ROUNDS=12
CSRF_SECRET=$csrf_secret

# Logging
LOG_LEVEL=info

# CORS
FRONTEND_URL=http://localhost:8080

# Admin Configuration
ADMIN_EMAIL=admin@muslimeen.space
EOF
    
    log_success "Backend .env file created"
}

# Install dependencies
install_dependencies() {
    log_step "Installing Dependencies"
    
    # Backend dependencies
    log_info "Installing backend dependencies..."
    cd "$SCRIPT_DIR/backend"
    
    if npm install; then
        log_success "Backend dependencies installed"
    else
        log_error "Failed to install backend dependencies"
        exit 1
    fi
    
    # Frontend dependencies
    log_info "Installing frontend dependencies..."
    cd "$SCRIPT_DIR/frontend"
    
    if npm install; then
        log_success "Frontend dependencies installed"
    else
        log_error "Failed to install frontend dependencies"
        exit 1
    fi
    
    cd "$SCRIPT_DIR"
}

# Setup database
setup_database() {
    if [ "$SKIP_DB_SETUP" = true ]; then
        log_step "Database Setup Skipped"
        return 0
    fi
    
    log_step "Setting Up Database"
    
    # Get PostgreSQL credentials
    echo -e "${CYAN}PostgreSQL Admin Credentials:${NC}"
    prompt_input "  PostgreSQL admin user" "postgres" "POSTGRES_USER"
    prompt_input "  PostgreSQL admin password" "" "POSTGRES_PASSWORD" true
    
    export PGPASSWORD="$POSTGRES_PASSWORD"
    
    # Create database and user
    log_info "Creating database and user..."
    
    local sql_script=$(cat <<EOF
-- MuslimEEN Database Setup
-- Generated: $(date)

-- Create database if it doesn't exist
SELECT 'CREATE DATABASE $DB_NAME'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '$DB_NAME')\gexec

-- Connect to database
\c $DB_NAME

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create application user if it doesn't exist
DO \$\$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = '$DB_USER') THEN
        CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';
    END IF;
END
\$\$;

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;
GRANT ALL ON SCHEMA public TO $DB_USER;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO $DB_USER;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO $DB_USER;
EOF
)
    
    if echo "$sql_script" | psql -U "$POSTGRES_USER" -h localhost -p 5432 -v ON_ERROR_STOP=1 2>&1; then
        log_success "Database and user created"
    else
        log_warning "Database setup may have already been completed"
    fi
    
    # Run migrations
    log_info "Running database migrations..."
    
    local migration_file="$SCRIPT_DIR/backend/database/migrations/001_initial_schema.sql"
    
    if [ -f "$migration_file" ]; then
        if psql -U "$POSTGRES_USER" -d "$DB_NAME" -h localhost -p 5432 -f "$migration_file" -v ON_ERROR_STOP=1 2>&1; then
            log_success "Migrations completed"
        else
            log_warning "Migrations may have already been applied"
        fi
    else
        log_warning "Migration file not found: $migration_file"
    fi
    
    # Verify tables
    log_info "Verifying database setup..."
    local tables=$(psql -U "$POSTGRES_USER" -d "$DB_NAME" -h localhost -p 5432 -t -c "SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;" 2>/dev/null || true)
    
    if [ -n "$tables" ]; then
        log_success "Database tables created:"
        echo "$tables" | while read -r table; do
            if [ -n "$table" ]; then
                echo "    • $table"
            fi
        done
    fi
    
    unset PGPASSWORD
}

# Build project
build_project() {
    log_step "Building Project"
    
    # Build backend
    log_info "Building backend..."
    cd "$SCRIPT_DIR/backend"
    
    if npm run build; then
        log_success "Backend built successfully"
    else
        log_error "Backend build failed"
        exit 1
    fi
    
    # Build frontend (optional - can be slow)
    echo ""
    read -p "Build frontend? (recommended for production, y/N): " build_frontend
    if [[ "$build_frontend" =~ ^[Yy]$ ]]; then
        log_info "Building frontend..."
        cd "$SCRIPT_DIR/frontend"
        
        if npm run build; then
            log_success "Frontend built successfully"
        else
            log_warning "Frontend build completed with warnings"
        fi
    else
        log_info "Skipping frontend build (can be done later with: cd frontend && npm run build)"
    fi
    
    cd "$SCRIPT_DIR"
}

# Display final instructions
show_completion() {
    echo ""
    echo -e "${GREEN}${BOLD}════════════════════════════════════════════════════════════════${NC}"
    echo -e "  ${GREEN}${BOLD}✓ MuslimEEN Setup Complete!${NC}"
    echo -e "${GREEN}${BOLD}════════════════════════════════════════════════════════════════${NC}"
    echo ""
    
    echo -e "${CYAN}${BOLD}Next Steps:${NC}"
    echo ""
    
    echo -e "  ${YELLOW}1. Start the development servers:${NC}"
    echo ""
    echo -e "     ${BOLD}Terminal 1 (Backend):${NC}"
    echo -e "     ${GREEN}cd backend && npm run dev${NC}"
    echo ""
    echo -e "     ${BOLD}Terminal 2 (Frontend):${NC}"
    echo -e "     ${GREEN}cd frontend && npm run dev${NC}"
    echo ""
    
    echo -e "  ${YELLOW}2. Access the application:${NC}"
    echo -e "     Frontend: ${CYAN}http://localhost:8080${NC}"
    echo -e "     Backend API: ${CYAN}http://localhost:3001${NC}"
    echo -e "     Health Check: ${CYAN}http://localhost:3001/health${NC}"
    echo ""
    
    echo -e "  ${YELLOW}3. Available npm commands:${NC}"
    echo -e "     Backend:  ${CYAN}npm run dev${NC} | ${CYAN}npm run build${NC} | ${CYAN}npm run test${NC}"
    echo -e "     Frontend: ${CYAN}npm run dev${NC} | ${CYAN}npm run build${NC} | ${CYAN}npm run lint${NC}"
    echo ""
    
    if [ "$SKIP_DB_SETUP" = false ]; then
        echo -e "  ${YELLOW}4. Database Management:${NC}"
        echo -e "     Run migrations: ${CYAN}cd backend && npm run migrate${NC}"
        echo -e "     Seed test data: ${CYAN}cd backend && npm run seed${NC}"
        echo ""
    fi
    
    echo -e "  ${YELLOW}5. Documentation:${NC}"
    echo -e "     Setup Guide:    ${CYAN}./LOCAL_SETUP_GUIDE.md${NC}"
    echo -e "     API Contract:   ${CYAN}./API_CONTRACT.md${NC}"
    echo -e "     Backend Guide:  ${CYAN}./BACKEND_README.md${NC}"
    echo ""
    
    echo -e "${GREEN}${BOLD}════════════════════════════════════════════════════════════════${NC}"
    echo -e "  ${MAGENTA}Welcome to MuslimEEN! 🌙${NC}"
    echo -e "${GREEN}${BOLD}════════════════════════════════════════════════════════════════${NC}"
    echo ""
}

# Parse command line arguments
parse_arguments() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            --skip-db)
                SKIP_DB_SETUP=true
                shift
                ;;
            --db-name)
                DB_NAME="$2"
                shift 2
                ;;
            --db-user)
                DB_USER="$2"
                shift 2
                ;;
            --db-password)
                DB_PASSWORD="$2"
                shift 2
                ;;
            --help|-h)
                show_help
                exit 0
                ;;
            *)
                log_error "Unknown option: $1"
                show_help
                exit 1
                ;;
        esac
    done
}

# Show help
show_help() {
    echo "MuslimEEN Setup Script"
    echo ""
    echo "Usage: ./setup.sh [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  --skip-db            Skip database setup"
    echo "  --db-name NAME       Set database name (default: muslimeen)"
    echo "  --db-user USER       Set database user (default: muslimeen)"
    echo "  --db-password PASS   Set database password"
    echo "  --help, -h           Show this help message"
    echo ""
    echo "Examples:"
    echo "  ./setup.sh                    # Full setup"
    echo "  ./setup.sh --skip-db          # Setup without database"
    echo "  ./setup.sh --db-name mydb     # Use custom database name"
}

# Main function
main() {
    parse_arguments "$@"
    
    show_banner
    check_prerequisites
    setup_environment
    install_dependencies
    setup_database
    build_project
    show_completion
}

# Run main function
main "$@"
