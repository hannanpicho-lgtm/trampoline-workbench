import { useState, useEffect } from 'react';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { createPageUrl } from '@/utils';
import ProfilePictureSection from '../components/profile/ProfilePictureSection';
import PersonalInfoSection from '../components/profile/PersonalInfoSection';
import AccountSettingsSection from '../components/profile/AccountSettingsSection';
import EarningStatsSection from '../components/profile/EarningStatsSection';
import PasswordChangeSection from '../components/profile/PasswordChangeSection';
import ReferralSection from '../components/referral/ReferralSection';
import ReferralStats from '../components/referral/ReferralStats';
import VIPBenefitsSection from '../components/profile/VIPBenefitsSection';
import PaymentMethodsSection from '../components/profile/PaymentMethodsSection';
import TrainingAccountsManager from '../components/profile/TrainingAccountsManager';

export default function UserProfile() {
  const [appUser, setAppUser] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    setLoading(true);
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      const appUsers = await base44.entities.AppUser.filter({ created_by: currentUser.email });
      if (appUsers.length > 0) {
        setAppUser(appUsers[0]);
      }
    } catch (error) {
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSavePersonalInfo = async (data) => {
    setSaving(true);
    try {
      if (appUser) {
        await base44.entities.AppUser.update(appUser.id, {
          phone: data.phone,
          bio: data.bio
        });
      }

      await base44.auth.updateMe({
        full_name: data.fullName
      });

      setAppUser(prev => prev ? { ...prev, phone: data.phone, bio: data.bio } : null);
      setUser(prev => prev ? { ...prev, full_name: data.fullName } : null);
      
      toast.success('Profile updated successfully');
      loadUserData();
    } catch (error) {
      toast.error('Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const handleProfilePictureUpdate = async (pictureUrl) => {
    try {
      if (appUser) {
        await base44.entities.AppUser.update(appUser.id, {
          profilePicture: pictureUrl
        });
        setAppUser(prev => prev ? { ...prev, profilePicture: pictureUrl } : null);
      }
      toast.success('Profile picture updated');
    } catch (error) {
      toast.error('Failed to update profile picture');
    }
  };

  const handleAccountSettingsSave = async (settings) => {
    setSaving(true);
    try {
      if (appUser) {
        await base44.entities.AppUser.update(appUser.id, {
          language: settings.language
        });
        setAppUser(prev => prev ? { ...prev, language: settings.language } : null);
      }
      toast.success('Settings updated');
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center gap-2 text-gray-600">
          <Loader2 className="w-5 h-5 animate-spin" />
          Loading profile...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-4">
          <a href={createPageUrl('Dashboard')} className="text-gray-600 hover:text-gray-900">
            <ArrowLeft className="w-6 h-6" />
          </a>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
            <p className="text-gray-600 text-sm">{user?.email}</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="space-y-6">
          {/* Profile Picture */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Profile Picture</h2>
            <ProfilePictureSection 
              picture={appUser?.profilePicture}
              onUpdate={handleProfilePictureUpdate}
            />
          </div>

          {/* Personal Information */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h2>
            <PersonalInfoSection
              user={user}
              appUser={appUser}
              onSave={handleSavePersonalInfo}
              isSaving={saving}
            />
          </div>

          {/* Account Settings */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Account Settings</h2>
            <AccountSettingsSection
              appUser={appUser}
              onSave={handleAccountSettingsSave}
              isSaving={saving}
            />
          </div>

          {/* VIP Level & Benefits */}
          {appUser && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">VIP Level & Benefits</h2>
              <VIPBenefitsSection appUser={appUser} />
            </div>
          )}

          {/* Payment Methods */}
          {appUser && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Payment Methods</h2>
              <PaymentMethodsSection appUser={appUser} />
            </div>
          )}

          {/* Referral Program */}
          {appUser && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Referral Program</h2>
              <ReferralSection appUser={appUser} />
            </div>
          )}

          {/* Referral Statistics */}
          {appUser && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Referral Statistics</h2>
              <ReferralStats appUser={appUser} />
            </div>
          )}

          {/* Training Accounts */}
          {appUser && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <TrainingAccountsManager appUser={appUser} />
            </div>
          )}

          {/* Earning Statistics */}
          {appUser && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Earning Statistics</h2>
              <EarningStatsSection appUser={appUser} />
            </div>
          )}

          {/* Password Change */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Security</h2>
            <PasswordChangeSection />
          </div>
        </div>
      </div>
    </div>
  );
}