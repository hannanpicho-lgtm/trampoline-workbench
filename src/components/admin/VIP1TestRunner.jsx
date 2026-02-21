import { useState } from "react";
import { Play, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

function assert(condition, message) {
  if (!condition) {
    throw new Error(`TEST FAILED: ${message}`);
  }
}

function testVIP1Commission(totalCommission) {
  assert(
    totalCommission >= 131 && totalCommission <= 150,
    "VIP1 commission out of range (131–150)"
  );
}

function testProductValue(productValue) {
  assert(
    productValue <= 100,
    "Product value exceeds VIP1 limit (100)"
  );
}

function testTaskSets(user) {
  assert(user.taskSetsCompleted <= 2, "User must complete max 2 sets");
  assert((user.taskSetsCompleted || 0) >= 0, "Invalid task set state");
}

function runAllTests(user, products) {
  const results = [];
  let passed = 0;
  let failed = 0;

  // Calculate total commission
  const totalCommission = products.reduce((sum, p) => sum + (p.commission || 0), 0);

  // Test 1: VIP1 Commission Range
  try {
    testVIP1Commission(totalCommission);
    results.push({ test: "VIP1 Commission Range (131-150)", status: "passed", message: `Total: $${totalCommission.toFixed(2)}` });
    passed++;
  } catch (error) {
    results.push({ test: "VIP1 Commission Range (131-150)", status: "failed", message: error.message });
    failed++;
  }

  // Test 2: Task Sets
  try {
    testTaskSets(user);
    results.push({ test: "Task Sets Validation", status: "passed", message: `Sets: ${user.taskSetsCompleted || 0}/2` });
    passed++;
  } catch (error) {
    results.push({ test: "Task Sets Validation", status: "failed", message: error.message });
    failed++;
  }

  // Test 3: Product Values
  const invalidProducts = [];
  products.forEach(p => {
    try {
      testProductValue(p.price);
    } catch {
      invalidProducts.push(`${p.name} ($${p.price})`);
    }
  });

  if (invalidProducts.length === 0) {
    results.push({ test: "Product Value Limits (≤$100)", status: "passed", message: `All ${products.length} products valid` });
    passed++;
  } else {
    results.push({ test: "Product Value Limits (≤$100)", status: "failed", message: `Invalid: ${invalidProducts.join(", ")}` });
    failed++;
  }

  return { results, passed, failed, totalTests: results.length };
}

export default function VIP1TestRunner() {
  const [testing, setTesting] = useState(false);
  const [testResults, setTestResults] = useState(null);

  const runTests = async () => {
    setTesting(true);
    try {
      // Get Bronze users
      const users = await base44.entities.AppUser.filter({ vipLevel: "Bronze" });
      
      if (users.length === 0) {
        toast.error("No Bronze (VIP1) users found");
        setTesting(false);
        return;
      }

      const allResults = [];

      for (const user of users) {
        // Get user's tasks
        const tasks = await base44.entities.UserTask.filter({ userId: user.id });
        const productIds = tasks.map(t => t.productId);
        
        // Get products
        const products = await base44.entities.Product.filter({});
        const userProducts = products.filter(p => productIds.includes(p.id));

        if (userProducts.length === 0) continue;

        const result = runAllTests(user, userProducts);
        allResults.push({
          userEmail: user.created_by,
          userId: user.id,
          ...result
        });
      }

      setTestResults(allResults);
      
      const totalPassed = allResults.reduce((sum, r) => sum + r.passed, 0);
      const totalFailed = allResults.reduce((sum, r) => sum + r.failed, 0);

      if (totalFailed === 0) {
        toast.success(`✅ All tests passed (${totalPassed} tests)`);
      } else {
        toast.error(`❌ ${totalFailed} test(s) failed, ${totalPassed} passed`);
      }
    } catch (error) {
      toast.error("Test execution failed");
      console.error(error);
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-gray-900">VIP1 Automated Tests</h3>
          <p className="text-sm text-gray-500">Run validation tests on all Bronze users</p>
        </div>
        <button
          type="button"
          onClick={runTests}
          disabled={testing}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
        >
          <Play className="w-4 h-4" />
          {testing ? "Running..." : "Run Tests"}
        </button>
      </div>

      {testResults && (
        <div className="space-y-4">
          {testResults.map((userResult, idx) => (
            <div key={idx} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-gray-900">{userResult.userEmail}</h4>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-green-600 font-medium">{userResult.passed} passed</span>
                  {userResult.failed > 0 && (
                    <span className="text-red-600 font-medium">{userResult.failed} failed</span>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                {userResult.results.map((result, ridx) => (
                  <div
                    key={ridx}
                    className={`flex items-start gap-2 p-2 rounded text-sm ${
                      result.status === "passed"
                        ? "bg-green-50 border border-green-200"
                        : "bg-red-50 border border-red-200"
                    }`}
                  >
                    {result.status === "passed" ? (
                      <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <div className={result.status === "passed" ? "text-green-800 font-medium" : "text-red-800 font-medium"}>
                        {result.test}
                      </div>
                      <div className={result.status === "passed" ? "text-green-700" : "text-red-700"}>
                        {result.message}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {!testResults && !testing && (
        <div className="text-center py-8 text-gray-500">
          <AlertCircle className="w-12 h-12 mx-auto mb-2 text-gray-400" />
          <p className="text-sm">Click "Run Tests" to validate VIP1 users</p>
        </div>
      )}
    </div>
  );
}