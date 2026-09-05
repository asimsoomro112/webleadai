'use client';

import React, { useState } from 'react';
import {
  Lock,
  Mail,
  User as UserIcon,
  Briefcase,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  X,
  Sparkles,
  ShieldCheck,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '@/lib/authContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'signin' | 'signup';
}

export function AuthModal({ isOpen, onClose, initialMode = 'signin' }: AuthModalProps) {
  const { signInWithEmail, signUpWithEmail, signInWithGoogle, sendPasswordReset } = useAuth();

  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setLoading(true);

    try {
      if (mode === 'forgot') {
        if (!email.trim()) {
          throw new Error('Please enter your email address to reset password.');
        }
        await sendPasswordReset(email);
        setSuccessMessage('Password reset link sent! Check your inbox.');
        setLoading(false);
        return;
      }

      if (mode === 'signup') {
        if (!displayName.trim()) {
          throw new Error('Please provide your name or agency title.');
        }
        if (password.length < 6) {
          throw new Error('Password must be at least 6 characters.');
        }
        if (password !== confirmPassword) {
          throw new Error('Passwords do not match.');
        }
        await signUpWithEmail(email, password, displayName, businessName);
        setSuccessMessage('Account created successfully! Welcome aboard.');
        setTimeout(() => {
          onClose();
        }, 1000);
      } else {
        // Sign In
        await signInWithEmail(email, password);
        setSuccessMessage('Signed in successfully!');
        setTimeout(() => {
          onClose();
        }, 800);
      }
    } catch (err: unknown) {
      console.error('Auth error:', err);
      let msg = 'Authentication failed. Please check your credentials.';
      if (err instanceof Error) {
        if (err.message.includes('auth/invalid-credential') || err.message.includes('auth/wrong-password')) {
          msg = 'Invalid email or password. Please try again.';
        } else if (err.message.includes('auth/user-not-found')) {
          msg = 'No account found with this email. Please sign up first.';
        } else if (err.message.includes('auth/email-already-in-use')) {
          msg = 'An account with this email already exists. Please sign in.';
        } else if (err.message.includes('auth/weak-password')) {
          msg = 'Password is too weak. Please use at least 6 characters.';
        } else if (err.message.includes('auth/popup-closed-by-user')) {
          msg = 'Google sign-in popup was closed before completing.';
        } else {
          msg = err.message;
        }
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setLoading(true);
    try {
      await signInWithGoogle();
      setSuccessMessage('Signed in with Google successfully!');
      setTimeout(() => {
        onClose();
      }, 800);
    } catch (err: unknown) {
      console.error('Google auth error:', err);
      if (err instanceof Error && !err.message.includes('popup-closed-by-user')) {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        id="auth-modal-card"
        className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden flex flex-col transition-all"
      >
        {/* Header with decorative badge */}
        <div className="p-6 border-b border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <span>
                  {mode === 'signin' && 'Sign In to Workspace'}
                  {mode === 'signup' && 'Create Agency Account'}
                  {mode === 'forgot' && 'Reset Password'}
                </span>
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Multi-User Cloud Sync & Isolated Data
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab switch */}
        {mode !== 'forgot' && (
          <div className="flex border-b border-zinc-100 dark:border-zinc-800 bg-zinc-100/50 dark:bg-zinc-950/40 p-1">
            <button
              type="button"
              onClick={() => {
                setMode('signin');
                setError(null);
                setSuccessMessage(null);
              }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                mode === 'signin'
                  ? 'bg-white dark:bg-zinc-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('signup');
                setError(null);
                setSuccessMessage(null);
              }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                mode === 'signup'
                  ? 'bg-white dark:bg-zinc-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
              }`}
            >
              Create Account
            </button>
          </div>
        )}

        <div className="p-6 space-y-4">
          {/* Security & Multi-User notice */}
          <div className="p-3 rounded-xl bg-emerald-500/5 dark:bg-emerald-950/20 border border-emerald-500/15 text-xs text-zinc-600 dark:text-zinc-400 flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            <span>
              Your profile, personal API keys, discovered leads, audits, and pitches are securely saved in Firebase Firestore and isolated to your UID.
            </span>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-600 dark:text-rose-400 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Success Message */}
          {successMessage && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-600 dark:text-emerald-400 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{successMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {mode === 'signup' && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Your Name / Founder Name *
                  </label>
                  <div className="relative">
                    <UserIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                    <input
                      type="text"
                      required
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="e.g. Alex Morgan"
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Agency or Freelance Business Name
                  </label>
                  <div className="relative">
                    <Briefcase className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                    <input
                      type="text"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      placeholder="e.g. Apex Digital Design"
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Email Address *
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="developer@agency.com"
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                />
              </div>
            </div>

            {mode !== 'forgot' && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    Password *
                  </label>
                  {mode === 'signin' && (
                    <button
                      type="button"
                      onClick={() => {
                        setMode('forgot');
                        setError(null);
                        setSuccessMessage(null);
                      }}
                      className="text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-10 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            )}

            {mode === 'signup' && (
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Confirm Password *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 text-xs font-semibold rounded-xl text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 transition-colors shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>
                    {mode === 'signin' && 'Sign In to Workspace'}
                    {mode === 'signup' && 'Create Account & Sync'}
                    {mode === 'forgot' && 'Send Password Reset Email'}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>

          {mode === 'forgot' && (
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => {
                  setMode('signin');
                  setError(null);
                  setSuccessMessage(null);
                }}
                className="text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
              >
                ← Back to Sign In
              </button>
            </div>
          )}

          {/* Social Google Provider */}
          {mode !== 'forgot' && (
            <>
              <div className="relative flex items-center justify-center my-3">
                <div className="border-t border-zinc-200 dark:border-zinc-800 w-full" />
                <span className="bg-white dark:bg-zinc-900 px-3 text-[11px] font-medium text-zinc-400 absolute">
                  or continue with
                </span>
              </div>

              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full py-2 px-4 text-xs font-medium rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white hover:bg-zinc-50 dark:bg-zinc-950 dark:hover:bg-zinc-900 text-zinc-700 dark:text-zinc-200 transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.16 0 9.97 0 12s.45 3.84 1.25 5.42l4.03-3.15z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                  />
                </svg>
                <span>Continue with Google</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
