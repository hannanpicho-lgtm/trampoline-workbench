import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    if (req.method !== 'POST') {
      return Response.json({ error: 'Method not allowed' }, { status: 405 });
    }

    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const body = await req.json();
    const { 
      vipLevel, 
      taskCount = 10, 
      marketTrends = 'general',
      autoAssign = false,
      userId = null,
      includeDifficulty = true
    } = body;

    if (!vipLevel) {
      return Response.json({ error: 'vipLevel is required' }, { status: 400 });
    }

    // VIP level configuration with difficulty mapping
    const vipConfig = {
      "Bronze": { 
        min: 10, max: 100, rate: 0.005, label: "VIP1",
        taskDifficulty: ["easy", "easy", "easy", "medium"],
        complexityLevel: "beginner"
      },
      "Silver": { 
        min: 50, max: 500, rate: 0.01, label: "VIP2",
        taskDifficulty: ["easy", "medium", "medium", "medium"],
        complexityLevel: "intermediate"
      },
      "Gold": { 
        min: 500, max: 3500, rate: 0.015, label: "VIP3",
        taskDifficulty: ["medium", "medium", "medium", "hard"],
        complexityLevel: "advanced"
      },
      "Platinum": { 
        min: 1000, max: 5500, rate: 0.02, label: "VIP4",
        taskDifficulty: ["medium", "hard", "hard", "expert"],
        complexityLevel: "expert"
      },
      "Diamond": { 
        min: 2000, max: 15000, rate: 0.025, label: "VIP5",
        taskDifficulty: ["hard", "hard", "expert", "expert"],
        complexityLevel: "master"
      }
    };

    const config = vipConfig[vipLevel];
    if (!config) {
      return Response.json({ error: 'Invalid VIP level' }, { status: 400 });
    }

    // Get existing products and analyze patterns
    const existingProducts = await base44.asServiceRole.entities.Product.filter(
      { isActive: true }, 
      "-created_date", 
      100
    );
    
    const categories = [...new Set(existingProducts.map(p => p.category))];
    const popularCategories = categories.slice(0, 5);
    
    // Analyze user's task history if userId provided
    let userPreferences = null;
    if (userId) {
      const userTasks = await base44.asServiceRole.entities.UserTask.filter({ userId });
      const completedProducts = await Promise.all(
        userTasks.slice(0, 20).map(t => 
          base44.asServiceRole.entities.Product.get(t.productId).catch(() => null)
        )
      );
      const userCategories = completedProducts
        .filter(p => p)
        .map(p => p.category);
      userPreferences = {
        favoriteCategories: [...new Set(userCategories)].slice(0, 3),
        averagePrice: completedProducts.reduce((sum, p) => sum + (p?.price || 0), 0) / completedProducts.length || 0,
        completionRate: userTasks.filter(t => t.status === 'completed').length / userTasks.length || 1
      };
    }

    // Enhanced AI prompt with difficulty and variations
    const prompt = `You are an intelligent task generator for a ${config.complexityLevel} level VIP ${vipLevel} (${config.label}) user.

TASK REQUIREMENTS:
- VIP Level: ${vipLevel} (${config.label})
- Price Range: $${config.min} - $${config.max}
- Commission Rate: ${(config.rate * 100).toFixed(1)}%
- Tasks to Generate: ${taskCount}
- Market Context: ${marketTrends}
- Complexity: ${config.complexityLevel}

AVAILABLE CATEGORIES: ${categories.join(', ') || 'Electronics, Fashion, Home, Beauty, Sports, Books, Toys, Food, Automotive, Health, Gaming, Fitness, Kitchen, Outdoor'}

${userPreferences ? `
USER PREFERENCES (personalized):
- Favorite Categories: ${userPreferences.favoriteCategories.join(', ')}
- Average Task Price: $${userPreferences.averagePrice.toFixed(2)}
- Success Rate: ${(userPreferences.completionRate * 100).toFixed(0)}%
` : ''}

DIFFICULTY LEVELS TO USE: ${config.taskDifficulty.join(', ')}
- Easy: Simple, straightforward products
- Medium: Standard products with some complexity
- Hard: High-value items requiring more attention
- Expert: Premium bundles and complex products

GENERATE ${taskCount} DIVERSE TASKS:
1. Mix difficulty levels based on VIP tier
2. Ensure price variation within the range
3. Include 1-2 PREMIUM products (10x commission, bundled items)
4. Vary categories to keep tasks interesting
5. Consider market trends: ${marketTrends}
6. Create task variations (different brands, models, styles)
${userPreferences ? '7. Prioritize user\'s favorite categories when relevant' : ''}

For each task, provide:
- name: Specific, realistic product name with variation (e.g., brand, model, color)
- price: Realistic price within VIP range
- category: Product category
- difficulty: One of [easy, medium, hard, expert]
- isPremium: true for bundled high-value products (max 2)
- bundleItems: For premium products, list 2-3 specific items
- taskVariation: Brief note on what makes this variation unique
- estimatedTimeMinutes: Estimated completion time (5-30 mins)
- description: Why this task suits the VIP level and user

Create engaging, realistic products that match the user's progression level.`;

    const aiResponse = await base44.integrations.Core.InvokeLLM({
      prompt: prompt,
      response_json_schema: {
        type: "object",
        properties: {
          products: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                price: { type: "number" },
                category: { type: "string" },
                difficulty: { 
                  type: "string",
                  enum: ["easy", "medium", "hard", "expert"]
                },
                isPremium: { type: "boolean" },
                bundleItems: { 
                  type: "array",
                  items: { type: "string" }
                },
                taskVariation: { type: "string" },
                estimatedTimeMinutes: { type: "number" },
                description: { type: "string" }
              },
              required: ["name", "price", "category", "difficulty", "isPremium"]
            }
          },
          summary: {
            type: "object",
            properties: {
              easyCount: { type: "number" },
              mediumCount: { type: "number" },
              hardCount: { type: "number" },
              expertCount: { type: "number" },
              premiumCount: { type: "number" },
              categoryDistribution: { type: "object" }
            }
          }
        },
        required: ["products"]
      }
    });

    // Process generated products
    const generatedProducts = aiResponse.products.map(product => ({
      name: product.name,
      price: product.price,
      commission: product.isPremium ? product.price * config.rate * 10 : product.price * config.rate,
      category: product.category,
      isPremium: product.isPremium || false,
      bundleItems: product.bundleItems || [],
      imageUrl: "",
      isActive: false, // Inactive until admin approves
      metadata: {
        aiGenerated: true,
        generatedAt: new Date().toISOString(),
        vipLevel: vipLevel,
        difficulty: product.difficulty,
        taskVariation: product.taskVariation,
        estimatedTimeMinutes: product.estimatedTimeMinutes || 10,
        description: product.description,
        marketTrends: marketTrends,
        userPersonalized: !!userPreferences
      }
    }));

    // Auto-assign if requested
    let assignmentResult = null;
    if (autoAssign && userId) {
      try {
        const appUser = await base44.asServiceRole.entities.AppUser.get(userId);
        
        // Create products first
        const createdProducts = [];
        for (const product of generatedProducts) {
          const created = await base44.asServiceRole.entities.Product.create({
            ...product,
            isActive: true
          });
          createdProducts.push(created);
        }

        // Create task offers
        const taskOffers = [];
        for (const product of createdProducts) {
          const offer = await base44.asServiceRole.entities.TaskOffer.create({
            userId: appUser.id,
            productId: product.id,
            status: "pending",
            vipLevel: vipLevel,
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
          });
          taskOffers.push(offer);
        }

        assignmentResult = {
          assigned: true,
          productsCreated: createdProducts.length,
          taskOffersCreated: taskOffers.length
        };
      } catch (error) {
        console.error('Auto-assign error:', error);
        assignmentResult = {
          assigned: false,
          error: error.message
        };
      }
    }

    return Response.json({
      success: true,
      vipLevel: vipLevel,
      taskCount: generatedProducts.length,
      products: generatedProducts,
      summary: {
        ...aiResponse.summary,
        totalTasks: generatedProducts.length,
        averagePrice: generatedProducts.reduce((sum, p) => sum + p.price, 0) / generatedProducts.length,
        totalCommission: generatedProducts.reduce((sum, p) => sum + p.commission, 0),
        personalized: !!userPreferences
      },
      assignment: assignmentResult,
      message: `Generated ${generatedProducts.length} intelligent AI tasks for ${vipLevel} with difficulty variations`
    });

  } catch (error) {
    console.error('AI Task Generator error:', error);
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
});