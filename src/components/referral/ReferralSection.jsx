import { useState } from 'react';
import { Copy, Share2, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function ReferralSection({ appUser }) {
  const [copied, setCopied] = useState(false);
  const referralLink = `${window.location.origin}?ref=${appUser?.invitationCode}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    toast.success('Referral link copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const shareReferral = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Join and Earn!',
        text: 'Join me and earn money together!',
        url: referralLink
      }).catch(err => console.log('Share cancelled:', err));
    } else {
      copyToClipboard();
    }
  };

  return (
    <div className="space-y-4">
      {/* Referral Link Card */}
      <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 border border-blue-200">
        <div className="flex items-center gap-2 mb-4">
          <Share2 className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold text-gray-900">Your Referral Link</h3>
        </div>
        
        <div className="flex gap-2">
          <div className="flex-1 bg-white rounded-lg px-4 py-2 border border-blue-200 overflow-x-auto">
            <p className="text-sm text-gray-600 whitespace-nowrap">{referralLink}</p>
          </div>
          <button
            type="button"
            onClick={copyToClipboard}
            className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 whitespace-nowrap ${
              copied
                ? 'bg-green-600 text-white'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {copied ? (
              <>
                <CheckCircle className="w-4 h-4" />
                Copied
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                Copy
              </>
            )}
          </button>
        </div>

        <p className="text-sm text-gray-600 mt-3">
          💡 Share this link with friends and earn rewards when they sign up!
        </p>
      </div>

      {/* Share Button */}
      <button
        type="button"
        onClick={shareReferral}
        className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
      >
        <Share2 className="w-4 h-4 inline mr-2" />
        Share Referral Link
      </button>

      {/* Code Display */}
      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
        <p className="text-xs text-gray-600 mb-2">Your Invitation Code</p>
        <p className="text-xl font-bold text-gray-900 font-mono">{appUser?.invitationCode}</p>
      </div>
    </div>
  );
}