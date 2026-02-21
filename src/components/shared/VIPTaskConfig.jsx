// VIP Level Configuration - Task Sets & Commission Rates
export const VIP_CONFIG = {
  Bronze: {
    tasksPerSet: 40,
    commissionRate: 0.005, // 0.5%
    level: "Bronze",
    // VIP1-specific: Product value constraints & commission range
    maxProductValue: 100,
    minTotalCommission: 131,
    maxTotalCommission: 150,
    totalTasksAcrossSet: 80 // 40 per set * 2 sets
  },
  Silver: {
    tasksPerSet: 45,
    commissionRate: 0.01, // 1.0%
    level: "Silver"
  },
  Gold: {
    tasksPerSet: 50,
    commissionRate: 0.015, // 1.5%
    level: "Gold"
  },
  Platinum: {
    tasksPerSet: 55,
    commissionRate: 0.02, // 2.0%
    level: "Platinum"
  },
  Diamond: {
    tasksPerSet: 60,
    commissionRate: 0.025, // 2.5%
    level: "Diamond"
  }
};

export function getVIPConfig(vipLevel) {
  return VIP_CONFIG[vipLevel] || VIP_CONFIG.Bronze;
}

export function getTasksPerSet(vipLevel) {
  return getVIPConfig(vipLevel).tasksPerSet;
}

export function getCommissionRate(vipLevel) {
  return getVIPConfig(vipLevel).commissionRate;
}

// Validate product assignment for VIP1 (Bronze) users
export function isValidProductForVIP(vipLevel, productValue) {
  const config = getVIPConfig(vipLevel);
  
  // Bronze has product value constraints
  if (vipLevel === "Bronze" && config.maxProductValue) {
    return productValue <= config.maxProductValue;
  }
  
  return true;
}

// Calculate total commission for a set of tasks
export function calculateTotalCommission(vipLevel, products) {
  const config = getVIPConfig(vipLevel);
  const rate = config.commissionRate;
  return products.reduce((sum, product) => sum + (product.price * rate), 0);
}

// Check if commission is within valid range for VIP level
export function isCommissionInRange(vipLevel, totalCommission) {
  const config = getVIPConfig(vipLevel);
  
  if (!config.minTotalCommission || !config.maxTotalCommission) {
    return true; // No constraints for this VIP level
  }
  
  return totalCommission >= config.minTotalCommission && 
         totalCommission <= config.maxTotalCommission;
}

// Get commission constraints for VIP level
export function getCommissionConstraints(vipLevel) {
  const config = getVIPConfig(vipLevel);
  return {
    minTotalCommission: config.minTotalCommission,
    maxTotalCommission: config.maxTotalCommission,
    maxProductValue: config.maxProductValue,
    totalTasksAcrossSet: config.totalTasksAcrossSet
  };
}