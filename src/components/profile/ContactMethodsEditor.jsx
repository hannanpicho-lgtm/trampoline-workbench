import { useState, useEffect } from 'react';
import { Mail, Phone, MessageSquare, Plus, X, Check, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { backendClient } from '@/api/backendClient';

export default function ContactMethodsEditor({ currentUser, appUser, onUpdate }) {
  const [methods, setMethods] = useState([
    { type: 'email', value: currentUser?.email, preferred: false },
    { type: 'phone', value: appUser?.phone, preferred: false }
  ]);
  const [newMethod, setNewMethod] = useState('');
  const [newType, setNewType] = useState('phone');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (appUser?.contactMethods) {
      setMethods(appUser.contactMethods);
    }
  }, [appUser]);

  const handleAddMethod = async () => {
    if (!newMethod.trim()) {
      toast.error('Please enter a contact method');
      return;
    }

    setSaving(true);
    try {
      const updatedMethods = [...methods, { type: newType, value: newMethod, preferred: false }];
      await backendClient.entities.AppUser.update(appUser.id, { contactMethods: updatedMethods });
      
      setMethods(updatedMethods);
      setNewMethod('');
      toast.success('Contact method added');
      onUpdate({ ...appUser, contactMethods: updatedMethods });
    } catch (error) {
      toast.error('Failed to add contact method');
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveMethod = async (index) => {
    setSaving(true);
    try {
      const updatedMethods = methods.filter((_, i) => i !== index);
      await backendClient.entities.AppUser.update(appUser.id, { contactMethods: updatedMethods });
      
      setMethods(updatedMethods);
      toast.success('Contact method removed');
      onUpdate({ ...appUser, contactMethods: updatedMethods });
    } catch (error) {
      toast.error('Failed to remove contact method');
    } finally {
      setSaving(false);
    }
  };

  const handleSetPreferred = async (index) => {
    setSaving(true);
    try {
      const updatedMethods = methods.map((m, i) => ({
        ...m,
        preferred: i === index
      }));
      await backendClient.entities.AppUser.update(appUser.id, { contactMethods: updatedMethods });
      
      setMethods(updatedMethods);
      toast.success('Preferred contact method updated');
      onUpdate({ ...appUser, contactMethods: updatedMethods });
    } catch (error) {
      toast.error('Failed to update preferred method');
    } finally {
      setSaving(false);
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'email': return <Mail className="w-4 h-4" />;
      case 'phone': return <Phone className="w-4 h-4" />;
      case 'whatsapp': return <MessageSquare className="w-4 h-4" />;
      default: return null;
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Current Methods</h3>
        <div className="space-y-2">
          {methods.map((method, idx) => (
            <div
              key={idx}
              className={`flex items-center justify-between p-3 rounded-lg border-2 transition-all ${
                method.preferred ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-100 rounded-lg text-gray-600">
                  {getIcon(method.type)}
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-900 capitalize">{method.type}</div>
                  <div className="text-xs text-gray-500">{method.value}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleSetPreferred(idx)}
                  disabled={saving}
                  className={`p-2 rounded-lg transition-colors ${
                    method.preferred
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                  title="Set as preferred"
                >
                  <Check className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleRemoveMethod(idx)}
                  disabled={saving}
                  className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Add New Method</h3>
        <div className="flex gap-2">
          <select
            value={newType}
            onChange={(e) => setNewType(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
          >
            <option value="phone">Phone</option>
            <option value="email">Email</option>
            <option value="whatsapp">WhatsApp</option>
          </select>
          <input
            type="text"
            value={newMethod}
            onChange={(e) => setNewMethod(e.target.value)}
            placeholder={newType === 'email' ? 'email@example.com' : '+1234567890'}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="button"
            onClick={handleAddMethod}
            disabled={saving || !newMethod.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors flex items-center gap-2 font-medium text-sm"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Add
          </button>
        </div>
      </div>
    </div>
  );
}