import { useState, useEffect } from 'react';
import { DollarSign, Settings, Calendar, Zap, AlertCircle, CheckCircle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

export default function AutoWithdrawalSettings({ appUser }) {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [payoutMethods, setPayoutMethods] = useState([]);
  const [formData, setFormData] = useState({
    isEnabled: false,
    thresholdAmount: 100,
    withdrawalAmount: 'full_balance',
    customAmount: 0,
    paymentMethodId: '',
    frequency: 'immediate'
  });

  useEffect(() => {
    loadSettings();
    loadPayoutMethods();
  }, [appUser?.id]);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const existingSettings = await base44.entities.AutoWithdrawalSettings.filter({
        userId: appUser.id
      });

      if (existingSettings.length > 0) {
        const setting = existingSettings[0];
        setSettings(setting);
        setFormData({
          isEnabled: setting.isEnabled,
          thresholdAmount: setting.thresholdAmount,
          withdrawalAmount: setting.withdrawalAmount,
          customAmount: setting.customAmount || 0,
          paymentMethodId: setting.paymentMethodId || '',
          frequency: setting.frequency
        });
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPayoutMethods = async () => {
    try {
      const methods = await base44.entities.PayoutMethod.filter({
        userId: appUser.id
      });
      setPayoutMethods(methods);
      
      // Auto-select default method
      const defaultMethod = methods.find(m => m.isDefault);
      if (defaultMethod && !formData.paymentMethodId) {
        setFormData(prev => ({ ...prev, paymentMethodId: defaultMethod.id }));
      }
    } catch (error) {
      console.error('Failed to load payout methods:', error);
    }
  };

  const handleSave = async () => {
    if (!formData.paymentMethodId) {
      toast.error('Please select a payout method');
      return;
    }

    if (formData.thresholdAmount <= 0) {
      toast.error('Threshold amount must be greater than 0');
      return;
    }

    if (formData.withdrawalAmount === 'custom' && formData.customAmount <= 0) {
      toast.error('Custom amount must be greater than 0');
      return;
    }

    setSaving(true);
    try {
      if (settings) {
        await base44.entities.AutoWithdrawalSettings.update(settings.id, formData);
        toast.success('Auto-withdrawal settings updated');
      } else {
        await base44.entities.AutoWithdrawalSettings.create({
          userId: appUser.id,
          ...formData
        });
        toast.success('Auto-withdrawal settings created');
      }
      loadSettings();
    } catch (error) {
      toast.error('Failed to save settings');
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8 text-gray-500">Loading settings...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Status Banner */}
      {formData.isEnabled ? (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-green-900">Auto-Withdrawal Enabled</h3>
            <p className="text-sm text-green-700 mt-1">
              Your account will automatically withdraw when balance reaches ${formData.thresholdAmount}
            </p>
            {settings?.lastProcessedAt && (
              <p className="text-xs text-green-600 mt-2">
                Last processed: {new Date(settings.lastProcessedAt).toLocaleString()}
              </p>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-amber-900">Auto-Withdrawal Disabled</h3>
            <p className="text-sm text-amber-700 mt-1">
              Enable auto-withdrawal to automatically process payouts when your balance reaches a threshold
            </p>
          </div>
        </div>
      )}

      {/* Settings Form */}
      <div className="space-y-4">
        {/* Enable Toggle */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-center gap-3">
            <Zap className="w-5 h-5 text-blue-600" />
            <div>
              <p className="font-medium text-gray-900">Enable Auto-Withdrawal</p>
              <p className="text-sm text-gray-600">Automatically process withdrawals</p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={formData.isEnabled}
              onChange={(e) => setFormData({ ...formData, isEnabled: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        {/* Threshold Amount */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <DollarSign className="w-4 h-4 inline mr-1" />
            Threshold Amount
          </label>
          <input
            type="number"
            min="1"
            step="0.01"
            value={formData.thresholdAmount}
            onChange={(e) => setFormData({ ...formData, thresholdAmount: parseFloat(e.target.value) })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="100.00"
          />
          <p className="text-xs text-gray-500 mt-1">
            Withdrawal will trigger when balance reaches this amount
          </p>
        </div>

        {/* Withdrawal Amount Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Withdrawal Amount</label>
          <select
            value={formData.withdrawalAmount}
            onChange={(e) => setFormData({ ...formData, withdrawalAmount: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="full_balance">Full Balance</option>
            <option value="threshold_only">Threshold Amount Only</option>
            <option value="custom">Custom Amount</option>
          </select>
        </div>

        {/* Custom Amount */}
        {formData.withdrawalAmount === 'custom' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Custom Amount</label>
            <input
              type="number"
              min="1"
              step="0.01"
              value={formData.customAmount}
              onChange={(e) => setFormData({ ...formData, customAmount: parseFloat(e.target.value) })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="50.00"
            />
          </div>
        )}

        {/* Frequency */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Calendar className="w-4 h-4 inline mr-1" />
            Frequency
          </label>
          <select
            value={formData.frequency}
            onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="immediate">Immediate (when threshold met)</option>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
        </div>

        {/* Payment Method Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Payout Method</label>
          {payoutMethods.length === 0 ? (
            <div className="text-center py-4 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm text-amber-700">No payout methods added yet</p>
              <p className="text-xs text-amber-600 mt-1">Add a payout method in Payment Methods section</p>
            </div>
          ) : (
            <select
              value={formData.paymentMethodId}
              onChange={(e) => setFormData({ ...formData, paymentMethodId: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select payout method</option>
              {payoutMethods.map(method => (
                <option key={method.id} value={method.id}>
                  {method.accountName} - {method.accountDetails} {method.isDefault ? '(Default)' : ''}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Save Button */}
        <Button
          onClick={handleSave}
          disabled={saving || payoutMethods.length === 0}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
        >
          {saving ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>
    </div>
  );
}