import { getBase44Client } from './_shared/base44Client.ts';

/**
 * Sends notifications for task-related events
 * - Task approval/rejection
 * - New task availability
 * Call from automations or other backend functions
 */
Deno.serve(async (req) => {
  try {
    const base44 = getBase44Client(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { userId, eventType, taskName, status, approvalReason } = body;

    if (!userId || !eventType) {
      return Response.json({ error: 'Missing userId or eventType' }, { status: 400 });
    }

    // Check user notification preferences
    const prefs = await base44.asServiceRole.entities.NotificationPreference.filter({ userId });
    const userPrefs = prefs.length > 0 ? prefs[0] : null;

    // Determine if user wants this notification
    let shouldNotify = true;
    let notificationConfig = {};

    switch (eventType) {
      case 'task_approved':
        shouldNotify = userPrefs?.taskApprovalRejection !== false;
        notificationConfig = {
          type: 'task_approved',
          title: '✅ Task Approved!',
          message: `Your task "${taskName}" has been approved`,
          priority: 'high'
        };
        break;

      case 'task_rejected':
        shouldNotify = userPrefs?.taskApprovalRejection !== false;
        notificationConfig = {
          type: 'task_approved',
          title: '❌ Task Rejected',
          message: `Your task "${taskName}" was rejected: ${approvalReason || 'See details for more info'}`,
          priority: 'medium'
        };
        break;

      case 'task_available':
        shouldNotify = userPrefs?.taskAvailable !== false;
        notificationConfig = {
          type: 'task_available',
          title: '📋 New Task Available',
          message: `A new task "${taskName}" is available for you`,
          priority: 'medium'
        };
        break;

      default:
        return Response.json({ error: 'Unknown eventType' }, { status: 400 });
    }

    if (!shouldNotify) {
      return Response.json({ success: true, message: 'User opted out of notifications' });
    }

    // Create notification
    const notification = await base44.asServiceRole.entities.Notification.create({
      userId,
      type: notificationConfig.type,
      title: notificationConfig.title,
      message: notificationConfig.message,
      priority: notificationConfig.priority,
      read: false
    });

    return Response.json({ success: true, notification });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});