/**
 * Generate Environment File Module
 * Handles .env file generation with database configuration
 */

const fs = require('fs');
const path = require('path');
const { log } = require('../utils/logger');

/**
 * Generate and write the .env file
 * @param {Object} config - Configuration object with host, port, appDb, appUser, appPassword
 * @param {string} envPath - Path to the .env file
 * @returns {void}
 */
function generateEnvFile(config, envPath) {
  const envContent = `# MuslimEEN Backend Environment Configuration
# Local Development - Auto-generated

# Server Configuration
NODE_ENV=development
PORT=3001

# Database Configuration
DB_HOST=${config.host}
DB_PORT=${config.port}
DB_NAME=${config.appDb}
DB_USER=${config.appUser}
DB_PASSWORD=${config.appPassword}

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-for-development-only-${Date.now()}
JWT_EXPIRES_IN=24h

# Security
BCRYPT_ROUNDS=12
CSRF_SECRET=dev-csrf-secret-${Date.now()}

# Logging
LOG_LEVEL=info

# CORS
FRONTEND_URL=http://localhost:8080

# Admin Configuration
ADMIN_EMAIL=admin@muslimeen.space
`;

  fs.writeFileSync(envPath, envContent);
  log(`✓ Environment file updated: ${envPath}`);
}

module.exports = { generateEnvFile };
