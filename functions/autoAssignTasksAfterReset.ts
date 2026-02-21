import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId } = await req.json();

    // Get user details
    const appUsers = await base44.asServiceRole.entities.AppUser.filter({ id: userId });
    if (appUsers.length === 0) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    const appUser = appUsers[0];
    const vipLevel = appUser.vipLevel || "Bronze";

    // Determine tasks per set based on VIP level
    const tasksPerSet = {
      "Bronze": 30,
      "Silver": 35,
      "Gold": 40,
      "Platinum": 40,
      "Diamond": 40
    }[vipLevel];

    // Get all active products
    const allProducts = await base44.asServiceRole.entities.Product.filter({ isActive: true });
    
    if (allProducts.length < tasksPerSet) {
      return Response.json({ 
        error: 'Not enough products', 
        details: `Need ${tasksPerSet} products, found ${allProducts.length}` 
      }, { status: 400 });
    }

    // Get completed tasks to avoid duplicates in same set
    const existingTasks = await base44.asServiceRole.entities.UserTask.filter({ userId });
    const completedProductIds = existingTasks
      .filter(t => t.status === "completed" || t.status === "approved")
      .map(t => t.productId);

    // Select products that haven't been completed yet, or recycle if needed
    let selectedProducts = allProducts.filter(p => !completedProductIds.includes(p.id));
    
    // If not enough unique products, recycle completed ones
    if (selectedProducts.length < tasksPerSet) {
      selectedProducts = [...selectedProducts, ...allProducts.filter(p => completedProductIds.includes(p.id))];
    }

    // Shuffle and select required number
    selectedProducts = selectedProducts
      .sort(() => Math.random() - 0.5)
      .slice(0, tasksPerSet);

    // Create pending tasks
    const createdTasks = [];
    for (const product of selectedProducts) {
      const task = await base44.asServiceRole.entities.UserTask.create({
        userId,
        productId: product.id,
        commission: product.commission,
        status: "pending",
        submittedAt: null
      });
      createdTasks.push(task);
    }

    return Response.json({
      success: true,
      tasksCreated: createdTasks.length,
      vipLevel,
      message: `Assigned ${createdTasks.length} tasks to ${appUser.created_by}`
    });

  } catch (error) {
    return Response.json({ 
      error: error.message,
      success: false 
    }, { status: 500 });
  }
});