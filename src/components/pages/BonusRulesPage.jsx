import { ChevronLeft, Gift, TrendingUp, Award, DollarSign } from "lucide-react";

export default function BonusRulesPage({ onNavigate }) {
  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      {/* Header */}
      <div className="bg-gradient-to-b from-[#1a1a1a] to-[#2d2d2d] px-4 pt-4 pb-8">
        <div className="flex items-center justify-between">
          <button type="button" onClick={() => onNavigate("home")} className="p-2 -ml-2">
            <ChevronLeft className="w-6 h-6 text-white" />
          </button>
          <h1 className="text-white text-xl font-semibold">Bonus Rules</h1>
          <div className="w-10" />
        </div>
      </div>

      {/* Content */}
      <div className="px-4 -mt-4 pb-8">
        {/* Anniversary Banner */}
        <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-3xl p-6 shadow-xl mb-6 border-2 border-amber-300">
          <div className="text-center mb-4">
            <div className="text-sm text-gray-600 font-medium mb-1">5-Year Anniversary</div>
            <h2 className="text-3xl font-bold text-red-800 mb-4">BONUS DROP</h2>
            <p className="text-sm text-gray-700 leading-relaxed">
              Thank you for your continued support and trust! We are very honored to announce that we have prepared a special reward for you.
            </p>
            <p className="text-sm text-gray-700 mt-3 leading-relaxed">
              The company will work with all merchants to allocate a bonus of <span className="font-bold text-red-700">US$300 million</span> to reward more than 200,000 users on the platform.
            </p>
          </div>
        </div>

        {/* Activity Rules */}
        <div className="bg-white rounded-2xl p-6 shadow-sm mb-6">
          <div className="bg-red-600 text-white text-center py-2 px-4 rounded-lg font-bold mb-6">
            ACTIVITY RULES
          </div>

          <h3 className="font-bold text-gray-900 mb-3 text-center">
            Optimized Explanation: Lucky Bonus Rules in the 40/40 Task Set
          </h3>

          <div className="space-y-4 text-sm text-gray-700">
            <p className="leading-relaxed">
              In any 40/40 optimization task set, whenever you encounter an Advanced Task (i.e., an order with a negative amount greater than $100), the system will automatically generate based on the following rule:
            </p>

            <p className="font-medium">
              Each task set can generate up to 3 Lucky Bonuses.
            </p>

            <p className="font-semibold text-gray-900">Below are the detailed rules:</p>

            {/* Rule 1 */}
            <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
              <div className="font-bold text-blue-900 mb-3">
                ① Bonus Eligibility Based on the Negative Amount of the Advanced Task
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-blue-300">
                      <th className="text-left py-2 pr-2">Advanced Task Negative Amount Range</th>
                      <th className="text-left py-2">Lucky Bonus Amount Range</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-blue-200">
                    <tr>
                      <td className="py-2 pr-2">$0 ~ $499</td>
                      <td className="py-2">Random: $0 to $1,000</td>
                    </tr>
                    <tr>
                      <td className="py-2 pr-2">$500 ~ $4,999.99</td>
                      <td className="py-2">Random: $1,000 to $5,000</td>
                    </tr>
                    <tr>
                      <td className="py-2 pr-2">$5,000 ~ $9,999.99</td>
                      <td className="py-2">Random: $2,500 ~ $100,000</td>
                    </tr>
                    <tr>
                      <td className="py-2 pr-2">$10,000+</td>
                      <td className="py-2">$5,000+ (no upper limit possible)</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Rule 2 */}
            <div className="bg-green-50 rounded-xl p-4 border border-green-200">
              <div className="font-bold text-green-900 mb-3">
                ② Special Mechanism (Core Rule)
              </div>

              <p className="mb-3">
                When the system assigns an Advanced Task with a negative amount ≥ $1,000, a Lucky Bonus is automatically generated based on the following rule:
              </p>

              <div className="space-y-2 ml-4">
                <p><span className="font-semibold">Minimum:</span> 0.5x of the negative amount</p>
                <p><span className="font-semibold">Maximum:</span> 10x of the negative amount</p>
              </div>

              <div className="mt-4 bg-white rounded-lg p-3 border border-green-300">
                <div className="font-semibold text-green-900 mb-2">Examples:</div>
                <div className="space-y-2 text-xs">
                  <p>• If the negative amount is <span className="font-bold">$2,000</span><br />
                  → Lucky Bonus may range from $1,000 to $20,000</p>
                  <p>• If the negative amount is <span className="font-bold">$6,000</span><br />
                  → Lucky Bonus may range from $3,000 to $60,000</p>
                </div>
              </div>
            </div>

            {/* Summary */}
            <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
              <div className="font-bold text-purple-900 mb-3">Summary</div>
              <ul className="space-y-2 list-disc list-inside">
                <li>Advanced Tasks are randomly assigned by the system</li>
                <li>Lucky Bonuses are automatically triggered based on the Advanced Task amount</li>
                <li>Higher negative amounts = Higher potential Lucky Bonuses</li>
                <li>Up to 3 Lucky Bonuses per 40/40 task set</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Reward Distribution */}
        <div className="bg-white rounded-2xl p-6 shadow-sm mb-6">
          <div className="bg-red-600 text-white text-center py-2 px-4 rounded-lg font-bold mb-4">
            REWARD DISTRIBUTION
          </div>
          
          <div className="bg-green-50 border border-green-300 rounded-xl p-4 mb-4">
            <p className="text-sm text-gray-800 font-medium text-center">
              • After completing the task, the reward will be directly credited to the user's account.
            </p>
          </div>

          <div className="bg-red-600 text-white rounded-xl p-4 text-center">
            <p className="font-bold mb-2">Look forward to your participation and wish you good luck!</p>
            <p className="text-xs">
              Wishing you a New Year filled with new hopes, new joys, and new beginnings. May 2025 bring you endless happiness and success!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}