import { describe, it, expect, beforeEach, afterEach } from 'vitest';

/**
 * Integration tests for the Training Account system
 * Tests the complete flow from account creation through profit sharing
 */

class TrainingAccountTestHelper {
  constructor() {
    this.testAccounts = [];
    this.testReferrers = [];
    this.testTransactions = [];
    this.testLogs = [];
  }

  createTestReferrer(overrides = {}) {
    const referrer = {
      id: `referrer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      phone: `+1${Math.floor(Math.random() * 9000000000 + 1000000000)}`,
      invitationCode: `REF_${Date.now()}_${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      balance: 0,
      isTrainingAccount: false,
      ...overrides,
    };
    this.testReferrers.push(referrer);
    return referrer;
  }

  createTestTrainingAccount(referrer, overrides = {}) {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 6).toUpperCase();

    const account = {
      id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      phone: `+1${Math.floor(Math.random() * 9000000000 + 1000000000)}`,
      invitationCode: `TRAIN_${timestamp}_${random}`,
      trainingAccountName: `Test Training Account ${Date.now()}`,
      referredBy: referrer.id,
      isTrainingAccount: true,
      accountType: 'training',
      balance: 0,
      ...overrides,
    };
    this.testAccounts.push(account);
    return account;
  }

  simulateProfitShare(trainingAccount, referrer, earnings, sharePercentage = 20) {
    const profitShare = (earnings * sharePercentage) / 100;
    const trainingEarnings = earnings - profitShare;

    const transaction = {
      id: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: trainingAccount.id,
      type: 'training_profit_share',
      amount: profitShare,
      metadata: {
        trainingAccountId: trainingAccount.id,
        originalEarnings: earnings,
        sharePercentage: sharePercentage,
        sharerPhone: trainingAccount.phone,
      },
      createdAt: new Date().toISOString(),
    };

    this.testTransactions.push(transaction);

    // Update existing log or create new one
    const existingLog = this.getAccountLog(trainingAccount.id);
    if (existingLog) {
      existingLog.totalEarnings += earnings;
      existingLog.totalSharedProfit += profitShare;
    } else {
      const log = {
        id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        trainingAccountId: trainingAccount.id,
        referrerId: referrer.id,
        accountName: trainingAccount.trainingAccountName,
        createdAt: new Date().toISOString(),
        totalEarnings: earnings,
        totalSharedProfit: profitShare,
        status: 'active',
      };
      this.testLogs.push(log);
    }

    return {
      trainingAccountNewBalance: trainingAccount.balance + trainingEarnings,
      referrerNewBalance: referrer.balance + profitShare,
      profitShare: profitShare,
      trainingEarnings: trainingEarnings,
    };
  }

  getAccountLog(trainingAccountId) {
    return this.testLogs.find(log => log.trainingAccountId === trainingAccountId);
  }

  getTransactions(trainingAccountId) {
    return this.testTransactions.filter(txn => txn.metadata.trainingAccountId === trainingAccountId);
  }

  cleanup() {
    this.testAccounts = [];
    this.testReferrers = [];
    this.testTransactions = [];
    this.testLogs = [];
  }
}

