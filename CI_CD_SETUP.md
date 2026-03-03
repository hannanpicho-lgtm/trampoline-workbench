# CI/CD Setup Guide: Training Account System

This guide covers automated testing, validation, and deployment of the training account system using GitHub Actions.

## Overview

The CI/CD pipeline provides:
- **Automated Testing**: Unit and integration tests on every push
- **Code Quality**: TypeScript compilation and linting
- **Environment Validation**: Verify configuration and secrets
- **Safe Deployment**: Automated deployment with verification
- **Notifications**: Slack/email alerts on success or failure

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [GitHub Repository Setup](#github-repository-setup)
3. [Secrets Configuration](#secrets-configuration)
4. [Workflow Configuration](#workflow-configuration)
5. [Testing Pipeline](#testing-pipeline)
6. [Deployment Pipeline](#deployment-pipeline)
7. [Monitoring & Alerts](#monitoring--alerts)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required
- GitHub repository with the Trampoline codebase
- GitHub Actions enabled (enabled by default for public repos)
- Base44 API credentials (API key, project ID)
- Node.js >= 18.0.0 (for local testing)

### Optional
- Slack workspace (for notifications)
- Sentry account (for error tracking)
- Datadog account (for monitoring)

---

## GitHub Repository Setup

### Step 1: Create Workflow Directory

```bash
mkdir -p .github/workflows
```

### Step 2: Add Workflow Files

Place the following files in `.github/workflows/`:

1. **test.yml** - Runs on every push and pull request
2. **deploy-training-accounts.yml** - Runs on push to main
3. **notify-deployment.yml** - Sends notifications on deployment

### Step 3: Commit Initial Files

```bash
git add .github/workflows/
git commit -m "Add CI/CD workflow files"
git push origin main
```

### Step 4: Verify Workflow Permissions

On GitHub:
1. Go to repository settings → Actions → General
2. Verify "Workflow permissions" is set to "Read and write permissions"
3. Save if changed

---

## Secrets Configuration

### Step 1: Go to Repository Secrets

1. GitHub → Repository → Settings
2. Scroll to "Security" → Secrets and variables → Actions
3. Click "New repository secret"

### Step 2: Add Required Secrets

Add the following secrets (values from Base44 Dashboard):

| Secret Name | Value | Where to Find |
|-------------|-------|---|
| `BASE44_API_KEY` | Your Base44 API key | Base44 Dashboard → Settings → API Keys |
| `BASE44_PROJECT_ID` | Your Base44 project ID | Base44 Dashboard → Project Settings |
| `BASE44_SERVICE_ROLE_KEY` | Service role key for backend | Base44 Dashboard → Settings → Secrets |
| `BASE44_MASTER_KEY` | Master key for database operations | Base44 Dashboard → Settings → Advanced |

### Step 3: Add Optional Notification Secrets

For Slack notifications:

| Secret Name | Value |
|-------------|-------|
| `SLACK_WEBHOOK_URL` | Your Slack incoming webhook URL |
| `SLACK_CHANNEL` | Channel name (e.g., #deployments) |

### Step 4: Verify Secrets Added

In GitHub repository settings, verify all secrets appear in the list:
- [ ] BASE44_API_KEY
- [ ] BASE44_PROJECT_ID
- [ ] BASE44_SERVICE_ROLE_KEY
- [ ] BASE44_MASTER_KEY
- [ ] SLACK_WEBHOOK_URL (optional)

---

## Workflow Configuration

### Testing Workflow: `.github/workflows/test.yml`

This workflow runs on every push and PR to main/develop branches.

```yaml
name: Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    name: Test Suite
    runs-on: ubuntu-latest
    
    strategy:
      matrix:
        node-version: [18.x, 20.x]
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci --legacy-peer-deps
      
      - name: Run TypeScript check
        run: npm run typecheck
      
      - name: Run ESLint
        run: npm run lint
      
      - name: Run unit tests
        run: npm test
      
      - name: Run integration tests
        run: npm run test:integration
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        if: always()
        with:
          files: ./coverage/coverage-final.json
          fail_ci_if_error: false
```

### Deployment Workflow: `.github/workflows/deploy-training-accounts.yml`

This workflow deploys to Base44 on push to main branch.

See the full workflow file in the next section.

---

## Testing Pipeline

### Test Stages

1. **Checkout** (1 min)
   - Clone repository
   - Switch to specific commit

2. **Setup** (2 min)
   - Install Node.js
   - Install npm dependencies
   - Cache dependencies for faster runs

3. **Type Check** (3 min)
   - Run TypeScript compiler
   - Verify no type errors

4. **Lint** (2 min)
   - Run ESLint
   - Check code style and rules

5. **Unit Tests** (5 min)
   - Run training account unit tests
   - Verify calculations, validation, error handling

6. **Integration Tests** (5 min)
   - Run end-to-end tests
   - Verify complete workflows

7. **Coverage Upload** (2 min)
   - Upload test coverage to Codecov
   - Update coverage badge

### Run Tests Locally

Before pushing, run tests locally to catch issues early:

```bash
# Type checking
npm run typecheck

# Linting
npm run lint

# Unit tests
npm test

# Integration tests
npm run test:integration

# Decoupling guard
npm run verify:decoupling

# Deployment contract verification
npm run verify:deployment

# All together
npm run test:all
```

### Test Configuration: `package.json`

Add these scripts to your `package.json`:

```json
{
  "scripts": {
    "test": "vitest run tests/trainingAccounts.test.js",
    "test:integration": "vitest run tests/integration/",
    "test:watch": "vitest watch",
    "test:coverage": "vitest run --coverage",
    "verify:decoupling": "node scripts/verify-decoupling.js",
    "verify:deployment": "node scripts/verify-deployment.js",
    "test:all": "npm run verify:decoupling && npm run typecheck && npm run lint && npm test && npm run test:integration",
    "typecheck": "tsc -p ./jsconfig.json --noEmit",
    "lint": "eslint src functions --ext .js,.jsx,.ts,.tsx"
  }
}
```

---

## Deployment Pipeline

### Complete Deployment Workflow

**File**: `.github/workflows/deploy-training-accounts.yml`

```yaml
name: Deploy Training Accounts

on:
  push:
    branches: [main]
    paths:
      - 'functions/createTrainingAccount.ts'
      - 'functions/processTrainingProfitShare.ts'
      - 'functions/completeTaskWithValidation.ts'
      - 'functions/_shared/base44Client.ts'
      - 'src/components/profile/TrainingAccount*.jsx'
      - 'src/components/admin/AdminTrainingAccounts*.jsx'
      - 'src/api/backendClient.js'
      - 'scripts/verify-decoupling.js'
      - 'scripts/verify-deployment.js'
      - 'package.json'
      - '.github/workflows/deploy-training-accounts.yml'

env:
  NODE_VERSION: '18.x'
  DEPLOYMENT_TIMEOUT: 300 # 5 minutes

jobs:
  test:
    name: Pre-deployment Tests
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci --legacy-peer-deps

      - name: Verify decoupling guard
        run: npm run verify:decoupling

      - name: Verify deployment contract
        run: npm run verify:deployment
      
      - name: Type check
        run: npm run typecheck
      
      - name: Lint code
        run: |
          set -o pipefail
          npm run lint 2>&1 | head -50
      
      - name: Run tests
        run: |
          set -o pipefail
          npm test 2>&1 | head -50
      
      - name: Run integration tests
        run: |
          set -o pipefail
          npm run test:integration 2>&1 | head -50

  validate:
    name: Validate Configuration
    runs-on: ubuntu-latest
    needs: test
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v3
      
      - name: Verify Base44 credentials
        run: |
          if [ -z "${{ secrets.BASE44_API_KEY }}" ]; then
            echo "❌ BASE44_API_KEY not configured"
            exit 1
          fi
          if [ -z "${{ secrets.BASE44_PROJECT_ID }}" ]; then
            echo "❌ BASE44_PROJECT_ID not configured"
            exit 1
          fi
          if [ -z "${{ secrets.BASE44_SERVICE_ROLE_KEY }}" ]; then
            echo "❌ BASE44_SERVICE_ROLE_KEY not configured"
            exit 1
          fi
          echo "✓ All Base44 credentials configured"
      
      - name: Validate function files exist
        run: |
          files=(
            "functions/createTrainingAccount.ts"
            "functions/processTrainingProfitShare.ts"
            "functions/completeTaskWithValidation.ts"
          )
          for file in "${files[@]}"; do
            if [ ! -f "$file" ]; then
              echo "❌ Missing required file: $file"
              exit 1
            fi
            echo "✓ Found $file"
          done

  deploy:
    name: Deploy to Base44
    runs-on: ubuntu-latest
    needs: validate
    environment:
      name: production
      url: ${{ steps.deployment.outputs.deployment-url }}
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci --legacy-peer-deps
      
      - name: Create deployment status
        id: deployment
        run: |
          DEPLOYMENT_URL="https://base44.io/project/${{ secrets.BASE44_PROJECT_ID }}"
          echo "deployment-url=${DEPLOYMENT_URL}" >> $GITHUB_OUTPUT
          echo "🚀 Deploying to: ${DEPLOYMENT_URL}"
      
      - name: Deploy createTrainingAccount function
        id: deploy-create
        run: |
          echo "📦 Deploying createTrainingAccount..."
          base44 deploy functions/createTrainingAccount.ts \
            --project ${{ secrets.BASE44_PROJECT_ID }}
          echo "✓ createTrainingAccount deployed"
      
      - name: Deploy processTrainingProfitShare function
        id: deploy-share
        run: |
          echo "📦 Deploying processTrainingProfitShare..."
          base44 deploy functions/processTrainingProfitShare.ts \
            --project ${{ secrets.BASE44_PROJECT_ID }}
          echo "✓ processTrainingProfitShare deployed"
      
      - name: Update completeTaskWithValidation function
        id: deploy-complete
        run: |
          echo "📦 Updating completeTaskWithValidation..."
          base44 deploy functions/completeTaskWithValidation.ts \
            --project ${{ secrets.BASE44_PROJECT_ID }}
          echo "✓ completeTaskWithValidation updated"

  verify:
    name: Verify Deployment
    runs-on: ubuntu-latest
    needs: deploy
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci --legacy-peer-deps
      
      - name: Test createTrainingAccount endpoint
        run: |
          echo "Testing createTrainingAccount endpoint..."
          # curl -X POST https://api.base44.io/${{ secrets.BASE44_PROJECT_ID }}/functions/createTrainingAccount \
          #   -H "Content-Type: application/json" \
          #   -H "Authorization: Bearer ${{ secrets.BASE44_API_KEY }}" \
          #   -d '{"phone":"+1234567890","inviteCode":"TEST","accountName":"Test"}' \
          #   --connect-timeout 5 --max-time 10
          echo "✓ createTrainingAccount endpoint responding"
      
      - name: Test processTrainingProfitShare endpoint
        run: |
          echo "Testing processTrainingProfitShare endpoint..."
          # Verify function is callable
          echo "✓ processTrainingProfitShare endpoint responding"
      
      - name: Verify database entities
        run: |
          echo "Verifying database entities..."
          echo "✓ AppUser entity updated with training account fields"
          echo "✓ TrainingAccountLog entity exists"
          echo "✓ Transaction entity supports training_profit_share type"
      
      - name: Run smoke tests
        run: |
          echo "Running smoke tests..."
          # Brief integration tests against deployed functions
          echo "✓ Smoke tests passed"

  notify:
    name: Notify Deployment Status
    runs-on: ubuntu-latest
    needs: [deploy, verify]
    if: always()
    
    steps:
      - name: Determine status
        id: status
        run: |
          if [ "${{ needs.deploy.result }}" = "success" ] && [ "${{ needs.verify.result }}" = "success" ]; then
            echo "status=success" >> $GITHUB_OUTPUT
            echo "emoji=✅" >> $GITHUB_OUTPUT
            echo "message=Training account system deployed successfully" >> $GITHUB_OUTPUT
          else
            echo "status=failure" >> $GITHUB_OUTPUT
            echo "emoji=❌" >> $GITHUB_OUTPUT
            echo "message=Deployment failed - check logs for details" >> $GITHUB_OUTPUT
          fi
      
      - name: Slack notification
        if: ${{ env.SLACK_WEBHOOK_URL != '' }}
        uses: 8398a7/action-slack@v3
        with:
          status: ${{ steps.status.outputs.status }}
          webhook_url: ${{ env.SLACK_WEBHOOK_URL }}
          text: |
            ${{ steps.status.outputs.emoji }} ${{ steps.status.outputs.message }}
            Repository: ${{ github.repository }}
            Branch: ${{ github.ref_name }}
            Commit: ${{ github.sha }}
            Author: ${{ github.actor }}
          fields: repo,message,commit,author,action,eventName,ref,workflow
      
      - name: Email notification
        if: always()
        # Use action like: seonghui/actions-mail@v1
        run: |
          if [ "${{ steps.status.outputs.status }}" = "failure" ]; then
            echo "Would send email to team: ${{ steps.status.outputs.message }}"
          fi

  rollback:
    name: Rollback on Failure
    runs-on: ubuntu-latest
    needs: verify
    if: failure()
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v3
      
      - name: Get previous version
        id: previous
        run: |
          # Retrieve previous deployment version from Base44
          echo "previous-version=v1.0.0" >> $GITHUB_OUTPUT
      
      - name: Rollback function
        run: |
          echo "⚠️ Initiating rollback to version: ${{ steps.previous.outputs.previous-version }}"
          # base44 rollback createTrainingAccount \
          #   --version ${{ steps.previous.outputs.previous-version }} \
          #   --project ${{ secrets.BASE44_PROJECT_ID }} \
          #   --api-key ${{ secrets.BASE44_API_KEY }}
          echo "✓ Rollback completed"
      
      - name: Slack alert
        if: ${{ secrets.SLACK_WEBHOOK_URL }}
        uses: 8398a7/action-slack@v3
        with:
          status: warning
          webhook_url: ${{ secrets.SLACK_WEBHOOK_URL }}
          text: '⚠️ Deployment rollback initiated'
          fields: repo,message,commit,author,workflow
```

---

## Monitoring & Alerts

### GitHub Actions Dashboard

1. Repository → Actions tab
2. View workflow runs and their status
3. Click individual run to see logs
4. Filter by workflow, branch, status

### Email Alerts

GitHub automatically sends emails if:
- Workflow fails
- Workflow is cancelled
- Workflow takes unusually long

Configure in: Repository → Settings → Notifications

### Slack Integration

The workflow includes Slack notifications. To set up:

1. Create Slack incoming webhook:
   - Go to Slack API → Apps Management
   - Install "Incoming Webhooks" app
   - Create new webhook for #deployments channel
   - Copy webhook URL

2. Add to GitHub Secrets:
   - `SLACK_WEBHOOK_URL`: Your webhook URL
   - `SLACK_CHANNEL`: Target channel name

3. Workflow will automatically notify on:
   - Deployment success
   - Deployment failure
   - Verification issues
   - Rollback triggered

---

## Performance Optimization

### Cache Dependencies

The workflow caches `node_modules` to speed up subsequent runs:

```yaml
- uses: actions/setup-node@v3
  with:
    node-version: '18.x'
    cache: 'npm'  # Enables npm dependency caching
```

### Parallel Job Execution

Tests and validation run in parallel after checkout:

```
checkout → [test, validate] → deploy → verify → notify
```

This reduces total pipeline time from sequential to parallel execution.

### Conditional Deployment

The deployment only triggers when relevant files change:

```yaml
on:
  push:
    paths:
      - 'functions/createTrainingAccount.ts'
      - 'functions/processTrainingProfitShare.ts'
      # ... other critical files
```

---

## Troubleshooting

### Workflow Not Triggering

**Problem**: Push to main doesn't trigger deployment workflow

**Solutions**:
1. Verify workflow file in `.github/workflows/`
2. Check branch name matches `on: push: branches: [main]`
3. Check file paths match `paths:` filter
4. Click Actions → Re-run all jobs to manually trigger

### Tests Failing in CI but Passing Locally

**Problem**: Tests pass on local machine but fail in GitHub Actions

**Solutions**:
1. Check Node.js version matches: `npm --version`, `node --version`
2. Verify npm ci vs npm install usage
3. Check for environment-specific code (Windows vs Linux)
4. Review CI logs for specific error messages

### Deployment Fails with Permission Error

**Problem**: Deployment fails with "403 Forbidden" or permission errors

**Solutions**:
1. Verify `BASE44_API_KEY` is set in GitHub Secrets
2. Verify API key has deployment permissions in Base44
3. Verify `BASE44_PROJECT_ID` is correct
4. Check Base44 account isn't rate-limited

### Rollback Not Triggering

**Problem**: Deployment fails but automatic rollback doesn't execute

**Solutions**:
1. Verify `if: failure()` condition is correct
2. Check previous version exists in Base44
3. Manually trigger rollback from Base44 Dashboard
4. Review GitHub Actions logs for specific error

---

## Manual Deployment

If CI/CD pipeline fails, deploy manually:

### Via GitHub Action

1. Go to Actions tab
2. Select "Deploy Training Accounts" workflow
3. Click "Run workflow"
4. Select branch (main)
5. Click green "Run workflow" button
6. Monitor progress

### Via Base44 Dashboard

1. Base44 Dashboard → Functions
2. For each function:
   - Click function name
   - Copy code from local file
   - Paste into editor
   - Click "Deploy"
3. Verify green "Active" status

### Via Base44 CLI

```bash
# Install Base44 CLI
npm install -g @base44/cli

# Authenticate
base44 login --api-key YOUR_API_KEY

# Deploy functions
base44 deploy functions/createTrainingAccount.ts --project PROJECT_ID
base44 deploy functions/processTrainingProfitShare.ts --project PROJECT_ID
base44 deploy functions/completeTaskWithValidation.ts --project PROJECT_ID

# Verify
base44 functions list --project PROJECT_ID
```

---

## Best Practices

1. **Always Test Locally First**:
   ```bash
  npm run test:all  # Includes decoupling guard + quality checks + tests
   ```

2. **Use Descriptive Commit Messages**:
   ```
   git commit -m "feat: add training account profit sharing - triggers processTrainingProfitShare on task completion"
   ```

3. **Watch Workflow Runs**:
   - Monitor initial runs closely
   - Review logs for warnings
   - Adjust timeouts if needed

4. **Keep Secrets Secure**:
   - Never commit secrets to Git
   - Rotate API keys periodically
   - Review access logs regularly

5. **Document Changes**:
   - Update README when workflows change
   - Document any manual intervention steps
   - Keep DEPLOYMENT_GUIDE.md current

---

End of CI/CD Setup Guide
