import { useState, useEffect } from "react";
import { backendClient } from "@/api/backendClient";
import { toast } from "sonner";
import { Settings, Save, Loader2 } from "lucide-react";

export default function TaskAutomationSettings({ userId }) {
  const [preferences, setPreferences] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadPreferences();
  }, [userId]);

  const loadPreferences = async () => {
    try {
      const prefs = await backendClient.entities.TaskAutomationPreference.filter({ userId });
      
      if (prefs.length > 0) {
        setPreferences(prefs[0]);
      } else {
        // Create default preferences
        const newPrefs = await backendClient.entities.TaskAutomationPreference.create({
          userId,
          autoCompleteEnabled: false,
          autoCompleteRules: {
            excludePremium: false,
            maxTasksPerDay: 40
          },
          smartAssignmentEnabled: true,
          prioritizeHighCommission: false
        });
        setPreferences(newPrefs);
      }
    } catch (error) {
      toast.error("Failed to load preferences");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await backendClient.entities.TaskAutomationPreference.update(preferences.id, preferences);
      toast.success("Automation settings saved");
    } catch (error) {
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const updateRule = (key, value) => {
    setPreferences(prev => ({
      ...prev,
      autoCompleteRules: {
        ...prev.autoCompleteRules,
        [key]: value
      }
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <Settings className="w-5 h-5 text-gray-700" />
        <h3 className="text-lg font-bold text-gray-900">Task Automation Settings</h3>
      </div>

      {/* Auto-Complete Toggle */}
      <div className="bg-white rounded-lg p-4 border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="font-medium text-gray-900">Auto-Complete Tasks</div>
            <div className="text-sm text-gray-500">Automatically complete tasks based on your rules</div>
          </div>
          <button
            type="button"
            onClick={() => setPreferences(p => ({ ...p, autoCompleteEnabled: !p.autoCompleteEnabled }))}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              preferences.autoCompleteEnabled ? "bg-blue-600" : "bg-gray-200"
            }`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              preferences.autoCompleteEnabled ? "translate-x-6" : "translate-x-1"
            }`} />
          </button>
        </div>

        {preferences.autoCompleteEnabled && (
          <div className="space-y-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Min Commission ($)</label>
                <input
                  type="number"
                  value={preferences.autoCompleteRules?.minCommission || ''}
                  onChange={(e) => updateRule('minCommission', parseFloat(e.target.value) || null)}
                  placeholder="No minimum"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Max Commission ($)</label>
                <input
                  type="number"
                  value={preferences.autoCompleteRules?.maxCommission || ''}
                  onChange={(e) => updateRule('maxCommission', parseFloat(e.target.value) || null)}
                  placeholder="No maximum"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Max Tasks Per Day</label>
              <input
                type="number"
                value={preferences.autoCompleteRules?.maxTasksPerDay || 40}
                onChange={(e) => updateRule('maxTasksPerDay', parseInt(e.target.value) || 40)}
                min="1"
                max="40"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Pause From (HH:MM)</label>
                <input
                  type="time"
                  value={preferences.autoCompleteRules?.pauseHoursStart || ''}
                  onChange={(e) => updateRule('pauseHoursStart', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Pause Until (HH:MM)</label>
                <input
                  type="time"
                  value={preferences.autoCompleteRules?.pauseHoursEnd || ''}
                  onChange={(e) => updateRule('pauseHoursEnd', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={preferences.autoCompleteRules?.excludePremium || false}
                onChange={(e) => updateRule('excludePremium', e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded"
              />
              <label className="text-sm text-gray-700">Exclude premium orders from auto-complete</label>
            </div>
          </div>
        )}
      </div>

      {/* Smart Assignment */}
      <div className="bg-white rounded-lg p-4 border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-medium text-gray-900">AI-Powered Smart Assignment</div>
            <div className="text-sm text-gray-500">Use AI to recommend suitable tasks based on your performance</div>
          </div>
          <button
            type="button"
            onClick={() => setPreferences(p => ({ ...p, smartAssignmentEnabled: !p.smartAssignmentEnabled }))}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              preferences.smartAssignmentEnabled ? "bg-blue-600" : "bg-gray-200"
            }`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              preferences.smartAssignmentEnabled ? "translate-x-6" : "translate-x-1"
            }`} />
          </button>
        </div>
      </div>

      {/* Priority Settings */}
      <div className="bg-white rounded-lg p-4 border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-medium text-gray-900">Prioritize High Commission</div>
            <div className="text-sm text-gray-500">Show tasks with higher rewards first</div>
          </div>
          <button
            type="button"
            onClick={() => setPreferences(p => ({ ...p, prioritizeHighCommission: !p.prioritizeHighCommission }))}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              preferences.prioritizeHighCommission ? "bg-blue-600" : "bg-gray-200"
            }`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              preferences.prioritizeHighCommission ? "translate-x-6" : "translate-x-1"
            }`} />
          </button>
        </div>
      </div>

      {/* Save Button */}
      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {saving ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Saving...
          </>
        ) : (
          <>
            <Save className="w-5 h-5" />
            Save Settings
          </>
        )}
      </button>
    </div>
  );
}