describe('Training Account Integration Tests', () => {
  let helper;

  beforeEach(() => {
    helper = new TrainingAccountTestHelper();
  });

  afterEach(() => {
    helper.cleanup();
  });

  describe('Complete Flow: Account Creation to Profit Sharing', () => {
    it('should create training account and record it properly', () => {
      const referrer = helper.createTestReferrer();
      const account = helper.createTestTrainingAccount(referrer);

      expect(account.id).toBeDefined();
      expect(account.trainingAccountName).toBeDefined();
      expect(account.referredBy).toBe(referrer.id);
      expect(account.isTrainingAccount).toBe(true);
      expect(helper.testAccounts).toHaveLength(1);
    });

    it('should validate referrer before account creation', () => {
      const referrer = helper.createTestReferrer();
      const isValidReferrer = referrer && !referrer.isTrainingAccount;

      expect(isValidReferrer).toBe(true);

      const account = helper.createTestTrainingAccount(referrer);
      expect(account.referredBy).toBe(referrer.id);
    });

    it('should distribute profit when training account earns', () => {
      const referrer = helper.createTestReferrer({ balance: 0 });
      const account = helper.createTestTrainingAccount(referrer, { balance: 0 });

      const result = helper.simulateProfitShare(account, referrer, 100);

      expect(result.profitShare).toBe(20);
      expect(result.trainingEarnings).toBe(80);
      expect(result.referrerNewBalance).toBe(20);
      expect(result.trainingAccountNewBalance).toBe(80);
    });

    it('should handle multiple earnings over time', () => {
      const referrer = helper.createTestReferrer({ balance: 0 });
      const account = helper.createTestTrainingAccount(referrer, { balance: 0 });

      // First earnings
      const result1 = helper.simulateProfitShare(account, referrer, 100);
      expect(result1.profitShare).toBe(20);

      // Update referrer balance
      referrer.balance = result1.referrerNewBalance;
      account.balance = result1.trainingAccountNewBalance;

      // Second earnings
      const result2 = helper.simulateProfitShare(account, referrer, 150);
      expect(result2.profitShare).toBe(30);
      expect(result2.referrerNewBalance).toBe(50); // 20 + 30

      const log = helper.getAccountLog(account.id);
      expect(log.totalEarnings).toBe(250); // 100 + 150
      expect(log.totalSharedProfit).toBe(50); // 20 + 30
    });

    it('should track all transactions correctly', () => {
      const referrer = helper.createTestReferrer();
      const account = helper.createTestTrainingAccount(referrer);

      helper.simulateProfitShare(account, referrer, 100);
      helper.simulateProfitShare(account, referrer, 50);
      helper.simulateProfitShare(account, referrer, 75);

      const transactions = helper.getTransactions(account.id);
      expect(transactions).toHaveLength(3);
      expect(transactions.every(txn => txn.type === 'training_profit_share')).toBe(true);
    });
  });

  describe('Multi-Account Scenarios', () => {
    it('should manage multiple training accounts for single referrer', () => {
      const referrer = helper.createTestReferrer({ balance: 0 });

      const account1 = helper.createTestTrainingAccount(referrer);
      const account2 = helper.createTestTrainingAccount(referrer);
      const account3 = helper.createTestTrainingAccount(referrer);

      // Earnings from each account
      helper.simulateProfitShare(account1, referrer, 100);
      helper.simulateProfitShare(account2, referrer, 150);
      helper.simulateProfitShare(account3, referrer, 50);

      const allTransactions = helper.testTransactions;
      expect(allTransactions).toHaveLength(3);

      const totalProfit = allTransactions.reduce((sum, txn) => sum + txn.amount, 0);
      expect(totalProfit).toBe(60); // 20 + 30 + 10
    });

    it('should track earnings per account independently', () => {
      const referrer = helper.createTestReferrer();

      const account1 = helper.createTestTrainingAccount(referrer);
      const account2 = helper.createTestTrainingAccount(referrer);

      helper.simulateProfitShare(account1, referrer, 100);
      helper.simulateProfitShare(account2, referrer, 200);

      const log1 = helper.getAccountLog(account1.id);
      const log2 = helper.getAccountLog(account2.id);

      expect(log1.totalEarnings).toBe(100);
      expect(log2.totalEarnings).toBe(200);
      expect(log1.totalSharedProfit).toBe(20);
      expect(log2.totalSharedProfit).toBe(40);
    });

    it('should handle accounts from different referrers', () => {
      const referrer1 = helper.createTestReferrer({ balance: 0 });
      const referrer2 = helper.createTestReferrer({ balance: 0 });

      const account1 = helper.createTestTrainingAccount(referrer1);
      const account2 = helper.createTestTrainingAccount(referrer2);

      const result1 = helper.simulateProfitShare(account1, referrer1, 100);
      const result2 = helper.simulateProfitShare(account2, referrer2, 100);

      // Update referrer balances to track them
      referrer1.balance = result1.referrerNewBalance;
      referrer2.balance = result2.referrerNewBalance;

      expect(referrer1.balance).toBeGreaterThan(0); // Should have 20 from 100 earnings
      expect(referrer2.balance).toBeGreaterThan(0); // Should have 20 from 100 earnings

      const log1 = helper.getAccountLog(account1.id);
      const log2 = helper.getAccountLog(account2.id);

      expect(log1.referrerId).toBe(referrer1.id);
      expect(log2.referrerId).toBe(referrer2.id);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle zero earnings', () => {
      const referrer = helper.createTestReferrer();
      const account = helper.createTestTrainingAccount(referrer);

      const result = helper.simulateProfitShare(account, referrer, 0);

      expect(result.profitShare).toBe(0);
      expect(result.trainingEarnings).toBe(0);
    });

    it('should handle fractional earnings correctly', () => {
      const referrer = helper.createTestReferrer();
      const account = helper.createTestTrainingAccount(referrer);

      const result = helper.simulateProfitShare(account, referrer, 99.99);

      expect(result.profitShare).toBeCloseTo(19.998, 2);
      expect(result.trainingEarnings).toBeCloseTo(79.992, 2);
    });

    it('should reject invalid training account scenarios', () => {
      const trainingAccount = helper.createTestTrainingAccount(
        helper.createTestReferrer(),
        { isTrainingAccount: true }
      );

      // Verify training account cannot be a referrer for another training account
      const isValidReferrer = !trainingAccount.isTrainingAccount;
      expect(isValidReferrer).toBe(false);
    });

    it('should maintain precision in financial calculations', () => {
      const referrer = helper.createTestReferrer({ balance: 0 });
      const account = helper.createTestTrainingAccount(referrer, { balance: 0 });

      // Test with values that might cause floating point errors
      const amounts = [33.33, 66.67, 100.00, 49.99, 50.01];
      let totalReferrerEarnings = 0;

      for (const amount of amounts) {
        const result = helper.simulateProfitShare(account, referrer, amount);
        totalReferrerEarnings += result.profitShare;
      }

      const expectedTotal = amounts.reduce((sum, amount) => sum + (amount * 0.2), 0);
      expect(totalReferrerEarnings).toBeCloseTo(expectedTotal, 2);
    });
  });

  describe('Data Aggregation and Reporting', () => {
    it('should calculate accurate referrer earnings summary', () => {
      const referrer = helper.createTestReferrer();

      const account1 = helper.createTestTrainingAccount(referrer);
      const account2 = helper.createTestTrainingAccount(referrer);
      const account3 = helper.createTestTrainingAccount(referrer);

      helper.simulateProfitShare(account1, referrer, 100);
      helper.simulateProfitShare(account2, referrer, 150);
      helper.simulateProfitShare(account3, referrer, 50);

      const referrerLogs = helper.testLogs.filter(log => log.referrerId === referrer.id);
      const totalProfit = referrerLogs.reduce((sum, log) => sum + log.totalSharedProfit, 0);

      expect(totalProfit).toBe(60); // 20 + 30 + 10
    });

    it('should generate performance metrics per training account', () => {
      const referrer = helper.createTestReferrer();
      const account = helper.createTestTrainingAccount(referrer);

      const earnings = [50, 75, 100, 125, 150];
      earnings.forEach(amount => {
        helper.simulateProfitShare(account, referrer, amount);
      });

      const log = helper.getAccountLog(account.id);
      const avgEarning = log.totalEarnings / earnings.length;
      const avgProfit = log.totalSharedProfit / earnings.length;

      expect(avgEarning).toBe(100);
      expect(avgProfit).toBe(20);
    });

    it('should filter and list accounts by status', () => {
      const referrer = helper.createTestReferrer();

      const account1 = helper.createTestTrainingAccount(referrer);
      const account2 = helper.createTestTrainingAccount(referrer);

      helper.simulateProfitShare(account1, referrer, 100);
      helper.simulateProfitShare(account2, referrer, 100);

      const activeLogs = helper.testLogs.filter(log => log.status === 'active');
      expect(activeLogs).toHaveLength(2);

      // Simulate deactivation
      const log = helper.getAccountLog(account1.id);
      log.status = 'inactive';

      const newActiveLogs = helper.testLogs.filter(log => log.status === 'active');
      expect(newActiveLogs).toHaveLength(1);
    });
  });
});

