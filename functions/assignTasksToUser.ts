import { getBase44Client } from './_shared/base44Client.ts';

Deno.serve(async (req) => {
  try {
    const base44 = getBase44Client(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId } = await req.json();

    // Get app user data
    const appUsers = await base44.entities.AppUser.filter({ id: userId });
    if (!appUsers.length) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    const appUser = appUsers[0];
    const vipLevel = appUser.vipLevel || 'Bronze';

    // Get VIP configuration
    const vipConfig = {
      Bronze: { dailyLimit: 3, capacity: 10, preferredDifficulty: ['easy', 'medium'] },
      Silver: { dailyLimit: 5, capacity: 15, preferredDifficulty: ['easy', 'medium', 'hard'] },
      Gold: { dailyLimit: 8, capacity: 20, preferredDifficulty: ['medium', 'hard', 'expert'] },
      Platinum: { dailyLimit: 10, capacity: 25, preferredDifficulty: ['hard', 'expert'] },
      Diamond: { dailyLimit: 15, capacity: 30, preferredDifficulty: ['expert'] }
    };

    const config = vipConfig[vipLevel] || vipConfig.Bronze;

    // Check current task count
    const activeTasks = await base44.entities.TaskAssignment.filter({
      userId,
      status: { $in: ['assigned', 'in_progress', 'submitted'] }
    });

    if (activeTasks.length >= config.capacity) {
      return Response.json({
        success: false,
        message: 'User has reached task capacity',
        currentTasks: activeTasks.length,
        capacity: config.capacity
      });
    }

    // Get available task types matching VIP level
    const taskTypes = await base44.entities.TaskType.filter({
      isActive: true,
      difficulty: { $in: config.preferredDifficulty }
    });

    if (!taskTypes.length) {
      return Response.json({
        success: false,
        message: 'No available tasks for this VIP level'
      });
    }

    // Get available products
    const products = await base44.entities.Product.filter({ isActive: true });

    // Select task
    const randomTaskType = taskTypes[Math.floor(Math.random() * taskTypes.length)];
    const randomProduct = products[Math.floor(Math.random() * products.length)];

    if (!randomProduct) {
      return Response.json({
        success: false,
        message: 'No available products'
      });
    }

    // Create task offer
    const dueAt = new Date(Date.now() + randomTaskType.timeLimit * 60 * 60 * 1000).toISOString();

    const taskOffer = await base44.entities.TaskOffer.create({
      userId,
      productId: randomProduct.id,
      status: 'pending',
      expiresAt: dueAt,
      vipLevel
    });

    // Create task assignment
    const taskAssignment = await base44.entities.TaskAssignment.create({
      userId,
      taskOfferId: taskOffer.id,
      productId: randomProduct.id,
      taskTypeId: randomTaskType.id,
      assignmentType: 'automatic',
      assignedAt: new Date().toISOString(),
      dueAt,
      status: 'assigned',
      userVIPLevel: vipLevel,
      baseCommission: randomTaskType.baseCommission
    });

    return Response.json({
      success: true,
      taskAssignment,
      taskOffer,
      message: `Task assigned successfully`
    });

  } catch (error) {
    console.error('Error assigning task:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});