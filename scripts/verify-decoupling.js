#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');

const ALLOWED_FRONTEND_BASE44_FILES = new Set([
  path.normalize('src/api/backendClient.js'),
  path.normalize('src/api/base44Client.js')
]);

const ALLOWED_FUNCTION_CLIENT_FILE = path.normalize('functions/_shared/base44Client.ts');

const CODE_EXTENSIONS = new Set(['.js', '.jsx', '.ts', '.tsx']);
const EXCLUDED_DIRS = new Set(['.git', 'node_modules', 'dist', 'coverage', '.base44']);

const violations = [];

const toRelative = (absolutePath) => path.relative(projectRoot, absolutePath);

const readAllCodeFiles = (startDir) => {
  const files = [];
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        if (!EXCLUDED_DIRS.has(entry.name)) {
          walk(path.join(dir, entry.name));
        }
        continue;
      }

      const fullPath = path.join(dir, entry.name);
      const extension = path.extname(entry.name);
      if (CODE_EXTENSIONS.has(extension)) {
        files.push(fullPath);
      }
    }
  };

  walk(startDir);
  return files;
};

const pushViolation = (filePath, rule, details) => {
  violations.push({ filePath, rule, details });
};

const checkFrontendDecoupling = () => {
  const srcRoot = path.join(projectRoot, 'src');
  if (!fs.existsSync(srcRoot)) return;

  for (const file of readAllCodeFiles(srcRoot)) {
    const relative = path.normalize(toRelative(file));
    const content = fs.readFileSync(file, 'utf8');

    const hasDirectBase44Import =
      /from\s+['"]@\/api\/base44Client['"]/.test(content) ||
      /from\s+['"]\.\/base44Client['"]/.test(content) ||
      /from\s+['"]\.\.\/api\/base44Client['"]/.test(content);

    if (hasDirectBase44Import && !ALLOWED_FRONTEND_BASE44_FILES.has(relative)) {
      pushViolation(relative, 'frontend-direct-import', 'Direct base44 client import found outside adapter files.');
    }

    const hasDirectBase44Usage = /\bbase44\.(entities|functions\.invoke|integrations\.Core)\b/.test(content);
    if (hasDirectBase44Usage && relative !== path.normalize('src/api/backendClient.js')) {
      pushViolation(relative, 'frontend-direct-usage', 'Direct base44 usage found outside backendClient adapter.');
    }
  }
};

const checkBackendDecoupling = () => {
  const functionsRoot = path.join(projectRoot, 'functions');
  if (!fs.existsSync(functionsRoot)) return;

  for (const file of readAllCodeFiles(functionsRoot)) {
    const relative = path.normalize(toRelative(file));
    const content = fs.readFileSync(file, 'utf8');

    const hasCreateClientImport = content.includes('createClientFromRequest');
    const hasBase44SdkImport = content.includes("npm:@base44/sdk");

    if ((hasCreateClientImport || hasBase44SdkImport) && relative !== ALLOWED_FUNCTION_CLIENT_FILE) {
      pushViolation(
        relative,
        'backend-direct-client',
        'Direct Base44 SDK client usage found outside shared helper.'
      );
    }
  }
};

checkFrontendDecoupling();
checkBackendDecoupling();

if (violations.length > 0) {
  console.error('\n❌ Base44 decoupling verification failed.\n');
  for (const violation of violations) {
    console.error(`- [${violation.rule}] ${violation.filePath}: ${violation.details}`);
  }
  console.error(`\nTotal violations: ${violations.length}`);
  process.exit(1);
}

console.log('✅ Base44 decoupling verification passed.');
console.log('- Frontend Base44 access is adapter-only.');
console.log('- Backend Base44 client creation is shared-helper-only.');
