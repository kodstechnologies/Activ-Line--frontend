import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Mail, ArrowLeft, Lock, KeyRound, RefreshCw, Eye, EyeOff } from "lucide-react";
import toast from "react-hot-toast";
import LoginAnimation from "../../components/LoginAnimation";
import ActivlineLogo from "../../logo/Logo";
import { useTheme } from "../../context/ThemeContext";
import ThemeToggle from "../../components/ThemeToggle";
import { forgotPassword, resendForgotPasswordOtp, resetPassword } from "../../api/auth.api";

const ForgotPassword = () => {
  const { isDark } = useTheme();
  const [step, setStep] = useState("request");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState({ send: false, resend: false, reset: false });
  const [formError, setFormError] = useState("");

  const handleSendOtp = async () => {
    setFormError("");
    if (!email.trim()) {
      setFormError("Email is required");
      return;
    }
    try {
      setLoading((prev) => ({ ...prev, send: true }));
      await forgotPassword(email.trim());
      toast.success("OTP sent to your email");
      setStep("reset");
    } catch (err) {
      setFormError(err?.response?.data?.message || err?.message || "Failed to send OTP");
    } finally {
      setLoading((prev) => ({ ...prev, send: false }));
    }
  };

  const handleResendOtp = async () => {
    setFormError("");
    if (!email.trim()) {
      setFormError("Email is required");
      return;
    }
    try {
      setLoading((prev) => ({ ...prev, resend: true }));
      await resendForgotPasswordOtp(email.trim());
      toast.success("OTP resent");
    } catch (err) {
      setFormError(err?.response?.data?.message || err?.message || "Failed to resend OTP");
    } finally {
      setLoading((prev) => ({ ...prev, resend: false }));
    }
  };

  const handleResetPassword = async () => {
    setFormError("");
    if (!email.trim() || !otp.trim() || !password.trim()) {
      setFormError("Email, OTP, and new password are required");
      return;
    }
    try {
      setLoading((prev) => ({ ...prev, reset: true }));
      await resetPassword({ email: email.trim(), otp: otp.trim(), password: password.trim() });
      toast.success("Password reset successfully");
      setStep("request");
      setOtp("");
      setPassword("");
    } catch (err) {
      setFormError(err?.response?.data?.message || err?.message || "Failed to reset password");
    } finally {
      setLoading((prev) => ({ ...prev, reset: false }));
    }
  };

  return (
    <div className={`min-h-screen flex font-sans transition-colors duration-300 ${isDark ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' : 'bg-gradient-to-br from-blue-50 to-gray-50'}`}>
      {/* ================= LEFT SIDE ================= */}
      <div className="hidden lg:flex w-1/2 relative items-center justify-center overflow-hidden">
        {/* Animated Blue Gradient Background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-500 animate-gradient-x" />
          <div className="absolute inset-0 bg-gradient-to-t from-blue-700/20 via-transparent to-transparent" />
          <div className="absolute top-0 left-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl translate-x-1/3 translate-y-1/3" />
        </div>

        {/* Floating Elements */}
        <div className="absolute top-20 left-20 w-10 h-10 rounded-full bg-white/20 animate-float-slow" />
        <div className="absolute bottom-32 right-24 w-14 h-14 rounded-full bg-white/15 animate-float" />
        <div className="absolute top-40 right-32 w-8 h-8 rounded-full bg-white/25 animate-float-slower" />

        {/* Content Wrapper - Centered vertically */}
        <div className="relative z-10 flex flex-col items-center justify-center text-center px-16 animate-fade-in h-full">
          {/* BIG Image */}
       {/* BIG Animation */}
<div className="w-full flex items-center justify-center">
  
  <LoginAnimation />
</div>

          {/* Logo & Branding Section */}
         
        </div>
      </div>

      {/* ================= RIGHT SIDE ================= */}
      <div className="w-full lg:w-1/2 flex items-center justify-center relative">
        {/* Background with pattern */}
        <div className={`absolute inset-0 transition-colors duration-300 ${isDark ? 'bg-gray-900' : 'bg-white'}`}>
          <div className={`absolute inset-0 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:30px_30px] transition-opacity duration-300 ${isDark ? 'opacity-[0.05]' : 'opacity-[0.08]'}`} />
        </div>

        {/* Theme Toggle */}
        <div className="absolute top-8 right-8 z-20">
          <div className={`p-3 backdrop-blur-sm rounded-xl shadow-lg border transition-all duration-300 ${isDark ? 'bg-gray-800/80 border-gray-700/60 hover:shadow-blue-500/10' : 'bg-white/90 border-gray-200/60 hover:shadow-blue-500/20'}`}>
            <ThemeToggle />
          </div>
        </div>

        {/* Back to Login */}
        <div className="absolute top-8 left-8 z-20">
          <Link to="/login">
            <div className={`p-3 backdrop-blur-sm rounded-xl shadow-lg border transition-all duration-300 group ${isDark ? 'bg-gray-800/80 border-gray-700/60 hover:shadow-blue-500/10' : 'bg-white/90 border-gray-200/60 hover:shadow-blue-500/20'}`}>
              <ArrowLeft className={`w-5 h-5 transition-colors duration-300 ${isDark ? 'text-gray-400 group-hover:text-blue-400' : 'text-gray-600 group-hover:text-blue-600'}`} />
            </div>
          </Link>
        </div>

        {/* CARD */}
        <div className="w-full max-w-md px-6 animate-fade-in-up">
          <div className="relative">
            {/* Card Glow Effect */}
            <div className={`absolute -inset-1 rounded-3xl blur-xl transition-all duration-300 ${isDark ? 'bg-gradient-to-r from-blue-500/15 via-cyan-500/15 to-blue-400/15' : 'bg-gradient-to-r from-blue-500/20 via-cyan-500/20 to-blue-400/20'}`} />
            
            {/* Main Card */}
            <div className={`relative rounded-3xl border backdrop-blur-xl shadow-2xl p-10 transition-all duration-300 ${isDark ? 'border-gray-700/50 bg-gray-900/90 hover:shadow-blue-500/10' : 'border-gray-300/80 bg-white/95 hover:shadow-blue-500/10'}`}>
              
              {/* Enhanced Header with Logo */}
              <div className="text-center mb-10">
                <div className="flex items-center justify-center gap-3 mb-6">
                  <div className={`p-3 rounded-xl shadow-lg border transition-all duration-300 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                    <ActivlineLogo className={`h-12 transition-colors duration-300 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                  </div>
                 
                </div>
                
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent mb-3">
                  Reset Password
                </h1>
                <p className={`text-base font-medium transition-colors duration-300 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Send OTP to your email and reset your password
                </p>
              </div>

              {formError && (
                <div className={`mb-4 rounded-xl border px-4 py-3 text-sm font-medium ${
                  isDark ? "bg-red-900/20 border-red-500/40 text-red-300" : "bg-red-50 border-red-200 text-red-700"
                }`}>
                  {formError}
                </div>
              )}

              {step === "request" ? (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold flex items-center gap-2 transition-colors duration-300">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300 ${isDark ? 'bg-blue-900/40' : 'bg-blue-100'}`}>
                        <Mail className={`w-4 h-4 transition-colors duration-300 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                      </div>
                      <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>Email Address</span>
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={`mt-1 w-full h-12 rounded-xl border px-4 text-sm focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 placeholder:text-gray-400 ${
                        isDark ? 'bg-gray-800 text-white placeholder:text-gray-500 border-gray-600/50 focus:ring-blue-400' : 'bg-white text-gray-900 border-gray-300 focus:ring-blue-500'
                      }`}
                      placeholder="Enter your registered email"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={loading.send}
                    className={`relative w-full h-12 rounded-xl text-white font-semibold text-base active:scale-[0.98] transition-all duration-200 shadow-lg group overflow-hidden disabled:opacity-70 disabled:cursor-not-allowed ${
                      isDark 
                        ? 'bg-gradient-to-r from-blue-500 to-cyan-400 hover:from-blue-600 hover:to-cyan-500 hover:shadow-blue-500/20' 
                        : 'bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 hover:shadow-blue-500/40'
                    }`}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-white/20 to-blue-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                    {loading.send ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Sending OTP...</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-2">
                        <Mail className="w-4 h-4" />
                        <span>Send OTP</span>
                      </div>
                    )}
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold flex items-center gap-2 transition-colors duration-300">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300 ${isDark ? 'bg-blue-900/40' : 'bg-blue-100'}`}>
                        <Mail className={`w-4 h-4 transition-colors duration-300 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                      </div>
                      <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>Email Address</span>
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={`mt-1 w-full h-12 rounded-xl border px-4 text-sm focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 placeholder:text-gray-400 ${
                        isDark ? 'bg-gray-800 text-white placeholder:text-gray-500 border-gray-600/50 focus:ring-blue-400' : 'bg-white text-gray-900 border-gray-300 focus:ring-blue-500'
                      }`}
                      placeholder="Enter your registered email"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold flex items-center gap-2 transition-colors duration-300">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300 ${isDark ? 'bg-blue-900/40' : 'bg-blue-100'}`}>
                        <KeyRound className={`w-4 h-4 transition-colors duration-300 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                      </div>
                      <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>OTP</span>
                    </label>
                    <input
                      type="text"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      className={`mt-1 w-full h-12 rounded-xl border px-4 text-sm focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 placeholder:text-gray-400 ${
                        isDark ? 'bg-gray-800 text-white placeholder:text-gray-500 border-gray-600/50 focus:ring-blue-400' : 'bg-white text-gray-900 border-gray-300 focus:ring-blue-500'
                      }`}
                      placeholder="Enter 6-digit OTP"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold flex items-center gap-2 transition-colors duration-300">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300 ${isDark ? 'bg-blue-900/40' : 'bg-blue-100'}`}>
                        <Lock className={`w-4 h-4 transition-colors duration-300 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                      </div>
                      <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>New Password</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className={`mt-1 w-full h-12 rounded-xl border px-4 pr-12 text-sm focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 placeholder:text-gray-400 ${
                          isDark ? 'bg-gray-800 text-white placeholder:text-gray-500 border-gray-600/50 focus:ring-blue-400' : 'bg-white text-gray-900 border-gray-300 focus:ring-blue-500'
                        }`}
                        placeholder="Enter new password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className={`absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition-all duration-300 ${
                          isDark ? "text-gray-400 hover:text-gray-300 hover:bg-gray-800" : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                        }`}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3">
                    <button
                      type="button"
                      onClick={handleResetPassword}
                      disabled={loading.reset}
                      className={`relative w-full h-12 rounded-xl text-white font-semibold text-base active:scale-[0.98] transition-all duration-200 shadow-lg group overflow-hidden disabled:opacity-70 disabled:cursor-not-allowed ${
                        isDark 
                          ? 'bg-gradient-to-r from-blue-500 to-cyan-400 hover:from-blue-600 hover:to-cyan-500 hover:shadow-blue-500/20' 
                          : 'bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 hover:shadow-blue-500/40'
                      }`}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-white/20 to-blue-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                      {loading.reset ? (
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>Resetting...</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-2">
                          <Lock className="w-4 h-4" />
                          <span>Reset Password</span>
                        </div>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={loading.resend}
                      className={`w-full h-12 rounded-xl font-semibold text-sm transition-all duration-200 border ${
                        isDark ? "border-gray-700 text-gray-300 hover:bg-gray-800" : "border-gray-300 text-gray-700 hover:bg-gray-50"
                      } ${loading.resend ? "opacity-70 cursor-not-allowed" : ""}`}
                    >
                      <span className="inline-flex items-center gap-2">
                        <RefreshCw className={`w-4 h-4 ${loading.resend ? "animate-spin" : ""}`} />
                        Resend OTP
                      </span>
                    </button>
                  </div>
                </div>
              )}

              {/* Back to Login Link */}
              <div className={`mt-8 pt-6 border-t text-center transition-colors duration-300 ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                <Link
                  to="/login"
                  className={`text-sm font-medium transition-colors duration-300 inline-flex items-center gap-1 ${isDark ? 'text-gray-400 hover:text-blue-400' : 'text-gray-600 hover:text-blue-600'}`}
                >
                  <ArrowLeft className="w-3 h-3" />
                  Remember your password? Sign in
                </Link>
              </div>

              {/* Copyright */}
              <p className={`text-center text-xs mt-8 transition-colors duration-300 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                © {new Date().getFullYear()} Activline Network Solutions. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
