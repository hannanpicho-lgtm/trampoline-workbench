import { useState, useEffect } from "react";
import { ChevronLeft, Calendar, Lock, CheckCircle, Clock, ArrowDown, ArrowUp } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { getTasksPerSet } from "../shared/VIPTaskConfig";

export default function RecordsPage({ currentUser, onNavigate }) {
  const [appUser, setAppUser] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [products, setProducts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    loadData();
  }, [currentUser]);

  const loadData = async () => {
    setLoading(true);
    try {
      const appUserData = await base44.entities.AppUser.filter({ created_by: currentUser.email });
      
      if (appUserData.length === 0) {
        setLoading(false);
        return;
      }

      setAppUser(appUserData[0]);

      const [tasksData, productsData, transactionsData] = await Promise.all([
        base44.entities.UserTask.filter({ userId: appUserData[0].id }, "-created_date", 100),
        base44.entities.Product.filter({ isActive: true }),
        base44.entities.Transaction.filter({ userId: appUserData[0].id }, "-created_date", 100)
      ]);

      setTasks(tasksData);
      setProducts(productsData);
      setTransactions(transactionsData);
    } catch (error) {
      console.error("Failed to load data", error);
    } finally {
      setLoading(false);
    }
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

  const tasksPerSet = getTasksPerSet(appUser.vipLevel || "Bronze");
  const completedTasks = tasks.filter(t => t.status === "completed" || t.status === "approved");
  const totalEarnings = completedTasks.reduce((sum, t) => sum + (t.commission || 0), 0);
  const canWithdraw = appUser.taskSetsCompleted >= 2;

  const getProduct = (productId) => {
    return products.find(p => p.id === productId);
  };

  const filteredTasks = activeTab === "all" 
    ? tasks 
    : activeTab === "completed"
    ? completedTasks
    : tasks.filter(t => t.status === "pending");

  const filteredTransactions = activeTab === "transactions"
    ? transactions.filter(t => t.type === "deposit" || t.type === "withdrawal")
    : activeTab === "deposits"
    ? transactions.filter(t => t.type === "deposit")
    : activeTab === "withdrawals"
    ? transactions.filter(t => t.type === "withdrawal")
    : [];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800">
      {/* Header */}
      <div className="bg-black/40 backdrop-blur-sm px-4 py-4 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <button type="button" onClick={() => onNavigate("home")} className="p-2 -ml-2 hover:bg-white/10 rounded-lg">
            <ChevronLeft className="w-6 h-6 text-white" />
          </button>
          <h1 className="text-white text-xl font-bold">Records</h1>
          <div className="w-10" />
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-gray-800/50 border-b border-gray-700 flex overflow-x-auto hide-scrollbar">
        {[
          { id: "all", label: "All Tasks" },
          { id: "completed", label: "Completed" },
          { id: "pending", label: "Pending" },
          { id: "transactions", label: "Transactions" },
          { id: "deposits", label: "Deposits" },
          { id: "withdrawals", label: "Withdrawals" }
        ].map(tab => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-3 font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === tab.id
                ? "border-blue-500 text-blue-400"
                : "border-transparent text-gray-400 hover:text-gray-300"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="px-4 py-6 pb-20">
        {/* Performance Summary - Only show for task tabs */}
        {!["transactions", "deposits", "withdrawals"].includes(activeTab) && (
          <div className="max-w-2xl mx-auto mb-8">
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6">
              <h2 className="text-white font-bold mb-4">Performance Summary</h2>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div>
                  <p className="text-white/60 text-sm mb-1">Completed</p>
                  <p className="text-white text-2xl font-bold">{completedTasks.length}</p>
                </div>
                <div>
                  <p className="text-white/60 text-sm mb-1">Earned</p>
                  <p className="text-green-400 text-2xl font-bold">${totalEarnings.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-white/60 text-sm mb-1">Sets Done</p>
                  <p className="text-blue-400 text-2xl font-bold">{appUser.taskSetsCompleted}/2</p>
                </div>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                <p className="text-white/60 text-xs">
                  {canWithdraw 
                    ? "✅ Your balance is ready for withdrawal"
                    : `⏳ Complete ${2 - appUser.taskSetsCompleted} more set(s) to enable withdrawal`
                  }
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Transaction Summary - Show for transaction tabs */}
        {["transactions", "deposits", "withdrawals"].includes(activeTab) && (
          <div className="max-w-2xl mx-auto mb-8">
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6">
              <h2 className="text-white font-bold mb-4">Transaction Summary</h2>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-white/60 text-sm mb-1">Total</p>
                  <p className="text-white text-2xl font-bold">
                    {transactions.filter(t => t.type === "deposit" || t.type === "withdrawal").length}
                  </p>
                </div>
                <div>
                  <p className="text-white/60 text-sm mb-1">Deposits</p>
                  <p className="text-green-400 text-2xl font-bold">
                    ${transactions.filter(t => t.type === "deposit").reduce((sum, t) => sum + t.amount, 0).toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-white/60 text-sm mb-1">Withdrawals</p>
                  <p className="text-red-400 text-2xl font-bold">
                    ${transactions.filter(t => t.type === "withdrawal").reduce((sum, t) => sum + t.amount, 0).toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Transactions List */}
        {["transactions", "deposits", "withdrawals"].includes(activeTab) && (
          filteredTransactions.length === 0 ? (
            <div className="max-w-2xl mx-auto text-center py-12">
              <p className="text-white/60">No transactions to display</p>
            </div>
          ) : (
            <div className="max-w-2xl mx-auto space-y-4">
              {filteredTransactions.map(tx => {
                const isDeposit = tx.type === "deposit";
                const isWithdrawal = tx.type === "withdrawal";
                const statusColor = tx.status === "completed" 
                  ? "bg-green-500/20 border-green-500/50"
                  : tx.status === "pending"
                  ? "bg-yellow-500/20 border-yellow-500/50"
                  : "bg-red-500/20 border-red-500/50";

                return (
                  <div key={tx.id} className={`bg-white/10 backdrop-blur-sm border ${statusColor} rounded-xl p-4`}>
                    <div className="flex items-start gap-4">
                      {/* Icon */}
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        isDeposit ? "bg-green-500/20" : isWithdrawal ? "bg-red-500/20" : "bg-blue-500/20"
                      }`}>
                        {isDeposit ? (
                          <ArrowDown className="w-6 h-6 text-green-400" />
                        ) : isWithdrawal ? (
                          <ArrowUp className="w-6 h-6 text-red-400" />
                        ) : (
                          <span className="text-xl">💰</span>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="text-white font-bold capitalize">{tx.type}</h3>
                            <p className="text-white/60 text-xs mt-1 flex items-center gap-2">
                              <Calendar className="w-3 h-3" />
                              {new Date(tx.created_date).toLocaleDateString()} {new Date(tx.created_date).toLocaleTimeString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className={`text-xl font-bold ${
                              isDeposit ? "text-green-400" : isWithdrawal ? "text-red-400" : "text-blue-400"
                            }`}>
                              {isWithdrawal ? "-" : "+"}${tx.amount.toFixed(2)}
                            </p>
                            <p className={`text-xs font-medium mt-1 ${
                              tx.status === "completed" ? "text-green-400" :
                              tx.status === "pending" ? "text-yellow-400" : "text-red-400"
                            }`}>
                              {tx.status}
                            </p>
                          </div>
                        </div>

                        {/* Additional Info */}
                        {tx.paymentMethod && (
                          <div className="mt-2 text-sm text-white/60">
                            Method: <span className="text-white">{tx.paymentMethod}</span>
                          </div>
                        )}
                        {tx.bonus > 0 && (
                          <div className="mt-1 text-sm text-green-400">
                            🎁 Bonus: +${tx.bonus.toFixed(2)}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}

        {/* Tasks List */}
        {!["transactions", "deposits", "withdrawals"].includes(activeTab) && (filteredTasks.length === 0 ? (
          <div className="max-w-2xl mx-auto text-center py-12">
            <p className="text-white/60">No tasks to display</p>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto space-y-4">
            {filteredTasks.map(task => {
              const product = getProduct(task.productId);
              const statusIcon = task.status === "completed" || task.status === "approved"
                ? <CheckCircle className="w-5 h-5 text-green-400" />
                : <Clock className="w-5 h-5 text-yellow-400" />;
              const statusLabel = task.status === "completed" || task.status === "approved"
                ? "Completed"
                : "Pending";
              const statusColor = task.status === "completed" || task.status === "approved"
                ? "bg-green-500/20 border-green-500/50"
                : "bg-yellow-500/20 border-yellow-500/50";

              return (
                <div key={task.id} className={`bg-white/10 backdrop-blur-sm border ${statusColor} rounded-xl p-4`}>
                  <div className="flex items-start gap-4">
                    {/* Image */}
                    <div className="w-16 h-16 bg-gray-800 rounded-lg overflow-hidden flex-shrink-0">
                      {product?.imageUrl ? (
                        <img src={product.imageUrl} alt={product?.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-600">📦</div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="text-white font-bold">{product?.name || "Product"}</h3>
                          <p className="text-white/60 text-xs mt-1 flex items-center gap-2">
                            <Calendar className="w-3 h-3" />
                            {new Date(task.created_date).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 text-xs font-medium">
                          {statusIcon}
                          <span className="text-white/60">{statusLabel}</span>
                        </div>
                      </div>

                      {/* Earnings */}
                      <div className="flex items-center gap-6 text-sm">
                        <div>
                          <p className="text-white/60 text-xs">Price</p>
                          <p className="text-white font-bold">${product?.price || "0"}</p>
                        </div>
                        <div>
                          <p className="text-white/60 text-xs">Commission</p>
                          <p className="text-green-400 font-bold">${(task.commission || 0).toFixed(2)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ))}

        {/* Withdrawal Status */}
        {!["transactions", "deposits", "withdrawals"].includes(activeTab) && (
          canWithdraw ? (
          <div className="max-w-2xl mx-auto mt-12 bg-green-500/20 border border-green-500/50 rounded-2xl p-6">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-6 h-6 text-green-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-green-200 font-bold mb-1">Withdrawal Enabled</h3>
                <p className="text-green-100/80 text-sm mb-4">
                  You've completed all required task sets. Your balance is ready for withdrawal.
                </p>
                <button
                  type="button"
                  onClick={() => onNavigate("my")}
                  className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium text-sm"
                >
                  Go to Withdrawal
                </button>
              </div>
            </div>
          </div>
          ) : (
          <div className="max-w-2xl mx-auto mt-12 bg-amber-500/20 border border-amber-500/50 rounded-2xl p-6">
            <div className="flex items-start gap-3">
              <Lock className="w-6 h-6 text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-amber-200 font-bold mb-1">Withdrawal Locked</h3>
                <p className="text-amber-100/80 text-sm">
                  Complete all {2 - appUser.taskSetsCompleted} remaining task set(s) to unlock withdrawal.
                </p>
              </div>
            </div>
          </div>
          )
        )}
      </div>
    </div>
  );
}