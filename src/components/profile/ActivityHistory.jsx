import { useState, useEffect } from 'react';
import { Activity, Loader2, Calendar, TrendingUp, Award, Zap } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function ActivityHistory({ appUser }) {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, tasks, vip, achievements

  useEffect(() => {
    loadActivityHistory();
  }, [appUser?.id]);

  const loadActivityHistory = async () => {
    setLoading(true);
    try {
      const [logins, tasks, vipHistory] = await Promise.all([
        base44.entities.LoginHistory?.filter?.({ userId: appUser?.id }, '-created_date', 50) || Promise.resolve([]),
        base44.entities.UserTask?.filter?.({ userId: appUser?.id }, '-created_date', 50) || Promise.resolve([]),
        base44.entities.VIPUpgradeRequest?.filter?.({ userId: appUser?.id }, '-created_date', 50) || Promise.resolve([])
      ]);

      const allActivities = [];

      logins.forEach(login => {
        allActivities.push({
          type: 'login',
          timestamp: login.created_date,
          title: 'User Login',
          description: `Logged in from ${login.ipAddress || 'unknown'}`,
          icon: Activity,
          color: 'blue'
        });
      });

      tasks.forEach(task => {
        if (task.status === 'completed' || task.status === 'approved') {
          allActivities.push({
            type: 'task',
            timestamp: task.approvedAt || task.submittedAt || task.created_date,
            title: 'Task Completed',
            description: `Earned $${task.commission?.toFixed(2) || '0.00'}`,
            icon: Zap,
            color: 'green'
          });
        }
      });

      vipHistory.forEach(vip => {
        if (vip.status === 'approved') {
          allActivities.push({
            type: 'vip',
            timestamp: vip.created_date,
            title: 'VIP Upgrade',
            description: `Upgraded from ${vip.currentLevel} to ${vip.requestedLevel}`,
            icon: Award,
            color: 'purple'
          });
        }
      });

      // Sort by timestamp
      allActivities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setActivities(allActivities);
    } catch (error) {
      console.error('Failed to load activity history:', error);
      toast.error('Failed to load activity history');
    } finally {
      setLoading(false);
    }
  };

  const filteredActivities = filter === 'all' 
    ? activities 
    : activities.filter(a => a.type === filter);

  const getColorClasses = (color) => {
    const colors = {
      blue: 'bg-blue-100 text-blue-600',
      green: 'bg-green-100 text-green-600',
      purple: 'bg-purple-100 text-purple-600',
      orange: 'bg-orange-100 text-orange-600'
    };
    return colors[color] || colors.blue;
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {['all', 'tasks', 'vip', 'achievements'].map(f => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              filter === f
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Activity Timeline */}
      <div className="space-y-3">
        {filteredActivities.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No activities yet</p>
          </div>
        ) : (
          filteredActivities.map((activity, idx) => {
            const Icon = activity.icon;
            return (
              <div key={idx} className="flex gap-3 pb-3 border-b border-gray-100 last:border-0">
                <div className={`p-2.5 rounded-lg flex-shrink-0 ${getColorClasses(activity.color)}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">{activity.title}</h4>
                      <p className="text-xs text-gray-600 mt-0.5">{activity.description}</p>
                    </div>
                    <span className="text-xs text-gray-500 flex-shrink-0 whitespace-nowrap">
                      {new Date(activity.timestamp).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 gap-3 pt-4 border-t border-gray-200">
        <div className="bg-blue-50 rounded-lg p-3">
          <div className="text-xs text-blue-600 font-medium">Total Tasks</div>
          <div className="text-xl font-bold text-blue-900 mt-1">
            {activities.filter(a => a.type === 'task').length}
          </div>
        </div>
        <div className="bg-purple-50 rounded-lg p-3">
          <div className="text-xs text-purple-600 font-medium">VIP Upgrades</div>
          <div className="text-xl font-bold text-purple-900 mt-1">
            {activities.filter(a => a.type === 'vip').length}
          </div>
        </div>
      </div>
    </div>
  );
}