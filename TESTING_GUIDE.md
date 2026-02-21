# Testing Guide: Training Account System

This guide covers testing the training account system locally and in CI/CD pipeline.

## Overview

The test suite includes:
- **Unit Tests**: Individual function and calculation tests
- **Integration Tests**: Complete end-to-end workflow tests
- **Component Tests**: React component rendering and behavior (optional)
- **API Tests**: Backend function endpoint tests (CI/CD only)

## Quick Start

```bash
# Run all tests
npm run test:all

# Run specific test file
npm test

# Run integration tests
npm run test:integration

# Watch mode (auto-rerun on changes)
npm run test:watch
```

## Test Structure

```
tests/
├── trainingAccounts.test.js          # Unit tests
├── integration/
│   └── trainingAccounts.integration.test.js  # Integration tests
└── setup.js                           # Test configuration (optional)
```

## Running Tests

### Local Development

```bash
# Install test framework
npm install --save-dev vitest @vitest/ui

# Run tests in watch mode
npm run test:watch

# Run with UI dashboard
npx vitest --ui
```

### CI/CD Pipeline

Tests automatically run on:
- Every push to main/develop branches
- Every pull request to main/develop
- Manual trigger via GitHub Actions UI

## Test Coverage

### Unit Tests: `tests/trainingAccounts.test.js`

**File**: [tests/trainingAccounts.test.js](../tests/trainingAccounts.test.js)

**Test Suites** (150+ assertions):

1. **Profit Share Calculation** (5 tests)
   - ✓ Calculate 20% correctly: $100 → $20
   - ✓ Handle decimal earnings: $99.99 → $19.998
   - ✓ Handle zero earnings: $0 → $0
   - ✓ Distribute among multiple accounts
   - ✓ Maintain precision

2. **Balance Updates** (3 tests)
   - ✓ Update referrer balance with profit share
   - ✓ Update training account with remaining earnings
   - ✓ Handle multiple profit distributions

3. **Training Account Validation** (5 tests)
   - ✓ Require phone number
   - ✓ Require invitation code
   - ✓ Allow optional account name
   - ✓ Generate valid training code format
   - ✓ Validate referrer requirements

4. **Transaction Recording** (3 tests)
   - ✓ Create transaction with correct metadata
   - ✓ Record training account transactions
   - ✓ Maintain accurate transaction history

5. **Data Aggregation** (4 tests)
   - ✓ Aggregate earnings across accounts
   - ✓ Aggregate profit shares per referrer
   - ✓ Calculate average per account
   - ✓ Filter accounts by status

6. **Error Scenarios** (4 tests)
   - ✓ Handle missing training account
   - ✓ Handle missing referrer
   - ✓ Prevent invalid share percentages
   - ✓ Handle negative earnings

### Integration Tests: `tests/integration/trainingAccounts.integration.test.js`

**File**: [tests/integration/trainingAccounts.integration.test.js](../tests/integration/trainingAccounts.integration.test.js)

**Test Scenarios** (35+ tests):

1. **Complete Flow: Creation to Profit Sharing** (5 tests)
   - ✓ Create training account properly
   - ✓ Validate referrer before creation
   - ✓ Distribute profit on earnings
   - ✓ Handle multiple earnings over time
   - ✓ Track all transactions correctly

2. **Multi-Account Scenarios** (4 tests)
   - ✓ Manage multiple accounts for one referrer
   - ✓ Track earnings independently
   - ✓ Handle accounts from different referrers
   - ✓ Verify data isolation

3. **Edge Cases** (5 tests)
   - ✓ Handle zero earnings
   - ✓ Handle fractional amounts
   - ✓ Reject invalid training account scenarios
   - ✓ Maintain financial precision
   - ✓ Handle edge case percentages

4. **Data Aggregation & Reporting** (3 tests)
   - ✓ Calculate accurate referrer earnings
   - ✓ Generate performance metrics
   - ✓ Filter accounts by status

5. **Transaction Validation** (3 tests)
   - ✓ Ensure transaction amounts match calculations
   - ✓ Preserve metadata integrity
   - ✓ Maintain chronological order

## Writing New Tests

### Unit Test Template

```javascript
import { describe, it, expect } from 'vitest';

describe('Feature Name', () => {
  describe('Sub-feature', () => {
    it('should perform expected behavior', () => {
      // Arrange
      const input = { /* test data */ };
      
      // Act
      const result = functionUnderTest(input);
      
      // Assert
      expect(result).toBe(expectedValue);
    });
  });
});
```

### Integration Test Template

```javascript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('User Flow', () => {
  let testData;

  beforeEach(() => {
    testData = setupTestData();
  });

  afterEach(() => {
    cleanup(testData);
  });

  it('should complete full workflow', async () => {
    // Step 1
    const result1 = await step1(testData);
    expect(result1).toBeDefined();

    // Step 2
    const result2 = await step2(result1);
    expect(result2).toEqual(expectedValue);

    // Verify final state
    expect(testData.finalState).toBe(expectedFinalState);
  });
});
```

## Testing Best Practices

### 1. Isolation

Each test should be independent:

```javascript
// ✓ Good: Self-contained test
it('should calculate profit correctly', () => {
  const earnings = 100;
  const profit = earnings * 0.2;
  expect(profit).toBe(20);
});

// ✗ Bad: Depends on previous test
it('should update balance', () => {
  balance += profit; // Depends on previous test
  expect(balance).toBe(120);
});
```

### 2. Descriptive Names

Test names should clearly describe what's being tested:

```javascript
// ✓ Good
it('should distribute 20% of $100 earnings as profit share', () => { });

// ✗ Bad
it('should work', () => { });
```

