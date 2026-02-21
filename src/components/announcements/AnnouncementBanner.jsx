import { useState, useEffect } from 'react';
import { X, AlertCircle, Info, CheckCircle, AlertTriangle } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function AnnouncementBanner({ userId }) {
  const [announcements, setAnnouncements] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (!userId) return;
    loadAnnouncements();
  }, [userId]);

  const loadAnnouncements = async () => {
    try {
      const userAnnouncements = await base44.entities.UserAnnouncement.filter({
        userId,
        read: false,
        dismissed: false
      }, '-created_date', 10);

      const announcementIds = userAnnouncements.map(ua => ua.announcementId);
      if (announcementIds.length === 0) return;

      const announcements = await Promise.all(
        announcementIds.map(id => base44.entities.Announcement.filter({ id }))
      );

      const validAnnouncements = announcements
        .flat()
        .filter(a => {
          if (a.status !== 'published') return false;
          if (a.expiresAt && new Date(a.expiresAt) < new Date()) return false;
          return true;
        });

      setAnnouncements(validAnnouncements);
    } catch (error) {
      console.error('Failed to load announcements:', error);
    }
  };

  const handleDismiss = async (announcement) => {
    try {
      const userAnnouncement = await base44.entities.UserAnnouncement.filter({
        userId,
        announcementId: announcement.id
      });

      if (userAnnouncement.length > 0) {
        await base44.entities.UserAnnouncement.update(userAnnouncement[0].id, {
          dismissed: true,
          read: true,
          readAt: new Date().toISOString()
        });
      }

      setAnnouncements(prev => prev.filter(a => a.id !== announcement.id));
      
      if (currentIndex >= announcements.length - 1) {
        setCurrentIndex(0);
      }
    } catch (error) {
      console.error('Failed to dismiss announcement:', error);
    }
  };

  const handleRead = async (announcement) => {
    try {
      const userAnnouncement = await base44.entities.UserAnnouncement.filter({
        userId,
        announcementId: announcement.id
      });

      if (userAnnouncement.length > 0 && !userAnnouncement[0].read) {
        await base44.entities.UserAnnouncement.update(userAnnouncement[0].id, {
          read: true,
          readAt: new Date().toISOString()
        });

        await base44.entities.Announcement.update(announcement.id, {
          viewCount: (announcement.viewCount || 0) + 1
        });
      }
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  useEffect(() => {
    if (announcements.length === 0) return;
    
    const current = announcements[currentIndex];
    if (current) {
      handleRead(current);
    }

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % announcements.length);
    }, 8000);

    return () => clearInterval(interval);
  }, [currentIndex, announcements]);

  if (announcements.length === 0) return null;

  const current = announcements[currentIndex];
  if (!current) return null;

  const typeConfig = {
    info: {
      icon: Info,
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      text: 'text-blue-800',
      iconColor: 'text-blue-600'
    },
    warning: {
      icon: AlertTriangle,
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      text: 'text-yellow-800',
      iconColor: 'text-yellow-600'
    },
    success: {
      icon: CheckCircle,
      bg: 'bg-green-50',
      border: 'border-green-200',
      text: 'text-green-800',
      iconColor: 'text-green-600'
    },
    urgent: {
      icon: AlertCircle,
      bg: 'bg-red-50',
      border: 'border-red-200',
      text: 'text-red-800',
      iconColor: 'text-red-600'
    }
  };

  const config = typeConfig[current.type] || typeConfig.info;
  const Icon = config.icon;

  return (
    <div className={`relative z-10 px-4 mb-4`}>
      <div className={`${config.bg} ${config.border} border rounded-lg p-4 shadow-sm`}>
        <div className="flex items-start gap-3">
          <Icon className={`w-5 h-5 ${config.iconColor} flex-shrink-0 mt-0.5`} />
          <div className="flex-1 min-w-0">
            <h4 className={`font-semibold ${config.text} mb-1`}>{current.title}</h4>
            <p className={`text-sm ${config.text} opacity-90`}>{current.message}</p>
          </div>
          <button
            type="button"
            onClick={() => handleDismiss(current)}
            className={`${config.iconColor} hover:opacity-70 flex-shrink-0`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        {announcements.length > 1 && (
          <div className="flex justify-center gap-1 mt-3">
            {announcements.map((_, idx) => (
              <div
                key={idx}
                className={`w-1.5 h-1.5 rounded-full transition-colors ${
                  idx === currentIndex ? config.iconColor.replace('text-', 'bg-') : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}