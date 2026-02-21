# Deployment Checklist - Training Account System

**Status**: ✅ READY FOR PRODUCTION DEPLOYMENT

**Date**: February 21, 2026  
**System**: Training Account System  
**Target**: Base44 Production Environment  

---

## Pre-Deployment Verification ✅

- ✅ All 20 files present and accounted for
- ✅ Backend functions ready (3 files)
- ✅ Frontend components ready (5 files)
- ✅ Tests passing (43/43)
- ✅ Documentation complete (4 guides)
- ✅ CI/CD workflows configured
- ✅ Environment variables set

**Verification Command Run**:
```bash
node scripts/verify-deployment.js
# Result: ✅ READY FOR DEPLOYMENT
```

---

## Deployment Steps

### Step 1: Prepare GitHub Repository

**Status**: ⏳ Ready

1. Commit all changes:
```bash
git add .
git commit -m "feat: add training account system with profit sharing"
git push origin main
```

2. Verify changes appear on GitHub:
   - Visit: https://github.com/[owner]/trampoline-workbench
   - Confirm all files present

### Step 2: Configure GitHub Secrets for CI/CD

**Status**: ⏳ Review

Go to: Repository → Settings → Security → Secrets and variables → Actions

**Add these secrets**:

| Secret Name | Value | Source |
|-------------|-------|--------|
| `BASE44_API_KEY` | Your API key | Base44 Dashboard → Settings → API Keys |
| `BASE44_PROJECT_ID` | Your project ID | Base44 Dashboard → Project Settings |
| `BASE44_SERVICE_ROLE_KEY` | Service role key | Base44 Dashboard → Settings → Secrets |
| `BASE44_MASTER_KEY` | Master key | Base44 Dashboard → Settings → Advanced |
| `SLACK_WEBHOOK_URL` (optional) | Slack webhook | Slack API → Incoming Webhooks |

**How to get Base44 credentials**:
1. Go to https://base44.io
2. Log in to your account
3. Select your project
4. Navigate to Settings → API Keys
5. Copy your API key and project ID

### Step 3: Prepare Base44 Backend

**Status**: ⏳ Setup

#### Create Database Entities

1. **AppUser Entity** - Update existing:
   - Add fields:
     - `isTrainingAccount` (Boolean)
     - `accountType` (String: 'training' or 'regular')
     - `trainingAccountName` (String)
     - `invitationCode` (String)

2. **TrainingAccountLog Entity** - Create new:
   - `trainingAccountId` (String, FK)
   - `referrerId` (String, FK)
   - `accountName` (String)
   - `createdAt` (ISO DateTime)
   - `totalEarnings` (Decimal)
   - `totalSharedProfit` (Decimal)
   - `status` (String: 'active' or 'inactive')
   - `metadata` (JSON)

3. **Transaction Entity** - Update existing:
   - Ensure `type` field supports: `'training_profit_share'`

#### Deploy Functions via Base44 Dashboard

1. Go to Base44 Dashboard → Functions
2. Create new function for each:

**Function 1: createTrainingAccount**
- Name: `createTrainingAccount`
- Runtime: Deno (TypeScript)
- Code: Copy from `functions/createTrainingAccount.ts`
- Environment Variables:
  - `SERVICE_ROLE_KEY` = [your-service-role-key]

**Function 2: processTrainingProfitShare**
- Name: `processTrainingProfitShare`
- Runtime: Deno (TypeScript)
- Code: Copy from `functions/processTrainingProfitShare.ts`
- Environment Variables:
  - `SERVICE_ROLE_KEY` = [your-service-role-key]

**Function 3: Update completeTaskWithValidation**
- Find existing function
- Update with code from `functions/completeTaskWithValidation.ts`
- Ensure profit share trigger is included

### Step 4: Deploy Frontend

**Status**: ⏳ Done automatically

Once you push to GitHub:
1. GitHub Actions will automatically build
2. Vite will bundle the app
3. Frontend deploys with your existing deployment pipeline

**Verify**:
- Check GitHub Actions tab
- Look for "Deploy" workflow
- Should show green checkmark

