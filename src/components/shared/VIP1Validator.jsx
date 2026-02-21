// VIP1 (Bronze) Validation Rules

if (process.env.NODE_ENV !== "production") {
  console.warn("⚠ Development mode active");
}

export function simulateCommission(products, rate) {
  return products.reduce((total, product) => {
    return total + (product.value * rate);
  }, 0);
}

export function validateSimulation(totalCommission) {
  if (totalCommission < 131 || totalCommission > 150) {
    throw new Error("Simulation failed: commission out of VIP1 range");
  }
  return true;
}

export function canSubmitTask(user) {
  if (user.currentSet > 2) return false;
  if (user.completedTasks >= user.totalTasks) return false;
  return true;
}

export function canWithdraw(user) {
  return (
    user.currentSet === 2 &&
    user.completedTasks === user.totalTasks &&
    user.totalCommission >= 131 &&
    user.totalCommission <= 150
  );
}



export function validateVIP1Commission(totalCommission) {
  const MIN = 131;
  const MAX = 150;
  
  if (totalCommission < MIN || totalCommission > MAX) {
    throw new Error(`VIP1 commission out of range: ${totalCommission.toFixed(2)} (expected ${MIN}-${MAX})`);
  }
  return true;
}

export function validateProductValue(productValue) {
  const MAX_VALUE = 100;
  
  if (productValue > MAX_VALUE) {
    throw new Error(`Product value exceeds VIP1 limit: ${productValue} (max ${MAX_VALUE})`);
  }
  return true;
}

export function validateTaskSets(user) {
  if (user.taskSetsCompleted > 2) {
    throw new Error(`Invalid task sets: ${user.taskSetsCompleted} (max 2)`);
  }
  return true;
}

export function validateVIP1Assignment(products, user) {
  const errors = [];
  
  // Validate individual product values
  products.forEach(product => {
    try {
      validateProductValue(product.price);
    } catch (e) {
      errors.push(`${product.name}: ${e.message}`);
    }
  });
  
  // Calculate and validate total commission
  const totalCommission = products.reduce((sum, p) => sum + p.commission, 0);
  try {
    validateVIP1Commission(totalCommission);
  } catch (e) {
    errors.push(e.message);
  }
  
  // Validate task sets
  try {
    validateTaskSets(user);
  } catch (e) {
    errors.push(e.message);
  }
  
  if (errors.length > 0) {
    throw new Error(`VIP1 Validation Failed:\n${errors.join('\n')}`);
  }
  
  return {
    valid: true,
    totalCommission,
    productCount: products.length
  };
}

export function filterValidVIP1Products(allProducts) {
  return allProducts.filter(p => {
    try {
      validateProductValue(p.price);
      return true;
    } catch {
      return false;
    }
  });
}

export function selectVIP1Products(allProducts, targetCount = 40) {
  const validProducts = filterValidVIP1Products(allProducts);
  
  if (validProducts.length < targetCount) {
    throw new Error(`Not enough valid VIP1 products: ${validProducts.length} available, ${targetCount} needed`);
  }
  
  // Try to find a valid combination
  const maxAttempts = 100;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const shuffled = [...validProducts].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, targetCount);
    
    const totalCommission = selected.reduce((sum, p) => sum + p.commission, 0);
    
    if (totalCommission >= 131 && totalCommission <= 150) {
      return {
        products: selected,
        totalCommission,
        valid: true
      };
    }
  }
  
  throw new Error(`Could not find valid VIP1 product combination after ${maxAttempts} attempts`);
}