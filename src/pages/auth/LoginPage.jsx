import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Formik, Form, Field, ErrorMessage } from "formik";
import { Eye, EyeOff, Mail, Lock, LogIn } from "lucide-react";
import toast from "react-hot-toast";
import LoginAnimation from "../../components/LoginAnimation";

import ActivlineLogo from "../../logo/Logo";
import { loginSchema } from "./schema.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { useTheme } from "../../context/ThemeContext";
import ThemeToggle from "../../components/ThemeToggle";

import { adminLogin } from "../../api/auth.api.js";

const LoginPage = () => {
  const navigate = useNavigate();
  const { login, logout } = useAuth();
  const { isDark } = useTheme();
  const [apiError, setApiError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const getInitialValues = () => ({
    email: "",
    password: "",
  });

const handleSubmit = async (values, { setSubmitting }) => {
  setApiError("");
  try {
    const response = await adminLogin(values);

    const { user, accessToken, refreshToken } = response.data;

    // save auth
    login(user, accessToken);

    // optional: store refresh token
    localStorage.setItem("refreshToken", refreshToken);

    toast.success(`Welcome back, ${user.name}! 🚀`);

    // role-based redirect
    switch (user.role.toLowerCase()) {
      case "super_admin":
      case "admin":
        navigate("/dashboard");
        break;
      case "admin_staff":
        navigate("/dashboard");
        break;
      case "staff":
        navigate("/dashboard");
        break;
      case "franchise":
      case "franchise_admin":
        navigate("/franchise-dashboard");
        break;
      default:
        toast.error("Unauthorized access: Unknown role.");
        logout(); // Important: clear login state if role is invalid
        break;
    }
  } catch {
    setApiError("Invalid email or password. Please try again.");

  } finally {
    setSubmitting(false);
  }
};

  return (
    <div
      className={`min-h-screen flex font-sans transition-colors duration-300 ${
        isDark
          ? "bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900"
          : "bg-gradient-to-br from-blue-50 to-gray-50"
      }`}
    >
      {/* ================= LEFT SIDE ================= */}
      <div className="hidden lg:flex w-1/2 relative items-center justify-center overflow-hidden">
        {/* Animated Blue Gradient Background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-500 animate-gradient-x" />
          <div className="absolute inset-0 bg-gradient-to-t from-blue-700/20 via-transparent to-transparent" />
          {/* Floating glow effects */}
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
        <div
          className={`absolute inset-0 transition-colors duration-300 ${
            isDark ? "bg-gray-900" : "bg-white"
          }`}
        >
          <div
            className={`absolute inset-0 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:30px_30px] transition-opacity duration-300 ${
              isDark ? "opacity-[0.05]" : "opacity-[0.08]"
            }`}
          />
        </div>

        {/* Theme Toggle */}
        <div className="absolute top-8 right-8 z-20">
          <div
            className={`p-3 backdrop-blur-sm rounded-xl shadow-lg border transition-all duration-300 ${
              isDark
                ? "bg-gray-800/80 border-gray-700/60 hover:shadow-blue-500/10"
                : "bg-white/90 border-gray-200/60 hover:shadow-blue-500/20"
            }`}
          >
            <ThemeToggle />
          </div>
        </div>

        {/* CARD */}
        <div className="w-full max-w-md px-6 animate-fade-in-up">
          <div className="relative">
            {/* Card Glow Effect */}
            <div
              className={`absolute -inset-1 rounded-3xl blur-xl transition-all duration-300 ${
                isDark
                  ? "bg-gradient-to-r from-blue-500/15 via-cyan-500/15 to-blue-400/15"
                  : "bg-gradient-to-r from-blue-500/20 via-cyan-500/20 to-blue-400/20"
              }`}
            />

            {/* Main Card */}
            <div
              className={`relative rounded-3xl border backdrop-blur-xl shadow-2xl p-10 transition-all duration-300 ${
                isDark
                  ? "border-gray-700/50 bg-gray-900/90 hover:shadow-blue-500/10"
                  : "border-gray-300/80 bg-white/95 hover:shadow-blue-500/10"
              }`}
            >
              {/* Enhanced Header with Logo */}
              <div className="text-center mb-10">
                <div className="flex items-center justify-center gap-3 mb-6">
                  <div
                    className={`p-3 rounded-xl shadow-lg border transition-all duration-300 ${
                      isDark
                        ? "bg-gray-800 border-gray-700"
                        : "bg-white border-gray-200"
                    }`}
                  >
                    <ActivlineLogo
                      className={`h-12 transition-colors duration-300 ${
                        isDark ? "text-blue-400" : "text-blue-600"
                      }`}
                    />
                  </div>
                </div>

                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent mb-3">
                  Loginn
                </h1>
                <p
                  className={`text-base font-medium transition-colors duration-300 ${
                    isDark ? "text-gray-400" : "text-gray-600"
                  }`}
                >
                  Sign in to access your dashboard
                </p>
              </div>

              {/* FORM */}
              <Formik
                initialValues={getInitialValues()}
                enableReinitialize
                validationSchema={loginSchema}
                onSubmit={handleSubmit}
              >
                {({ isSubmitting, errors, touched }) => (
                  <Form className="space-y-6">
                    {apiError && (
                      <div
                        className={`rounded-xl border px-4 py-3 text-sm font-medium ${
                          isDark
                            ? "bg-red-900/20 border-red-500/40 text-red-300"
                            : "bg-red-50 border-red-200 text-red-700"
                        }`}
                      >
                        {apiError}
                      </div>
                    )}

                    {/* EMAIL FIELD */}
                    <div className="space-y-2">
                      <label className="text-sm font-semibold flex items-center gap-2 transition-colors duration-300">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300 ${
                            isDark ? "bg-blue-900/40" : "bg-blue-100"
                          }`}
                        >
                          <Mail
                            className={`w-4 h-4 transition-colors duration-300 ${
                              isDark ? "text-blue-400" : "text-blue-600"
                            }`}
                          />
                        </div>
                        <span
                          className={isDark ? "text-gray-300" : "text-gray-700"}
                        >
                          Email Address
                        </span>
                      </label>
                      <Field
                        type="email"
                        name="email"
                        className={`mt-1 w-full h-12 rounded-xl border px-4 text-sm focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 placeholder:text-gray-400 ${
                          errors.email && touched.email
                            ? "border-red-400 focus:ring-red-400"
                            : `border-gray-300 focus:ring-blue-500 ${
                                isDark
                                  ? "border-gray-600/50 focus:ring-blue-400"
                                  : ""
                              }`
                        } ${
                          isDark
                            ? "bg-gray-800 text-white placeholder:text-gray-500"
                            : "bg-white text-gray-900"
                        }`}
                        placeholder="Enter your email"
                      />
                      <ErrorMessage
                        name="email"
                        component="p"
                        className={`text-xs mt-1 flex items-center gap-1 transition-colors duration-300 ${
                          isDark ? "text-red-400" : "text-red-500"
                        }`}
                      />
                    </div>

                    {/* PASSWORD FIELD */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <label className="text-sm font-semibold flex items-center gap-2 transition-colors duration-300">
                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300 ${
                              isDark ? "bg-blue-900/40" : "bg-blue-100"
                            }`}
                          >
                            <Lock
                              className={`w-4 h-4 transition-colors duration-300 ${
                                isDark ? "text-blue-400" : "text-blue-600"
                              }`}
                            />
                          </div>
                          <span
                            className={
                              isDark ? "text-gray-300" : "text-gray-700"
                            }
                          >
                            Password
                          </span>
                        </label>
                        <Link
                          to="/forgot-password"
                          className={`text-xs font-medium transition-colors duration-300 ${
                            isDark
                              ? "text-blue-400 hover:text-blue-300"
                              : "text-blue-600 hover:text-blue-700"
                          }`}
                        >
                          Forgot password?
                        </Link>
                      </div>

                      <div className="relative">
                        <Field
                          type={showPassword ? "text" : "password"}
                          name="password"
                          className={`mt-1 w-full h-12 rounded-xl border px-4 pr-12 text-sm focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 placeholder:text-gray-400 ${
                            errors.password && touched.password
                              ? "border-red-400 focus:ring-red-400"
                              : `border-gray-300 focus:ring-blue-500 ${
                                  isDark
                                    ? "border-gray-600/50 focus:ring-blue-400"
                                    : ""
                                }`
                          } ${
                            isDark
                              ? "bg-gray-800 text-white placeholder:text-gray-500"
                              : "bg-white text-gray-900"
                          }`}
                          placeholder="Enter your password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className={`absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition-all duration-300 ${
                            isDark
                              ? "text-gray-400 hover:text-gray-300 hover:bg-gray-800"
                              : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                          }`}
                        >
                          {showPassword ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                      <ErrorMessage
                        name="password"
                        component="p"
                        className={`text-xs mt-1 flex items-center gap-1 transition-colors duration-300 ${
                          isDark ? "text-red-400" : "text-red-500"
                        }`}
                      />
                    </div>

                    {/* Remember Me & Submit */}
                    <div className="space-y-5">
                      <div className="flex items-center">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <div className="relative">
                           
                          
                          </div>
                          
                        </label>
                      </div>

                      {/* SUBMIT BUTTON */}
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className={`relative w-full h-12 rounded-xl text-white font-semibold text-base active:scale-[0.98] transition-all duration-200 shadow-lg group overflow-hidden disabled:opacity-70 disabled:cursor-not-allowed ${
                          isDark
                            ? "bg-gradient-to-r from-blue-500 to-cyan-400 hover:from-blue-600 hover:to-cyan-500 hover:shadow-blue-500/20"
                            : "bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 hover:shadow-blue-500/40"
                        }`}
                      >
                        {/* Animated background effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-white/20 to-blue-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />

                        {isSubmitting ? (
                          <div className="flex items-center justify-center gap-2">
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            <span>Authenticating...</span>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center gap-2">
                            <LogIn className="w-4 h-4" />
                            <span>Sign In to Dashboard</span>
                          </div>
                        )}
                      </button>
                    </div>
                  </Form>
                )}
              </Formik>

              {/* Copyright */}
              <p
                className={`text-center text-xs mt-6 transition-colors duration-300 ${
                  isDark ? "text-gray-500" : "text-gray-400"
                }`}
              >
                © {new Date().getFullYear()} Activline Network Solutions. All
                rights reserved.
              </p>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default LoginPage;
