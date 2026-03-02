import { useState, useEffect } from 'react';
import { Target, Plus, Trash2 } from 'lucide-react';
import { backendClient } from '@/api/backendClient';
import { toast } from 'sonner';

export default function SegmentTaskAssigner() {
  const [segments, setSegments] = useState([]);
  const [products, setProducts] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    segmentId: '',
    productId: '',
    assignmentType: 'preferred',
    priority: 0
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [segmentsData, productsData, assignmentsData] = await Promise.all([
        backendClient.entities.UserSegment.filter({ isActive: true }),
        backendClient.entities.Product.filter({ isActive: true }),
        backendClient.entities.SegmentTaskAssignment.list('-created_date')
      ]);
      setSegments(segmentsData);
      setProducts(productsData);
      setAssignments(assignmentsData);
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAssignment = async () => {
    if (!formData.segmentId || !formData.productId) {
      toast.error('Please select segment and product');
      return;
    }

    try {
      await backendClient.entities.SegmentTaskAssignment.create(formData);
      toast.success('Task assignment created');
      setShowForm(false);
      setFormData({ segmentId: '', productId: '', assignmentType: 'preferred', priority: 0 });
      loadData();
    } catch (error) {
      toast.error('Failed to create assignment');
    }
  };

  const handleDeleteAssignment = async (id) => {
    if (!confirm('Delete this assignment?')) return;
    try {
      await backendClient.entities.SegmentTaskAssignment.delete(id);
      toast.success('Assignment deleted');
      loadData();
    } catch (error) {
      toast.error('Failed to delete assignment');
    }
  };

  const getSegmentName = (id) => segments.find(s => s.id === id)?.name || 'Unknown';
  const getProductName = (id) => products.find(p => p.id === id)?.name || 'Unknown';

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Segment Task Assignment</h2>
          <p className="text-gray-600 mt-1">Assign specific tasks to user segments</p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          New Assignment
        </button>
      </div>

      {/* Assignments by Segment */}
      {segments.map(segment => {
        const segmentAssignments = assignments.filter(a => a.segmentId === segment.id);
        if (segmentAssignments.length === 0) return null;

        return (
          <div key={segment.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">{segment.name}</h3>
            <div className="space-y-2">
              {segmentAssignments.map(assignment => (
                <div key={assignment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Target className="w-4 h-4 text-blue-600" />
                    <div>
                      <div className="font-medium text-gray-900">{getProductName(assignment.productId)}</div>
                      <div className="text-sm text-gray-600">
                        <span className={`inline-block px-2 py-0.5 rounded text-xs ${
                          assignment.assignmentType === 'exclusive' ? 'bg-purple-100 text-purple-800' :
                          assignment.assignmentType === 'preferred' ? 'bg-blue-100 text-blue-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {assignment.assignmentType}
                        </span>
                        {assignment.priority > 0 && (
                          <span className="ml-2">Priority: {assignment.priority}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteAssignment(assignment.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {assignments.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <Target className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>No task assignments yet</p>
        </div>
      )}

      {/* Assignment Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">New Task Assignment</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Segment *</label>
                <select
                  value={formData.segmentId}
                  onChange={(e) => setFormData({ ...formData, segmentId: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="">Select segment...</option>
                  {segments.map(seg => (
                    <option key={seg.id} value={seg.id}>{seg.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Task/Product *</label>
                <select
                  value={formData.productId}
                  onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="">Select task...</option>
                  {products.map(prod => (
                    <option key={prod.id} value={prod.id}>{prod.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Assignment Type</label>
                <select
                  value={formData.assignmentType}
                  onChange={(e) => setFormData({ ...formData, assignmentType: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="preferred">Preferred (boost this task)</option>
                  <option value="exclusive">Exclusive (only this segment)</option>
                  <option value="excluded">Excluded (hide from segment)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Priority Weight</label>
                <input
                  type="number"
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="0 = default"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="flex-1 py-2 border rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveAssignment}
                className="flex-1 py-2 bg-blue-600 text-white rounded-lg"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}