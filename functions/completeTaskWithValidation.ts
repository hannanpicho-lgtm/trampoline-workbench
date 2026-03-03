import { getBase44Client } from './_shared/base44Client.ts';

Deno.serve(async (req) => {
  try {
    const base44 = getBase44Client(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { taskAssignmentId, taskId, commission } = await req.json();

    if (!taskAssignmentId || !taskId || !commission) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get task assignment
    const assignments = await base44.entities.TaskAssignment.filter({ id: taskAssignmentId });
    if (!assignments.length) {
      return Response.json({ error: 'Task assignment not found' }, { status: 404 });
    }

    const assignment = assignments[0];

    // Verify task belongs to this assignment's user
    const userTasks = await base44.entities.UserTask.filter({ id: taskId, userId: assignment.userId });
    if (!userTasks.length) {
      return Response.json({ error: 'Task does not belong to this assignment' }, { status: 400 });
    }

    // Get app user
    const appUsers = await base44.entities.AppUser.filter({ id: assignment.userId });
    if (!appUsers.length) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    const appUser = appUsers[0];
    let creditScoreChange = 0;

    // Update assignment status
    await base44.entities.TaskAssignment.update(taskAssignmentId, {
      status: 'submitted',
      completedAt: new Date().toISOString(),
      actualCommission: commission
    });

    // Update user task
    await base44.entities.UserTask.update(taskId, {
      status: 'completed',
      submittedAt: new Date().toISOString()
    });

    // Update user balance
    const newBalance = (appUser.balance || 0) + commission;
    const newTasksCompleted = (appUser.tasksCompleted || 0) + 1;
    const newTasksInSet = (appUser.tasksInCurrentSet || 0) + 1;

    // Credit score: increase on completion
    creditScoreChange = Math.min(2, 100 - appUser.creditScore); // Max increase to reach 100
    const newCreditScore = Math.min(100, (appUser.creditScore || 100) + creditScoreChange);

    // Check if user completed a set (40 tasks)
    const needsReset = newTasksInSet >= 40;

    await base44.entities.AppUser.update(assignment.userId, {
      balance: newBalance,
      tasksCompleted: newTasksCompleted,
      tasksInCurrentSet: needsReset ? 0 : newTasksInSet,
      needsReset: needsReset,
      taskSetsCompleted: needsReset ? (appUser.taskSetsCompleted || 0) + 1 : appUser.taskSetsCompleted,
      creditScore: newCreditScore
    });

    // Create transaction record
    await base44.entities.Transaction.create({
      userId: assignment.userId,
      type: 'completion',
      amount: commission,
      status: 'completed',
      balanceBefore: appUser.balance || 0,
      balanceAfter: newBalance,
      metadata: {
        taskAssignmentId,
        taskType: 'completion'
      }
    });

    // Handle training account profit sharing
    let trainingProfitShare = null;
    if (appUser.isTrainingAccount && appUser.accountType === 'training' && appUser.referredBy) {
      try {
        // Invoke the profit share function
        const profitShareResponse = await base44.functions.invoke('processTrainingProfitShare', {
          trainingAccountId: assignment.userId,
          taskEarnings: commission
        });
        
        if (profitShareResponse?.success) {
          trainingProfitShare = {
            referrerId: appUser.referredBy,
            profitShare: profitShareResponse.profitShare,
            referrerNewBalance: profitShareResponse.newReferrerBalance
          };
        }
      } catch (error) {
        console.error('Error processing training account profit share:', error);
        // Don't fail the task completion, just log the error
      }
    }

    return Response.json({
      success: true,
      newBalance,
      newCreditScore,
      creditScoreChange,
      needsReset,
      trainingProfitShare,
      message: 'Task completed successfully'
    });

  } catch (error) {
    console.error('Error completing task:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});