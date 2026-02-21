import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { userId, limit = 5 } = await req.json();

    // Get user data
    const appUsers = await base44.asServiceRole.entities.AppUser.filter({ id: userId });
    if (appUsers.length === 0) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }
    const appUser = appUsers[0];

    // Get user's task history
    const userTasks = await base44.asServiceRole.entities.UserTask.filter(
      { userId },
      '-created_date',
      50
    );

    // Get user preferences
    const prefs = await base44.asServiceRole.entities.TaskAutomationPreference.filter({ userId });
    const userPrefs = prefs.length > 0 ? prefs[0] : null;

    // Get available products
    const allProducts = await base44.asServiceRole.entities.Product.filter({ isActive: true });
    
    // Filter out already completed products
    const completedProductIds = userTasks
      .filter(t => t.status === 'completed' || t.status === 'approved')
      .map(t => t.productId);
    
    const availableProducts = allProducts.filter(p => !completedProductIds.includes(p.id));

    if (availableProducts.length === 0) {
      return Response.json({ 
        success: true, 
        recommendations: [],
        reason: 'No available products'
      });
    }

    // Calculate user performance metrics
    const completedTasks = userTasks.filter(t => t.status === 'approved' || t.status === 'completed');
    const avgCommission = completedTasks.length > 0
      ? completedTasks.reduce((sum, t) => sum + (t.commission || 0), 0) / completedTasks.length
      : 0;
    
    const successRate = userTasks.length > 0
      ? (completedTasks.length / userTasks.length) * 100
      : 100;

    // Build context for AI
    const context = {
      user: {
        vipLevel: appUser.vipLevel,
        tasksCompleted: appUser.tasksCompleted || 0,
        balance: appUser.balance || 0,
        successRate: successRate.toFixed(1),
        avgCommission: avgCommission.toFixed(2),
        creditScore: appUser.creditScore || 100
      },
      history: {
        totalTasks: userTasks.length,
        completedTasks: completedTasks.length,
        recentCategories: [...new Set(
          completedTasks.slice(0, 10).map(t => {
            const product = allProducts.find(p => p.id === t.productId);
            return product?.category || 'Unknown';
          })
        )],
        avgTaskValue: avgCommission
      },
      preferences: userPrefs ? {
        prioritizeHighCommission: userPrefs.prioritizeHighCommission || false,
        excludePremium: userPrefs.autoCompleteRules?.excludePremium || false,
        minCommission: userPrefs.autoCompleteRules?.minCommission,
        maxCommission: userPrefs.autoCompleteRules?.maxCommission
      } : null,
      availableProducts: availableProducts.map(p => ({
        id: p.id,
        name: p.name,
        category: p.category,
        price: p.price,
        commission: p.commission
      }))
    };

    // Use AI to analyze and recommend tasks
    const aiResponse = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `You are a task recommendation AI. Analyze the user's profile and recommend the ${limit} most suitable tasks.

User Profile:
${JSON.stringify(context.user, null, 2)}

Task History:
${JSON.stringify(context.history, null, 2)}

User Preferences:
${JSON.stringify(context.preferences, null, 2)}

Available Products (${availableProducts.length} total):
${JSON.stringify(context.availableProducts.slice(0, 20), null, 2)}

Based on:
1. User's VIP level and performance history
2. Commission patterns and success rate
3. Recent task categories they've completed
4. User preferences and settings
5. Risk vs. reward balance

Recommend the ${limit} best tasks. For each recommendation, provide:
- productId (from available products)
- score (0-100)
- reasoning (why this task suits the user)
- riskLevel (low/medium/high)
- expectedSuccess (percentage)

Return valid JSON only.`,
      response_json_schema: {
        type: "object",
        properties: {
          recommendations: {
            type: "array",
            items: {
              type: "object",
              properties: {
                productId: { type: "string" },
                score: { type: "number" },
                reasoning: { type: "string" },
                riskLevel: { type: "string" },
                expectedSuccess: { type: "number" }
              }
            }
          }
        }
      }
    });

    // Enrich recommendations with product details
    const enrichedRecommendations = aiResponse.recommendations.map(rec => {
      const product = availableProducts.find(p => p.id === rec.productId);
      return {
        ...rec,
        product: product || null
      };
    }).filter(rec => rec.product !== null);

    return Response.json({
      success: true,
      recommendations: enrichedRecommendations,
      userContext: {
        vipLevel: appUser.vipLevel,
        successRate: successRate.toFixed(1),
        avgCommission: avgCommission.toFixed(2)
      }
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});