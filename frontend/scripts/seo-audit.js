/**
 * SEO Audit Script
 * 
 * Run this script to check SEO implementation across the site:
 * node scripts/seo-audit.js
 */

const fs = require('fs');
const path = require('path');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  bold: '\x1b[1m',
};

function log(message, type = 'info') {
  const color = type === 'success' ? colors.green : 
                type === 'error' ? colors.red : 
                type === 'warning' ? colors.yellow : colors.blue;
  console.log(`${color}${message}${colors.reset}`);
}

function logSection(title) {
  console.log(`\n${colors.bold}${colors.blue}═══ ${title} ═══${colors.reset}\n`);
}

const auditResults = { passed: 0, warnings: 0, errors: 0 };

function fileExists(filePath) {
  return fs.existsSync(filePath);
}

function readFile(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf-8');
  } catch (e) {
    return null;
  }
}

function checkSEOFiles() {
  logSection('SEO Files Check');
  
  const files = [
    'app/robots.ts',
    'app/sitemap.ts',
    'app/layout.tsx',
    'app/opengraph-image.tsx',
    'app/twitter-image.tsx',
    'lib/seo/metadata.ts',
  ];
  
  files.forEach(file => {
    const fullPath = path.join(process.cwd(), file);
    if (fileExists(fullPath)) {
      log(`✓ ${path.basename(file)} exists`, 'success');
      auditResults.passed++;
    } else {
      log(`✗ ${path.basename(file)} missing`, 'error');
      auditResults.errors++;
    }
  });
}

function checkSchemaComponents() {
  logSection('Schema Components Check');
  
  const schemas = [
    'OrganizationSchema.tsx',
    'PersonSchema.tsx',
    'JobPostingSchema.tsx',
    'BreadcrumbSchema.tsx',
    'FAQSchema.tsx',
    'HowToSchema.tsx',
    'VideoSchema.tsx',
    'EventSchema.tsx',
  ];
  
  const schemaDir = path.join(process.cwd(), 'components/seo/schemas');
  
  schemas.forEach(file => {
    const filePath = path.join(schemaDir, file);
    if (fileExists(filePath)) {
      log(`✓ ${file} exists`, 'success');
      auditResults.passed++;
    } else {
      log(`✗ ${file} missing`, 'error');
      auditResults.errors++;
    }
  });
}

function printSummary() {
  logSection('Audit Summary');
  
  const total = auditResults.passed + auditResults.warnings + auditResults.errors;
  const score = Math.round((auditResults.passed / total) * 100);
  
  log(`Total: ${total} | Passed: ${auditResults.passed} | Warnings: ${auditResults.warnings} | Errors: ${auditResults.errors}`, 'info');
  
  if (score >= 90) {
    log(`Score: ${score}/100 - Excellent!`, 'success');
  } else if (score >= 70) {
    log(`Score: ${score}/100 - Good`, 'warning');
  } else {
    log(`Score: ${score}/100 - Needs Work`, 'error');
  }
}

console.log(`\n${colors.bold}${colors.green}MuslimEEN SEO Audit Tool${colors.reset}\n`);
checkSEOFiles();
checkSchemaComponents();
printSummary();
