# Training Account System - Implementation Guide

## Overview

The training account system allows registered users to create dedicated training accounts that are linked to their referral code. When a training account completes tasks and earns commission, **20% of those earnings are automatically transferred to the referrer's account**.

## Features

### 1. Create Training Accounts
- Users can create multiple training accounts using their referral code
- Each training account has a unique phone number and optional name
- Training accounts generate their own unique training codes
- No email required for training accounts

### 2. Automatic Profit Sharing
- 20% commission from training account task earnings automatically paid to referrer
- Immediate distribution after each task completion
- Tracked in transaction history with metadata
- Notifications sent to referrer for each profit share

### 3. Account Tracking
- View all training accounts linked to your referral code
- Real-time earnings and profit share statistics
- Training account logs tracking total earnings and shares

## System Architecture

### Backend Functions

#### 1. `createTrainingAccount.ts`
**Purpose:** Creates a new training account linked to a referrer

**Input:**
```json
{
  "phone": "string - training account phone",
  "inviteCode": "string - 6-char referrer code",
  "accountName": "string (optional) - friendly name"
}
```

**Output:**
```json
{
  "success": true,
  "trainingAccount": {
    "id": "training account ID",
    "phone": "training phone",
    "accountName": "account name",
    "invitationCode": "unique training code",
    "referrerId": "parent referrer ID",
    "createdAt": "ISO timestamp"
  }
}
```

**Database Updates:**
- Creates new `AppUser` with `isTrainingAccount: true` and `accountType: 'training'`
- Creates `TrainingAccountLog` entry for tracking
- Sends notification to referrer
- Sets initial balance to $0

---

#### 2. `processTrainingProfitShare.ts`
**Purpose:** Automatically distributes 20% of training account earnings to referrer

**Input:**
```json
{
  "trainingAccountId": "string - ID of training account",
  "taskEarnings": "number - amount earned from task"
}
```

**Output:**
```json
{
  "success": true,
  "profitShare": 0.20,
  "newReferrerBalance": 150.00,
  "trainingAccountEarnings": 1.00,
  "sharePercentage": 20
}
```

**Operations:**
1. Validates training account status
2. Calculates 20% of task earnings
3. Updates referrer's balance
4. Creates transaction record
5. Updates `TrainingAccountLog` totals
6. Sends notification to referrer

---

#### 3. Updated `completeTaskWithValidation.ts`
**New Feature:** Automatically triggers `processTrainingProfitShare` when a training account completes a task

**Modified Return:**
```json
{
  "success": true,
  "newBalance": 150.00,
  "newCreditScore": 100,
  "creditScoreChange": 0,
  "needsReset": false,
  "trainingProfitShare": {
    "referrerId": "referrer ID",
    "profitShare": 0.20,
    "referrerNewBalance": 150.00
  }
}
```

---

### Frontend Components

#### 1. `CreateTrainingAccountModal.jsx`
Modal dialog for creating a new training account

**Props:**
- `referrerCode` (string) - User's invitation code
- `onClose` (function) - Close modal callback
- `onSuccess` (function) - Success callback with training account data

**Features:**
- Form validation
- Loading states
- Success confirmation screen
- Error handling with toast notifications

#### 2. `TrainingAccountsManager.jsx`
Complete dashboard for managing training accounts

**Features:**
- Display referral code with copy/hide actions
- Statistics cards (active accounts, total earnings, profit share)
- List all training accounts with detailed metrics
- Create button to launch modal
- Real-time loading states

**Key Sections:**
1. **Referral Code Display** - Copy, show/hide existing code
2. **Statistics** - Active accounts, earnings, your profit
3. **Accounts List** - Detailed view of each training account
   - Account name and phone
   - Unique training code
   - Total earnings from account
   - Your 20% profit share
   - Creation date
   - Active/Inactive status

---

## Database Schema

### AppUser Entity - New Fields
```typescript
{
  isTrainingAccount: boolean,          // Identifies as training account
  accountType: 'training' | 'regular', // Account type
  trainingAccountName: string,         // Friendly name for training account
  parentAccountId: string,             // ID of referrer (alternative to referredBy)
  // ... existing fields remain unchanged
}
```

### TrainingAccountLog Entity (New)
```typescript
{
  id: string,
  trainingAccountId: string,           // ID of the training account
  referrerId: string,                  // ID of the referrer
  accountName: string,                 // Name of training account
  createdAt: string,                   // ISO timestamp
  totalEarnings: number,               // Total task earnings from this account
  totalSharedProfit: number,           // 20% sum paid to referrer
  status: 'active' | 'inactive'        // Account status
}
```

