import { AlertCircle, Check } from "lucide-react";
import { isValidProductForVIP, calculateTotalCommission, isCommissionInRange, getCommissionConstraints } from "../shared/VIPTaskConfig";
import { validateVIP1Assignment } from "../shared/VIP1Validator";

export function validateBronzeAssignment(products, vipLevel = "Bronze", user = null) {
  const constraints = getCommissionConstraints(vipLevel);
  const errors = [];
  const warnings = [];

  // Check product values
  const invalidProducts = products.filter(p => !isValidProductForVIP(vipLevel, p.price));
  if (invalidProducts.length > 0) {
    errors.push(
      `${invalidProducts.length} product(s) exceed max value of $${constraints.maxProductValue}`
    );
  }

  // Check total commission
  const totalCommission = calculateTotalCommission(vipLevel, products);
  if (!isCommissionInRange(vipLevel, totalCommission)) {
    errors.push(
      `Total commission $${totalCommission.toFixed(2)} outside range $${constraints.minTotalCommission}-$${constraints.maxTotalCommission}`
    );
  }

  // Run automated VIP1 validation tests
  if (vipLevel === "Bronze" && user) {
    try {
      validateVIP1Assignment(products, user);
    } catch (error) {
      errors.push(`Automated Test Failed: ${error.message}`);
    }
  }

  return { isValid: errors.length === 0, errors, warnings, totalCommission };
}

export default function BronzeProductValidator({ products, vipLevel = "Bronze", user = null }) {
  const { isValid, errors, totalCommission } = validateBronzeAssignment(products, vipLevel, user);
  const constraints = getCommissionConstraints(vipLevel);

  if (vipLevel !== "Bronze") return null;

  return (
    <div className="space-y-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
      <div className="flex items-start gap-2">
        <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h4 className="font-semibold text-blue-900 mb-2">Bronze (VIP1) Assignment Constraints</h4>
          <ul className="text-sm text-blue-800 space-y-1 mb-3">
            <li>• Max product value: ${constraints.maxProductValue}</li>
            <li>• Commission range (2 sets): ${constraints.minTotalCommission}-${constraints.maxTotalCommission}</li>
            <li>• Current total: ${totalCommission.toFixed(2)}</li>
          </ul>
        </div>
      </div>

      {errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded p-2">
          {errors.map((error, idx) => (
            <p key={idx} className="text-xs text-red-700 mb-1">
              ❌ {error}
            </p>
          ))}
        </div>
      )}

      {isValid && (
        <div className="bg-green-50 border border-green-200 rounded p-2 flex items-center gap-2">
          <Check className="w-4 h-4 text-green-600" />
          <p className="text-xs text-green-700">All constraints satisfied</p>
        </div>
      )}
    </div>
  );
}