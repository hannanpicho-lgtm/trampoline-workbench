import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    if (req.method !== 'POST') {
      return Response.json({ error: 'Method not allowed' }, { status: 405 });
    }

    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { userId, type, title, message, priority = 'medium', relatedId, relatedType, actionUrl } = body;

    if (!userId || !type || !title || !message) {
      return Response.json(
        { error: 'Missing required fields: userId, type, title, message' },
        { status: 400 }
      );
    }

    const notification = await base44.asServiceRole.entities.Notification.create({
      userId,
      type,
      title,
      message,
      priority,
      relatedId,
      relatedType,
      actionUrl,
      read: false
    });

    return Response.json({
      success: true,
      notification
    });
  } catch (error) {
    console.error('Notification creation error:', error);
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
});