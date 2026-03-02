import { useState, useEffect } from "react";
import { backendClient } from "@/api/backendClient";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { Sparkles, Loader2, Zap } from "lucide-react";

export default function AITaskGenerator() {
  const [generating, setGenerating] = useState(false);
  const [vipLevel, setVipLevel] = useState("Bronze");
  const [taskCount, setTaskCount] = useState(10);
  const [marketTrends, setMarketTrends] = useState("general");
  const [generatedTasks, setGeneratedTasks] = useState([]);
  const [selectedTasks, setSelectedTasks] = useState([]);
  const [includeDifficulty, setIncludeDifficulty] = useState(true);
  const [autoAssign, setAutoAssign] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [users, setUsers] = useState([]);
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const appUsers = await backendClient.entities.AppUser.list("-created_date", 100);
      setUsers(appUsers);
    } catch (error) {
      console.error("Failed to load users:", error);
    }
  };

  const generateTasks = async () => {
    setGenerating(true);
    try {
      const response = await base44.functions.invoke("aiTaskGenerator", {
        vipLevel,
        taskCount,
        marketTrends,
        includeDifficulty,
        autoAssign,
        userId: selectedUserId
      });

      setGeneratedTasks(response.data.products || []);
      setSelectedTasks(response.data.products || []);
      setSummary(response.data.summary);
      
      if (response.data.assignment?.assigned) {
        toast.success(`Generated & assigned ${response.data.products?.length || 0} tasks to user`);
      } else {
        toast.success(`Generated ${response.data.products?.length || 0} intelligent tasks with difficulty levels`);
      }
    } catch (error) {
      toast.error("Failed to generate tasks", { description: error.message });
    } finally {
      setGenerating(false);
    }
  };

  const toggleTaskSelection = (task) => {
    const isSelected = selectedTasks.some(t => t.name === task.name);
    if (isSelected) {
      setSelectedTasks(selectedTasks.filter(t => t.name !== task.name));
    } else {
      setSelectedTasks([...selectedTasks, task]);
    }
  };

  const approveAndCreateTasks = async () => {
    if (selectedTasks.length === 0) {
      toast.error("Please select at least one task");
      return;
    }

    try {
      for (const task of selectedTasks) {
        await backendClient.entities.Product.create({
          ...task,
          isActive: true
        });
      }
      toast.success(`Created ${selectedTasks.length} products successfully!`);
      setGeneratedTasks([]);
      setSelectedTasks([]);
      setSummary(null);
    } catch (error) {
      toast.error("Failed to create products", { description: error.message });
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-5 h-5 text-purple-600" />
        <h3 className="text-lg font-bold text-gray-900">AI Task Generator</h3>
      </div>

      <div className="space-y-4">
        {/* Main Controls */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">VIP Level</label>
            <select
              value={vipLevel}
              onChange={(e) => setVipLevel(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            >
              <option value="Bronze">Bronze (VIP1)</option>
              <option value="Silver">Silver (VIP2)</option>
              <option value="Gold">Gold (VIP3)</option>
              <option value="Platinum">Platinum (VIP4)</option>
              <option value="Diamond">Diamond (VIP5)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Number of Tasks</label>
            <input
              type="number"
              min="1"
              max="50"
              value={taskCount}
              onChange={(e) => setTaskCount(parseInt(e.target.value) || 10)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Market Trends</label>
            <select
              value={marketTrends}
              onChange={(e) => setMarketTrends(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            >
              <option value="general">General</option>
              <option value="trending">Trending Now</option>
              <option value="seasonal">Seasonal</option>
              <option value="premium">Premium Products</option>
              <option value="budget">Budget-Friendly</option>
              <option value="tech">Technology Focus</option>
              <option value="lifestyle">Lifestyle & Wellness</option>
            </select>
          </div>
        </div>

        {/* Advanced Options */}
        <div className="border-t border-gray-200 pt-4 space-y-3">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="includeDifficulty"
              checked={includeDifficulty}
              onChange={(e) => setIncludeDifficulty(e.target.checked)}
              className="w-4 h-4 text-purple-600 rounded"
            />
            <label htmlFor="includeDifficulty" className="text-sm text-gray-700">
              Include difficulty levels & task variations
            </label>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="autoAssign"
              checked={autoAssign}
              onChange={(e) => setAutoAssign(e.target.checked)}
              className="w-4 h-4 text-purple-600 rounded"
            />
            <label htmlFor="autoAssign" className="text-sm text-gray-700">
              Auto-assign to specific user (personalized)
            </label>
          </div>

          {autoAssign && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Select User</label>
              <select
                value={selectedUserId || ""}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm"
              >
                <option value="">Choose user...</option>
                {users.filter(u => u.vipLevel === vipLevel).map(user => (
                  <option key={user.id} value={user.id}>
                    {user.phone || user.created_by} - {user.vipLevel} (${user.balance?.toFixed(2)})
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                AI will personalize tasks based on user's history and preferences
              </p>
            </div>
          )}
        </div>

        {/* Generate Button */}
        <button
          onClick={generateTasks}
          disabled={generating}
          className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-400 disabled:to-gray-400 text-white rounded-lg font-medium flex items-center justify-center gap-2"
        >
          {generating ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Generating with AI...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              Generate Tasks with AI
            </>
          )}
        </button>

        {/* Summary Stats */}
        {summary && (
          <div className="border-t border-gray-200 pt-4 mt-4">
            <h4 className="text-sm font-semibold text-gray-900 mb-3">Generation Summary</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-green-50 rounded-lg p-3">
                <div className="text-xs text-green-600 font-medium">Easy Tasks</div>
                <div className="text-lg font-bold text-green-900">{summary.easyCount || 0}</div>
              </div>
              <div className="bg-blue-50 rounded-lg p-3">
                <div className="text-xs text-blue-600 font-medium">Medium Tasks</div>
                <div className="text-lg font-bold text-blue-900">{summary.mediumCount || 0}</div>
              </div>
              <div className="bg-orange-50 rounded-lg p-3">
                <div className="text-xs text-orange-600 font-medium">Hard Tasks</div>
                <div className="text-lg font-bold text-orange-900">{summary.hardCount || 0}</div>
              </div>
              <div className="bg-purple-50 rounded-lg p-3">
                <div className="text-xs text-purple-600 font-medium">Expert Tasks</div>
                <div className="text-lg font-bold text-purple-900">{summary.expertCount || 0}</div>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-xs text-gray-600">Avg Price</div>
                <div className="text-lg font-bold text-gray-900">${summary.averagePrice?.toFixed(2)}</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-xs text-gray-600">Total Commission</div>
                <div className="text-lg font-bold text-green-600">${summary.totalCommission?.toFixed(2)}</div>
              </div>
            </div>
            {summary.personalized && (
              <div className="mt-3 bg-purple-50 border border-purple-200 rounded-lg p-2">
                <p className="text-xs text-purple-800">
                  ✨ Personalized based on user's history and preferences
                </p>
              </div>
            )}
          </div>
        )}

        {/* Generated Tasks Preview */}
        {generatedTasks.length > 0 && (
          <div className="border-t border-gray-200 pt-6 mt-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold text-gray-900">Generated Tasks ({generatedTasks.length})</h4>
              <button
                onClick={approveAndCreateTasks}
                disabled={selectedTasks.length === 0}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg font-medium flex items-center gap-2"
              >
                <Zap className="w-4 h-4" />
                Approve & Create ({selectedTasks.length})
              </button>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {generatedTasks.map((task, index) => (
                <div key={index} className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={selectedTasks.some(t => t.name === task.name)}
                      onChange={() => toggleTaskSelection(task)}
                      className="mt-1 w-4 h-4 text-purple-600 rounded"
                    />
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h5 className="font-semibold text-gray-900">{task.name}</h5>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-gray-500">{task.category}</span>
                            {task.metadata?.difficulty && (
                              <span className={`px-1.5 py-0.5 text-xs font-medium rounded ${
                                task.metadata.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
                                task.metadata.difficulty === 'medium' ? 'bg-blue-100 text-blue-700' :
                                task.metadata.difficulty === 'hard' ? 'bg-orange-100 text-orange-700' :
                                'bg-purple-100 text-purple-700'
                              }`}>
                                {task.metadata.difficulty}
                              </span>
                            )}
                            {task.metadata?.estimatedTimeMinutes && (
                              <span className="text-xs text-gray-400">
                                ~{task.metadata.estimatedTimeMinutes}min
                              </span>
                            )}
                          </div>
                        </div>
                        {task.isPremium && (
                          <span className="px-2 py-1 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-bold rounded">
                            ⭐ PREMIUM
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Price: <strong className="text-gray-900">${task.price}</strong></span>
                        <span className="text-green-600">Commission: <strong>${task.commission.toFixed(2)}</strong></span>
                      </div>
                      {task.bundleItems?.length > 0 && (
                        <div className="mt-2 text-xs text-gray-600">
                          <strong>Bundle:</strong> {task.bundleItems.join(", ")}
                        </div>
                      )}
                      {task.metadata?.taskVariation && (
                        <div className="mt-2 bg-blue-50 border border-blue-200 rounded p-2">
                          <p className="text-xs text-blue-800">
                            <strong>Variation:</strong> {task.metadata.taskVariation}
                          </p>
                        </div>
                      )}
                      {task.metadata?.description && (
                        <p className="mt-2 text-xs text-gray-500 italic">{task.metadata.description}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800 mt-6">
        <p className="font-medium mb-2">🤖 Intelligent AI Task Generation:</p>
        <ul className="list-disc ml-4 space-y-1">
          <li><strong>Difficulty Levels:</strong> Tasks categorized as Easy, Medium, Hard, or Expert based on VIP tier</li>
          <li><strong>Task Variations:</strong> Generates diverse product variations (brands, models, styles)</li>
          <li><strong>Personalization:</strong> Analyzes user history to suggest relevant categories and pricing</li>
          <li><strong>Smart Pricing:</strong> Optimizes task prices within VIP-appropriate ranges</li>
          <li><strong>Market Trends:</strong> Incorporates current market trends and seasonal patterns</li>
          <li><strong>Premium Mix:</strong> Includes 1-2 premium bundled products with 10x commission</li>
          <li><strong>Auto-Assignment:</strong> Can automatically create and assign tasks to specific users</li>
        </ul>
      </div>
    </div>
  );
}