import { useState, useEffect } from 'react';
import { Zap, AlertTriangle, TrendingUp, Users, CheckCircle, Loader2 } from 'lucide-react';
import { backendClient } from '@/api/backendClient';
import { toast } from 'sonner';

export default function VIPTaskAssignmentMonitor() {
  const [summary, setSummary] = useState(null);
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    calculateFairness();
  }, []);

  const calculateFairness = async () => {
    setLoading(true);
    try {
      const response = await backendClient.functions.invoke('calculateTaskFairness', {});
      setSummary(response.data.summary);
      setIssues(response.data.unfairDistributions || []);
    } catch (error) {
      toast.error('Failed to calculate fairness');
    } finally {
      setLoading(false);
    }
  };

  const handleAutoAssign = async () => {
    if (!confirm('Run intelligent task assignment? This will assign tasks to eligible users.')) return;

    setRunning(true);
    try {
      const response = await backendClient.functions.invoke('enhancedTaskAssignment', {
        assignmentLimit: 500
      });

      toast.success(`Assigned ${response.data.assigned} tasks!`);
      await calculateFairness();
    } catch (error) {
      toast.error('Task assignment failed');
    } finally {
      setRunning(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12">Calculating fairness metrics...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">VIP Task Assignment</h2>
          <p className="text-gray-600 mt-1">Monitor fair task distribution by VIP level</p>
        </div>
        <button
          type="button"
          onClick={handleAutoAssign}
          disabled={running}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg flex items-center gap-2 font-medium transition-colors"
        >
          {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
          {running ? 'Assigning...' : 'Run Auto-Assignment'}
        </button>
      </div>

      {/* Issues */}
      {issues.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-2">
          <div className="flex items-center gap-2 text-amber-900 font-bold">
            <AlertTriangle className="w-5 h-5" />
            Fairness Issues Detected
          </div>
          {issues.map((issue, idx) => (
            <div key={idx} className="text-sm text-amber-800 bg-white p-2 rounded">
              <div className="font-medium">{issue.type}</div>
              <div className="text-xs text-amber-700 mt-1">{issue.description}</div>
            </div>
          ))}
        </div>
      )}

      {/* VIP Summary */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {summary && Object.entries(summary).map(([vip, data]) => (
          <div key={vip} className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
            <div className="text-sm font-medium text-gray-600 mb-3">{vip}</div>
            
            <div className="space-y-2">
              <div>
                <div className="text-xs text-gray-500">Users</div>
                <div className="text-2xl font-bold text-gray-900">{data.userCount}</div>
              </div>
              
              <div>
                <div className="text-xs text-gray-500">Avg Tasks</div>
                <div className="text-lg font-bold text-gray-900">{data.avgTotalTasks}</div>
              </div>
              
              <div>
                <div className="text-xs text-gray-500">Completed Avg</div>
                <div className="text-lg font-bold text-green-600">{data.avgCompletedTasks}</div>
              </div>
              
              <div>
                <div className="text-xs text-gray-500">Avg Earnings</div>
                <div className="text-lg font-bold text-blue-600">${data.avgEarnings}</div>
              </div>
              
              <div className="pt-2 border-t border-gray-200">
                <div className="text-xs text-gray-500 mb-1">Fairness Score</div>
                <div className="flex items-center gap-1">
                  <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div 
                      className="h-full bg-green-500"
                      style={{ width: `${data.fairnessScore}%` }}
                    />
                  </div>
                  <span className="text-xs font-bold text-gray-700">{data.fairnessScore}%</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Assignment Strategy */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-blue-600" />
          Assignment Strategy
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <h4 className="font-semibold text-gray-900">VIP Level Capacity Multipliers</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between p-2 bg-orange-50 rounded">
                <span className="text-gray-700">Bronze</span>
                <span className="font-bold text-gray-900">1.0x</span>
              </div>
              <div className="flex justify-between p-2 bg-gray-50 rounded">
                <span className="text-gray-700">Silver</span>
                <span className="font-bold text-gray-900">1.2x</span>
              </div>
              <div className="flex justify-between p-2 bg-yellow-50 rounded">
                <span className="text-gray-700">Gold</span>
                <span className="font-bold text-gray-900">1.5x</span>
              </div>
              <div className="flex justify-between p-2 bg-cyan-50 rounded">
                <span className="text-gray-700">Platinum</span>
                <span className="font-bold text-gray-900">1.8x</span>
              </div>
              <div className="flex justify-between p-2 bg-purple-50 rounded">
                <span className="text-gray-700">Diamond</span>
                <span className="font-bold text-gray-900">2.0x</span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-semibold text-gray-900">Fairness Factors</h4>
            <div className="space-y-2 text-sm">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                <div className="font-medium text-blue-900">Completion Rate</div>
                <div className="text-xs text-blue-700">Users with higher success rates get more tasks</div>
              </div>
              <div className="p-3 bg-green-50 border border-green-200 rounded">
                <div className="font-medium text-green-900">Pending Load Balance</div>
                <div className="text-xs text-green-700">Users with fewer pending tasks get priority</div>
              </div>
              <div className="p-3 bg-purple-50 border border-purple-200 rounded">
                <div className="font-medium text-purple-900">VIP Proportional Distribution</div>
                <div className="text-xs text-purple-700">Higher VIP tiers receive more rewarding tasks</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}