import { useState } from "react";
import { Eye, EyeOff, User, Lock, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function LoginPage({ 
  onNavigate, 
  onLogin, 
  translations 
}) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const newErrors = {};
    if (!username.trim()) newErrors.username = "Username is required";
    if (!password || password.length < 6) newErrors.password = "Password must be at least 6 characters";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setIsLoading(true);
    try {
      await onLogin(username, password, rememberMe);
    } finally {
      setIsLoading(false);
    }
  };



  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-[#111] to-black flex items-center justify-center px-4">
      {/* Login Wrapper */}
      <div className="w-full max-w-[380px] p-10 bg-black/55 rounded-xl">
        
        {/* Logo */}
        <div className="w-[110px] h-[110px] border-[5px] border-red-600 rounded-full mx-auto mb-9 flex items-center justify-center">
          <span className="text-red-600 font-bold text-[54px]" style={{ fontFamily: 'serif' }}>t</span>
        </div>

        {/* Form */}
        <form className="space-y-[18px]" onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
          
          {/* Username Field */}
          <div>
            <label className="block text-white text-[13px] mb-1.5">Username/Phone</label>
            <div className="relative">
              <div className="absolute left-[14px] top-1/2 -translate-y-1/2">
                <User className="w-4 h-4 text-[#aaa]" />
              </div>
              <input
                type="text"
                placeholder="Username/Phone"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full py-3 px-10 rounded-[25px] border-none outline-none bg-[#0f1a26] text-white placeholder-[#999]"
              />
            </div>
            {errors.username && <div className="text-red-400 text-xs mt-1 ml-4">{errors.username}</div>}
          </div>

          {/* Password Field */}
          <div>
            <label className="block text-white text-[13px] mb-1.5">Password</label>
            <div className="relative">
              <div className="absolute left-[14px] top-1/2 -translate-y-1/2">
                <Lock className="w-4 h-4 text-[#aaa]" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full py-3 px-10 rounded-[25px] border-none outline-none bg-[#0f1a26] text-white placeholder-[#999]"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-[14px] top-1/2 -translate-y-1/2 cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4 text-[#aaa]" /> : <Eye className="w-4 h-4 text-[#aaa]" />}
              </button>
            </div>
            {errors.password && <div className="text-red-400 text-xs mt-1 ml-4">{errors.password}</div>}
          </div>

          {/* Remember Me */}
          <div className="my-2.5 mb-6">
            <label className="flex items-center gap-2 text-[13px] text-[#ddd] cursor-pointer">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 accent-red-600"
              />
              Remember me
            </label>
          </div>

          {/* Sign In Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-transparent border border-white text-white rounded-[25px] cursor-pointer text-[15px] font-medium hover:bg-white hover:text-black transition-colors disabled:opacity-50"
          >
            {isLoading && <Loader2 className="w-4 h-4 animate-spin inline mr-2" />}
            {translations.signIn}
          </button>

          {/* Sign Up Link */}
          <p className="text-center text-[13px] mt-5">
            <span className="text-white">Don't have an account? </span>
            <button
              type="button"
              onClick={() => onNavigate("signup")}
              className="text-red-600 cursor-pointer hover:text-red-500"
            >
              Sign up
            </button>
          </p>
        </form>
      </div>
    </div>
  );
}