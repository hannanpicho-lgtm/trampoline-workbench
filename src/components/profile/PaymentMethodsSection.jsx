import { useState, useEffect } from 'react';
import { Wallet, Plus, Trash2, CreditCard, Building2, Settings } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import AddWalletModal from '../modals/AddWalletModal';
import AutoWithdrawalSettings from './AutoWithdrawalSettings';

export default function PaymentMethodsSection({ appUser }) {
  const [wallets, setWallets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [showAutoWithdrawal, setShowAutoWithdrawal] = useState(false);

  useEffect(() => {
    loadWallets();
  }, [appUser?.id]);

  const loadWallets = async () => {
    setLoading(true);
    try {
      const payoutMethods = await base44.entities.PayoutMethod.filter({ 
        userId: appUser.id 
      });
      setWallets(payoutMethods.map(pm => ({
        id: pm.id,
        type: pm.type,
        name: pm.accountName,
        details: pm.accountDetails,
        isDefault: pm.isDefault
      })));
    } catch (error) {
      console.error('Failed to load wallets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteWallet = async (walletId) => {
    setDeleting(walletId);
    try {
      await base44.entities.PayoutMethod.delete(walletId);
      setWallets(prev => prev.filter(w => w.id !== walletId));
      toast.success('Payment method removed');
    } catch (error) {
      toast.error('Failed to remove payment method');
    } finally {
      setDeleting(null);
    }
  };

  const getWalletIcon = (type) => {
    switch (type) {
      case 'bank': return Building2;
      case 'card': return CreditCard;
      default: return Wallet;
    }
  };

  if (loading) {
    return <div className="text-center py-8 text-gray-500">Loading payment methods...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setShowAutoWithdrawal(false)}
          className={`px-4 py-2 font-medium transition-colors ${
            !showAutoWithdrawal 
              ? 'text-blue-600 border-b-2 border-blue-600' 
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Wallet className="w-4 h-4 inline mr-2" />
          Payment Methods
        </button>
        <button
          onClick={() => setShowAutoWithdrawal(true)}
          className={`px-4 py-2 font-medium transition-colors ${
            showAutoWithdrawal 
              ? 'text-blue-600 border-b-2 border-blue-600' 
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Settings className="w-4 h-4 inline mr-2" />
          Auto-Withdrawal
        </button>
      </div>

      {showAutoWithdrawal ? (
        <AutoWithdrawalSettings appUser={appUser} />
      ) : (
        <>
          {/* Add Payment Method Button */}
          <Button
            onClick={() => setShowAddModal(true)}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Payment Method
          </Button>

      {/* Wallet List */}
      {wallets.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
          <Wallet className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600 font-medium">No payment methods added</p>
          <p className="text-sm text-gray-500 mt-1">Add a payment method to receive withdrawals</p>
        </div>
      ) : (
        <div className="space-y-3">
          {wallets.map(wallet => {
            const WalletIcon = getWalletIcon(wallet.type);
            return (
              <div 
                key={wallet.id}
                className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                    <WalletIcon className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 flex items-center gap-2">
                      {wallet.name}
                      {wallet.isDefault && (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                          Default
                        </span>
                      )}
                    </p>
                    <p className="text-sm text-gray-500">{wallet.details}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteWallet(wallet.id)}
                  disabled={deleting === wallet.id}
                  className="text-red-600 hover:text-red-700 p-2 disabled:opacity-50"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Current Balance Display */}
      <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6 border border-green-200 mt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 mb-1">Available Balance</p>
            <p className="text-3xl font-bold text-gray-900">
              ${(appUser?.balance || 0).toFixed(2)}
            </p>
          </div>
          <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center">
            <Wallet className="w-8 h-8 text-white" />
          </div>
        </div>
        {appUser?.frozenBalance > 0 && (
          <div className="mt-4 pt-4 border-t border-green-300">
            <p className="text-sm text-gray-600">
              Frozen Balance: <span className="font-semibold text-orange-600">${appUser.frozenBalance.toFixed(2)}</span>
            </p>
          </div>
        )}
      </div>

          {/* Add Wallet Modal */}
          <AddWalletModal
            show={showAddModal}
            onClose={() => {
              setShowAddModal(false);
              loadWallets();
            }}
            currentUser={appUser}
          />
        </>
      )}
    </div>
  );
}