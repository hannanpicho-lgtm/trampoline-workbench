import { useState } from 'react';
import { Loader2, X, AlertCircle, CheckCircle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function CreateTrainingAccountModal({ referrerCode, onClose, onSuccess }) {
  const [trainingPhone, setTrainingPhone] = useState('');
  const [accountName, setAccountName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successData, setSuccessData] = useState(null);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!trainingPhone.trim()) {
      setError('Training account phone number is required');
      return;
    }

    if (!referrerCode || referrerCode.length === 0) {
      setError('Referrer code is missing. Please ensure you have a valid invitation code.');
      return;
    }

    setIsLoading(true);

    try {
      const response = await base44.functions.invoke('createTrainingAccount', {
        phone: trainingPhone.trim(),
        inviteCode: referrerCode,
        accountName: accountName.trim() || undefined
      });

      if (response?.success) {
        setSuccessData(response.trainingAccount);
        toast.success('Training account created successfully!');
        
        // Call parent callback after 2 seconds
        setTimeout(() => {
          onSuccess?.(response.trainingAccount);
          onClose();
        }, 2000);
      } else {
        setError(response?.error || 'Failed to create training account');
        toast.error(response?.error || 'Failed to create training account');
      }
    } catch (err) {
      const errorMsg = err.message || 'Failed to create training account. Please try again.';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  if (successData) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl p-8 w-full max-w-md">
          <div className="flex justify-center mb-4">
            <CheckCircle className="w-16 h-16 text-green-600" />
          </div>
          
          <h3 className="text-2xl font-bold text-center text-gray-900 mb-2">
            Training Account Created!
          </h3>

          <div className="space-y-3 bg-green-50 rounded-lg p-4 mb-6">
            <div>
              <p className="text-sm text-gray-600">Account Name</p>
              <p className="font-medium text-gray-900">{successData.accountName}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Phone</p>
              <p className="font-medium text-gray-900">{successData.phone}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Training Code</p>
              <p className="font-mono font-medium text-green-700">{successData.invitationCode}</p>
            </div>
          </div>

          <p className="text-sm text-gray-600 text-center mb-6">
            You will receive 20% of all profits from this training account automatically!
          </p>

          <button
            onClick={onClose}
            className="w-full py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-6 w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-900">Create Training Account</h3>
          <button
            onClick={onClose}
            type="button"
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <p className="text-sm text-gray-600 mb-4">
          Create a training account using your referral code. You'll earn 20% of profits from this account!
        </p>

        {error && (
          <div className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-lg mb-4">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <form onSubmit={handleCreate} className="space-y-4">
          {/* Training Account Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Training Account Phone *
            </label>
            <input
              type="tel"
              value={trainingPhone}
              onChange={(e) => setTrainingPhone(e.target.value)}
              placeholder="e.g., +1 (555) 123-4567"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
              disabled={isLoading}
            />
            <p className="text-xs text-gray-500 mt-1">
              Phone number for the training account
            </p>
          </div>

          {/* Training Account Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Account Name (Optional)
            </label>
            <input
              type="text"
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              placeholder="e.g., Demo Account, Test Account"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isLoading}
            />
            <p className="text-xs text-gray-500 mt-1">
              A friendly name to identify this training account
            </p>
          </div>

          {/* Info Box */}
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-xs text-blue-800">
              <strong>Your Referral Code:</strong> {referrerCode || 'Not available'}
            </p>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
              disabled={isLoading}
            >
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              {isLoading ? 'Creating...' : 'Create Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
