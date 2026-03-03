import { getBase44Client } from './_shared/base44Client.ts';

const VIP_COMMISSION_RATES = {
  "Bronze": 0.005,   // 0.5%
  "Silver": 0.01,    // 1.0%
  "Gold": 0.015,     // 1.5%
  "Platinum": 0.02,  // 2.0%
  "Diamond": 0.025   // 2.5%
};

const TASKS_PER_SET = {
  "Bronze": 35,
  "Silver": 45,
  "Gold": 55,
  "Platinum": 65,
  "Diamond": 75
};

Deno.serve(async (req) => {
  try {
    const base44 = getBase44Client(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await req.json();
    const { vipLevel, setNumber = 1, userId = null } = body;

    if (!vipLevel) {
      return Response.json({ error: 'vipLevel required' }, { status: 400 });
    }

    // Get commission range from settings
    const settings = await base44.asServiceRole.entities.AppSettings.list();
    const minSetting = settings.find(s => s.settingKey === `vip_commission_min_${vipLevel}`);
    const maxSetting = settings.find(s => s.settingKey === `vip_commission_max_${vipLevel}`);

    let targetMin, targetMax;
    if (minSetting && maxSetting) {
      targetMin = parseFloat(minSetting.settingValue) / 2; // Divide by 2 for per-set target
      targetMax = parseFloat(maxSetting.settingValue) / 2;
    } else {
      // Defaults
      const defaults = {
        "Bronze": { min: 70, max: 80 },
        "Silver": { min: 125, max: 150 },
        "Gold": { min: 225, max: 275 },
        "Platinum": { min: 400, max: 500 },
        "Diamond": { min: 750, max: 1000 }
      };
      targetMin = defaults[vipLevel].min;
      targetMax = defaults[vipLevel].max;
    }

    const targetCommission = (targetMin + targetMax) / 2; // Aim for middle of range
    const tasksNeeded = TASKS_PER_SET[vipLevel];
    const commissionRate = VIP_COMMISSION_RATES[vipLevel];

    // Get all active products
    const allProducts = await base44.asServiceRole.entities.Product.filter({ isActive: true });

    // Filter by VIP level price range
    const priceRanges = {
      "Bronze": { min: 10, max: 100 },
      "Silver": { min: 50, max: 500 },
      "Gold": { min: 500, max: 3500 },
      "Platinum": { min: 1000, max: 5500 },
      "Diamond": { min: 2000, max: 15000 }
    };
    const range = priceRanges[vipLevel];

    // Filter products by price range and premium status (Set 1 = no premium)
    let availableProducts = allProducts.filter(p => 
      p.price >= range.min && p.price <= range.max
    );

    if (setNumber === 1) {
      availableProducts = availableProducts.filter(p => !p.isPremium);
    }

    // If userId provided, exclude already completed products
    if (userId) {
      const completedTasks = await base44.asServiceRole.entities.UserTask.filter({ 
        userId,
        status: ['completed', 'approved']
      });
      const completedProductIds = completedTasks.map(t => t.productId);
      availableProducts = availableProducts.filter(p => !completedProductIds.includes(p.id));
    }

    if (availableProducts.length < tasksNeeded) {
      return Response.json({ 
        error: `Insufficient products. Need ${tasksNeeded}, have ${availableProducts.length}` 
      }, { status: 400 });
    }

    // INTELLIGENT SELECTION ALGORITHM
    // Calculate ideal product price to hit target commission
    const idealProductPrice = targetCommission / (tasksNeeded * commissionRate);

    // Score products by how close they are to ideal price
    const scoredProducts = availableProducts.map(p => {
      const commission = p.price * commissionRate;
      const priceDiff = Math.abs(p.price - idealProductPrice);
      const score = 1 / (1 + priceDiff / idealProductPrice); // Higher score = closer to ideal
      
      return { ...p, commission, score };
    });

    // Sort by score and use greedy algorithm to hit target
    scoredProducts.sort((a, b) => b.score - a.score);

    let selectedProducts = [];
    let totalCommission = 0;
    let attempts = 0;
    const maxAttempts = 100;

    // Try to find best combination
    while (attempts < maxAttempts) {
      const shuffled = [...scoredProducts].sort(() => Math.random() - 0.5);
      const candidates = shuffled.slice(0, tasksNeeded);
      const candidateCommission = candidates.reduce((sum, p) => sum + p.commission, 0);

      // Check if within range
      if (candidateCommission >= targetMin && candidateCommission <= targetMax) {
        selectedProducts = candidates;
        totalCommission = candidateCommission;
        break;
      }

      // If this is better than current best, keep it
      if (candidateCommission >= targetMin && candidateCommission <= targetMax) {
        selectedProducts = candidates;
        totalCommission = candidateCommission;
      } else if (selectedProducts.length === 0) {
        // Keep first attempt as fallback
        selectedProducts = candidates;
        totalCommission = candidateCommission;
      }

      attempts++;
    }

    // If still empty or way off, use top-scored products
    if (selectedProducts.length === 0) {
      selectedProducts = scoredProducts.slice(0, tasksNeeded);
      totalCommission = selectedProducts.reduce((sum, p) => sum + p.commission, 0);
    }

    return Response.json({
      success: true,
      vipLevel,
      setNumber,
      targetRange: { min: targetMin, max: targetMax },
      actualCommission: totalCommission,
      withinRange: totalCommission >= targetMin && totalCommission <= targetMax,
      variance: ((totalCommission - targetCommission) / targetCommission * 100).toFixed(2) + '%',
      products: selectedProducts.map(p => ({
        id: p.id,
        name: p.name,
        price: p.price,
        commission: p.commission,
        category: p.category,
        isPremium: p.isPremium
      })),
      statistics: {
        totalProducts: selectedProducts.length,
        totalCommission: totalCommission.toFixed(2),
        avgProductPrice: (selectedProducts.reduce((sum, p) => sum + p.price, 0) / selectedProducts.length).toFixed(2),
        minProductPrice: Math.min(...selectedProducts.map(p => p.price)),
        maxProductPrice: Math.max(...selectedProducts.map(p => p.price)),
        premiumCount: selectedProducts.filter(p => p.isPremium).length
      }
    });

  } catch (error) {
    console.error('Intelligent product selection error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});