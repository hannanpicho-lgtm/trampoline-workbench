import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Get all users who need task assignments
    const allUsers = await base44.asServiceRole.entities.AppUser.list();
    
    // Filter users who can receive new tasks
    const eligibleUsers = allUsers.filter(user => 
      !user.needsReset && 
      user.tasksInCurrentSet < 40 && 
      user.taskSetsCompleted < 2
    );

    if (eligibleUsers.length === 0) {
      return Response.json({ 
        success: true, 
        message: "No eligible users found",
        assigned: 0 
      });
    }

    // Get active products
    const products = await base44.asServiceRole.entities.Product.filter({ isActive: true });
    
    if (products.length === 0) {
      return Response.json({ 
        success: false, 
        message: "No active products available" 
      });
    }

    // VIP level task ranges
    const vipTaskRanges = {
      Bronze: { min: 0, max: 100 },
      Silver: { min: 50, max: 250 },
      Gold: { min: 150, max: 500 },
      Platinum: { min: 300, max: 1000 },
      Diamond: { min: 500, max: 10000 }
    };

    let totalAssigned = 0;

    // Assign tasks to each eligible user
    for (const user of eligibleUsers) {
      try {
        // Get user's existing tasks
        const userTasks = await base44.asServiceRole.entities.UserTask.filter({ userId: user.id });
        const pendingOffers = await base44.asServiceRole.entities.TaskOffer.filter({ 
          userId: user.id, 
          status: "pending" 
        });

        // Skip if user already has pending offers
        if (pendingOffers.length > 0) continue;

        // Filter products by VIP level and not already done
        const range = vipTaskRanges[user.vipLevel || 'Bronze'];
        const availableProducts = products.filter(p => {
          const alreadyDone = userTasks.some(t => 
            t.productId === p.id && 
            (t.status === "completed" || t.status === "approved")
          );
          const isPending = userTasks.some(t => 
            t.productId === p.id && 
            t.status === "pending"
          );
          return !alreadyDone && !isPending && p.price >= range.min && p.price <= range.max;
        });

        if (availableProducts.length === 0) continue;

        // Select 3-5 random products for the user
        const numToAssign = Math.min(
          Math.floor(Math.random() * 3) + 3, // 3-5 products
          availableProducts.length,
          40 - user.tasksInCurrentSet // Don't exceed set limit
        );

        const shuffled = [...availableProducts].sort(() => Math.random() - 0.5);
        const selectedProducts = shuffled.slice(0, numToAssign);

        // Create task offers for each product
        for (const product of selectedProducts) {
          const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours

          await base44.asServiceRole.entities.TaskOffer.create({
            userId: user.id,
            productId: product.id,
            status: "pending",
            expiresAt: expiresAt,
            vipLevel: user.vipLevel || 'Bronze',
            isPremiumOrder: false
          });

          totalAssigned++;
        }
      } catch (error) {
        console.error(`Failed to assign tasks to user ${user.id}:`, error);
      }
    }

    return Response.json({ 
      success: true, 
      message: `Successfully assigned ${totalAssigned} tasks to ${eligibleUsers.length} users`,
      usersProcessed: eligibleUsers.length,
      tasksAssigned: totalAssigned
    });

  } catch (error) {
    console.error("Auto-assign tasks error:", error);
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
});