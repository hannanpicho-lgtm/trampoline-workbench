import { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';

export const useNotifications = (userId) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  // Load initial notifications
  const loadNotifications = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const data = await base44.entities.Notification.filter(
        { userId },
        "-created_date",
        50
      );
      setNotifications(data);
      setUnreadCount(data.filter(n => !n.read).length);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!userId) return;

    loadNotifications();

    const unsubscribe = base44.entities.Notification.subscribe((event) => {
      if (event.data.userId === userId) {
        if (event.type === 'create') {
          setNotifications(prev => [event.data, ...prev]);
          if (!event.data.read) {
            setUnreadCount(prev => prev + 1);
          }
        } else if (event.type === 'update') {
          setNotifications(prev =>
            prev.map(n => (n.id === event.data.id ? event.data : n))
          );
          // Update unread count if marked as read
          if (event.data.read) {
            setUnreadCount(prev => Math.max(0, prev - 1));
          }
        }
      }
    });

    return unsubscribe;
  }, [userId, loadNotifications]);

  const markAsRead = async (notificationId) => {
    try {
      await base44.entities.Notification.update(notificationId, { read: true });
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    const unreadIds = notifications
      .filter(n => !n.read)
      .map(n => n.id);

    try {
      await Promise.all(
        unreadIds.map(id => base44.entities.Notification.update(id, { read: true }))
      );
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      await base44.entities.Notification.delete(notificationId);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    reload: loadNotifications
  };
};