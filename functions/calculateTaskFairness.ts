import { getBase44Client } from './_shared/base44Client.ts';

Deno.serve(async (req) => {
  try {
    const base44 = getBase44Client(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Fetch all users and their tasks
    const users = await base44.asServiceRole.entities.AppUser.list();
    const allTasks = await base44.asServiceRole.entities.UserTask.list('-created_date', 10000);

    // Calculate fairness metrics
    const fairnessData = {};
    const vipCounts = {};
    const avgCompletionByVIP = {};
    const avgTasksByVIP = {};
    const avgEarningsByVIP = {};

    users.forEach(u => {
      const vipLevel = u.vipLevel || 'Bronze';
      const userTasks = allTasks.filter(t => t.userId === u.id);
      const completedTasks = userTasks.filter(t => t.status === 'completed' || t.status === 'approved');
      const pendingTasks = userTasks.filter(t => t.status === 'pending');
      const totalEarnings = completedTasks.reduce((sum, t) => sum + (t.commission || 0), 0);

      if (!vipCounts[vipLevel]) {
        vipCounts[vipLevel] = 0;
        avgCompletionByVIP[vipLevel] = { total: 0, count: 0 };
        avgTasksByVIP[vipLevel] = { total: 0, count: 0 };
        avgEarningsByVIP[vipLevel] = { total: 0, count: 0 };
      }

      vipCounts[vipLevel]++;
      avgCompletionByVIP[vipLevel].total += completedTasks.length;
      avgCompletionByVIP[vipLevel].count++;
      avgTasksByVIP[vipLevel].total += userTasks.length;
      avgTasksByVIP[vipLevel].count++;
      avgEarningsByVIP[vipLevel].total += totalEarnings;
      avgEarningsByVIP[vipLevel].count++;

      fairnessData[u.id] = {
        vipLevel,
        totalTasks: userTasks.length,
        completedTasks: completedTasks.length,
        pendingTasks: pendingTasks.length,
        totalEarnings,
        completionRate: userTasks.length > 0 ? ((completedTasks.length / userTasks.length) * 100).toFixed(1) : 0,
        avgEarningsPerTask: completedTasks.length > 0 ? (totalEarnings / completedTasks.length).toFixed(2) : 0
      };
    });

    // Calculate averages by VIP
    const summary = {};
    Object.keys(avgCompletionByVIP).forEach(vip => {
      const completionAvg = avgCompletionByVIP[vip].total / avgCompletionByVIP[vip].count;
      const tasksAvg = avgTasksByVIP[vip].total / avgTasksByVIP[vip].count;
      const earningsAvg = avgEarningsByVIP[vip].total / avgEarningsByVIP[vip].count;

      summary[vip] = {
        userCount: vipCounts[vip],
        avgCompletedTasks: completionAvg.toFixed(1),
        avgTotalTasks: tasksAvg.toFixed(1),
        avgEarnings: earningsAvg.toFixed(2),
        fairnessScore: calculateFairnessScore(completionAvg, tasksAvg, earningsAvg)
      };
    });

    // Identify unfair distributions
    const unfairDistributions = identifyUnfairDistributions(summary);

    return Response.json({
      success: true,
      summary,
      unfairDistributions,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Fairness calculation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function calculateFairnessScore(completionAvg, tasksAvg, earningsAvg) {
  // Score based on balance between tasks assigned and completed
  // Higher is more fair
  if (tasksAvg === 0) return 100;
  
  const completionRate = (completionAvg / tasksAvg) * 100;
  const earningsEfficiency = (earningsAvg / Math.max(1, tasksAvg)) * 10;
  
  return Math.min(100, ((completionRate + Math.min(100, earningsEfficiency)) / 2).toFixed(1));
}

function identifyUnfairDistributions(summary) {
  const issues = [];
  const vipLevels = Object.keys(summary);

  // Check for significant differences in task distribution
  const avgTasksPerVIP = Object.values(summary).map(s => parseFloat(s.avgTotalTasks));
  const maxTasks = Math.max(...avgTasksPerVIP);
  const minTasks = Math.min(...avgTasksPerVIP);

  if ((maxTasks - minTasks) > maxTasks * 0.3) {
    issues.push({
      type: 'uneven_task_distribution',
      severity: 'medium',
      description: `Task distribution is uneven. Max: ${maxTasks.toFixed(1)}, Min: ${minTasks.toFixed(1)}`
    });
  }

  // Check for completion rate disparities
  const completionRates = Object.values(summary).map(s => parseFloat(s.avgCompletedTasks) / parseFloat(s.avgTotalTasks));
  const avgCompletion = completionRates.reduce((a, b) => a + b, 0) / completionRates.length;
  
  vipLevels.forEach(vip => {
    const vipCompletion = parseFloat(summary[vip].avgCompletedTasks) / parseFloat(summary[vip].avgTotalTasks);
    if (Math.abs(vipCompletion - avgCompletion) > 0.2) {
      issues.push({
        type: 'completion_rate_disparity',
        vipLevel: vip,
        severity: vipCompletion > avgCompletion ? 'low' : 'high',
        description: `${vip} completion rate ${(vipCompletion * 100).toFixed(1)}% vs average ${(avgCompletion * 100).toFixed(1)}%`
      });
    }
  });

  return issues;
}