### 3. Arrange-Act-Assert

Structure tests clearly:

```javascript
it('should validate referrer existence', () => {
  // Arrange: Set up test data
  const referrer = { id: 'ref_1', isTrainingAccount: false };
  
  // Act: Execute code under test
  const isValid = validateReferrer(referrer);
  
  // Assert: Verify results
  expect(isValid).toBe(true);
});
```

### 4. Edge Cases

Always test boundaries:

```javascript
// Test edge cases
it('should handle zero earnings', () => {
  expect(calculateShare(0)).toBe(0);
});

it('should handle maximum safe integer', () => {
  expect(calculateShare(Number.MAX_SAFE_INTEGER)).toBeDefined();
});

it('should reject negative amounts', () => {
  expect(() => validateAmount(-100)).toThrow();
});
```

### 5. Mock External Dependencies

```javascript
// ✓ Good: Mock Base44 SDK
const mockBase44 = {
  entities: {
    AppUser: { get: vi.fn() }
  }
};

// ✗ Bad: Don't call real API in tests
const realUser = await base44.entities.AppUser.get('id');
```

## Common Testing Patterns

### Testing Calculations

```javascript
it('should calculate profit share correctly', () => {
  const testCases = [
    { earnings: 100, expected: 20 },
    { earnings: 50, expected: 10 },
    { earnings: 99.99, expected: 19.998 },
  ];

  testCases.forEach(({ earnings, expected }) => {
    const result = (earnings * 20) / 100;
    expect(result).toBeCloseTo(expected, 2);
  });
});
```

### Testing State Changes

```javascript
it('should update referrer balance', () => {
  const referrer = { balance: 100 };
  const profitShare = 20;

  referrer.balance += profitShare;

  expect(referrer.balance).toBe(120);
});
```

### Testing Multiple Scenarios

```javascript
it('should handle multi-account scenario', () => {
  const referrer = createMockReferrer({ balance: 0 });
  const accounts = [
    createMockTrainingAccount(referrer),
    createMockTrainingAccount(referrer),
  ];

  simulateProfitShare(accounts[0], referrer, 100);
  simulateProfitShare(accounts[1], referrer, 50);

  expect(referrer.balance).toBe(30); // 20 + 10
});
```

## Debugging Tests

### Print Values During Test

```javascript
it('should debug profit calculation', () => {
  const earnings = 100;
  const profit = (earnings * 20) / 100;
  
  console.log('Earnings:', earnings);
  console.log('Profit:', profit);
  console.log('Debug info:', { earnings, profit });
  
  expect(profit).toBe(20);
});
```

### Run Single Test File

```bash
npm test tests/trainingAccounts.test.js
```

### Run Single Test

```bash
npm test -- -t "should calculate 20% profit share correctly"
```

### Watch Mode

```bash
npm run test:watch
```

### UI Dashboard

```bash
npx vitest --ui
```

## Test Performance

### Slow Tests

If tests run slowly:

1. **Reduce test data**: Smaller datasets
2. **Mock external calls**: Don't call real APIs
3. **Parallelize**: Run independent tests in parallel
4. **Profile**: Identify bottlenecks with `--reporter=verbose`

### Improving Speed

```bash
# Run tests in parallel
npx vitest --reporter=verbose

# Run with specific workers
npx vitest --threads --threads-per-worker 2

# Disable coverage to speed up
npx vitest --coverage=false
```

## Coverage Goals

Target coverage metrics:

| Metric | Goal |
|--------|------|
| Statements | >= 80% |
| Branches | >= 75% |
| Functions | >= 80% |
| Lines | >= 80% |

Generate coverage report:

```bash
# Install coverage tool
npm install --save-dev @vitest/coverage-v8

# Generate report
npx vitest --coverage
```

## Continuous Integration

Tests automatically run in CI/CD:

1. **On Push**: Tests run for main/develop branches
2. **On PR**: Tests required before merging
3. **Manual Trigger**: Run tests anytime from Actions tab
4. **Scheduled**: (Optional) Run nightly test suite

### GitHub Actions Logs

View test results:
1. GitHub → Actions tab
2. Click workflow run
3. Click "Test Suite" job
4. Review console output

### Failure Notifications

If tests fail:
1. **Email**: GitHub notifies you automatically
2. **Slack**: If configured, sends webhook
3. **PR Comment**: Failed test details posted to PR

## Test Maintenance

### Review Tests Quarterly

1. Remove obsolete tests
2. Add tests for new features
3. Update mocks if interfaces change
4. Refactor duplicated test code

### Update Tests When Code Changes

```javascript
// When function signature changes
// BEFORE
const result = calculateShare(earnings);

// AFTER
const result = calculateShare(earnings, percentage);

// Update tests
expect(calculateShare(100, 20)).toBe(20);
```

## Troubleshooting

### Tests not running

```bash
# Check vitest is installed
npm list vitest

# Install if missing
npm install --save-dev vitest

# Run with verbose output
npx vitest --reporter=verbose
```

### Import errors

```javascript
// ✗ Error: Cannot find module
import { base44 } from '@/api/base44Client';

// Solution: Use correct path or mock
const mockBase44 = { /* ... */ };
```

### Timeout errors

```javascript
// Increase timeout for slow tests
it('should complete workflow', async () => {
  // test code
}, { timeout: 10000 }); // 10 second timeout
```

## Resources

- [Vitest Documentation](https://vitest.dev)
- [Testing Library](https://testing-library.com)
- [Jest Matchers](https://vitest.dev/api/expect.html)
- [Test Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

---

End of Testing Guide
