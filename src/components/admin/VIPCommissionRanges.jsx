import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { DollarSign, Save, RefreshCw } from "lucide-react";
import CommissionCalculator from "./CommissionCalculator";

const VIP_LEVELS = ["Bronze", "Silver", "Gold", "Platinum", "Diamond"];

const DEFAULT_RANGES = {
  "Bronze": { min: 140, max: 160 },
  "Silver": { min: 250, max: 300 },
  "Gold": { min: 450, max: 550 },
  "Platinum": { min: 800, max: 1000 },
  "Diamond": { min: 1500, max: 2000 }
};

export default function VIPCommissionRanges() {
  const [ranges, setRanges] = useState(DEFAULT_RANGES);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadRanges();
  }, []);

  const loadRanges = async () => {
    setLoading(true);
    try {
      const settings = await base44.entities.AppSettings.list();
      const loadedRanges = { ...DEFAULT_RANGES };

      VIP_LEVELS.forEach(level => {
        const minSetting = settings.find(s => s.settingKey === `vip_commission_min_${level}`);
        const maxSetting = settings.find(s => s.settingKey === `vip_commission_max_${level}`);
        
        if (minSetting && maxSetting) {
          loadedRanges[level] = {
            min: parseFloat(minSetting.settingValue),
            max: parseFloat(maxSetting.settingValue)
          };
        }
      });

      setRanges(loadedRanges);
    } catch (error) {
      console.error("Failed to load ranges:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const settings = await base44.entities.AppSettings.list();
      
      for (const level of VIP_LEVELS) {
        const minKey = `vip_commission_min_${level}`;
        const maxKey = `vip_commission_max_${level}`;
        
        const minSetting = settings.find(s => s.settingKey === minKey);
        const maxSetting = settings.find(s => s.settingKey === maxKey);

        if (minSetting) {
          await base44.entities.AppSettings.update(minSetting.id, {
            settingValue: ranges[level].min.toString()
          });
        } else {
          await base44.entities.AppSettings.create({
            settingKey: minKey,
            settingValue: ranges[level].min.toString(),
            description: `Minimum total commission for ${level} VIP (both sets)`
          });
        }

        if (maxSetting) {
          await base44.entities.AppSettings.update(maxSetting.id, {
            settingValue: ranges[level].max.toString()
          });
        } else {
          await base44.entities.AppSettings.create({
            settingKey: maxKey,
            settingValue: ranges[level].max.toString(),
            description: `Maximum total commission for ${level} VIP (both sets)`
          });
        }
      }

      toast.success("Commission ranges saved successfully");
    } catch (error) {
      toast.error("Failed to save ranges");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (!confirm("Reset to default commission ranges?")) return;
    setRanges(DEFAULT_RANGES);
  };

  const updateRange = (level, field, value) => {
    setRanges(prev => ({
      ...prev,
      [level]: {
        ...prev[level],
        [field]: parseFloat(value) || 0
      }
    }));
  };

  if (loading) {
    return <div className="text-center py-12 text-gray-500">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">VIP Commission Ranges</h2>
          <p className="text-sm text-gray-500 mt-1">Configure total commission earnings per VIP level (both task sets combined)</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleReset}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Reset Defaults
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg font-medium flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <DollarSign className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">How it works:</p>
            <p>When assigning tasks, the system calculates product selections to ensure the total commission earned (across both task sets) falls within the specified range for each VIP level. This controls user earnings predictably.</p>
          </div>
        </div>
      </div>

      {/* Ranges Grid */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">VIP Level</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Minimum Commission ($)</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Maximum Commission ($)</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Range</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {VIP_LEVELS.map((level, index) => (
                <tr key={level} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${
                        index === 0 ? "bg-orange-500" :
                        index === 1 ? "bg-gray-400" :
                        index === 2 ? "bg-yellow-500" :
                        index === 3 ? "bg-purple-500" :
                        "bg-blue-500"
                      }`} />
                      <span className="font-medium text-gray-900">{level}</span>
                      <span className="text-xs text-gray-500">(VIP{index + 1})</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <input
                      type="number"
                      value={ranges[level].min}
                      onChange={(e) => updateRange(level, "min", e.target.value)}
                      className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      step="10"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <input
                      type="number"
                      value={ranges[level].max}
                      onChange={(e) => updateRange(level, "max", e.target.value)}
                      className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      step="10"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-medium text-gray-900">
                      ${ranges[level].min} - ${ranges[level].max}
                    </span>
                    <span className="text-xs text-gray-500 ml-2">
                      (spread: ${ranges[level].max - ranges[level].min})
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Example Calculation */}
      <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
        <h3 className="font-semibold text-purple-900 mb-2">Example Calculation</h3>
        <p className="text-sm text-purple-800 mb-3">
          For Bronze VIP with range $140-$160:
        </p>
        <ul className="text-sm text-purple-800 space-y-1 ml-4">
          <li>• User completes ~35 tasks in Set 1 and ~35 tasks in Set 2 (total ~70 tasks)</li>
          <li>• System assigns products with 0.5% commission rate</li>
          <li>• Products are selected so total commission = $150 (within $140-$160 range)</li>
          <li>• Product prices range from $20-$100 to achieve target</li>
        </ul>
      </div>

      {/* Calculator */}
      <CommissionCalculator />
    </div>
  );
}