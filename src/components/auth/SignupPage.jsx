import { useState } from "react";
import { Eye, EyeOff, Lock, User, Phone as PhoneIcon, Ticket } from "lucide-react";
import { toast } from "sonner";
import { backendClient } from "@/api/backendClient";
import { processSignupBonus } from "../automation/ReferralRewards";

const generateInvitationCode = () => {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const numbers = "0123456789";
  let code = "";
  for (let i = 0; i < 5; i++) {
    code += letters.charAt(Math.floor(Math.random() * letters.length));
  }
  code += numbers.charAt(Math.floor(Math.random() * numbers.length));
  return code;
};

export default function SignupPage({ 
  onNavigate, 
  onSignupComplete,
  translations
}) {
  const [formData, setFormData] = useState({
    username: "",
    phone: "",
    transactionPassword: "",
    loginPassword: "",
    inviteCode: "",
    agreeTerms: false,
  });
  
  const [showTransactionPassword, setShowTransactionPassword] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const validate = () => {
    const newErrors = {};
    if (!formData.username.trim()) newErrors.username = "Username is required";
    if (!formData.phone.trim()) newErrors.phone = "Phone is required";
    if (!formData.transactionPassword || formData.transactionPassword.length < 6) newErrors.transactionPassword = "Transaction password must be at least 6 characters";
    if (!formData.loginPassword || formData.loginPassword.length < 6) newErrors.loginPassword = "Login password must be at least 6 characters";
    if (!formData.inviteCode || formData.inviteCode.length !== 6) newErrors.inviteCode = "Valid 6-character invitation code is required";
    if (!formData.agreeTerms) newErrors.agreeTerms = "You must agree to terms";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setIsLoading(true);
    try {
      // First check if it's an admin invitation code
      const inviteCodes = await backendClient.entities.InvitationCode.filter({ 
        code: formData.inviteCode.toUpperCase() 
      });

      let isAdminCode = false;
      let inviteCode = null;
      let referrer = null;

      if (inviteCodes.length > 0) {
        // It's an admin code
        isAdminCode = true;
        inviteCode = inviteCodes[0];

        // Check if code is active
        if (inviteCode.status !== 'active') {
          toast.error("Invalid invitation code", { description: "This code has been used or revoked" });
          setIsLoading(false);
          return;
        }

        // Check if code has expired
        if (inviteCode.expiresAt && new Date(inviteCode.expiresAt) < new Date()) {
          await backendClient.entities.InvitationCode.update(inviteCode.id, { status: 'expired' });
          toast.error("Invalid invitation code", { description: "This code has expired" });
          setIsLoading(false);
          return;
        }

        // Check if code has reached max uses
        if (inviteCode.usedCount >= inviteCode.maxUses) {
          await backendClient.entities.InvitationCode.update(inviteCode.id, { status: 'used' });
          toast.error("Invalid invitation code", { description: "This code has reached its usage limit" });
          setIsLoading(false);
          return;
        }
      } else {
        // It's a user referral code
        const referrers = await backendClient.entities.AppUser.filter({ 
          invitationCode: formData.inviteCode 
        });
        
        if (referrers.length === 0) {
          toast.error("Invalid invitation code", { description: "The invitation code you entered does not exist" });
          setIsLoading(false);
          return;
        }

        referrer = referrers[0];
      }

      const userInvitationCode = generateInvitationCode();
      
      // New user starts as VIP1 with $100 balance (minimum to submit VIP1 tasks)
      const appUser = await backendClient.entities.AppUser.create({
        phone: formData.phone,
        invitationCode: userInvitationCode,
        referredBy: referrer?.id || null,
        balance: 100,
        vipLevel: "VIP1",
        creditScore: 100,
        emailVerified: false,
        language: "en",
        transactionPassword: formData.transactionPassword
      });

      if (isAdminCode) {
        // Update admin invitation code usage
        await backendClient.entities.InvitationCode.update(inviteCode.id, {
          usedCount: inviteCode.usedCount + 1,
          usedBy: appUser.id,
          usedAt: new Date().toISOString(),
          status: inviteCode.usedCount + 1 >= inviteCode.maxUses ? 'used' : 'active'
        });
      } else if (referrer) {
        // Update referrer's invite count
        await backendClient.entities.AppUser.update(referrer.id, {
          inviteCount: (referrer.inviteCount || 0) + 1
        });
      }

      // Create new user bonus transaction
      await backendClient.entities.Transaction.create({
        userId: appUser.id,
        type: 'bonus',
        amount: 100,
        status: 'completed',
        balanceBefore: 0,
        balanceAfter: 100,
        metadata: { 
          reason: 'VIP1 Starting Balance',
          description: 'Welcome bonus for new VIP1 registration'
        }
      });

      let tasksAssigned = 0;
      try {
        const { assignInitialTasks } = await import("../automation/TaskAutomation");
        tasksAssigned = await assignInitialTasks(appUser.id, "VIP1");
      } catch (error) {
        console.warn("Failed to assign initial tasks:", error);
      }

      toast.success("Account created! 🎉", {
        description: `VIP1 Starting Balance: $100 | Your code: ${userInvitationCode} | ${tasksAssigned} tasks assigned!`
      });

      onSignupComplete(formData.username, userInvitationCode);
    } catch (error) {
      toast.error("Signup failed", { description: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center px-6 py-8">
      {/* Logo */}
      <div className="w-32 h-32 rounded-full border-[6px] border-red-600 flex items-center justify-center bg-[#1a1a1a] mb-12">
        <span className="text-red-600 font-bold text-6xl" style={{ fontFamily: "serif" }}>t</span>
      </div>

      {/* Form */}
      <div className="w-full max-w-2xl space-y-6">
        {/* Username */}
        <div>
          <label className="block text-white text-sm mb-2">Username</label>
          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input 
              type="text" 
              placeholder="Username" 
              value={formData.username}
              onChange={(e) => setFormData(d => ({ ...d, username: e.target.value }))}
              className={`w-full bg-[#1a2332] text-white placeholder-gray-500 rounded-xl py-4 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.username ? "ring-2 ring-red-500" : ""}`}
            />
          </div>
          {errors.username && <div className="text-red-400 text-xs mt-1">{errors.username}</div>}
        </div>

        {/* Phone */}
        <div>
          <label className="block text-white text-sm mb-2">Phone</label>
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
              <span className="text-2xl">🇺🇸</span>
            </div>
            <input 
              type="tel" 
              placeholder="Enter a phone number" 
              value={formData.phone}
              onChange={(e) => setFormData(d => ({ ...d, phone: e.target.value }))}
              className={`w-full bg-[#1a2332] text-white placeholder-gray-500 rounded-xl py-4 pl-16 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.phone ? "ring-2 ring-red-500" : ""}`}
            />
          </div>
          {errors.phone && <div className="text-red-400 text-xs mt-1">{errors.phone}</div>}
        </div>

        {/* Transaction Password */}
        <div>
          <label className="block text-white text-sm mb-2">Transaction Password</label>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input 
              type={showTransactionPassword ? "text" : "password"}
              placeholder="Transaction Password" 
              value={formData.transactionPassword}
              onChange={(e) => setFormData(d => ({ ...d, transactionPassword: e.target.value }))}
              className={`w-full bg-[#1a2332] text-white placeholder-gray-500 rounded-xl py-4 pl-12 pr-12 focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.transactionPassword ? "ring-2 ring-red-500" : ""}`}
            />
            <button 
              type="button" 
              onClick={() => setShowTransactionPassword(!showTransactionPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2"
            >
              {showTransactionPassword ? <EyeOff className="w-5 h-5 text-gray-500" /> : <Eye className="w-5 h-5 text-gray-500" />}
            </button>
          </div>
          {errors.transactionPassword && <div className="text-red-400 text-xs mt-1">{errors.transactionPassword}</div>}
        </div>

        {/* Login Password */}
        <div>
          <label className="block text-white text-sm mb-2">Login Password</label>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input 
              type={showLoginPassword ? "text" : "password"}
              placeholder="Login Password" 
              value={formData.loginPassword}
              onChange={(e) => setFormData(d => ({ ...d, loginPassword: e.target.value }))}
              className={`w-full bg-[#1a2332] text-white placeholder-gray-500 rounded-xl py-4 pl-12 pr-12 focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.loginPassword ? "ring-2 ring-red-500" : ""}`}
            />
            <button 
              type="button" 
              onClick={() => setShowLoginPassword(!showLoginPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2"
            >
              {showLoginPassword ? <EyeOff className="w-5 h-5 text-gray-500" /> : <Eye className="w-5 h-5 text-gray-500" />}
            </button>
          </div>
          {errors.loginPassword && <div className="text-red-400 text-xs mt-1">{errors.loginPassword}</div>}
        </div>

        {/* Invite Code */}
        <div>
          <label className="block text-white text-sm mb-2">Invite Code</label>
          <div className="relative">
            <Ticket className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input 
              type="text" 
              placeholder="Invite Code" 
              value={formData.inviteCode}
              onChange={(e) => setFormData(d => ({ ...d, inviteCode: e.target.value.toUpperCase() }))}
              className={`w-full bg-[#1a2332] text-white placeholder-gray-500 rounded-xl py-4 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase ${errors.inviteCode ? "ring-2 ring-red-500" : ""}`}
              maxLength={6}
            />
          </div>
          {errors.inviteCode && <div className="text-red-400 text-xs mt-1">{errors.inviteCode}</div>}
        </div>

        {/* Terms Checkbox */}
        <div className="flex items-start gap-3 pt-2">
          <input 
            type="checkbox"
            checked={formData.agreeTerms}
            onChange={(e) => setFormData(d => ({ ...d, agreeTerms: e.target.checked }))}
            className="w-5 h-5 mt-0.5 accent-red-600"
          />
          <label className="text-sm text-gray-300">
            I agree to Trampoline Branding{" "}
            <button type="button" className="text-red-500 underline hover:text-red-400">Privacy Notice</button>
            {", "}
            <button type="button" className="text-red-500 underline hover:text-red-400">MSA</button>
            {" And "}
            <button type="button" className="text-red-500 underline hover:text-red-400">Terms of Service</button>
          </label>
        </div>
        {errors.agreeTerms && <div className="text-red-400 text-xs">{errors.agreeTerms}</div>}

        {/* Submit Button */}
        <button 
          type="button" 
          onClick={handleSubmit}
          disabled={isLoading}
          className="w-full py-4 rounded-xl border-2 border-white text-white font-semibold hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-8"
        >
          {isLoading ? "Creating account..." : "Create account"}
        </button>

        {/* Login Link */}
        <div className="text-center pt-4">
          <span className="text-gray-400">Already have an account? </span>
          <button 
            type="button" 
            onClick={() => onNavigate("login")}
            className="text-red-500 hover:text-red-400 font-medium"
          >
            Login here
          </button>
        </div>
      </div>
    </div>
  );
}