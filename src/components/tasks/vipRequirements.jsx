// VIP Level minimum balance requirements for task submission
export const VIP_BALANCE_REQUIREMENTS = {
  VIP1: 100,
  VIP2: 250,
  VIP3: 500,
  VIP4: 1000,
  VIP5: 2500,
  Bronze: 0,
  Silver: 0,
  Gold: 0,
  Platinum: 0,
  Diamond: 0
};

export const canSubmitTask = (userVipLevel, userBalance) => {
  const minimumRequired = VIP_BALANCE_REQUIREMENTS[userVipLevel] || 0;
  return userBalance >= minimumRequired;
};

export const getMinimumBalance = (userVipLevel) => {
  return VIP_BALANCE_REQUIREMENTS[userVipLevel] || 0;
};