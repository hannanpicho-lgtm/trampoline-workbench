import { useState } from 'react';
import { Camera, Loader2, X, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';

export default function ProfileBannerEditor({ appUser, onUpdate }) {
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [bannerColor, setBannerColor] = useState(appUser?.bannerColor || '#667eea');
  const [bannerPattern, setBannerPattern] = useState(appUser?.bannerPattern || 'gradient');
  const [saving, setSaving] = useState(false);

  const bannerColors = [
    '#667eea', '#764ba2', '#f093fb', '#4facfe', '#00f2fe',
    '#43e97b', '#38f9d7', '#fa709a', '#fee140', '#30cfd0'
  ];

  const patterns = [
    { id: 'gradient', name: 'Gradient', class: 'bg-gradient-to-r from-blue-500 to-purple-600' },
    { id: 'dots', name: 'Dots', class: 'bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500' },
    { id: 'waves', name: 'Waves', class: 'bg-gradient-to-r from-cyan-500 to-blue-500' }
  ];

  const handleBannerUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingBanner(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setSaving(true);
      
      await base44.entities.AppUser.update(appUser.id, {
        bannerImage: file_url
      });

      toast.success('Banner image updated');
      onUpdate({ ...appUser, bannerImage: file_url });
    } catch (error) {
      toast.error('Failed to upload banner');
    } finally {
      setUploadingBanner(false);
      setSaving(false);
    }
  };

  const updateBannerStyle = async (field, value) => {
    setSaving(true);
    try {
      await base44.entities.AppUser.update(appUser.id, { [field]: value });
      onUpdate({ ...appUser, [field]: value });
      toast.success('Banner updated');
    } catch (error) {
      toast.error('Failed to update banner');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Banner Preview */}
      <div className="relative h-32 rounded-xl overflow-hidden shadow-sm border border-gray-200">
        {appUser?.bannerImage ? (
          <img
            src={appUser.bannerImage}
            alt="Banner"
            className="w-full h-full object-cover"
          />
        ) : (
          <div
            className={`w-full h-full ${patterns.find(p => p.id === bannerPattern)?.class || patterns[0].class}`}
            style={!appUser?.bannerImage ? { background: bannerColor } : {}}
          />
        )}
        
        <label className="absolute bottom-2 right-2 w-10 h-10 bg-white rounded-full flex items-center justify-center cursor-pointer hover:bg-gray-100 shadow-lg">
          {uploadingBanner ? (
            <Loader2 className="w-5 h-5 animate-spin text-gray-600" />
          ) : (
            <Camera className="w-5 h-5 text-gray-600" />
          )}
          <input
            type="file"
            accept="image/*"
            onChange={handleBannerUpload}
            className="hidden"
            disabled={uploadingBanner}
          />
        </label>
      </div>

      {/* Color Selection */}
      {!appUser?.bannerImage && (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Banner Color</label>
            <div className="flex gap-2 flex-wrap">
              {bannerColors.map(color => (
                <button
                  key={color}
                  type="button"
                  onClick={() => updateBannerStyle('bannerColor', color)}
                  className={`w-8 h-8 rounded-full border-2 transition-all ${
                    bannerColor === color ? 'border-gray-900 ring-2 ring-offset-1 ring-gray-400' : 'border-gray-300'
                  }`}
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Pattern</label>
            <div className="grid grid-cols-3 gap-2">
              {patterns.map(pattern => (
                <button
                  key={pattern.id}
                  type="button"
                  onClick={() => updateBannerStyle('bannerPattern', pattern.id)}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    bannerPattern === pattern.id
                      ? 'border-blue-500 ring-2 ring-blue-200'
                      : 'border-gray-200'
                  }`}
                >
                  <div className={`w-full h-12 rounded ${pattern.class} mb-1`} />
                  <div className="text-xs font-medium text-gray-700">{pattern.name}</div>
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {appUser?.bannerImage && (
        <button
          type="button"
          onClick={async () => {
            setSaving(true);
            try {
              await base44.entities.AppUser.update(appUser.id, { bannerImage: null });
              onUpdate({ ...appUser, bannerImage: null });
              toast.success('Banner removed');
            } catch (error) {
              toast.error('Failed to remove banner');
            } finally {
              setSaving(false);
            }
          }}
          disabled={saving}
          className="w-full py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 font-medium text-sm transition-colors flex items-center justify-center gap-2"
        >
          <X className="w-4 h-4" />
          Remove Banner Image
        </button>
      )}
    </div>
  );
}