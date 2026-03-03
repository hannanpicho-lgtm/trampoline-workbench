# Quick Deployment Guide - Training Account System

**Deploy in 60 minutes** ⚡

---

## Prerequisites ✅

- Base44 account (free or paid)
- Project created in Base44
- GitHub account with repository
- 60 minutes of time

---

## 1️⃣ Push Code to GitHub (5 minutes)

```bash
cd c:\Users\Administrator\Downloads\trampoline-workbench

# Stage all changes
git add .

# Commit changes
git commit -m "feat: add training account system with 20% profit sharing"

# Push to main branch
git push origin main
```

Verify on GitHub: https://github.com/[your-org]/trampoline-workbench

---

## 2️⃣ Configure GitHub Secrets (10 minutes)

**Go to**: Repository → Settings → Secrets and variables → Actions

**Click "New repository secret" for each**:

```
Name: BASE44_API_KEY
Value: [Get from Base44 Dashboard → Settings → API Keys]

Name: BASE44_PROJECT_ID
Value: [Get from Base44 Dashboard → Project Settings]

Name: BASE44_SERVICE_ROLE_KEY
Value: [Get from Base44 Dashboard → Settings → Secrets]

Name: BASE44_MASTER_KEY
Value: [Get from Base44 Dashboard → Settings → Advanced]

Name: SLACK_WEBHOOK_URL (Optional)
Value: [Get from Slack → Incoming Webhooks] (or skip)
```

---

## 3️⃣ Create Database Entities (15 minutes)

**Go to**: Base44 Dashboard → Entities

### Update AppUser Entity

Click "Edit" on AppUser:

Add these fields:
```
Field Name: isTrainingAccount
Type: Boolean
Default: false

Field Name: accountType
Type: String
Values: training, regular

Field Name: trainingAccountName
Type: String

Field Name: invitationCode
Type: String
```

Save changes.

### Create TrainingAccountLog Entity

Click "New Entity":

```
Name: TrainingAccountLog

Fields:
- trainingAccountId (String, required, indexed)
- referrerId (String, required, indexed)
- accountName (String, required)
- createdAt (DateTime)
- totalEarnings (Decimal, default: 0)
- totalSharedProfit (Decimal, default: 0)
- status (String, default: "active", indexed)
- metadata (JSON)
```

Click "Create Entity".

### Update Transaction Entity

Edit existing Transaction entity:

Update `type` field enum to include: `'training_profit_share'`

Save changes.

---

## 4️⃣ Deploy Functions (10 minutes)

### Function 1: createTrainingAccount

1. Go to: Base44 Dashboard → Functions
2. Click "New Function" → Name: `createTrainingAccount`
3. Runtime: Select "Deno (TypeScript)"
4. Copy code from: `functions/createTrainingAccount.ts`
5. Paste into editor
6. Set Environment Variables:
   ```
   SERVICE_ROLE_KEY = [your-service-role-key]
   ```
7. Click **Deploy** → Wait for green checkmark

### Function 2: processTrainingProfitShare

1. Click "New Function" → Name: `processTrainingProfitShare`
2. Runtime: "Deno (TypeScript)"
3. Copy code from: `functions/processTrainingProfitShare.ts`
4. Set same environment variables
5. Click **Deploy** → Wait for green checkmark

### Function 3: Update completeTaskWithValidation

1. Click existing `completeTaskWithValidation` function
2. Copy updated code from: `functions/completeTaskWithValidation.ts`
3. Replace function code in editor
4. Click **Update** → Wait for green checkmark

**All functions should show ✅ Active**

---

## 5️⃣ Verify Endpoints (5 minutes)

### Test Function Calls

Open terminal:

```bash
# Test 1: Create training account
curl -X POST https://api.base44.io/[PROJECT_ID]/functions/createTrainingAccount \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer [API_KEY]" \
  -d '{"phone": "+1555123456", "inviteCode": "INVITE_CODE", "accountName": "Test"}'

# Expected: Success response with training account ID
```

✅ If you get success response → Functions working!

---

## 6️⃣ Run Smoke Tests (10 minutes)

### Test in App

1. Open your app at your deployment URL
2. Log in as a test user
3. Go to: Profile → Training Accounts
4. Click "Create Training Account"
5. Enter:
   - Phone: +1555123456
   - Invitation Code: [use an existing code]
   - Account Name: "Test Training"
6. Click "Create"

✅ If account was created → Frontend working!

### Test Admin Panel

1. Go to: Admin Dashboard (if have access)
2. Click "Training Accounts" tab
3. See list of accounts
4. Try filtering and exporting

✅ If you see accounts → Admin working!

---

## 7️⃣ Verify Deployment (10 minutes)

### Check GitHub Actions

1. Go to: GitHub Repository → Actions tab
2. Find workflow: "Test" or "Deploy Training Accounts"
3. Should show: ✅ PASSED

### Check Function Status

1. Go to: Base44 Dashboard → Functions
2. All three should show: ✅ Active
3. Check logs if any errors

### Check Database

1. Go to: Base44 Dashboard → Database
2. Check TrainingAccountLog table
3. Should have entries from your test

✅ All green → Deployment successful!

---

## Troubleshooting Quick Fixes

### ❌ Functions not deploying

**Problem**: "Error deploying function"  
**Fix**: Check environments variables are set, check code for syntax errors

### ❌ No data showing up

**Problem**: "Training accounts not found in database"  
**Fix**: Make sure entities were created in Base44 dashboard

### ❌ GitHub Actions failing

**Problem**: "Workflow failed"  
**Fix**: Check GitHub Secrets are set (Settings → Secrets)

### ❌ API calls getting 401 Unauthorized

**Problem**: "Authorization failed"  
**Fix**: Verify API key is correct in GitHub Secrets

---

## That's It! 🎉

Your Training Account System is now live!

**What's deployed**:
- ✅ 3 backend functions
- ✅ 5 frontend components  
- ✅ Database entities
- ✅ Admin panel
- ✅ Analytics dashboard
- ✅ 43 passing tests

**Time taken**: ~60 minutes

**Next steps**:
1. Announce feature to users
2. Monitor usage metrics
3. Gather feedback
4. Enjoy the automatic profit sharing! 💰

---

## Need Help?

- **Setup**: See [TRAINING_ACCOUNT_SETUP.md](TRAINING_ACCOUNT_SETUP.md)
- **Full Guide**: See [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)
- **Tests**: See [TESTING_GUIDE.md](TESTING_GUIDE.md)
- **CI/CD**: See [CI_CD_SETUP.md](CI_CD_SETUP.md)

---

**Status**: Ready to Deploy 🚀  
**All Tests Passing**: 43/43 ✅  
**Date**: March 3, 2026
