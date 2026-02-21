import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { TrendingUp, TrendingDown, Users, DollarSign, Target, Zap, AlertTriangle, Calendar, Award, RefreshCw, Settings, CheckCircle, Clock } from "lucide-react";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from "recharts";

export default function AdvancedAnalyticsDashboard() {
  const [loading, setLoading] = useState(true);
  const [retentionData, setRetentionData] = useState([]);
  const [churnPredictions, setChurnPredictions] = useState([]);
  const [taskROI, setTaskROI] = useState([]);
  const [assignmentEffectiveness, setAssignmentEffectiveness] = useState(null);
  const [timeRange, setTimeRange] = useState("30d");

  useEffect(() => {
    loadAnalytics();
  }, [timeRange]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const [users, tasks, configs] = await Promise.all([
        base44.entities.AppUser.list("-created_date", 500),
        base44.entities.UserTask.list("-created_date", 1000),
        base44.entities.TaskAssignmentConfig.list()
      ]);

      calculateRetention(users, tasks);
      calculateChurnPredictions(users, tasks);
      calculateTaskROI(tasks);
      calculateAssignmentEffectiveness(configs, tasks, users);
    } catch (error) {
      toast.error("Failed to load analytics");
    } finally {
      setLoading(false);
    }
  };

  const calculateRetention = (users, tasks) => {
    const now = new Date();
    const cohorts = {};

    users.forEach(user => {
      const joinDate = new Date(user.created_date);
      const cohortMonth = `${joinDate.getFullYear()}-${String(joinDate.getMonth() + 1).padStart(2, '0')}`;
      
      if (!cohorts[cohortMonth]) {
        cohorts[cohortMonth] = { total: 0, retained: {} };
      }
      cohorts[cohortMonth].total++;

      // Check activity in each subsequent month
      const userTasks = tasks.filter(t => t.userId === user.id);
      userTasks.forEach(task => {
        const taskDate = new Date(task.created_date);
        const monthsAfterJoin = Math.floor((taskDate.getTime() - joinDate.getTime()) / (1000 * 60 * 60 * 24 * 30));
        if (monthsAfterJoin >= 0) {
          if (!cohorts[cohortMonth].retained[monthsAfterJoin]) {
            cohorts[cohortMonth].retained[monthsAfterJoin] = new Set();
          }
          cohorts[cohortMonth].retained[monthsAfterJoin].add(user.id);
        }
      });
    });

    const retentionChart = Object.entries(cohorts).slice(-6).map(([cohort, data]) => {
      const month0 = data.total;
      return {
        cohort,
        month0: 100,
        month1: data.retained[1] ? parseFloat((data.retained[1].size / month0 * 100).toFixed(1)) : 0,
        month2: data.retained[2] ? parseFloat((data.retained[2].size / month0 * 100).toFixed(1)) : 0,
        month3: data.retained[3] ? parseFloat((data.retained[3].size / month0 * 100).toFixed(1)) : 0
      };
    });

    setRetentionData(retentionChart);
  };

  const calculateChurnPredictions = (users, tasks) => {
    const predictions = users.map(user => {
      const userTasks = tasks.filter(t => t.userId === user.id);
      const lastTaskDate = userTasks.length > 0 
        ? new Date(Math.max(...userTasks.map(t => new Date(t.created_date).getTime())))
        : new Date(user.created_date);
      
      const daysSinceLastActivity = (Date.now() - lastTaskDate.getTime()) / (1000 * 60 * 60 * 24);
      const completionRate = userTasks.length > 0
        ? (userTasks.filter(t => t.status === 'completed' || t.status === 'approved').length / userTasks.length * 100)
        : 100;
      
      // Simple churn prediction score (0-100, higher = more likely to churn)
      let churnScore = 0;
      if (daysSinceLastActivity > 30) churnScore += 50;
      else if (daysSinceLastActivity > 14) churnScore += 30;
      else if (daysSinceLastActivity > 7) churnScore += 15;
      
      if (completionRate < 50) churnScore += 30;
      else if (completionRate < 70) churnScore += 15;
      
      if ((user.balance || 0) < 50) churnScore += 10;
      
      return {
        userId: user.id,
        email: user.created_by,
        churnScore: Math.min(100, churnScore),
        daysSinceLastActivity: Math.floor(daysSinceLastActivity),
        completionRate: parseFloat((completionRate).toFixed(1)),
        riskLevel: churnScore > 60 ? 'High' : churnScore > 30 ? 'Medium' : 'Low'
      };
    }).sort((a, b) => b.churnScore - a.churnScore);

    setChurnPredictions(predictions.slice(0, 20));
  };

  const calculateTaskROI = (tasks) => {
    const products = {};
    
    tasks.forEach(task => {
      if (!products[task.productId]) {
        products[task.productId] = {
          totalAssigned: 0,
          completed: 0,
          approved: 0,
          rejected: 0,
          totalCommission: 0,
          avgCompletionTime: []
        };
      }
      
      const p = products[task.productId];
      p.totalAssigned++;
      
      if (task.status === 'completed') p.completed++;
      if (task.status === 'approved') p.approved++;
      if (task.status === 'rejected') p.rejected++;
      if (task.commission) p.totalCommission += task.commission;
      
        if (task.submittedAt && task.created_date) {
        const completionTime = (new Date(task.submittedAt).getTime() - new Date(task.created_date).getTime()) / (1000 * 60 * 60);
        p.avgCompletionTime.push(completionTime);
      }
    });

    const roiData = Object.entries(products).map(([productId, data]) => {
      const completionRate = parseFloat((data.completed / data.totalAssigned * 100).toFixed(1));
      const approvalRate = parseFloat((data.approved / data.totalAssigned * 100).toFixed(1));
      const avgTime = data.avgCompletionTime.length > 0
        ? parseFloat((data.avgCompletionTime.reduce((a, b) => a + b, 0) / data.avgCompletionTime.length).toFixed(1))
        : 0;
      
      // ROI Score: higher completion rate, approval rate, and commission = better ROI
      const roiScore = parseFloat((completionRate * 0.4 + approvalRate * 0.4 + (data.totalCommission / data.totalAssigned) * 10).toFixed(1));
      
      return {
        productId: productId.substring(0, 8) + '...',
        assigned: data.totalAssigned,
        completionRate: completionRate,
        approvalRate: approvalRate,
        avgTime: avgTime,
        totalCommission: parseFloat(data.totalCommission.toFixed(2)),
        roiScore: roiScore
      };
    }).sort((a, b) => b.roiScore - a.roiScore).slice(0, 10);

    setTaskROI(roiData);
  };

  const calculateAssignmentEffectiveness = (configs, tasks, users) => {
    const now = new Date();
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    const recentTasks = tasks.filter(t => new Date(t.created_date).getTime() > last30Days.getTime());
    
    const effectiveness = {
      totalConfigs: configs.length,
      activeConfigs: configs.filter(c => c.isActive).length,
      tasksAssigned: recentTasks.filter(t => t.status === 'pending').length,
      tasksCompleted: recentTasks.filter(t => t.status === 'completed' || t.status === 'approved').length,
      avgCompletionTime: 0,
      fairnessScore: 0,
      configPerformance: []
    };

    // Calculate average completion time
    const completedTasks = recentTasks.filter(t => t.submittedAt);
    if (completedTasks.length > 0) {
      const totalTime = completedTasks.reduce((sum, t) => {
        return sum + (new Date(t.submittedAt).getTime() - new Date(t.created_date).getTime()) / (1000 * 60 * 60);
      }, 0);
      effectiveness.avgCompletionTime = parseFloat((totalTime / completedTasks.length).toFixed(1));
    }

    // Calculate fairness score (even distribution across users)
    const userTaskCounts = {};
    recentTasks.forEach(t => {
      userTaskCounts[t.userId] = (userTaskCounts[t.userId] || 0) + 1;
    });
    const taskCounts = Object.values(userTaskCounts);
    if (taskCounts.length > 0) {
      const avg = taskCounts.reduce((a, b) => a + b, 0) / taskCounts.length;
      const variance = taskCounts.reduce((sum, count) => sum + Math.pow(count - avg, 2), 0) / taskCounts.length;
      const stdDev = Math.sqrt(variance);
      effectiveness.fairnessScore = parseFloat(Math.max(0, 100 - (stdDev / avg * 100)).toFixed(1));
    }

    // Per-config performance
    configs.forEach(config => {
      const configUsers = users.filter(u => u.vipLevel === config.vipLevel);
      const configTasks = recentTasks.filter(t => {
        const user = users.find(u => u.id === t.userId);
        return user && user.vipLevel === config.vipLevel;
      });

      effectiveness.configPerformance.push({
        name: config.configName,
        vipLevel: config.vipLevel,
        usersAffected: configUsers.length,
        tasksAssigned: configTasks.length,
        completionRate: configTasks.length > 0
          ? ((configTasks.filter(t => t.status === 'completed' || t.status === 'approved').length / configTasks.length) * 100).toFixed(1)
          : 0,
        isActive: config.isActive
      });
    });

    setAssignmentEffectiveness(effectiveness);
  };

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
        <RefreshCw className="w-8 h-8 text-gray-400 mx-auto mb-3 animate-spin" />
        <p className="text-gray-500">Loading advanced analytics...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">Advanced Analytics</h2>
            <p className="text-blue-100">Deep insights into user behavior, task performance, and system effectiveness</p>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-4 py-2 bg-white/20 backdrop-blur rounded-lg text-white border border-white/30"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
            </select>
            <button
              type="button"
              onClick={loadAnalytics}
              className="p-2 bg-white/20 backdrop-blur hover:bg-white/30 rounded-lg transition-colors"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* User Retention Analysis */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <Users className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">User Retention Rate</h3>
            <p className="text-sm text-gray-500">Cohort-based retention analysis</p>
          </div>
        </div>
        
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={retentionData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="cohort" />
            <YAxis label={{ value: 'Retention %', angle: -90, position: 'insideLeft' }} />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="month0" stroke="#3b82f6" strokeWidth={2} name="Month 0" />
            <Line type="monotone" dataKey="month1" stroke="#10b981" strokeWidth={2} name="Month 1" />
            <Line type="monotone" dataKey="month2" stroke="#f59e0b" strokeWidth={2} name="Month 2" />
            <Line type="monotone" dataKey="month3" stroke="#ef4444" strokeWidth={2} name="Month 3" />
          </LineChart>
        </ResponsiveContainer>

        <div className="mt-4 grid grid-cols-3 gap-4">
          <div className="bg-blue-50 rounded-lg p-3">
            <div className="text-xs text-blue-700 font-medium mb-1">Avg Month 1</div>
            <div className="text-2xl font-bold text-blue-900">
              {retentionData.length > 0 
                ? (retentionData.reduce((sum, d) => sum + parseFloat(d.month1 || 0), 0) / retentionData.length).toFixed(1)
                : 0}%
            </div>
          </div>
          <div className="bg-green-50 rounded-lg p-3">
            <div className="text-xs text-green-700 font-medium mb-1">Avg Month 2</div>
            <div className="text-2xl font-bold text-green-900">
              {retentionData.length > 0 
                ? (retentionData.reduce((sum, d) => sum + parseFloat(d.month2 || 0), 0) / retentionData.length).toFixed(1)
                : 0}%
            </div>
          </div>
          <div className="bg-orange-50 rounded-lg p-3">
            <div className="text-xs text-orange-700 font-medium mb-1">Avg Month 3</div>
            <div className="text-2xl font-bold text-orange-900">
              {retentionData.length > 0 
                ? (retentionData.reduce((sum, d) => sum + parseFloat(d.month3 || 0), 0) / retentionData.length).toFixed(1)
                : 0}%
            </div>
          </div>
        </div>
      </div>

      {/* Churn Prediction */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Churn Risk Predictions</h3>
            <p className="text-sm text-gray-500">Users at risk of churning (top 20)</p>
          </div>
        </div>

        <div className="space-y-2">
          {churnPredictions.slice(0, 10).map((pred, idx) => (
            <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${
                  pred.riskLevel === 'High' ? 'bg-red-500' :
                  pred.riskLevel === 'Medium' ? 'bg-orange-500' : 'bg-green-500'
                }`} />
                <span className="text-sm text-gray-700 truncate max-w-xs">{pred.email}</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-xs text-gray-500">{pred.daysSinceLastActivity}d inactive</div>
                <div className="text-xs text-gray-500">{pred.completionRate}% completion</div>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  pred.riskLevel === 'High' ? 'bg-red-100 text-red-700' :
                  pred.riskLevel === 'Medium' ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'
                }`}>
                  {pred.churnScore}% risk
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Task Type ROI */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
            <DollarSign className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Task Type ROI Analysis</h3>
            <p className="text-sm text-gray-500">Return on investment by task performance</p>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={taskROI}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="productId" />
            <YAxis yAxisId="left" orientation="left" label={{ value: 'Rate %', angle: -90, position: 'insideLeft' }} />
            <YAxis yAxisId="right" orientation="right" label={{ value: 'ROI Score', angle: 90, position: 'insideRight' }} />
            <Tooltip />
            <Legend />
            <Bar yAxisId="left" dataKey="completionRate" fill="#3b82f6" name="Completion %" />
            <Bar yAxisId="left" dataKey="approvalRate" fill="#10b981" name="Approval %" />
            <Bar yAxisId="right" dataKey="roiScore" fill="#f59e0b" name="ROI Score" />
          </BarChart>
        </ResponsiveContainer>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Product</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Assigned</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Completion</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Approval</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Avg Time</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Commission</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">ROI Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {taskROI.slice(0, 5).map((task, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="px-4 py-2 font-mono text-xs">{task.productId}</td>
                  <td className="px-4 py-2">{task.assigned}</td>
                  <td className="px-4 py-2">{task.completionRate}%</td>
                  <td className="px-4 py-2">{task.approvalRate}%</td>
                  <td className="px-4 py-2">{task.avgTime}h</td>
                  <td className="px-4 py-2">${task.totalCommission}</td>
                  <td className="px-4 py-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      task.roiScore > 70 ? 'bg-green-100 text-green-700' :
                      task.roiScore > 40 ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {task.roiScore}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Assignment Effectiveness */}
      {assignmentEffectiveness && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Automated Assignment Effectiveness</h3>
              <p className="text-sm text-gray-500">Performance metrics of automated task distribution</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Settings className="w-4 h-4 text-blue-600" />
                <span className="text-xs text-blue-700 font-medium">Active Configs</span>
              </div>
              <div className="text-2xl font-bold text-blue-900">
                {assignmentEffectiveness.activeConfigs}/{assignmentEffectiveness.totalConfigs}
              </div>
            </div>

            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-4 h-4 text-green-600" />
                <span className="text-xs text-green-700 font-medium">Tasks Assigned</span>
              </div>
              <div className="text-2xl font-bold text-green-900">
                {assignmentEffectiveness.tasksAssigned}
              </div>
            </div>

            <div className="bg-purple-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-4 h-4 text-purple-600" />
                <span className="text-xs text-purple-700 font-medium">Completed</span>
              </div>
              <div className="text-2xl font-bold text-purple-900">
                {assignmentEffectiveness.tasksCompleted}
              </div>
            </div>

            <div className="bg-orange-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-orange-600" />
                <span className="text-xs text-orange-700 font-medium">Avg Time</span>
              </div>
              <div className="text-2xl font-bold text-orange-900">
                {assignmentEffectiveness.avgCompletionTime}h
              </div>
            </div>

            <div className="bg-indigo-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Award className="w-4 h-4 text-indigo-600" />
                <span className="text-xs text-indigo-700 font-medium">Fairness</span>
              </div>
              <div className="text-2xl font-bold text-indigo-900">
                {assignmentEffectiveness.fairnessScore}%
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-gray-700">Configuration Performance</h4>
            {assignmentEffectiveness.configPerformance.map((config, idx) => (
              <div key={idx} className={`p-4 rounded-lg border ${config.isActive ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-900">{config.name}</span>
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">{config.vipLevel}</span>
                    {config.isActive && (
                      <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs">Active</span>
                    )}
                  </div>
                  <div className="text-lg font-bold text-gray-900">{config.completionRate}%</div>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span>{config.usersAffected} users</span>
                  <span>•</span>
                  <span>{config.tasksAssigned} tasks assigned</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}