### Transaction Entity - New Type
Type: `'training_profit_share'`

```typescript
metadata: {
  trainingAccountId: string,
  trainingAccountName: string,
  originalEarnings: number,
  sharePercentage: 20,
  sharerPhone: string
}
```

---

## Workflow Diagram

```
┌─ User (Referrer) has invitationCode: "ABC123"
│
├─ Creates Training Account
│   └─ POST /createTrainingAccount
│       ├─ Phone: "+1234567890"
│       ├─ InviteCode: "ABC123"
│       └─ Returns: TrainingAccount (ID: "TRAIN_123")
│
├─ Training Account completes task
│   ├─ POST /completeTaskWithValidation
│   ├─ Task earns: $1.00
│   ├─ Training account receives: $1.00
│   └─ Triggers: processTrainingProfitShare
│       ├─ Calculates: 20% of $1.00 = $0.20
│       ├─ Updates referrer balance: +$0.20
│       ├─ Creates transaction record
│       ├─ Updates TrainingAccountLog
│       └─ Sends notification
│
└─ User receives profit in real-time
```

---

## Integration Steps

### 1. Add Functions to Base44
1. Deploy `createTrainingAccount.ts` to Base44 functions
2. Deploy `processTrainingProfitShare.ts` to Base44 functions
3. Verify both are callable from frontend

### 2. Update Database Entities
1. Add new fields to `AppUser` entity:
   - `isTrainingAccount: boolean`
   - `accountType: string ('training'|'regular')`
   - `trainingAccountName: string`
   - `parentAccountId: string`

2. Create new `TrainingAccountLog` entity with fields:
   - `trainingAccountId: string`
   - `referrerId: string`
   - `accountName: string`
   - `createdAt: string`
   - `totalEarnings: number`
   - `totalSharedProfit: number`
   - `status: string`

### 3. Add Frontend Components
1. Place `CreateTrainingAccountModal.jsx` in `src/components/modals/`
2. Place `TrainingAccountsManager.jsx` in `src/components/profile/`
3. Import `TrainingAccountsManager` in user dashboard/profile

### 4. Add Navigation
Add training accounts section to user profile navigation:

```jsx
<TabContent value="training">
  <TrainingAccountsManager appUser={appUser} />
</TabContent>
```

---

## Usage Example

### User Flow:
1. **Login** as registered user with invitation code "ABC123"
2. **Navigate** to "Training Accounts" section in profile
3. **Copy** your invitation code or view it
4. **Click** "Create Training Account" button
5. **Fill in:**
   - Training account phone: "+1 (555) 123-4567"
   - Account name: "Demo Account #1"
6. **Submit** form
7. **Receive** confirmation with training account code: "TRAIN_123456"

### Task Completion Flow:
1. Training account completes a task earning $1.50
2. Training account balance increases to $1.50
3. System automatically calculates: $1.50 × 20% = $0.30
4. Referrer's balance instantly increases by $0.30
5. Referrer receives notification: "You earned $0.30 (20% of $1.50)"
6. Transaction recorded with metadata for auditing

---

## Security Considerations

1. **Validation:**
   - Verify invitation code exists before creating
   - Check training account exists before processing profits
   - Validate training account type before profit distribution

2. **Audit Trail:**
   - All transactions recorded with `training_profit_share` type
   - TrainingAccountLog maintains historical data
   - Notifications sent for transparency

3. **Error Handling:**
   - Task completion fails safely if profit share fails
   - Errors logged but don't block main transaction
   - Referrer notified of issues

---

## Future Enhancements

1. **Variable Profit Sharing:** Different percentages by VIP level
2. **Profit Caps:** Maximum daily/monthly training account earnings
3. **Account Limits:** Limit number of training accounts per user
4. **Inactive Management:** Auto-deactivate accounts after period of inactivity
5. **Bulk Creation:** Admin interface for creating multiple accounts
6. **Analytics:** Detailed training account performance dashboard
7. **Export:** Export training account data and earnings history

---

## Testing Checklist

- [ ] Create training account successfully
- [ ] Verify training account code generated uniquely
- [ ] Complete task on training account
- [ ] Verify 20% profit share calculated correctly
- [ ] Verify referrer balance updated instantly
- [ ] Verify transaction recorded with correct metadata
- [ ] Verify notifications sent to referrer
- [ ] Verify TrainingAccountLog updated correctly
- [ ] Test error handling (invalid code, missing fields)
- [ ] Test multiple training accounts per referrer
- [ ] Test referrer dashboard displays all accounts
- [ ] Test copy referral code functionality
- [ ] Test show/hide code toggle
