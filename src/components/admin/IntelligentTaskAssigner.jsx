import { useState } from "react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { Loader2, Zap, Users, CheckCircle, AlertCircle } from "lucide-react";

export default function IntelligentTaskAssigner() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);

  const assignTasks = async () => {
    setLoading(true);
    setResults(null);
    try {
      const response = await base44.functions.invoke('intelligentTaskAssignment', {
        mode: 'auto'
      });

      if (response.data.success) {
        setResults(response.data);
        toast.success(`Assigned tasks to ${response.data.assignedUsers} users`);
      } else {
        toast.error(`Failed: ${response.data.error}`);
      }
    } catch (error) {
      console.error("Assignment error:", error);
      toast.error(`Failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center gap-2 mb-4">
        <Zap className="w-5 h-5 text-blue-600" />
        <h3 className="text-lg font-bold text-gray-900">Intelligent Task Assignment</h3>
      </div>

      <p className="text-sm text-gray-600 mb-4">
        Automatically assigns tasks to eligible users based on VIP level, progress, and completion rates.
      </p>

      <Button
        onClick={assignTasks}
        disabled={loading}
        className="bg-blue-600 hover:bg-blue-700 mb-4"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
            Assigning Tasks...
          </>
        ) : (
          <>
            <Zap className="w-4 h-4 mr-2" />
            Auto-Assign Tasks to All Users
          </>
        )}
      </Button>

      {results && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-xs font-medium text-green-800">Assigned</span>
              </div>
              <div className="text-2xl font-bold text-green-700">{results.assignedUsers}</div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <Users className="w-4 h-4 text-blue-600" />
                <span className="text-xs font-medium text-blue-800">Processed</span>
              </div>
              <div className="text-2xl font-bold text-blue-700">{results.totalProcessed}</div>
            </div>
          </div>

          {results.results && results.results.length > 0 && (
            <div className="max-h-64 overflow-y-auto">
              <h4 className="text-sm font-semibold text-gray-900 mb-2">Assignment Details</h4>
              <div className="space-y-2">
                {results.results.map((result, idx) => (
                  <div 
                    key={idx}
                    className={`flex items-center justify-between p-2 rounded-lg text-sm ${
                      result.error 
                        ? "bg-red-50 border border-red-200" 
                        : "bg-gray-50 border border-gray-200"
                    }`}
                  >
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{result.email}</div>
                      <div className="text-xs text-gray-600">
                        {result.error ? (
                          <span className="text-red-600">{result.error}</span>
                        ) : (
                          `${result.vipLevel} • ${result.tasksAssigned} tasks assigned • ${result.tasksRemaining} remaining`
                        )}
                      </div>
                    </div>
                    {result.error ? (
                      <AlertCircle className="w-4 h-4 text-red-500" />
                    ) : (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-800">
        <p className="font-medium mb-1">🤖 Intelligent Assignment Logic:</p>
        <ul className="list-disc ml-4 space-y-0.5">
          <li>Assigns 10-15 tasks based on user success rate (80%+ gets more)</li>
          <li>Respects VIP level price ranges and task limits</li>
          <li>Premium products only in Set 2, max 3 per set</li>
          <li>Skips users with pending tasks, frozen accounts, or needing reset</li>
          <li>Ensures product variety and avoids duplicates</li>
        </ul>
      </div>
    </div>
  );
}