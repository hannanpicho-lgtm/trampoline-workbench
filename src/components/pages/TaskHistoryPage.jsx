import { useState, useEffect } from "react";
import { ChevronLeft, CheckCircle, Clock, XCircle, Crown, Filter, TrendingUp, DollarSign, Award, Star, MessageSquare } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

export default function TaskHistoryPage({ currentUser, onNavigate }) {
  const [appUser, setAppUser] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState("date-desc");
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [ratingTask, setRatingTask] = useState(null);
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [submittingRating, setSubmittingRating] = useState(false);

  useEffect(() => {
    loadData();
  }, [currentUser]);

  const loadData = async () => {
    setLoading(true);
    try {
      const appUserData = await base44.entities.AppUser.filter({ created_by: currentUser.email });
      if (appUserData.length > 0) {
        const [tasksData, productsData] = await Promise.all([
          base44.entities.UserTask.filter({ userId: appUserData[0].id }),
          base44.entities.Product.list()
        ]);

        setAppUser(appUserData[0]);
        setTasks(tasksData);
        setProducts(productsData);
      }
    } catch (error) {
      toast.error("Failed to load task history");
    } finally {
      setLoading(false);
    }
  };

  const getProduct = (productId) => {
    return products.find(p => p.id === productId);
  };

  // Filter tasks
  const filteredTasks = filterStatus === "all" 
    ? tasks 
    : tasks.filter(t => t.status === filterStatus);

  // Sort tasks
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    switch (sortBy) {
      case "date-desc":
        return new Date(b.created_date).getTime() - new Date(a.created_date).getTime();
      case "date-asc":
        return new Date(a.created_date).getTime() - new Date(b.created_date).getTime();
      case "commission-desc":
        return b.commission - a.commission;
      case "commission-asc":
        return a.commission - b.commission;
      case "rating-desc":
        return (b.rating || 0) - (a.rating || 0);
      default:
        return 0;
    }
  });

  // Calculate performance metrics
  const approvedTasks = tasks.filter(t => t.status === "approved");
  const totalEarnings = approvedTasks.reduce((sum, t) => sum + (t.commission || 0), 0);
  const avgCommission = approvedTasks.length > 0 ? totalEarnings / approvedTasks.length : 0;
  const completionRate = tasks.length > 0 
    ? ((approvedTasks.length / tasks.length) * 100).toFixed(1)
    : 0;
  const ratedTasks = tasks.filter(t => t.rating);
  const avgRating = ratedTasks.length > 0
    ? (ratedTasks.reduce((sum, t) => sum + t.rating, 0) / ratedTasks.length).toFixed(1)
    : 0;

  const getStatusIcon = (status) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "completed":
        return <Clock className="w-5 h-5 text-blue-500" />;
      case "pending":
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case "rejected":
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800";
      case "completed":
        return "bg-blue-100 text-blue-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleRateTask = (task) => {
    setRatingTask(task);
    setRating(task.rating || 0);
    setFeedback(task.ratingFeedback || "");
    setShowRatingModal(true);
  };

  const submitRating = async () => {
    if (rating === 0) {
      toast.error("Please select a rating");
      return;
    }

    setSubmittingRating(true);
    try {
      await base44.entities.UserTask.update(ratingTask.id, {
        rating,
        ratingFeedback: feedback,
        ratedAt: new Date().toISOString()
      });

      toast.success("Thank you for your feedback!");
      setShowRatingModal(false);
      setRatingTask(null);
      setRating(0);
      setFeedback("");
      loadData();
    } catch (error) {
      toast.error("Failed to submit rating");
    } finally {
      setSubmittingRating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 flex items-center justify-center">
        <div className="text-white text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800">
      {/* Header */}
      <div className="bg-black/40 backdrop-blur-sm px-4 py-4 border-b border-gray-700">
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => onNavigate("home")} className="p-2 -ml-2 hover:bg-white/10 rounded-lg">
            <ChevronLeft className="w-6 h-6 text-white" />
          </button>
          <h1 className="text-white text-xl font-bold">Task History</h1>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="px-4 py-6">
        <div className="max-w-2xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <div className="bg-white/10 backdrop-blur rounded-xl p-4 border border-white/20">
              <div className="flex items-center gap-2 mb-1">
                <Award className="w-4 h-4 text-blue-400" />
                <div className="text-white/60 text-xs">Total Tasks</div>
              </div>
              <div className="text-white text-2xl font-bold">{tasks.length}</div>
            </div>
            <div className="bg-green-500/20 backdrop-blur rounded-xl p-4 border border-green-500/50">
              <div className="flex items-center gap-2 mb-1">
                <DollarSign className="w-4 h-4 text-green-400" />
                <div className="text-green-200 text-xs">Total Earned</div>
              </div>
              <div className="text-white text-2xl font-bold">${totalEarnings.toFixed(2)}</div>
            </div>
            <div className="bg-blue-500/20 backdrop-blur rounded-xl p-4 border border-blue-500/50">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-4 h-4 text-blue-400" />
                <div className="text-blue-200 text-xs">Success Rate</div>
              </div>
              <div className="text-white text-2xl font-bold">{completionRate}%</div>
            </div>
            <div className="bg-yellow-500/20 backdrop-blur rounded-xl p-4 border border-yellow-500/50">
              <div className="flex items-center gap-2 mb-1">
                <Star className="w-4 h-4 text-yellow-400" />
                <div className="text-yellow-200 text-xs">Avg Rating</div>
              </div>
              <div className="text-white text-2xl font-bold">{avgRating || "N/A"}</div>
            </div>
          </div>

          {/* Additional Stats */}
          <div className="bg-white/5 backdrop-blur rounded-xl p-4 border border-white/10 mb-6">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-white/60 mb-1">Approved Tasks</div>
                <div className="text-white font-bold">{approvedTasks.length}</div>
              </div>
              <div>
                <div className="text-white/60 mb-1">Avg Commission</div>
                <div className="text-white font-bold">${avgCommission.toFixed(2)}</div>
              </div>
              <div>
                <div className="text-white/60 mb-1">Pending Tasks</div>
                <div className="text-white font-bold">
                  {tasks.filter(t => t.status === "pending" || t.status === "completed").length}
                </div>
              </div>
              <div>
                <div className="text-white/60 mb-1">Tasks Rated</div>
                <div className="text-white font-bold">{ratedTasks.length} / {approvedTasks.length}</div>
              </div>
            </div>
          </div>

          {/* Filters and Sort */}
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-white/60" />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="flex-1 bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm"
                >
                  <option value="all">All Status</option>
                  <option value="approved">Approved</option>
                  <option value="completed">Completed</option>
                  <option value="pending">Pending</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
            </div>
            <div className="flex-1">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm"
              >
                <option value="date-desc">Newest First</option>
                <option value="date-asc">Oldest First</option>
                <option value="commission-desc">Highest Commission</option>
                <option value="commission-asc">Lowest Commission</option>
                <option value="rating-desc">Highest Rating</option>
              </select>
            </div>
          </div>

          {/* Task List */}
          <div className="space-y-3">
            {sortedTasks.length === 0 ? (
              <div className="bg-white/5 border border-white/10 rounded-xl p-12 text-center">
                <p className="text-white/60">No tasks found</p>
              </div>
            ) : (
              sortedTasks.map((task) => {
                const product = getProduct(task.productId);
                const canRate = task.status === "approved" && !task.rating;
                
                return (
                  <div key={task.id} className="bg-white/10 backdrop-blur border border-white/20 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-16 h-16 bg-gray-700 rounded-lg overflow-hidden flex-shrink-0">
                        {product?.imageUrl ? (
                          <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-500 text-xs">No Image</div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex-1">
                            <h3 className="text-white font-semibold text-sm mb-1 line-clamp-1">
                              {product?.name || "Unknown Product"}
                            </h3>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                                {task.status}
                              </span>
                              {product?.isPremium && (
                                <span className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-2 py-0.5 rounded text-xs font-bold flex items-center gap-1">
                                  <Crown className="w-3 h-3" />
                                  PREMIUM
                                </span>
                              )}
                            </div>
                          </div>
                          {getStatusIcon(task.status)}
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                          <div>
                            <span className="text-white/60">Commission:</span>
                            <span className="text-green-400 font-bold ml-1">${task.commission.toFixed(2)}</span>
                          </div>
                          <div>
                            <span className="text-white/60">Date:</span>
                            <span className="text-white/80 ml-1">
                              {new Date(task.created_date).toLocaleDateString()}
                            </span>
                          </div>
                        </div>

                        {/* Rating Display */}
                        {task.rating && (
                          <div className="mb-2 bg-yellow-500/20 border border-yellow-500/50 rounded-lg p-2">
                            <div className="flex items-center gap-1 mb-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={`w-4 h-4 ${
                                    star <= task.rating
                                      ? "fill-yellow-400 text-yellow-400"
                                      : "text-gray-600"
                                  }`}
                                />
                              ))}
                              <span className="text-yellow-300 text-xs ml-1">
                                {task.rating}/5
                              </span>
                            </div>
                            {task.ratingFeedback && (
                              <p className="text-yellow-200 text-xs">{task.ratingFeedback}</p>
                            )}
                          </div>
                        )}

                        {/* Rate Task Button */}
                        {canRate && (
                          <button
                            type="button"
                            onClick={() => handleRateTask(task)}
                            className="w-full mt-2 py-2 bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-500/50 text-yellow-300 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors"
                          >
                            <Star className="w-4 h-4" />
                            Rate This Task
                          </button>
                        )}

                        {task.submittedAt && (
                          <div className="text-xs text-white/60 mt-1">
                            Submitted: {new Date(task.submittedAt).toLocaleString()}
                          </div>
                        )}
                        {task.approvedAt && (
                          <div className="text-xs text-green-400 mt-1">
                            Approved: {new Date(task.approvedAt).toLocaleString()}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Rating Modal */}
      {showRatingModal && ratingTask && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 rounded-2xl p-6 w-full max-w-md border border-gray-700">
            <h2 className="text-white text-xl font-bold mb-4">Rate Task Quality</h2>
            
            <div className="mb-4">
              <div className="bg-white/5 rounded-lg p-3 mb-4">
                <p className="text-white/80 text-sm">
                  {products.find(p => p.id === ratingTask.productId)?.name || "Task"}
                </p>
                <p className="text-green-400 text-xs mt-1">
                  Earned: ${ratingTask.commission.toFixed(2)}
                </p>
              </div>

              <div className="mb-4">
                <label className="block text-white/80 text-sm mb-2">Your Rating</label>
                <div className="flex items-center justify-center gap-2 py-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="transition-transform hover:scale-110"
                    >
                      <Star
                        className={`w-10 h-10 ${
                          star <= rating
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-gray-600 hover:text-gray-500"
                        }`}
                      />
                    </button>
                  ))}
                </div>
                <div className="text-center text-white/60 text-sm">
                  {rating === 0 && "Select a rating"}
                  {rating === 1 && "Poor"}
                  {rating === 2 && "Fair"}
                  {rating === 3 && "Good"}
                  {rating === 4 && "Very Good"}
                  {rating === 5 && "Excellent"}
                </div>
              </div>

              <div>
                <label className="block text-white/80 text-sm mb-2">
                  Feedback (Optional)
                </label>
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Share your experience with this task..."
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm"
                  rows={3}
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowRatingModal(false);
                  setRatingTask(null);
                  setRating(0);
                  setFeedback("");
                }}
                className="flex-1 py-3 border border-gray-600 text-gray-300 rounded-lg font-medium hover:bg-gray-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submitRating}
                disabled={submittingRating || rating === 0}
                className="flex-1 py-3 bg-yellow-500 hover:bg-yellow-600 disabled:bg-gray-600 text-white rounded-lg font-medium transition-colors"
              >
                {submittingRating ? "Submitting..." : "Submit Rating"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}