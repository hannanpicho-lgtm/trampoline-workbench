import { useState } from 'react';
import { Loader2 } from 'lucide-react';

export default function AccountSettingsSection({ appUser, onSave, isSaving }) {
  const [language, setLanguage] = useState(appUser?.language || 'en');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ language });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
      {/* Language Preference */}
      <div>
        <label className="block text-sm font-medium text-gray-900 mb-1">Preferred Language</label>
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="en">English</option>
          <option value="es">Spanish</option>
          <option value="zh">Chinese</option>
          <option value="ar">Arabic</option>
        </select>
      </div>

      {/* Email Verification Status */}
      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-gray-700">
          <strong>Email:</strong> {appUser?.created_by}
        </p>
        <p className={`text-xs mt-1 ${appUser?.emailVerified ? 'text-green-600' : 'text-orange-600'}`}>
          {appUser?.emailVerified ? '✓ Verified' : '⚠ Not Verified'}
        </p>
      </div>

      {/* Account Status */}
      <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
        <p className="text-sm text-gray-700">
          <strong>Account Status:</strong> {appUser?.isDeactivated ? 'Deactivated' : 'Active'}
        </p>
      </div>

      {/* VIP Level */}
      <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
        <p className="text-sm text-gray-700">
          <strong>VIP Level:</strong> {appUser?.vipLevel || 'Bronze'}
        </p>
        <p className="text-xs text-gray-600 mt-1">
          Tasks Completed: {appUser?.tasksCompleted || 0}
        </p>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isSaving}
        className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
      >
        {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
        {isSaving ? 'Saving...' : 'Save Settings'}
      </button>
    </form>
  );
}