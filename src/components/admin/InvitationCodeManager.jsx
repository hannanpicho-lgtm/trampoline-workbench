import { useState, useEffect } from 'react';
import { Plus, Copy, CheckCircle, XCircle, Clock, Trash2, RefreshCw } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

const generateCode = () => {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  let code = '';
  
  // Generate 4 random letters
  for (let i = 0; i < 4; i++) {
    code += letters.charAt(Math.floor(Math.random() * letters.length));
  }
  
  // Add 1 random number
  code += numbers.charAt(Math.floor(Math.random() * numbers.length));
  
  return code;
};

export default function InvitationCodeManager() {
  const [codes, setCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [formData, setFormData] = useState({
    code: generateCode(),
    maxUses: 1,
    expiresAt: '',
    notes: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [codesData, user] = await Promise.all([
        base44.entities.InvitationCode.list('-created_date', 200),
        base44.auth.me()
      ]);
      setCodes(codesData);
      setCurrentUser(user);
    } catch (error) {
      toast.error('Failed to load invitation codes');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!formData.code) {
      toast.error('Code is required');
      return;
    }

    try {
      await base44.entities.InvitationCode.create({
        code: formData.code.toUpperCase(),
        createdBy: currentUser.email,
        maxUses: formData.maxUses,
        expiresAt: formData.expiresAt || null,
        notes: formData.notes,
        status: 'active',
        usedCount: 0
      });

      toast.success('Invitation code created!');
      setShowForm(false);
      setFormData({
        code: generateCode(),
        maxUses: 1,
        expiresAt: '',
        notes: ''
      });
      loadData();
    } catch (error) {
      toast.error('Failed to create code');
    }
  };

  const handleBulkCreate = async (count) => {
    if (!confirm(`Create ${count} invitation codes?`)) return;

    try {
      const bulkCodes = [];
      for (let i = 0; i < count; i++) {
        bulkCodes.push({
          code: generateCode(),
          createdBy: currentUser.email,
          maxUses: 1,
          status: 'active',
          usedCount: 0
        });
      }

      await base44.entities.InvitationCode.bulkCreate(bulkCodes);
      toast.success(`Created ${count} invitation codes!`);
      loadData();
    } catch (error) {
      toast.error('Failed to create bulk codes');
    }
  };

  const handleRevoke = async (codeId) => {
    if (!confirm('Revoke this invitation code?')) return;

    try {
      await base44.entities.InvitationCode.update(codeId, { status: 'revoked' });
      toast.success('Code revoked');
      loadData();
    } catch (error) {
      toast.error('Failed to revoke code');
    }
  };

  const handleDelete = async (codeId) => {
    if (!confirm('Delete this invitation code?')) return;

    try {
      await base44.entities.InvitationCode.delete(codeId);
      toast.success('Code deleted');
      loadData();
    } catch (error) {
      toast.error('Failed to delete code');
    }
  };

  const copyCode = (code) => {
    navigator.clipboard.writeText(code);
    toast.success('Code copied to clipboard!');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'used': return 'bg-gray-100 text-gray-800';
      case 'expired': return 'bg-orange-100 text-orange-800';
      case 'revoked': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active': return <CheckCircle className="w-4 h-4" />;
      case 'used': return <CheckCircle className="w-4 h-4" />;
      case 'expired': return <Clock className="w-4 h-4" />;
      case 'revoked': return <XCircle className="w-4 h-4" />;
      default: return null;
    }
  };

  const activeCount = codes.filter(c => c.status === 'active').length;
  const usedCount = codes.filter(c => c.status === 'used').length;

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Invitation Code Management</h2>
          <p className="text-gray-600 mt-1">Control user registration with invitation codes</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={loadData}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Create Code
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <div className="text-sm text-gray-600 mb-1">Total Codes</div>
          <div className="text-3xl font-bold text-gray-900">{codes.length}</div>
        </div>
        <div className="bg-green-50 rounded-lg shadow-sm p-4 border border-green-200">
          <div className="text-sm text-green-600 mb-1">Active</div>
          <div className="text-3xl font-bold text-green-900">{activeCount}</div>
        </div>
        <div className="bg-gray-50 rounded-lg shadow-sm p-4 border border-gray-200">
          <div className="text-sm text-gray-600 mb-1">Used</div>
          <div className="text-3xl font-bold text-gray-900">{usedCount}</div>
        </div>
        <div className="bg-blue-50 rounded-lg shadow-sm p-4 border border-blue-200">
          <div className="text-sm text-blue-600 mb-1">Quick Actions</div>
          <div className="flex gap-2 mt-2">
            <button
              type="button"
              onClick={() => handleBulkCreate(10)}
              className="text-xs px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              +10 Codes
            </button>
            <button
              type="button"
              onClick={() => handleBulkCreate(50)}
              className="text-xs px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              +50 Codes
            </button>
          </div>
        </div>
      </div>

      {/* Create Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Create Invitation Code</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Code</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    placeholder="ABCD1"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 uppercase"
                    maxLength={5}
                  />
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, code: generateCode() })}
                    className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Max Uses</label>
                <input
                  type="number"
                  value={formData.maxUses}
                  onChange={(e) => setFormData({ ...formData, maxUses: parseInt(e.target.value) })}
                  min="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Expires At (Optional)</label>
                <input
                  type="datetime-local"
                  value={formData.expiresAt}
                  onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes (Optional)</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Internal notes about this code..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 h-20 resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreate}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Create Code
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Codes Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Uses</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created By</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {codes.map((code) => (
                <tr key={code.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-gray-900">{code.code}</span>
                      <button
                        type="button"
                        onClick={() => copyCode(code.code)}
                        className="p-1 hover:bg-gray-100 rounded"
                      >
                        <Copy className="w-4 h-4 text-gray-400" />
                      </button>
                    </div>
                    {code.notes && (
                      <div className="text-xs text-gray-500 mt-1">{code.notes}</div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(code.status)}`}>
                      {getStatusIcon(code.status)}
                      {code.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-900">
                      {code.usedCount || 0} / {code.maxUses}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-600">{code.createdBy}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-600">
                      {new Date(code.created_date).toLocaleDateString()}
                    </span>
                    {code.expiresAt && (
                      <div className="text-xs text-orange-600">
                        Expires: {new Date(code.expiresAt).toLocaleDateString()}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {code.status === 'active' && (
                        <button
                          type="button"
                          onClick={() => handleRevoke(code.id)}
                          className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg"
                          title="Revoke"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleDelete(code.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {codes.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No invitation codes yet. Create one to get started!
          </div>
        )}
      </div>
    </div>
  );
}