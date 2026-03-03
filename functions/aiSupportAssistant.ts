import { getBase44Client } from './_shared/base44Client.ts';

Deno.serve(async (req) => {
  try {
    const base44 = getBase44Client(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { message, userId, conversationHistory } = await req.json();

    // Build context from conversation history
    const context = conversationHistory?.slice(-5).map(msg => 
      `${msg.isFromUser ? 'User' : 'Agent'}: ${msg.message}`
    ).join('\n') || '';

    // Common questions knowledge base
    const knowledgeBase = `
You are a helpful customer support AI assistant for a task completion platform. Answer user questions based on this information:

TASK SYSTEM:
- Users complete tasks in sets (Set 1 and Set 2)
- Each set has 30-40 tasks depending on VIP level
- After completing a set, users need customer service to unlock the next set
- Tasks earn commission based on product value
- Premium products offer 10x commission but freeze the account until customer service unfreezes it

VIP LEVELS:
- Bronze (VIP1): 30 tasks per set, requires $100+ balance
- Silver (VIP2): 35 tasks per set, requires $500-$3,499 balance
- Gold (VIP3): 40 tasks per set, requires $3,500-$5,499 balance
- Platinum (VIP4): 40 tasks per set, requires $5,500-$9,999 balance
- Diamond (VIP5): 40 tasks per set, requires $10,000+ balance

DEPOSITS & WITHDRAWALS:
- Deposits receive bonuses: 5% on $50+, 10% on $200+, 15% on $500+
- Withdrawals require transaction password
- Users must complete both task sets before requesting withdrawal

ACCOUNT ISSUES:
- Frozen accounts: Caused by premium product submission, contact support to unfreeze
- Need reset: Required after completing a task set, contact support
- Balance requirements: Must maintain minimum balance for VIP level to submit tasks

WORKING HOURS:
- Platform operates 9:00 AM to 11:00 PM Eastern Time (ET)

If the user's question is complex or requires account-specific actions, suggest they speak with a human agent.
`;

    const response = await base44.integrations.Core.InvokeLLM({
      prompt: `${knowledgeBase}\n\nConversation history:\n${context}\n\nUser question: ${message}\n\nProvide a helpful, concise answer. If this requires account changes or is too complex, suggest the user escalate to a human agent. Keep responses under 150 words.`,
      response_json_schema: {
        type: "object",
        properties: {
          answer: { type: "string" },
          needsHumanAgent: { type: "boolean" },
          suggestedActions: { type: "array", items: { type: "string" } }
        }
      }
    });

    return Response.json({
      success: true,
      aiResponse: response.answer,
      needsHumanAgent: response.needsHumanAgent || false,
      suggestedActions: response.suggestedActions || []
    });

  } catch (error) {
    return Response.json({ 
      error: error.message,
      success: false 
    }, { status: 500 });
  }
});