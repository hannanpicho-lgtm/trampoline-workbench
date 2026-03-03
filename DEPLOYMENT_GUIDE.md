# Deployment Guide: Training Account System

This guide covers step-by-step deployment of the training account system to Base44 serverless backend.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Local Setup & Testing](#local-setup--testing)
3. [Base44 Dashboard Configuration](#base44-dashboard-configuration)
4. [Function Deployment](#function-deployment)
5. [Entity Setup](#entity-setup)
6. [Environment Configuration](#environment-configuration)
7. [Verification & Testing](#verification--testing)
8. [Monitoring & Maintenance](#monitoring--maintenance)
9. [Rollback Procedures](#rollback-procedures)

---

## Prerequisites

### Required Tools
- Node.js >= 18.0.0
- npm >= 9.0.0
- Deno >= 1.40.0 (for local function testing)
- Git for version control
- Base44 CLI (if available) or web dashboard access

### Required Credentials
- Base44 account with project access
- Base44 API key with function deployment permissions
- Base44 master API key for entity management

### Required Knowledge
- TypeScript basics
- Backend-as-a-Service (BaaS) concepts
- Deno runtime environment
- REST API concepts

---

## Local Setup & Testing

### 1. Install Dependencies

```bash
cd /path/to/trampoline-workbench
npm install --legacy-peer-deps
```

### 2. Review Function Code

Examine the three training account functions:

```bash
# Function 1: Account creation
cat functions/createTrainingAccount.ts

# Function 2: Profit sharing
cat functions/processTrainingProfitShare.ts

# Function 3: Task completion trigger (modified)
cat functions/completeTaskWithValidation.ts
```

### 3. Local Function Testing with Deno

Create a test file to validate functions locally:

```bash
# Create test directory
mkdir -p tests/deno

# Run Deno tests (example)
deno test tests/deno/ --allow-net --allow-env
```

### 4. Validate TypeScript Compilation

```bash
npm run typecheck
```

Expected output: No new errors related to training account functions

---

## Base44 Dashboard Configuration

### Step 1: Access Base44 Dashboard

1. Navigate to [base44.io](https://base44.io)
2. Log in with your account credentials
3. Select the project matching your workspace
4. Locate the "Functions" or "Backend" section

### Step 2: Verify Project Settings

In the Base44 Dashboard:

1. **Project Settings** → Verify:
   - Project name and ID
   - Environment (Development/Staging/Production)
   - Time zone (set to UTC or your preference)

2. **API Keys** → Create/verify:
   - Public API Key (for frontend use)
   - Service Role Key (for secure backend operations)

3. **Webhooks** → Configure:
   - Ensure Stripe webhook is properly configured
   - Add error notification webhook if available

---

## Function Deployment

### Step 1: Prepare Functions for Deployment

Review each function in the `functions/` directory:

```typescript
// Required exports for Base44:
export default async function handleRequest(req) {
  // Function implementation
}

// Validate each function has:
// ✓ Proper error handling
// ✓ Type annotations
// ✓ Input validation
// ✓ Return value specification
```

### Step 2: Deploy Functions via Base44 Dashboard

For each training account function, follow this process:

#### Function 1: `createTrainingAccount`

1. In Base44 Dashboard → Functions → New Function
2. **Name**: `createTrainingAccount`
3. **Runtime**: Deno (TypeScript)
4. **Copy** the complete code from `functions/createTrainingAccount.ts`
5. **Set Environment Variables**:
   - `SERVICE_ROLE_KEY=<your-service-role-key>`
   - `VITE_BASE44_APP_BASE_URL=<your-base44-url>`
6. **Click Deploy** → Wait for confirmation

Expected deployment time: 30-60 seconds

#### Function 2: `processTrainingProfitShare`

1. In Base44 Dashboard → Functions → New Function
2. **Name**: `processTrainingProfitShare`
3. **Runtime**: Deno (TypeScript)
4. **Copy** the complete code from `functions/processTrainingProfitShare.ts`
5. **Set Environment Variables**:
   - `SERVICE_ROLE_KEY=<your-service-role-key>`
6. **Click Deploy** → Wait for confirmation

#### Function 3: Update `completeTaskWithValidation`

1. Find existing `completeTaskWithValidation` function
2. Locate the section added for training account handling (around line 60-85)
3. Verify the call to `processTrainingProfitShare`:
   ```typescript
   if (userTask.userId) {
     // Check if user is training account
     const user = await base44.entities.AppUser.get(userTask.userId);
     if (user?.isTrainingAccount) {
       // Trigger profit share
     }
   }
   ```
4. **Click Update** → Deploy

### Step 3: Verify Function Deployment

For each deployed function:

1. Navigate to **Functions** section
2. Click on the function name
3. **Status** should show: `✓ Active` (green indicator)
4. **Last Updated** should reflect current deployment time
5. **URL** should be visible (used for API calls)

Example function URLs:
```
https://api.base44.io/project-id/functions/createTrainingAccount
https://api.base44.io/project-id/functions/processTrainingProfitShare
```

---

## Entity Setup

### Step 1: Create or Verify Database Entities

In Base44 Dashboard → Entities/Database:

#### Entity 1: AppUser (Existing, Verify Fields)

Verify these fields exist:
- `id` (Primary Key, UUID)
- `phone` (String, Indexed)
- `balance` (Decimal/Number)
- `isTrainingAccount` (Boolean, **NEW**)
- `accountType` (String: 'training' | 'regular', **NEW**)
- `trainingAccountName` (String, **NEW**)
- `referredBy` (String, FK to AppUser, Existing)
- `invitationCode` (String, **NEW**)

**Migration Action**: Add the three new fields to existing AppUser entity

#### Entity 2: TrainingAccountLog (New Entity)

Create new entity with these fields:

| Field | Type | Indexed | Required |
|-------|------|---------|----------|
| `id` | UUID | Yes | Yes |
| `trainingAccountId` | String (FK) | Yes | Yes |
| `referrerId` | String (FK) | Yes | Yes |
| `accountName` | String | No | Yes |
| `createdAt` | ISO DateTime | Yes | No |
| `totalEarnings` | Decimal | No | No |
| `totalSharedProfit` | Decimal | No | No |
| `status` | String | Yes | Yes |
| `metadata` | JSON | No | No |

1. Click **New Entity** → Name: `TrainingAccountLog`
2. Add each field above
3. Set primary key to `id`
4. Add indexes on `trainingAccountId`, `referrerId`, `status`
5. Click **Create Entity**

#### Entity 3: Transaction (Existing, Verify Type)

Verify this field/type exists:
- `type` field should include value: `'training_profit_share'`

**Migration Action**: If `type` field uses enum, add `'training_profit_share'` as valid option

### Step 2: Verify Entity Relationships

In Entity Editor, verify:
- AppUser.referredBy → FK to AppUser ✓
- TrainingAccountLog.trainingAccountId → FK to AppUser ✓
- TrainingAccountLog.referrerId → FK to AppUser ✓
- Transaction.userId → FK to AppUser ✓

---

## Environment Configuration

### Step 1: Frontend Environment Setup

Update `.env` file in project root:

```bash
# Existing
VITE_BASE44_APP_BASE_URL=https://api.base44.io/your-project-id

# Add for training accounts (optional, for debugging)
VITE_TRAINING_ACCOUNT_API_URL=https://api.base44.io/your-project-id/functions

# Add function names for direct invocation
VITE_CREATE_TRAINING_ACCOUNT_FUNCTION=createTrainingAccount
VITE_PROCESS_PROFIT_SHARE_FUNCTION=processTrainingProfitShare
```

### Step 2: Backend Service Configuration

In Base44 Dashboard → Settings → Secrets:

Add the following:

```
SERVICE_ROLE_KEY = <your-service-role-key>
STRIPE_SECRET_KEY = <existing-stripe-key>
NOTIFICATION_SERVICE_URL = <your-notification-service-or-function-url>
```

### Step 3: Verify Configuration

Test configuration by calling a function:

```bash
curl -X POST https://api.base44.io/your-project-id/functions/createTrainingAccount \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d '{
    "phone": "+1234567890",
    "inviteCode": "REF_EXISTS_12345",
    "accountName": "Test Training"
  }'
```

Expected response:
```json
{
  "success": true,
  "trainingAccount": {
    "id": "user_123...",
    "phone": "+1234567890",
    "invitationCode": "TRAIN_1234567890_abc123",
    "referrerId": "referrer_...",
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

---

## Verification & Testing

### Checklist 1: Function Deployment Verification

- [ ] All three functions show "Active" status in Base44 Dashboard
- [ ] Each function URL is accessible
- [ ] Function logs are visible and error-free
- [ ] Service role key is properly configured

### Checklist 2: Entity Verification

- [ ] AppUser has new fields: isTrainingAccount, accountType, trainingAccountName
- [ ] TrainingAccountLog entity exists with all required fields
- [ ] Transaction entity supports 'training_profit_share' type
- [ ] All entity relationships are properly defined

### Checklist 3: API Test Cases

#### Test 1: Create Training Account

```bash
# Prerequisite: Have a referrer with invitationCode
# Run from frontend or via API

const response = await fetch('/.api/createTrainingAccount', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    phone: '+1555123456',
    inviteCode: 'REFERRER_CODE',
    accountName: 'New Training Account'
  })
});

const data = await response.json();
// Verify: success === true
// Verify: data.trainingAccount.invitationCode starts with 'TRAIN_'
```

#### Test 2: Complete Task with Training Account

```bash
# Complete a task for the newly created training account
// This should:
// 1. Award earnings to training account
// 2. Automatically trigger processTrainingProfitShare
// 3. Update referrer balance (+20% of earnings)
// 4. Create transaction record

// Verify in database:
// - TrainingAccountLog.totalSharedProfit increased
// - Referrer.balance increased by 20% of earnings
// - Transaction created with type 'training_profit_share'
```

#### Test 3: View Analytics

```bash
// Open UserProfile → Training Accounts Manager
// Verify:
// - New training account appears in list
// - Stats display correctly (total earnings, 20% profit)
// - Analytics dashboard shows profit over time
```

### Checklist 4: Error Handling

Test error scenarios:

```javascript
// Test 1: Invalid invitation code
const result = await createTrainingAccount({
  phone: '+1555123456',
  inviteCode: 'INVALID_CODE'
});
// Expected: Fails with error message

// Test 2: Missing required field
const result = await createTrainingAccount({
  phone: '+1555123456'
  // missing inviteCode
});
// Expected: Validation error

// Test 3: Training account cannot be referrer
// Attempt to use training account's code as invitationCode
// Expected: Error or validation failure
```

---

## Monitoring & Maintenance

### Real-time Monitoring

1. **Function Logs**:
   - Base44 Dashboard → Functions → [Function Name] → Logs
   - Review for errors, warnings, performance
   - Set alert threshold if available

2. **Error Tracking**:
   - Monitor error rate
   - Set up notifications for errors > 5% of requests
   - Review error messages in logs

3. **Performance**:
   - Monitor average execution time (target: < 2 seconds)
   - Monitor cold start times (target: < 5 seconds)
   - Review memory usage

### Weekly Maintenance Checklist

- [ ] Review function error logs for unusual patterns
- [ ] Check training account creation rate and success rate
- [ ] Verify profit share calculations in transaction logs
- [ ] Review database entity integrity
- [ ] Check API response times and error rates

### Monthly Maintenance Checklist

- [ ] Generate analytics report on training accounts
- [ ] Review and optimize function performance
- [ ] Update dependencies if available (Deno updates)
- [ ] Audit all service role operations
- [ ] Review and rotate API keys if necessary

---

## Rollback Procedures

### Scenario 1: Function Deployment Failed

**Symptoms**: Function shows "Error" or "Deploying" status for > 5 minutes

**Action**:
1. In Base44 Dashboard, click the function
2. Locate **Previous Versions** or **Rollback** option
3. Select the last known good version
4. Click **Rollback**
5. Verify function status returns to "Active"

### Scenario 2: Unexpected Behavior After Deployment

**Symptoms**: Training accounts not being created, profit not shared, errors in logs

**Action**:

1. **Check Logs**:
   ```bash
   # Review function-specific logs
   # Look for error messages, stack traces
   # Check timestamp of error against deployment time
   ```

2. **Verify Configuration**:
   ```bash
   # Verify SERVICE_ROLE_KEY is still valid
   # Verify entity structure hasn't changed
   # Verify API URLs are correct
   ```

3. **Rollback if Necessary**:
   - Click function → Versions → Previous version
   - Select specific version to rollback to
   - Click Rollback
   - Monitor logs for 5 minutes

### Scenario 3: Database Entity Corruption

**Symptoms**: Profit share calculations incorrect, missing TrainingAccountLog records

**Action**:

1. **Backup Data** (if available):
   ```bash
   # Export current data to CSV/JSON
   # Base44 Dashboard → Entities → [Entity] → Export
   ```

2. **Check Entity Structure**:
   - Verify all required fields exist
   - Verify field types are correct
   - Verify indexes are intact

3. **Repair Data**:
   - If specific records corrupted, manually correct in dashboard
   - If systematic issue, contact Base44 support
   - Restore from backup if available

4. **Verify Repairs**:
   - Run test cases again
   - Verify calculations match expected values
   - Monitor logs for 24 hours

### Scenario 4: API Key Compromise

**Symptoms**: Unauthorized function calls, suspicious activity in logs

**Action**:

1. **Immediate Action**:
   - Revoke compromised API key in Base44 Dashboard
   - Generate new API key
   - Update `.env` and Base44 secrets with new key

2. **Rotate Secrets**:
   - Update SERVICE_ROLE_KEY if exposed
   - Update STRIPE_SECRET_KEY if exposed
   - Restart functions with new secrets

3. **Audit and Monitor**:
   - Review function call history
   - Check for unauthorized account creations
   - Monitor for unusual profit share transactions

---

## Production Deployment Checklist

Before deploying to production, verify:

### Code Quality
- [ ] All TypeScript files compile without errors
- [ ] All functions have proper error handling
- [ ] All functions have input validation
- [ ] No hardcoded secrets or credentials

### Testing
- [ ] Unit tests pass: `npm test`
- [ ] Integration tests pass: `npm run test:integration`
- [ ] Manual API tests successful
- [ ] Error scenarios handled correctly

### Configuration
- [ ] Environment variables properly set
- [ ] API keys configured in Base44
- [ ] Entity structure verified
- [ ] Database backup created

### Documentation
- [ ] All functions documented with JSDoc
- [ ] README updated with new feature
- [ ] API contract documented
- [ ] Rollback procedure documented

### Monitoring
- [ ] Error alerting configured
- [ ] Performance monitoring enabled
- [ ] Log retention set appropriately
- [ ] Backup strategy in place

---

## Support & Troubleshooting

### Common Issues

**Issue**: Function returns 401 Unauthorized
- **Cause**: Invalid or missing API key
- **Solution**: Verify API key in Base44 Dashboard, update .env, restart

**Issue**: Function timeout (> 30 seconds)
- **Cause**: Large database query or external API call
- **Solution**: Optimize query filters, add pagination, use caching

**Issue**: Training account created but profit not shared
- **Cause**: Task completion not triggering profit share function
- **Solution**: Verify `completeTaskWithValidation.ts` was updated, check logs

**Issue**: Profit calculation incorrect
- **Cause**: Share percentage not 20, or balance update failed
- **Solution**: Review transaction logs, verify calculation logic, check database

### Contact Support

If issues persist:
1. Collect function logs and error messages
2. Note the exact steps to reproduce
3. Contact Base44 support through account dashboard
4. Include function names, timestamps, and error details

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | January 15, 2024 | Initial training account system deployment |
| | | - createTrainingAccount function |
| | | - processTrainingProfitShare function |
| | | - TrainingAccountLog entity |
| | | - Frontend dashboard components |

---

## Next Steps

After successful deployment:

1. **Announce Feature**: Notify users about training accounts
2. **Monitor Usage**: Track initial adoption and metrics
3. **Gather Feedback**: Collect user feedback on feature
4. **Optimize**: Based on usage patterns and feedback
5. **Scale**: Add additional features or improvements

---

## Appendix: API Reference

### Function 1: createTrainingAccount

**Endpoint**: `POST /.api/createTrainingAccount`

**Request**:
```json
{
  "phone": "+1234567890",
  "inviteCode": "REF_USER_CODE",
  "accountName": "Optional Account Name"
}
```

**Response**:
```json
{
  "success": true,
  "trainingAccount": {
    "id": "user_...",
    "phone": "+1234567890",
    "invitationCode": "TRAIN_1234567890_abc123",
    "referrerId": "ref_user_...",
    "trainingAccountName": "Optional Account Name",
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

### Function 2: processTrainingProfitShare

**Called automatically** when training account completes task

**Input** (internal):
```json
{
  "trainingAccountId": "user_...",
  "taskEarnings": 100
}
```

**Result** (updates):
- Referrer balance: +$20 (20% of earnings)
- Training account balance: +$80 (80% of earnings)
- Transaction created with metadata
- TrainingAccountLog updated

---

End of Deployment Guide
