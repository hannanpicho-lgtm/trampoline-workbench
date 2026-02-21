import { useState, useEffect } from "react";
import { ChevronLeft, AlertCircle, Check, MessageCircle, X, Sparkles, Crown, History, Star, TrendingUp, Calendar } from "lucide-react";
import { toast } from "sonner";
import { base44 } from "@/api/base44Client";
import { getTasksPerSet } from "../shared/VIPTaskConfig";
import { canSubmitTask, getMinimumBalance } from "../tasks/vipRequirements";
import TaskSubmissionValidator from "../tasks/TaskSubmissionValidator";
import CustomerServiceChat from "../chat/CustomerServiceChat";
import FrozenBalanceModal from "../modals/FrozenBalanceModal";

export default function StartingPage({ currentUser, onNavigate }) {
  const [appUser, setAppUser] = useState(null);
  const [products, setProducts] = useState([]);
  const [userTasks, setUserTasks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [priorities, setPriorities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [sortBy, setSortBy] = useState('default');
  const [submitting, setSubmitting] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [batchMode, setBatchMode] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showProductSelection, setShowProductSelection] = useState(false);
  const [showSupport, setShowSupport] = useState(false);
  const [showFrozenModal, setShowFrozenModal] = useState(false);
  const [frozenProduct, setFrozenProduct] = useState(null);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [taskToRate, setTaskToRate] = useState(null);
  const [rating, setRating] = useState(0);
  const [ratingFeedback, setRatingFeedback] = useState("");

  useEffect(() => {
    loadData();
  }, [currentUser]);

  // Real-time task updates subscription
  useEffect(() => {
    if (!appUser?.id) return;

    const unsubscribe = base44.entities.UserTask.subscribe((event) => {
      if (event.data?.userId === appUser.id) {
        loadData();
      }
    });

    return unsubscribe;
  }, [appUser?.id]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Fetch AppUser with retries for consistency after reset
      let appUserData = await base44.entities.AppUser.filter({ created_by: currentUser.email });
      
      // If no data found, retry once after short delay
      if (appUserData.length === 0) {
        await new Promise(resolve => setTimeout(resolve, 500));
        appUserData = await base44.entities.AppUser.filter({ created_by: currentUser.email });
      }

      if (appUserData.length > 0) {
        const [productsData, tasksData, categoriesData, prioritiesData] = await Promise.all([
          base44.entities.Product.filter({ isActive: true }),
          base44.entities.UserTask.filter({ userId: appUserData[0].id }, "-created_date", 100),
          base44.entities.TaskCategory.filter({ isActive: true }),
          base44.entities.TaskPriority.filter({ isActive: true })
        ]);

        console.log("Loaded data:", { 
          user: appUserData[0], 
          tasks: tasksData.length,
          pendingTasks: tasksData.filter(t => t.status === "pending").length,
          products: productsData.length
        });

        setAppUser(appUserData[0]);
        setProducts(productsData);
        setUserTasks(tasksData);
        setCategories(categoriesData);
        setPriorities(prioritiesData);
      }
    } catch (error) {
      console.error("Load data error:", error);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleRateTask = async () => {
    if (rating === 0) {
      toast.error("Please select a rating");
      return;
    }

    try {
      await base44.entities.UserTask.update(taskToRate.id, {
        rating,
        ratingFeedback,
        ratedAt: new Date().toISOString()
      });
      
      toast.success("Thank you for your feedback!");
      setShowRatingModal(false);
      setTaskToRate(null);
      setRating(0);
      setRatingFeedback("");
      loadData();
    } catch (error) {
      toast.error("Failed to submit rating");
    }
  };

  // Calculate daily/weekly progress
  const getDailyProgress = () => {
    const today = new Date().toDateString();
    const todayTasks = userTasks.filter(t => 
      new Date(t.created_date).toDateString() === today && 
      (t.status === "completed" || t.status === "approved")
    );
    return { completed: todayTasks.length, total: 10 }; // Daily goal: 10 tasks
  };

  const getWeeklyProgress = () => {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekTasks = userTasks.filter(t => 
      new Date(t.created_date) >= weekAgo && 
      (t.status === "completed" || t.status === "approved")
    );
    return { completed: weekTasks.length, total: 50 }; // Weekly goal: 50 tasks
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 flex items-center justify-center">
        <div className="text-white text-lg">Loading...</div>
      </div>
    );
  }

  if (!appUser) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 flex items-center justify-center">
        <div className="text-white text-lg">User data not found</div>
      </div>
    );
  }

  // Determine current set and progress
  const tasksPerSet = getTasksPerSet(appUser.vipLevel || "Bronze");
  const currentSet = appUser.taskSetsCompleted >= 2 ? 2 : (appUser.taskSetsCompleted + 1);
  const tasksInCurrentSet = appUser.tasksInCurrentSet || 0;
  const tasksRemaining = tasksPerSet - tasksInCurrentSet;
  const isSet2 = currentSet === 2;

  // Get progress data
  const dailyProgress = getDailyProgress();
  const weeklyProgress = getWeeklyProgress();

  // Get completed tasks that haven't been rated
  const completedUnratedTasks = userTasks.filter(t => 
    (t.status === "completed" || t.status === "approved") && !t.rating
  ).slice(0, 5);

  // Check if user can start tasks
  const canStartTasks = !appUser.needsReset && appUser.taskSetsCompleted < 2 && !appUser.isFrozen;
  const isComplete = appUser.taskSetsCompleted >= 2 && !appUser.needsReset;
  const awaitingReset = appUser.needsReset;
  const isFrozen = appUser.isFrozen;

  // Get pending tasks (assigned by admin or system)
  const pendingTasks = userTasks.filter(t => t.status === "pending");

  // Filter and sort products helper
  const getFilteredProducts = (productList) => {
    let filtered = productList;

    if (filterCategory !== 'all') {
      filtered = filtered.filter(p => p.categoryId === filterCategory);
    }

    if (filterPriority !== 'all') {
      filtered = filtered.filter(p => p.priorityId === filterPriority);
    }

    // Sort
    if (sortBy === 'commission-high') {
      filtered = [...filtered].sort((a, b) => {
        const aPri = priorities.find(p => p.id === a.priorityId);
        const bPri = priorities.find(p => p.id === b.priorityId);
        const aComm = a.commission * (aPri?.multiplier || 1);
        const bComm = b.commission * (bPri?.multiplier || 1);
        return bComm - aComm;
      });
    } else if (sortBy === 'commission-low') {
      filtered = [...filtered].sort((a, b) => {
        const aPri = priorities.find(p => p.id === a.priorityId);
        const bPri = priorities.find(p => p.id === b.priorityId);
        const aComm = a.commission * (aPri?.multiplier || 1);
        const bComm = b.commission * (bPri?.multiplier || 1);
        return aComm - bComm;
      });
    } else if (sortBy === 'price-high') {
      filtered = [...filtered].sort((a, b) => b.price - a.price);
    } else if (sortBy === 'price-low') {
      filtered = [...filtered].sort((a, b) => a.price - b.price);
    }

    return filtered;
  };

  // If we have pending tasks, show only those
  // Otherwise, show all products that haven't been completed in this set
  let availableProducts;
  if (pendingTasks.length > 0) {
    // Show only assigned pending tasks
    availableProducts = products.filter(p => pendingTasks.some(t => t.productId === p.id));
  } else {
    // Show all products except those already completed in current set
    const completedInCurrentSet = userTasks
      .filter(t => (t.status === "completed" || t.status === "approved"))
      .slice(-tasksInCurrentSet)
      .map(t => t.productId);
    availableProducts = products.filter(p => !completedInCurrentSet.includes(p.id));
  }

  // CRITICAL: Premium products only in Set 2
  if (currentSet === 1) {
    availableProducts = availableProducts.filter(p => !p.isPremium);
  }

  // Limit premium products based on encounter count
  const premiumCount = appUser.premiumEncounters || 0;
  const maxPremium = appUser.maxPremiumPerSet || 3;
  if (premiumCount >= maxPremium) {
    availableProducts = availableProducts.filter(p => !p.isPremium);
  }

  // Apply filters and sorting
  availableProducts = getFilteredProducts(availableProducts);

  const getCategoryName = (id) => categories.find(c => c.id === id)?.name || null;
  const getPriorityData = (id) => priorities.find(p => p.id === id) || null;

  const handleStartTask = async () => {
        if (!canStartTasks) {
          toast.error("Cannot start tasks - account needs reset or complete");
          return;
        }

        // Check if user has already completed the set
        if (tasksInCurrentSet >= tasksPerSet) {
          toast.error("Task set already complete", {
            description: "Contact Customer Service to continue"
          });
          return;
        }

        if (availableProducts.length === 0) {
          toast.error("No available products");
          return;
        }

        // Check balance requirements for VIP level
        const currentBalance = appUser.balance || 0;
        const vipLevel = appUser.vipLevel || "Bronze";

        if (!canSubmitTask(vipLevel, currentBalance)) {
          setShowSupport(true);
          return;
        }

        // Auto-select random product and show confirmation modal
        const randomProduct = availableProducts[Math.floor(Math.random() * availableProducts.length)];
        setSelectedProduct(randomProduct);
        setShowSubmitModal(true);
        };

  const handleProductSelect = (product) => {
    if (batchMode) {
      const isSelected = selectedProducts.some(p => p.id === product.id);
      if (isSelected) {
        setSelectedProducts(selectedProducts.filter(p => p.id !== product.id));
      } else {
        setSelectedProducts([...selectedProducts, product]);
      }
    } else {
      setSelectedProduct(product);
      setShowProductSelection(false);
      setShowSubmitModal(true);
    }
  };

  const handleBatchSubmit = () => {
    if (selectedProducts.length === 0) {
      toast.error("Please select at least one task");
      return;
    }
    setShowProductSelection(false);
    setShowSubmitModal(true);
  };

  const handleSubmitTask = async () => {
          const tasksToSubmit = batchMode ? selectedProducts : (selectedProduct ? [selectedProduct] : []);
          if (tasksToSubmit.length === 0) return;

    // CRITICAL: Check if user would exceed task limit
    const currentTasksInSet = appUser.tasksInCurrentSet || 0;
    const tasksPerSetLimit = getTasksPerSet(appUser.vipLevel || "Bronze");
    
    if (currentTasksInSet >= tasksPerSetLimit) {
      toast.error("Task set already complete", {
        description: "Contact Customer Service to continue"
      });
      setShowSubmitModal(false);
      return;
    }

    if (currentTasksInSet + tasksToSubmit.length > tasksPerSetLimit) {
      toast.error(`Cannot submit ${tasksToSubmit.length} tasks`, {
        description: `Only ${tasksPerSetLimit - currentTasksInSet} tasks remaining in this set`
      });
      setShowSubmitModal(false);
      return;
    }

    // Check balance requirements based on VIP level
    const currentBalance = appUser.balance || 0;
    const vipLevel = appUser.vipLevel || "Bronze";

    if (!canSubmitTask(vipLevel, currentBalance)) {
      toast.error(`Insufficient Balance for ${vipLevel}`, {
        description: `You need at least $${getMinimumBalance(vipLevel)}. Contact Customer Service for assistance.`
      });
      setShowSubmitModal(false);
      setSubmitting(false);
      return;
    }

    // VIP commission rates
    const vipCommissionRates = {
      "Bronze": 0.005,   // 0.5%
      "Silver": 0.01,    // 1.0%
      "Gold": 0.015,     // 1.5%
      "Platinum": 0.02,  // 2.0%
      "Diamond": 0.025   // 2.5%
    };
    const commissionRate = vipCommissionRates[vipLevel] || 0.005;

    setSubmitting(true);
    try {
      let totalCommission = 0;
      let totalPremiumValue = 0;
      let hasPremium = false;
      let premiumProductRef = null;

      for (const product of tasksToSubmit) {
        const isPremium = product.isPremium;
        // Calculate commission as percentage of product price
        const commission = isPremium 
          ? product.price * commissionRate * 10  // Premium: 10x commission
          : product.price * commissionRate;
        const premiumValue = product.price;

        if (isPremium) {
          hasPremium = true;
          premiumProductRef = product;
          totalPremiumValue += premiumValue;
        }
        totalCommission += commission;

        const existingTask = userTasks.find(t => 
          t.productId === product.id && t.status === "pending"
        );

        if (existingTask) {
          await base44.entities.UserTask.update(existingTask.id, {
            status: "completed",
            submittedAt: new Date().toISOString()
          });
        } else {
          await base44.entities.UserTask.create({
            userId: appUser.id,
            productId: product.id,
            commission: commission,
            status: "completed",
            submittedAt: new Date().toISOString()
          });
        }
      }

      const updatedTasksInSet = tasksInCurrentSet + tasksToSubmit.length;
      const setComplete = updatedTasksInSet >= tasksPerSet;

      // Process referral commission (20% to referrer) for each task
      for (const product of tasksToSubmit) {
        const taskCommission = product.isPremium 
          ? product.price * commissionRate * 10 
          : product.price * commissionRate;
          
        if (appUser.referredBy) {
          try {
            const userTask = userTasks.find(t => t.productId === product.id && t.status === "completed");
            if (userTask) {
              await base44.functions.invoke('processReferralCommission', {
                taskId: userTask.id,
                userId: appUser.id,
                commissionAmount: taskCommission
              });
            }
          } catch (error) {
            console.error('Failed to process referral commission:', error);
          }
        }
      }

      if (hasPremium) {
        const currentBalanceValue = appUser.balance || 0;
        const newBalance = currentBalanceValue - totalPremiumValue + (totalCommission - totalPremiumValue);
        const frozenBalance = totalPremiumValue + currentBalanceValue;

        await base44.entities.AppUser.update(appUser.id, {
          balance: newBalance,
          frozenBalance: frozenBalance,
          isFrozen: true,
          tasksCompleted: (appUser.tasksCompleted || 0) + tasksToSubmit.length,
          tasksInCurrentSet: updatedTasksInSet,
          premiumEncounters: (appUser.premiumEncounters || 0) + 1,
          needsReset: setComplete,
          taskSetsCompleted: setComplete ? (appUser.taskSetsCompleted || 0) + 1 : appUser.taskSetsCompleted
        });

        setShowSubmitModal(false);
        setSubmitting(false);
        setFrozenProduct(premiumProductRef);
        setShowFrozenModal(true);
        setSelectedProduct(null);
        setSelectedProducts([]);
        await loadData();
      } else {
        await base44.entities.AppUser.update(appUser.id, {
          balance: (appUser.balance || 0) + totalCommission,
          tasksCompleted: (appUser.tasksCompleted || 0) + tasksToSubmit.length,
          tasksInCurrentSet: updatedTasksInSet,
          needsReset: setComplete,
          taskSetsCompleted: setComplete ? (appUser.taskSetsCompleted || 0) + 1 : appUser.taskSetsCompleted
        });

        toast.success(`🎉 ${tasksToSubmit.length} task${tasksToSubmit.length > 1 ? 's' : ''} completed! +$${totalCommission.toFixed(2)}`, {
          description: setComplete 
            ? `Set ${currentSet} complete! Contact support to continue.`
            : `${tasksPerSet - updatedTasksInSet} tasks remaining in Set ${currentSet}`
        });
        setShowSubmitModal(false);
        setSelectedProduct(null);
        setSelectedProducts([]);
        await loadData();
      }
    } catch (error) {
      toast.error("Failed to submit task");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800">
      {/* Header */}
      <div className="bg-black/40 backdrop-blur-sm px-4 py-4 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <button type="button" onClick={() => onNavigate("home")} className="p-2 -ml-2 hover:bg-white/10 rounded-lg">
            <ChevronLeft className="w-6 h-6 text-white" />
          </button>
          <h1 className="text-white text-xl font-bold">Task Set {currentSet} of 2</h1>
          <button 
            type="button" 
            onClick={() => setShowSupport(true)}
            className="p-2 -mr-2 hover:bg-white/10 rounded-lg"
            title="Contact Support"
          >
            <MessageCircle className="w-6 h-6 text-white" />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 py-8">
        <div className="max-w-md mx-auto space-y-6">

          {/* Filters */}
          {canStartTasks && (categories.length > 0 || priorities.length > 0) && (
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-3">
              <div className="grid grid-cols-3 gap-2">
                {categories.length > 0 && (
                  <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="px-2 py-1.5 rounded-lg bg-white/90 text-gray-900 text-sm border-none"
                  >
                    <option value="all">All Categories</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>
                        {cat.icon} {cat.name}
                      </option>
                    ))}
                  </select>
                )}
                
                {priorities.length > 0 && (
                  <select
                    value={filterPriority}
                    onChange={(e) => setFilterPriority(e.target.value)}
                    className="px-2 py-1.5 rounded-lg bg-white/90 text-gray-900 text-sm border-none"
                  >
                    <option value="all">All Priorities</option>
                    {priorities.map(pri => (
                      <option key={pri.id} value={pri.id}>
                        {pri.name}
                      </option>
                    ))}
                  </select>
                )}

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-2 py-1.5 rounded-lg bg-white/90 text-gray-900 text-sm border-none"
                >
                  <option value="default">Default Sort</option>
                  <option value="commission-high">Comm: High</option>
                  <option value="commission-low">Comm: Low</option>
                  <option value="price-high">Price: High</option>
                  <option value="price-low">Price: Low</option>
                </select>
              </div>
            </div>
          )}
          
          {/* Set Progress Card */}
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6">
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-white/70 text-sm font-medium">Set {currentSet} Progress</span>
                <span className="text-white font-bold">{tasksInCurrentSet}/{tasksPerSet}</span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-3 overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all duration-500"
                  style={{ width: `${(tasksInCurrentSet / tasksPerSet) * 100}%` }}
                />
              </div>
            </div>
            <div className="text-white/60 text-sm">
              {tasksRemaining} tasks remaining in this set
            </div>
          </div>

          {/* Status Card */}
          {isFrozen ? (
            <div className="bg-red-500/20 border border-red-500/50 rounded-2xl p-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-red-200 font-bold mb-1">Account Frozen</h3>
                  <p className="text-red-100/80 text-sm mb-4">
                    Your account is frozen due to premium product submission. Contact Customer Service to unfreeze.
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowSupport(true)}
                    className="w-full py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors"
                  >
                    Contact Support
                  </button>
                </div>
              </div>
            </div>
          ) : awaitingReset ? (
            <div className="bg-amber-500/20 border border-amber-500/50 rounded-2xl p-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-6 h-6 text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-amber-200 font-bold mb-1">Reset Required</h3>
                  <p className="text-amber-100/80 text-sm mb-4">
                    You've completed Set {appUser.taskSetsCompleted}. Contact Customer Service to unlock the next set.
                  </p>
                  <button
                    type="button"
                    onClick={() => onNavigate("starting")}
                    className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-medium transition-colors"
                  >
                    Contact Support
                  </button>
                </div>
              </div>
            </div>
          ) : isComplete ? (
            <div className="bg-green-500/20 border border-green-500/50 rounded-2xl p-6">
              <div className="flex items-start gap-3">
                <Check className="w-6 h-6 text-green-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-green-200 font-bold mb-1">All Tasks Complete!</h3>
                  <p className="text-green-100/80 text-sm">
                    You've completed all required task sets. Your balance is ready for withdrawal.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-blue-500/20 border border-blue-500/50 rounded-2xl p-6">
              <p className="text-blue-100 text-sm">
                Complete {tasksRemaining} more tasks to finish Set {currentSet}.
              </p>
            </div>
          )}

          {/* Balance Validation Alert */}
          {canStartTasks && appUser && (
            <TaskSubmissionValidator 
              userVipLevel={appUser.vipLevel || "Bronze"}
              userBalance={appUser.balance || 0}
              canSubmit={canSubmitTask(appUser.vipLevel || "Bronze", appUser.balance || 0)}
            />
          )}

          {/* Action Button */}
          {canStartTasks && canSubmitTask(appUser.vipLevel || "Bronze", appUser.balance || 0) && (
            <button
              type="button"
              onClick={handleStartTask}
              disabled={submitting || availableProducts.length === 0}
              className="w-full py-4 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 disabled:from-gray-600 disabled:to-gray-600 text-white rounded-xl font-bold text-lg flex items-center justify-center gap-3 transition-all disabled:cursor-not-allowed shadow-lg shadow-blue-500/50"
            >
              <Sparkles className="w-5 h-5" />
              {submitting ? "Submitting..." : "Submit Task"}
            </button>
          )}

          {/* Contact Support Button - Shown when balance insufficient */}
          {canStartTasks && !canSubmitTask(appUser.vipLevel || "Bronze", appUser.balance || 0) && (
            <button
              type="button"
              onClick={() => setShowSupport(true)}
              className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl font-bold text-lg flex items-center justify-center gap-3 transition-all shadow-lg shadow-amber-500/50"
            >
              <MessageCircle className="w-5 h-5" />
              Contact Customer Service
            </button>
          )}

          {!canStartTasks && !isComplete && !isFrozen && (
            <div className="w-full py-4 bg-gray-600 text-gray-300 rounded-xl font-bold text-center">
              Awaiting Reset
            </div>
          )}

          {isFrozen && (
            <div className="w-full py-4 bg-red-600 text-white rounded-xl font-bold text-center">
              Account Frozen - Contact Support
            </div>
          )}

          {isComplete && (
            <button
              type="button"
              onClick={() => onNavigate("my")}
              className="w-full py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-xl font-bold text-lg transition-all"
            >
              View Balance & Withdraw
            </button>
          )}

          {/* Daily & Weekly Progress */}
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-green-400" />
              <h3 className="text-white font-bold">Your Progress</h3>
            </div>
            
            <div className="space-y-4">
              {/* Daily Progress */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-blue-400" />
                    <span className="text-white/70 text-sm">Today's Goal</span>
                  </div>
                  <span className="text-white font-bold text-sm">{dailyProgress.completed}/{dailyProgress.total}</span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-2.5 overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all duration-500"
                    style={{ width: `${Math.min((dailyProgress.completed / dailyProgress.total) * 100, 100)}%` }}
                  />
                </div>
                <p className="text-white/50 text-xs mt-1">{dailyProgress.total - dailyProgress.completed} tasks to reach daily goal</p>
              </div>

              {/* Weekly Progress */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-purple-400" />
                    <span className="text-white/70 text-sm">This Week</span>
                  </div>
                  <span className="text-white font-bold text-sm">{weeklyProgress.completed}/{weeklyProgress.total}</span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-2.5 overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500"
                    style={{ width: `${Math.min((weeklyProgress.completed / weeklyProgress.total) * 100, 100)}%` }}
                  />
                </div>
                <p className="text-white/50 text-xs mt-1">{weeklyProgress.total - weeklyProgress.completed} tasks to reach weekly goal</p>
              </div>
            </div>
          </div>

          {/* Completed Tasks - Quick Rate */}
          {completedUnratedTasks.length > 0 && (
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Star className="w-5 h-5 text-yellow-400" />
                <h3 className="text-white font-bold">Rate Your Tasks</h3>
              </div>
              <div className="space-y-2">
                {completedUnratedTasks.map(task => {
                  const product = products.find(p => p.id === task.productId);
                  return (
                    <div key={task.id} className="bg-white/5 rounded-lg p-3 flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-white text-sm font-medium">{product?.name || "Task"}</p>
                        <p className="text-white/50 text-xs">+${task.commission?.toFixed(2)}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setTaskToRate(task);
                          setShowRatingModal(true);
                        }}
                        className="px-4 py-2 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white rounded-lg text-sm font-medium flex items-center gap-2 transition-all"
                      >
                        <Star className="w-4 h-4" />
                        Rate
                      </button>
                    </div>
                  );
                })}
              </div>
              <button
                type="button"
                onClick={() => onNavigate("taskHistory")}
                className="w-full mt-3 py-2 bg-white/5 hover:bg-white/10 text-white/70 rounded-lg text-sm font-medium transition-colors"
              >
                View All Completed Tasks
              </button>
            </div>
          )}

          {/* Task Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4">
              <div className="text-white/60 text-xs font-medium mb-1">Total Tasks</div>
              <div className="text-white text-2xl font-bold">{appUser.tasksCompleted || 0}</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4">
              <div className="text-white/60 text-xs font-medium mb-1">Pending Balance</div>
              <div className="text-white text-2xl font-bold">${(appUser.balance || 0).toFixed(2)}</div>
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <p className="text-white/60 text-xs leading-relaxed">
              💡 <strong>After completing both task sets:</strong> Contact Customer Service to request withdrawal eligibility.
            </p>
          </div>
        </div>
      </div>



      {/* Support Modal */}
      {showSupport && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <CustomerServiceChat 
            currentUser={currentUser}
            initialRequest="task_reset"
            onNavigate={(page) => {
              setShowSupport(false);
              onNavigate(page);
            }}
            onClose={() => setShowSupport(false)}
            isModal={true}
          />
        </div>
      )}

      {/* Frozen Balance Modal */}
      {showFrozenModal && frozenProduct && (
        <FrozenBalanceModal
          premiumProduct={frozenProduct}
          currentBalance={appUser.balance + frozenProduct.price}
          onContactSupport={() => {
            setShowFrozenModal(false);
            setShowSupport(true);
          }}
          onClose={() => setShowFrozenModal(false)}
        />
      )}

      {/* Rating Modal */}
      {showRatingModal && taskToRate && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Rate Your Task</h2>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">How satisfied were you with this task?</p>
              <div className="flex items-center justify-center gap-2">
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="transition-transform hover:scale-110"
                  >
                    <Star 
                      className={`w-10 h-10 ${star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Feedback (Optional)
              </label>
              <textarea
                value={ratingFeedback}
                onChange={(e) => setRatingFeedback(e.target.value)}
                placeholder="Share your thoughts about this task..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowRatingModal(false);
                  setTaskToRate(null);
                  setRating(0);
                  setRatingFeedback("");
                }}
                className="flex-1 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRateTask}
                className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
              >
                Submit Rating
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Submit Modal */}
      {showSubmitModal && selectedProduct && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className={`bg-gray-900 rounded-2xl p-6 w-full max-w-md border ${
            selectedProduct?.isPremium ? "border-yellow-500" : "border-gray-700"
          }`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white text-xl font-bold">Submit Task</h2>
              {selectedProduct?.isPremium && (
                <span className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1">
                  <Crown className="w-3 h-3" />
                  PREMIUM
                </span>
              )}
            </div>

            {selectedProduct && (
              <>
                <div className="w-full h-40 bg-gray-800 rounded-xl overflow-hidden mb-4 relative">
                  {selectedProduct.imageUrl ? (
                    <img src={selectedProduct.imageUrl} alt={selectedProduct.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-500">No Image</div>
                  )}
                  {(() => {
                    const priority = getPriorityData(selectedProduct.priorityId);
                    return priority && (
                      <div 
                        className="absolute top-2 right-2 px-2 py-1 rounded-lg text-xs font-bold text-white shadow-lg"
                        style={{ backgroundColor: priority.color }}
                      >
                        {priority.name}
                      </div>
                    );
                  })()}
                </div>

                <div className="mb-4">
                  <div className="flex items-start justify-between mb-1">
                    <h3 className="text-white font-bold flex-1">{selectedProduct.name}</h3>
                    {(() => {
                      const categoryName = getCategoryName(selectedProduct.categoryId);
                      return categoryName && (
                        <span className="text-xs text-gray-400 ml-2">{categoryName}</span>
                      );
                    })()}
                  </div>
                  <p className="text-gray-400 text-sm mb-2">Price: ${selectedProduct.price}</p>
                  {selectedProduct.bundleItems?.length > 0 && (
                    <div className="mb-2 bg-purple-500/20 border border-purple-500/50 rounded-lg p-2">
                      <p className="text-purple-300 text-xs font-medium mb-1">Bundle includes:</p>
                      <ul className="text-purple-200 text-xs space-y-0.5">
                        {selectedProduct.bundleItems.map((item, i) => (
                          <li key={i}>• {item}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <div className={`rounded-lg p-3 ${
                    selectedProduct.isPremium
                      ? "bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/50"
                      : "bg-green-500/20 border border-green-500/50"
                  }`}>
                    {(() => {
                      const priority = getPriorityData(selectedProduct.priorityId);
                      const commission = selectedProduct.commission * (priority?.multiplier || 1);
                      return (
                        <p className={`text-sm font-medium flex items-center justify-between ${
                          selectedProduct.isPremium ? "text-yellow-300" : "text-green-300"
                        }`}>
                          <span>Earn: ${commission.toFixed(2)}</span>
                          <div className="flex items-center gap-2">
                            {priority && priority.multiplier !== 1 && (
                              <span className="bg-purple-500 text-white px-2 py-0.5 rounded text-xs font-bold">
                                {priority.multiplier}x
                              </span>
                            )}
                            {selectedProduct.isPremium && (
                              <span className="bg-orange-500 text-white px-2 py-0.5 rounded text-xs font-bold">
                                10x
                              </span>
                            )}
                          </div>
                        </p>
                      );
                    })()}
                  </div>
                </div>
              </>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowSubmitModal(false);
                  setSelectedProduct(null);
                  setSelectedProducts([]);
                }}
                className="flex-1 py-3 border border-gray-600 text-gray-300 rounded-lg font-medium hover:bg-gray-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmitTask}
                disabled={submitting}
                className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg font-medium transition-colors"
              >
                {submitting ? "Submitting..." : "Submit"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}