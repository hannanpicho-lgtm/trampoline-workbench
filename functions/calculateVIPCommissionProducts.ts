import { getBase44Client } from './_shared/base44Client.ts';

const VIP_COMMISSION_RATES = {
  "Bronze": 0.005,   // 0.5%
  "Silver": 0.01,    // 1.0%
  "Gold": 0.015,     // 1.5%
  "Platinum": 0.02,  // 2.0%
  "Diamond": 0.025   // 2.5%
};

const TASKS_PER_VIP = {
  "Bronze": 70,   // 35 per set * 2 sets
  "Silver": 90,   // 45 per set * 2 sets
  "Gold": 110,    // 55 per set * 2 sets
  "Platinum": 130, // 65 per set * 2 sets
  "Diamond": 150  // 75 per set * 2 sets
};

Deno.serve(async (req) => {
  try {
    const base44 = getBase44Client(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await req.json();
    const { vipLevel, targetCommission } = body;

    if (!vipLevel || !targetCommission) {
      return Response.json({ 
        error: 'vipLevel and targetCommission required' 
      }, { status: 400 });
    }

    // Get commission rate and total tasks for VIP level
    const commissionRate = VIP_COMMISSION_RATES[vipLevel];
    const totalTasks = TASKS_PER_VIP[vipLevel];

    // Get available products
    const allProducts = await base44.asServiceRole.entities.Product.filter({ 
      isActive: true,
      isPremium: false 
    });

    if (allProducts.length === 0) {
      return Response.json({ 
        error: 'No products available' 
      }, { status: 400 });
    }

    // Calculate required product prices to hit target commission
    // Commission = Product Price * Commission Rate
    // So: Product Price = Commission / Commission Rate
    const averageCommissionPerTask = targetCommission / totalTasks;
    const targetProductPrice = averageCommissionPerTask / commissionRate;

    // Find products close to target price
    const sortedProducts = allProducts
      .map(p => ({
        ...p,
        priceDiff: Math.abs(p.price - targetProductPrice),
        commission: p.price * commissionRate
      }))
      .sort((a, b) => a.priceDiff - b.priceDiff);

    // Select products that when combined hit target commission
    const selectedProducts = [];
    let totalCommissionSoFar = 0;
    let tasksAssigned = 0;

    // Use a mix of products around target price
    while (tasksAssigned < totalTasks && sortedProducts.length > 0) {
      const remainingTasks = totalTasks - tasksAssigned;
      const remainingCommission = targetCommission - totalCommissionSoFar;
      const neededCommissionPerTask = remainingCommission / remainingTasks;

      // Find best matching product
      const bestProduct = sortedProducts.find(p => {
        const productCommission = p.price * commissionRate;
        return Math.abs(productCommission - neededCommissionPerTask) < neededCommissionPerTask * 0.5;
      }) || sortedProducts[0];

      selectedProducts.push(bestProduct);
      totalCommissionSoFar += bestProduct.price * commissionRate;
      tasksAssigned++;
    }

    // Calculate actual commission achieved
    const actualCommission = selectedProducts.reduce((sum, p) => 
      sum + (p.price * commissionRate), 0
    );

    return Response.json({
      success: true,
      vipLevel,
      targetCommission,
      actualCommission,
      difference: actualCommission - targetCommission,
      totalTasks,
      commissionRate,
      averageProductPrice: selectedProducts.reduce((sum, p) => sum + p.price, 0) / selectedProducts.length,
      productDistribution: {
        count: selectedProducts.length,
        minPrice: Math.min(...selectedProducts.map(p => p.price)),
        maxPrice: Math.max(...selectedProducts.map(p => p.price)),
        avgPrice: selectedProducts.reduce((sum, p) => sum + p.price, 0) / selectedProducts.length
      },
      recommendation: actualCommission >= targetCommission ? 
        'Commission target achieved' : 
        'Need higher-priced products or more tasks'
    });

  } catch (error) {
    console.error('Commission calculation error:', error);
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});