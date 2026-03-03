#!/usr/bin/env node

/**
 * Training Account System - Pre-Deployment Verification Script
 * Run this before deploying to Base44
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');

const checks = {
  files: [],
  errors: [],
  warnings: []
};

function checkFile(filePath, description) {
  const fullPath = path.join(projectRoot, filePath);
  if (fs.existsSync(fullPath)) {
    checks.files.push(`✅ ${description}: ${filePath}`);
    return true;
  } else {
    checks.errors.push(`❌ Missing: ${filePath}`);
    return false;
  }
}

function checkFileContent(filePath, searchString, description) {
  const fullPath = path.join(projectRoot, filePath);
  try {
    const content = fs.readFileSync(fullPath, 'utf8');
    if (content.includes(searchString)) {
      checks.files.push(`✅ ${description}`);
      return true;
    } else {
      checks.warnings.push(`⚠️ ${description} - string not found`);
      return false;
    }
  } catch (error) {
    checks.errors.push(`❌ Could not read ${filePath}: ${error.message}`);
    return false;
  }
}

console.log('\n🔍 Training Account System - Pre-Deployment Verification\n');

// Check backend functions
console.log('Checking Backend Functions...');
checkFile('functions/createTrainingAccount.ts', 'Create training account function');
checkFile('functions/processTrainingProfitShare.ts', 'Process profit share function');
checkFileContent('functions/completeTaskWithValidation.ts', 'processTrainingProfitShare', 'Task completion updated for profit sharing');

// Check frontend components
console.log('\nChecking Frontend Components...');
checkFile('src/components/modals/CreateTrainingAccountModal.jsx', 'Training account creation modal');
checkFile('src/components/profile/TrainingAccountsManager.jsx', 'Training accounts manager');
checkFile('src/components/profile/TrainingAccountAnalytics.jsx', 'Training accounts analytics');
checkFile('src/components/admin/AdminTrainingAccountsManager.jsx', 'Admin training accounts manager');

// Check integration
console.log('\nChecking Integration...');
checkFileContent('src/pages/UserProfile.jsx', 'TrainingAccountsManager', 'Training manager integrated into UserProfile');
checkFileContent('src/pages/AdminDashboard.jsx', 'AdminTrainingAccountsManager', 'Admin manager integrated into AdminDashboard');

// Check tests
console.log('\nChecking Tests...');
checkFile('tests/trainingAccounts.test.js', 'Unit tests');
checkFile('tests/integration/trainingAccounts.integration.test.js', 'Integration tests');
checkFile('vitest.config.js', 'Vitest configuration');

// Check CI/CD
console.log('\nChecking CI/CD Workflows...');
checkFile('.github/workflows/test.yml', 'Test workflow');
checkFile('.github/workflows/deploy-training-accounts.yml', 'Deploy workflow');

// Check documentation
console.log('\nChecking Documentation...');
checkFile('TRAINING_ACCOUNT_SETUP.md', 'Setup guide');
checkFile('DEPLOYMENT_GUIDE.md', 'Deployment guide');
checkFile('CI_CD_SETUP.md', 'CI/CD setup guide');
checkFile('TESTING_GUIDE.md', 'Testing guide');

// Check environment
console.log('\nChecking Environment...');
checkFile('.env', 'Environment configuration');
checkFileContent('package.json', 'test": "vitest', 'Test scripts in package.json');

// Check decoupling guard
console.log('\nChecking Decoupling Guard...');
checkFile('scripts/verify-decoupling.js', 'Decoupling verification script');
checkFileContent('package.json', 'verify:decoupling', 'Decoupling npm script configured');

try {
  execSync('node scripts/verify-decoupling.js', {
    cwd: projectRoot,
    stdio: 'pipe',
    encoding: 'utf8'
  });
  checks.files.push('✅ Decoupling verification execution passed');
} catch (error) {
  const output = `${error?.stdout || ''}${error?.stderr || ''}`.trim();
  checks.errors.push(`❌ Decoupling verification failed${output ? `: ${output}` : ''}`);
}

// Print results
console.log('\n' + '='.repeat(60));
console.log('VERIFICATION RESULTS');
console.log('='.repeat(60));

console.log(`\n✅ Files Found: ${checks.files.length}`);
checks.files.forEach(f => console.log('  ' + f));

if (checks.warnings.length > 0) {
  console.log(`\n⚠️  Warnings: ${checks.warnings.length}`);
  checks.warnings.forEach(w => console.log('  ' + w));
}

if (checks.errors.length > 0) {
  console.log(`\n❌ Errors: ${checks.errors.length}`);
  checks.errors.forEach(e => console.log('  ' + e));
} else {
  console.log(`\n✅ No errors found!`);
}

console.log('\n' + '='.repeat(60));

if (checks.errors.length === 0) {
  console.log('✅ READY FOR DEPLOYMENT\n');
  process.exit(0);
} else {
  console.log('❌ DEPLOYMENT BLOCKED - Fix errors above\n');
  process.exit(1);
}
