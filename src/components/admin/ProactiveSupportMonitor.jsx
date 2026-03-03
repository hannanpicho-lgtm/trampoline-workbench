import { useState } from "react";
import { AlertTriangle, PlayCircle, Loader2, CheckCircle, XCircle } from "lucide-react";
import { backendClient } from "@/api/backendClient";
import { toast } from "sonner";

export default function ProactiveSupportMonitor() {
  const [loading, setLoading] = useState(false);
  const [lastRun, setLastRun] = useState(null);

  const runProactiveCheck = async () => {
    setLoading(true);
    try {
      const result = await backendClient.functions.invoke('proactiveSupport', {});
      
      if (result.data?.success) {
        setLastRun({
          timestamp: new Date(),
          issuesDetected: result.data.issuesDetected,
          breakdown: result.data.breakdown,
          issues: result.data.issues
        });
        
        toast.success(`Proactive check completed`, {
          description: `${result.data.issuesDetected} issues detected and addressed`
        });
      } else {
        toast.error("Proactive check failed");
      }
    } catch (error) {
      toast.error("Failed to run proactive check", { description: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Proactive Support Monitor</h2>
          <p className="text-sm text-gray-500 mt-1">AI-powered user behavior monitoring and automated assistance</p>
        </div>
        <button
          type="button"
          onClick={runProactiveCheck}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Running...
            </>
          ) : (
            <>
              <PlayCircle className="w-5 h-5" />
              Run Check Now
            </>
          )}
        </button>
      </div>

      {/* Monitored Issues */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
            </div>
            <h3 className="font-semibold text-gray-900">Inactive After Completion</h3>
          </div>
          <p className="text-sm text-gray-600">Users who completed task sets but haven't logged in for 24+ hours</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <XCircle className="w-5 h-5 text-red-600" />
            </div>
            <h3 className="font-semibold text-gray-900">Balance Below Threshold</h3>
          </div>
          <p className="text-sm text-gray-600">Users whose balance is below their VIP level requirement</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-purple-600" />
            </div>
            <h3 className="font-semibold text-gray-900">Account Frozen 48+ Hours</h3>
          </div>
          <p className="text-sm text-gray-600">Frozen accounts that haven't been resolved for 2+ days</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
            </div>
            <h3 className="font-semibold text-gray-900">Low Credit Score</h3>
          </div>
          <p className="text-sm text-gray-600">Users with credit scores below 60%</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="font-semibold text-gray-900">Stuck in Set</h3>
          </div>
          <p className="text-sm text-gray-600">Partial task set completion with 7+ days inactivity</p>
        </div>
      </div>

      {/* Last Run Results */}
      {lastRun && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Last Check Results</h3>
            <span className="text-sm text-gray-500">
              {new Date(lastRun.timestamp).toLocaleString()}
            </span>
          </div>

          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900">{lastRun.issuesDetected}</div>
              <div className="text-sm text-gray-500">Total Issues</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-red-600">{lastRun.breakdown?.critical || 0}</div>
              <div className="text-sm text-gray-500">Critical</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600">{lastRun.breakdown?.high || 0}</div>
              <div className="text-sm text-gray-500">High</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-600">{lastRun.breakdown?.medium || 0}</div>
              <div className="text-sm text-gray-500">Medium</div>
            </div>
          </div>

          {lastRun.issues?.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium text-gray-900 mb-2">Detected Issues:</h4>
              <div className="max-h-64 overflow-y-auto space-y-2">
                {lastRun.issues.map((issue, idx) => (
                  <div key={idx} className={`flex items-start gap-3 p-3 rounded-lg border ${
                    issue.severity === 'critical' ? 'bg-red-50 border-red-200' :
                    issue.severity === 'high' ? 'bg-orange-50 border-orange-200' :
                    'bg-yellow-50 border-yellow-200'
                  }`}>
                    <AlertTriangle className={`w-4 h-4 mt-0.5 ${
                      issue.severity === 'critical' ? 'text-red-600' :
                      issue.severity === 'high' ? 'text-orange-600' :
                      'text-yellow-600'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900">{issue.userEmail}</div>
                      <div className="text-xs text-gray-600">{issue.type.replace(/_/g, ' ')}</div>
                      <div className="text-xs text-gray-500 mt-1">{issue.message}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex gap-3">
          <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-900">
            <strong>Automated Actions:</strong> When issues are detected, the system automatically sends helpful messages to users and creates admin alerts for critical cases. The proactive check runs every 6 hours automatically.
          </div>
        </div>
      </div>
    </div>
  );
}