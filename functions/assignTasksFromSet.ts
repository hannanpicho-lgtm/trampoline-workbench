import { getBase44Client } from './_shared/base44Client.ts';

Deno.serve(async (req) => {
  try {
    const base44 = getBase44Client(req);
    
    // Authenticate user
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { userId, vipLevel } = await req.json();

    if (!userId || !vipLevel) {
      return Response.json({ 
        error: 'Missing required parameters: userId and vipLevel' 
      }, { status: 400 });
    }

    // Get active task sets for this VIP level (highest priority first)
    const taskSets = await base44.asServiceRole.entities.TaskSet.filter(
      { vipLevel, isActive: true },
      '-priority'
    );

    if (taskSets.length === 0) {
      return Response.json({ 
        success: false, 
        message: `No active task sets found for VIP level: ${vipLevel}` 
      });
    }

    // Use the highest priority task set
    const taskSet = taskSets[0];
    
    // Get user's existing tasks
    const userTasks = await base44.asServiceRole.entities.UserTask.filter({ userId });
    const completedProductIds = userTasks
      .filter(t => t.status === 'completed' || t.status === 'approved')
      .map(t => t.productId);

    // Filter available products from the task set
    const availableProductIds = taskSet.productIds.filter(
      id => !completedProductIds.includes(id)
    );

    if (availableProductIds.length === 0) {
      return Response.json({ 
        success: false, 
        message: 'No available products in task set' 
      });
    }

    // Determine how many tasks to assign
    const tasksToAssign = Math.min(
      Math.max(taskSet.minTasks, availableProductIds.length),
      taskSet.maxTasks
    );

    // Randomly select products
    const shuffled = availableProductIds.sort(() => Math.random() - 0.5);
    const selectedProductIds = shuffled.slice(0, tasksToAssign);

    // Get full product details
    const products = await base44.asServiceRole.entities.Product.list();
    const productMap = Object.fromEntries(products.map(p => [p.id, p]));

    // Create task offers
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const offers = [];

    for (const productId of selectedProductIds) {
      const product = productMap[productId];
      if (!product) continue;

      const offer = await base44.asServiceRole.entities.TaskOffer.create({
        userId,
        productId,
        status: 'pending',
        expiresAt,
        vipLevel
      });
      offers.push(offer);
    }

    return Response.json({
      success: true,
      taskSetName: taskSet.name,
      tasksAssigned: offers.length,
      vipLevel,
      message: `Assigned ${offers.length} tasks from "${taskSet.name}"`
    });

  } catch (error) {
    console.error('Task assignment error:', error);
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});