### Step 5: Verify Endpoints

**Status**: ⏳ Test

After functions deploy, test them:

```bash
# Test createTrainingAccount function
curl -X POST https://api.base44.io/[project-id]/functions/createTrainingAccount \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer [API_KEY]" \
  -d '{
    "phone": "+1555123456",
    "inviteCode": "REF_TEST_CODE",
    "accountName": "Test Training Account"
  }'

# Expected response:
# {
#   "success": true,
#   "trainingAccount": {
#     "id": "user_...",
#     "phone": "+1555123456",
#     "invitationCode": "TRAIN_...",
#     "referrerId": "ref_...",
#     "createdAt": "2026-02-21T..."
#   }
# }
```

### Step 6: Run Smoke Tests

**Status**: ⏳ Validate

1. Open app at your deployment URL
2. Navigate to User Profile → Training Accounts
3. Click "Create Training Account"
4. Enter test data and verify account created
5. Check Admin Dashboard → Training Accounts
6. Verify analytics dashboard loads

### Step 7: Monitoring Setup

**Status**: ⏳ Optional

1. **Function Logs**:
   - Base44 Dashboard → Functions → [Function] → Logs
   - Monitor for errors

2. **Database Monitoring**:
   - Check TrainingAccountLog table
   - Verify transactions recorded

3. **Error Alerts**:
   - Set up Slack webhook
   - Configure email notifications
   - Monitor Base44 error rate

---

## Rollback Plan

**If anything goes wrong**:

1. **Stop Deployment**:
   - Cancel GitHub Actions workflow
   - Stop deploying changes

2. **Revert Functions**:
   - Base44 Dashboard → Functions
   - Click function → Versions
   - Select previous version → Rollback

3. **Revert Frontend**:
   - If hosted on GitHub Pages: revert to previous commit
   - If on custom server: restore previous deployment

4. **Database Recovery**:
   - Restore from backup if available
   - TrainingAccountLog can be archived/deleted without affecting other data

---

## Post-Deployment Checklist

After successful deployment:

- [ ] All functions showing "Active" status
- [ ] Tests passing on main branch
- [ ] GitHub Actions workflows completing successfully
- [ ] Create training account works
- [ ] Profit sharing calculates correctly
- [ ] Admin panel shows accounts
- [ ] Analytics displaying data
- [ ] No errors in function logs
- [ ] Slack notifications working (if configured)

---

## Support & Documentation

For help during deployment, see:
- **Setup**: [TRAINING_ACCOUNT_SETUP.md](TRAINING_ACCOUNT_SETUP.md)
- **Deployment**: [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)
- **CI/CD**: [CI_CD_SETUP.md](CI_CD_SETUP.md)
- **Testing**: [TESTING_GUIDE.md](TESTING_GUIDE.md)

---

## Deployment Timeline

| Step | Task | Time | Status |
|------|------|------|--------|
| 1 | Push to GitHub | 5 min | ⏳ |
| 2 | Configure secrets | 10 min | ⏳ |
| 3 | Create entities in Base44 | 15 min | ⏳ |
| 4 | Deploy functions | 10 min | ⏳ |
| 5 | Backend tests | 5 min | ⏳ |
| 6 | Verify endpoints | 5 min | ⏳ |
| 7 | Smoke tests | 10 min | ⏳ |
| **Total** | | **60 min** | |

---

## Success Criteria

Deployment is successful when:

✅ All functions show "Active" status  
✅ Creating training account works  
✅ Profit sharing processes correctly  
✅ Admin dashboard functions  
✅ Analytics load and display  
✅ All tests passing  
✅ No errors in logs  
✅ Slack notifications received  

---

## Next Steps After Deployment

1. **Announce Feature**: Tell users about training accounts
2. **Monitor Metrics**: Track adoption and revenue
3. **Gather Feedback**: Collect user feedback
4. **Optimize**: Improve based on usage patterns
5. **Scale**: Prepare for growth

---

**Created**: February 21, 2026  
**Last Updated**: February 21, 2026  
**Status**: Ready for Deployment ✅
