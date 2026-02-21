import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    if (req.method !== 'POST') {
      return Response.json({ error: 'Method not allowed' }, { status: 405 });
    }

    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { userId, mode = 'auto' } = body;

    // If userId provided, assign to specific user, otherwise assign to all eligible users
    const users = userId 
      ? await base44.asServiceRole.entities.AppUser.filter({ id: userId })
      : await base44.asServiceRole.entities.AppUser.filter({ needsReset: false, isFrozen: false });

    const vipTaskTargets = {
      Bronze: 35,
      Silver: 45,
      Gold: 55,
      Platinum: 65,
      Diamond: 75
    };
    
    let assignmentResults = [];

    for (const appUser of users) {
      try {
        const vipLevel = appUser.vipLevel || 'Bronze';
        const tasksPerSet = vipTaskTargets[vipLevel];

        // Check if user needs tasks
        const tasksInCurrentSet = appUser.tasksInCurrentSet || 0;
        const tasksRemaining = tasksPerSet - tasksInCurrentSet;

        if (tasksRemaining <= 0 || appUser.needsReset || appUser.isFrozen) {
          continue;
        }

        // Get existing tasks
        const existingTasks = await base44.asServiceRole.entities.UserTask.filter({ userId: appUser.id });
        const pendingTasks = existingTasks.filter(t => t.status === 'pending');
        
        // If already has pending tasks, skip
        if (pendingTasks.length > 0) {
          continue;
        }

        // Use intelligent product selector
        const currentSetNumber = (appUser.taskSetsCompleted || 0) + 1;
        const tasksToAssign = Math.min(15, tasksRemaining); // Assign up to 15 at a time

        const selectionResult = await base44.asServiceRole.functions.invoke('intelligentProductSelector', {
          vipLevel: vipLevel,
          setNumber: currentSetNumber,
          userId: appUser.id
        });

        if (!selectionResult.data.success) {
          console.error(`Product selection failed for user ${appUser.id}:`, selectionResult.data.error);
          continue;
        }

        const selectedProducts = selectionResult.data.products.slice(0, tasksToAssign);

        // Create tasks
        for (const product of selectedProducts) {
          await base44.asServiceRole.entities.UserTask.create({
            userId: appUser.id,
            productId: product.id,
            commission: product.commission,
            status: 'pending'
          });
        }

        assignmentResults.push({
          userId: appUser.id,
          email: appUser.created_by,
          vipLevel: vipLevel,
          tasksAssigned: selectedProducts.length,
          tasksRemaining: tasksRemaining,
          targetCommission: selectionResult.data.targetRange,
          actualCommission: selectionResult.data.actualCommission
        });

      } catch (error) {
        console.error(`Failed to assign tasks to user ${appUser.id}:`, error);
        assignmentResults.push({
          userId: appUser.id,
          email: appUser.created_by,
          error: error.message
        });
      }
    }

    return Response.json({
      success: true,
      assignedUsers: assignmentResults.filter(r => !r.error).length,
      totalProcessed: assignmentResults.length,
      results: assignmentResults
    });

  } catch (error) {
    console.error('Intelligent task assignment error:', error);
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
});