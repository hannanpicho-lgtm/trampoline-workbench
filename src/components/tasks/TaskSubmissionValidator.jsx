import { AlertCircle, DollarSign } from 'lucide-react';
import { getMinimumBalance } from './vipRequirements';

export default function TaskSubmissionValidator({ 
  userVipLevel, 
  userBalance, 
  canSubmit 
}) {
  if (canSubmit) return null;

  const minimumRequired = getMinimumBalance(userVipLevel);
  const shortfall = minimumRequired - userBalance;

  return (
    <div className="bg-red-50 border-l-4 border-red-600 p-4 rounded">
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
        <div>
          <h3 className="font-semibold text-red-800">Insufficient Balance</h3>
          <p className="text-red-700 text-sm mt-1">
            Your {userVipLevel} account requires a minimum balance of ${minimumRequired} to submit tasks.
          </p>
          <div className="mt-2 flex items-center gap-2 text-red-700 text-sm">
            <DollarSign className="w-4 h-4" />
            <span>You need ${shortfall.toFixed(2)} more to submit tasks.</span>
          </div>
        </div>
      </div>
    </div>
  );
}