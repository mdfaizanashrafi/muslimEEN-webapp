/**
 * Environment file manager
 * Handles reading, writing, and updating .env files
 */

const fs = require('fs');
const path = require('path');

const ENV_FILE = path.join(__dirname, '../../.env');
const ENV_EXAMPLE = path.join(__dirname, '../../.env.example');

/**
 * Read the environment file content
 * @returns {string} The file content or empty string if not found
 */
function readEnvFile() {
  if (fs.existsSync(ENV_FILE)) {
    return fs.readFileSync(ENV_FILE, 'utf8');
  }
  if (fs.existsSync(ENV_EXAMPLE)) {
    return fs.readFileSync(ENV_EXAMPLE, 'utf8');
  }
  return '';
}

/**
 * Write content to the environment file
 * @param {string} content - The content to write
 */
function writeEnvFile(content) {
  fs.writeFileSync(ENV_FILE, content, 'utf8');
}

/**
 * Update the environment file with phase configuration
 * @param {Object} phaseConfig - The phase configuration containing modules to enable/disable
 * @param {Object} modules - The module definitions with flags
 */
function updateEnvFile(phaseConfig, modules) {
  let envContent = readEnvFile();
  
  // Update each module flag
  for (const [moduleName, enabled] of Object.entries(phaseConfig.modules)) {
    const flag = modules[moduleName].flag;
    const value = enabled ? 'true' : 'false';
    
    // Check if flag exists in file
    const flagRegex = new RegExp(`^${flag}=.*$`, 'm');
    
    if (flagRegex.test(envContent)) {
      // Update existing flag
      envContent = envContent.replace(flagRegex, `${flag}=${value}`);
    } else {
      // Add new flag
      envContent += `\n${flag}=${value}`;
    }
  }
  
  writeEnvFile(envContent);
}

module.exports = {
  readEnvFile,
  writeEnvFile,
  updateEnvFile,
  ENV_FILE,
  ENV_EXAMPLE,
};