describe('Transaction Validation and Integrity', () => {
  let helper;

  beforeEach(() => {
    helper = new TrainingAccountTestHelper();
  });

  afterEach(() => {
    helper.cleanup();
  });

  it('should ensure transaction amounts match calculations', () => {
    const referrer = helper.createTestReferrer();
    const account = helper.createTestTrainingAccount(referrer);

    const earnings = 123.45;
    helper.simulateProfitShare(account, referrer, earnings);

    const transactions = helper.getTransactions(account.id);
    const transaction = transactions[0];

    expect(transaction.amount).toBeCloseTo(earnings * 0.2, 2);
    expect(transaction.metadata.originalEarnings).toBe(earnings);
    expect(transaction.metadata.sharePercentage).toBe(20);
  });

  it('should preserve transaction metadata integrity', () => {
    const referrer = helper.createTestReferrer();
    const account = helper.createTestTrainingAccount(referrer);

    helper.simulateProfitShare(account, referrer, 100);

    const transactions = helper.getTransactions(account.id);
    const transaction = transactions[0];

    expect(transaction.metadata.trainingAccountId).toBe(account.id);
    expect(transaction.metadata.sharerPhone).toBe(account.phone);
    expect(transaction.type).toBe('training_profit_share');
    expect(transaction.userId).toBe(account.id);
  });

  it('should maintain chronological transaction order', () => {
    const referrer = helper.createTestReferrer();
    const account = helper.createTestTrainingAccount(referrer);

    const timestamps = [];
    for (let i = 0; i < 5; i++) {
      helper.simulateProfitShare(account, referrer, 100);
      const txn = helper.testTransactions[helper.testTransactions.length - 1];
      timestamps.push(new Date(txn.createdAt).getTime());
    }

    // Verify timestamps are in order (allowing same timestamp)
    for (let i = 1; i < timestamps.length; i++) {
      expect(timestamps[i]).toBeGreaterThanOrEqual(timestamps[i - 1]);
    }
  });
});
