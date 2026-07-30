'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Lock, User as UserIcon, Sparkles, CheckCircle2, AlertCircle, ArrowRight, RefreshCw, KeyRound, ShieldCheck, ArrowLeft, LogOut, Star } from 'lucide-react';
import { validateEmail } from '@/lib/emailValidation';
import { useStore, UserRole } from '@/lib/store';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { setCurrentUser, addNotification, currentUser } = useStore();
  const [mode, setMode] = useState<'login' | 'signup' | 'otp' | 'forgot-password'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<UserRole>('customer');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // Email Validation State
  const [resendTimer, setResendTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState(false);

  // Forgot-password state
  const [forgotStep, setForgotStep] = useState<'email' | 'reset'>('email');
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetOtp, setResetOtp] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [forgotError, setForgotError] = useState<string | null>(null);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState(false);

  // Resend Countdown Timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (mode === 'otp' && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    } else if (resendTimer === 0) {
      setCanResend(true);
    }
    return () => clearInterval(interval);
  }, [mode, resendTimer]);

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setEmail(val);
    if (val.trim()) {
      const res = validateEmail(val);
      setEmailError(res.error);
    } else {
      setEmailError(null);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    if (value && index < 5) {
      document.getElementById(`otp-${index + 1}`)?.focus();
    }
  };

  const handleGenerateOtp = async () => {
    setIsSending(true);
    setEmailError(null);
    try {
      const isPhone = /^\+?[0-9\s-]{8,}$/.test(email.trim());
      const endpoint = isPhone
        ? '/api/auth/otp/whatsapp/send'
        : '/api/auth/otp/email/send';
      const payload = isPhone ? { phone: email.trim() } : { email: email.trim() };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setEmailError(data.error || 'Failed to send OTP');
      } else {
        setResendTimer(30);
        setCanResend(false);
        addNotification(
          isPhone ? 'WhatsApp OTP Sent' : 'OTP Verification Email Sent',
          `Verification code sent to ${email}`,
          'system'
        );
        setMode('otp');
      }
    } catch (err: any) {
      setEmailError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (mode === 'signup' || mode === 'login') {
      const isPhone = /^\+?[0-9\s-]{8,}$/.test(email.trim());
      if (!isPhone) {
        const emailCheck = validateEmail(email);
        if (!emailCheck.isValid) {
          setEmailError(emailCheck.error);
          return;
        }
      }
      await handleGenerateOtp();
      return;
    }

    if (mode === 'otp') {
      setIsVerifying(true);
      setOtpError(null);
      const code = otp.join('');

      try {
        const isPhone = /^\+?[0-9\s-]{8,}$/.test(email.trim());
        const endpoint = isPhone
          ? '/api/auth/otp/whatsapp/verify'
          : '/api/auth/otp/email/verify';
        const payload = isPhone
          ? { phone: email.trim(), otp: code }
          : { email: email.trim(), otp: code };

        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        const data = await res.json();
        
        if (!res.ok || !data.success) {
          setOtpError(data.error || 'Invalid OTP');
          setIsVerifying(false);
          return;
        }

        // Successfully authenticate
        const dbUser = data.user;
        const newUser = {
          id: dbUser?.id || `usr-${Date.now()}`,
          email: dbUser?.email || email.trim(),
          name: dbUser?.full_name || fullName || email.split('@')[0],
          role: (dbUser?.role as UserRole) || role,
          loyaltyPoints: role === 'customer' ? 500 : 0,
        };

        setCurrentUser(newUser);
        setAuthSuccess(true);
        addNotification('Welcome to Haven Sanctuary', `Authenticated as ${newUser.name} (${newUser.role})`, 'system');

        setTimeout(() => {
          setAuthSuccess(false);
          onClose();
        }, 1200);
      } catch (err: any) {
        setOtpError(err.message || 'Failed to verify OTP. Try again.');
      } finally {
        setIsVerifying(false);
      }
    }
  };

  const handleGoogleOAuth = async () => {
    try {
      const { signIn } = await import('next-auth/react');
      // signIn navigates away to Google — the return trip is handled
      // by SessionSync.tsx which pushes the session into the store.
      await signIn('google', { callbackUrl: '/' });
    } catch (e) {
      console.error('Google OAuth error:', e);
      addNotification(
        'Sign-in Failed',
        'Could not connect to Google. Please try again.',
        'system'
      );
    }
  };

  // ─── Forgot-Password Handlers ─────────────────────────────────────────────

  const handleResetOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const next = [...resetOtp];
    next[index] = value.slice(-1);
    setResetOtp(next);
    if (value && index < 5) {
      document.getElementById(`reset-otp-${index + 1}`)?.focus();
    }
  };

  const handleForgotRequest = async () => {
    setForgotLoading(true);
    setForgotError(null);
    try {
      const res = await fetch('/api/auth/password/forgot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail.trim() }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setForgotError(data.error || 'Failed to request reset code.');
      } else {
        setForgotStep('reset');
        addNotification('Password Reset', `If an account exists, a reset code was sent to ${forgotEmail}`, 'system');
      }
    } catch (err: any) {
      setForgotError(err.message || 'Something went wrong.');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResetSubmit = async () => {
    setForgotError(null);
    if (newPassword.length < 8) {
      setForgotError('Password must be at least 8 characters.');
      return;
    }
    if (!/[0-9]/.test(newPassword)) {
      setForgotError('Password must contain at least one number.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setForgotError('Passwords do not match.');
      return;
    }
    setForgotLoading(true);
    try {
      const code = resetOtp.join('');
      const res = await fetch('/api/auth/password/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail.trim(), otp: code, newPassword }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setForgotError(data.error || 'Failed to reset password.');
      } else {
        setForgotSuccess(true);
        addNotification('Password Updated', 'Your password has been changed. Please log in.', 'system');
        setTimeout(() => {
          setForgotSuccess(false);
          setMode('login');
          // Reset forgot-password state
          setForgotStep('email');
          setForgotEmail('');
          setResetOtp(['', '', '', '', '', '']);
          setNewPassword('');
          setConfirmPassword('');
          setForgotError(null);
        }, 1500);
      }
    } catch (err: any) {
      setForgotError(err.message || 'Something went wrong.');
    } finally {
      setForgotLoading(false);
    }
  };

  // ─── Sign Out ──────────────────────────────────────────────────────────────
  const handleSignOut = async () => {
    try {
      setCurrentUser(null);
      // Also sign out from NextAuth so Google session cookie is cleared
      const { signOut } = await import('next-auth/react');
      await signOut({ redirect: false });
    } catch (e) {
      // Store is already cleared; ignore NextAuth errors
    }
    onClose();
  };

  if (!isOpen) return null;


  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-md bg-haven-card border border-haven-gold/30 rounded-2xl p-6 sm:p-8 shadow-gold-lg overflow-hidden"
        >
          {/* Top Gold Shimmer Border */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gold-gradient" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-haven-text-muted hover:text-haven-gold transition"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header subtitle */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 text-haven-gold font-serif text-2xl font-bold tracking-wider mb-1">
              <Sparkles className="w-5 h-5 text-haven-gold" />
              HAVEN SANCTUARY
            </div>
            <p className="font-sans text-xs text-haven-text-secondary uppercase tracking-widest">
              {currentUser
                ? 'Your Account'
                : mode === 'login'
                ? 'Welcome Back'
                : mode === 'signup'
                ? 'Create Guest Account'
                : mode === 'forgot-password'
                ? 'Reset Password'
                : 'Verify Email OTP'}
            </p>
          </div>

          {/* ── SIGNED-IN VIEW ─────────────────────────────────────────── */}
          {currentUser ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-5"
            >
              {/* Avatar + name */}
              <div className="flex flex-col items-center gap-3 py-4">
                <div className="w-16 h-16 rounded-full bg-haven-gold/20 border-2 border-haven-gold/50 flex items-center justify-center shadow-gold-sm">
                  <UserIcon className="w-8 h-8 text-haven-gold" />
                </div>
                <div className="text-center">
                  <p className="font-serif text-lg font-bold text-haven-text-primary">{currentUser.name}</p>
                  <p className="text-xs text-haven-text-muted mt-0.5">{currentUser.email}</p>
                  <span className="inline-block mt-1.5 px-2.5 py-0.5 rounded-full bg-haven-gold/15 border border-haven-gold/30 text-haven-gold text-[10px] font-semibold uppercase tracking-widest">
                    {currentUser.role}
                  </span>
                </div>
              </div>

              {/* Loyalty Points */}
              <div className="flex items-center justify-between bg-haven-surface border border-haven-gold/20 rounded-xl px-4 py-3">
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-haven-gold" />
                  <span className="text-xs font-semibold text-haven-text-secondary uppercase tracking-wider">Loyalty Points</span>
                </div>
                <span className="text-haven-gold font-bold font-serif text-lg">{currentUser.loyaltyPoints ?? 0}</span>
              </div>

              {/* Sign Out */}
              <button
                type="button"
                onClick={handleSignOut}
                className="w-full py-3 rounded-xl border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 font-semibold text-sm tracking-wider uppercase transition flex items-center justify-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </motion.div>
          ) : authSuccess ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="py-8 text-center flex flex-col items-center justify-center gap-3"
            >
              <CheckCircle2 className="w-14 h-14 text-haven-gold animate-bounce" />
              <h3 className="font-serif text-xl text-haven-text-primary font-bold">
                {forgotSuccess ? 'Password Updated' : 'Authentication Successful'}
              </h3>
              <p className="text-xs text-haven-text-secondary">Welcome to Haven Restaurant & Lounge</p>
            </motion.div>
          ) : (
            <form onSubmit={handleAuthSubmit} className="space-y-4">
              {mode === 'signup' && (
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-haven-text-muted mb-1.5 font-semibold">
                    Full Name
                  </label>
                  <div className="relative">
                    <UserIcon className="absolute left-3.5 top-3 w-4 h-4 text-haven-gold/60" />
                    <input
                      type="text"
                      required
                      autoComplete="off"
                      name="haven-fullname"
                      placeholder="Your full name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full bg-haven-surface border border-haven-border rounded-xl py-2.5 pl-10 pr-4 text-sm text-haven-text-primary placeholder:text-haven-text-muted focus:outline-none focus:border-haven-gold/70"
                    />
                  </div>
                </div>
              )}

              {mode !== 'otp' && (
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-haven-text-muted mb-1.5 font-semibold">
                    Email Address <span className="text-haven-gold">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3 w-4 h-4 text-haven-gold/60" />
                    <input
                      type="email"
                      required
                      autoComplete="off"
                      name="haven-email"
                      placeholder="user@example.com"
                      value={email}
                      onChange={handleEmailChange}
                      className={`w-full bg-haven-surface border rounded-xl py-2.5 pl-10 pr-4 text-sm text-haven-text-primary placeholder:text-haven-text-muted focus:outline-none transition ${
                        emailError
                          ? 'border-red-500 focus:border-red-500'
                          : 'border-haven-border focus:border-haven-gold/70'
                      }`}
                    />
                  </div>
                  {emailError && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-1.5 mt-1.5 text-red-400 text-xs"
                    >
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{emailError}</span>
                    </motion.div>
                  )}
                </div>
              )}

              {mode !== 'otp' && (
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-haven-text-muted mb-1.5 font-semibold">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3 w-4 h-4 text-haven-gold/60" />
                    <input
                      type="password"
                      required
                      autoComplete="new-password"
                      name="haven-password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-haven-surface border border-haven-border rounded-xl py-2.5 pl-10 pr-4 text-sm text-haven-text-primary placeholder:text-haven-text-muted focus:outline-none focus:border-haven-gold/70"
                    />
                  </div>
                  {mode === 'login' && (
                    <div className="flex justify-end mt-1">
                      <button
                        type="button"
                        onClick={() => { setMode('forgot-password'); setForgotEmail(email); setForgotError(null); setForgotStep('email'); }}
                        className="text-[11px] text-haven-gold/80 hover:text-haven-gold transition font-medium"
                      >
                        Forgot password?
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Role Selection */}
              {mode === 'signup' && (
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-haven-text-muted mb-1.5 font-semibold">
                    Account Role
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['customer', 'staff', 'admin'] as UserRole[]).map((r) => (
                      <button
                        type="button"
                        key={r}
                        onClick={() => setRole(r)}
                        className={`py-2 text-xs rounded-lg border font-medium capitalize transition ${
                          role === r
                            ? 'border-haven-gold bg-haven-gold/10 text-haven-gold shadow-gold-sm'
                            : 'border-haven-border bg-haven-surface text-haven-text-muted hover:text-haven-text-primary'
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* OTP VERIFICATION STEP WITH INSTANT CODE DISPLAY & AUTO-FILL */}
              {mode === 'otp' && (
                <div className="space-y-4">
                  {/* PROFESSIONAL OTP NOTIFICATION BANNER */}
                  <div className="bg-haven-surface border border-haven-gold/20 rounded-xl p-4 text-center space-y-2">
                    <div className="flex items-center justify-center gap-1.5 text-haven-gold text-xs font-semibold">
                      <KeyRound className="w-4 h-4" />
                      <span>WhatsApp Verification</span>
                    </div>
                    <p className="text-xs text-haven-text-secondary leading-relaxed">
                      OTP has been sent to your WhatsApp number.
                    </p>
                  </div>

                  <div className="flex justify-between gap-2">
                    {otp.map((digit, index) => (
                      <input
                        key={index}
                        id={`otp-${index}`}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(index, e.target.value)}
                        className="w-12 h-14 text-center bg-haven-surface border border-haven-border rounded-xl text-xl text-haven-text-primary placeholder:text-haven-text-muted focus:outline-none focus:border-haven-gold/70 transition font-mono"
                      />
                    ))}
                  </div>

                  {otpError && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-1.5 mt-2 text-red-400 text-xs justify-center"
                    >
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{otpError}</span>
                    </motion.div>
                  )}

                  {/* Resend Action */}
                  <div className="flex items-center justify-end text-xs pt-1">
                    <button
                      type="button"
                      disabled={!canResend}
                      onClick={handleGenerateOtp}
                      className="text-haven-text-muted hover:text-haven-gold transition disabled:opacity-50 flex items-center gap-1"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>{canResend ? 'Resend OTP' : `Resend (${resendTimer}s)`}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* ─── FORGOT PASSWORD MODE ────────────────────────────── */}
              {mode === 'forgot-password' && !forgotSuccess && (
                <div className="space-y-4">
                  {forgotStep === 'email' ? (
                    <>
                      <div className="bg-haven-surface border border-haven-gold/20 rounded-xl p-4 text-center space-y-2">
                        <div className="flex items-center justify-center gap-1.5 text-haven-gold text-xs font-semibold">
                          <ShieldCheck className="w-4 h-4" />
                          <span>Password Reset</span>
                        </div>
                        <p className="text-xs text-haven-text-secondary leading-relaxed">
                          Enter your email and we&apos;ll send a 6-digit reset code.
                        </p>
                      </div>

                      <div>
                        <label className="block text-[10px] uppercase tracking-widest text-haven-text-muted mb-1.5 font-semibold">
                          Email Address <span className="text-haven-gold">*</span>
                        </label>
                        <div className="relative">
                          <Mail className="absolute left-3.5 top-3 w-4 h-4 text-haven-gold/60" />
                          <input
                            type="email"
                            required
                            autoComplete="off"
                            placeholder="user@example.com"
                            value={forgotEmail}
                            onChange={(e) => setForgotEmail(e.target.value)}
                            className="w-full bg-haven-surface border border-haven-border rounded-xl py-2.5 pl-10 pr-4 text-sm text-haven-text-primary placeholder:text-haven-text-muted focus:outline-none focus:border-haven-gold/70"
                          />
                        </div>
                      </div>

                      {forgotError && (
                        <motion.div
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex items-center gap-1.5 text-red-400 text-xs"
                        >
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          <span>{forgotError}</span>
                        </motion.div>
                      )}

                      <button
                        type="button"
                        disabled={forgotLoading || !forgotEmail.trim()}
                        onClick={handleForgotRequest}
                        className="w-full py-3.5 rounded-xl bg-gold-gradient text-black font-bold text-sm tracking-wider uppercase transition shadow-gold-sm hover:opacity-90 flex items-center justify-center gap-2"
                      >
                        <span>{forgotLoading ? 'Sending...' : 'Send Reset Code'}</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="bg-haven-surface border border-haven-gold/20 rounded-xl p-4 text-center space-y-2">
                        <div className="flex items-center justify-center gap-1.5 text-haven-gold text-xs font-semibold">
                          <KeyRound className="w-4 h-4" />
                          <span>Enter Reset Code</span>
                        </div>
                        <p className="text-xs text-haven-text-secondary leading-relaxed">
                          A code was sent to <strong className="text-haven-text-primary">{forgotEmail}</strong>. It expires in 10 minutes.
                        </p>
                      </div>

                      {/* OTP boxes — same style as login OTP */}
                      <div className="flex justify-between gap-2">
                        {resetOtp.map((digit, index) => (
                          <input
                            key={index}
                            id={`reset-otp-${index}`}
                            type="text"
                            inputMode="numeric"
                            maxLength={1}
                            value={digit}
                            onChange={(e) => handleResetOtpChange(index, e.target.value)}
                            className="w-12 h-14 text-center bg-haven-surface border border-haven-border rounded-xl text-xl text-haven-text-primary placeholder:text-haven-text-muted focus:outline-none focus:border-haven-gold/70 transition font-mono"
                          />
                        ))}
                      </div>

                      {/* New Password */}
                      <div>
                        <label className="block text-[10px] uppercase tracking-widest text-haven-text-muted mb-1.5 font-semibold">
                          New Password <span className="text-haven-gold">*</span>
                        </label>
                        <div className="relative">
                          <Lock className="absolute left-3.5 top-3 w-4 h-4 text-haven-gold/60" />
                          <input
                            type="password"
                            required
                            autoComplete="new-password"
                            placeholder="Min 8 chars, at least 1 number"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="w-full bg-haven-surface border border-haven-border rounded-xl py-2.5 pl-10 pr-4 text-sm text-haven-text-primary placeholder:text-haven-text-muted focus:outline-none focus:border-haven-gold/70"
                          />
                        </div>
                      </div>

                      {/* Confirm Password */}
                      <div>
                        <label className="block text-[10px] uppercase tracking-widest text-haven-text-muted mb-1.5 font-semibold">
                          Confirm Password <span className="text-haven-gold">*</span>
                        </label>
                        <div className="relative">
                          <ShieldCheck className="absolute left-3.5 top-3 w-4 h-4 text-haven-gold/60" />
                          <input
                            type="password"
                            required
                            autoComplete="new-password"
                            placeholder="Re-enter new password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full bg-haven-surface border border-haven-border rounded-xl py-2.5 pl-10 pr-4 text-sm text-haven-text-primary placeholder:text-haven-text-muted focus:outline-none focus:border-haven-gold/70"
                          />
                        </div>
                      </div>

                      {forgotError && (
                        <motion.div
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex items-center gap-1.5 text-red-400 text-xs"
                        >
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          <span>{forgotError}</span>
                        </motion.div>
                      )}

                      <button
                        type="button"
                        disabled={forgotLoading || resetOtp.join('').length < 6 || !newPassword || !confirmPassword}
                        onClick={handleResetSubmit}
                        className="w-full py-3.5 rounded-xl bg-gold-gradient text-black font-bold text-sm tracking-wider uppercase transition shadow-gold-sm hover:opacity-90 flex items-center justify-center gap-2"
                      >
                        <span>{forgotLoading ? 'Resetting...' : 'Reset Password'}</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </>
                  )}

                  {/* Back to login link */}
                  <div className="text-center pt-1">
                    <button
                      type="button"
                      onClick={() => { setMode('login'); setForgotError(null); setForgotStep('email'); }}
                      className="text-xs text-haven-text-muted hover:text-haven-gold transition flex items-center justify-center gap-1 mx-auto"
                    >
                      <ArrowLeft className="w-3 h-3" />
                      <span>Back to login</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Forgot-password success state */}
              {mode === 'forgot-password' && forgotSuccess && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="py-8 text-center flex flex-col items-center justify-center gap-3"
                >
                  <CheckCircle2 className="w-14 h-14 text-haven-gold animate-bounce" />
                  <h3 className="font-serif text-xl text-haven-text-primary font-bold">Password Updated</h3>
                  <p className="text-xs text-haven-text-secondary">Redirecting to login...</p>
                </motion.div>
              )}

              {/* Submit Button — hide in forgot-password mode (it has its own buttons) */}
              {mode !== 'forgot-password' && (
                <button
                  type="submit"
                  disabled={isSending || isVerifying || Boolean(emailError)}
                  className="w-full py-3.5 rounded-xl bg-gold-gradient text-black font-bold text-sm tracking-wider uppercase transition shadow-gold-sm hover:opacity-90 flex items-center justify-center gap-2 mt-6"
                >
                  <span>
                    {mode === 'login'
                      ? 'Log In'
                      : mode === 'signup'
                      ? (isSending ? 'Sending OTP...' : 'Continue')
                      : (isVerifying ? 'Verifying...' : 'Verify OTP')}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}

              {/* Google OAuth Button — hidden during OTP and forgot-password modes */}
              {mode !== 'otp' && mode !== 'forgot-password' && (
                <button
                  type="button"
                  onClick={handleGoogleOAuth}
                  className="w-full py-2.5 rounded-xl border border-haven-border bg-haven-surface hover:border-haven-gold/50 text-haven-text-primary text-xs font-medium tracking-wider flex items-center justify-center gap-2 transition"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                  <span>Continue with Google</span>
                </button>
              )}

              {/* Toggle mode — hidden during forgot-password (it has its own back link) */}
              {mode !== 'forgot-password' && (
                <div className="text-center pt-2">
                  {mode === 'login' ? (
                    <p className="text-xs text-haven-text-muted">
                      New guest?{' '}
                      <button
                        type="button"
                        onClick={() => setMode('signup')}
                        className="text-haven-gold font-semibold underline"
                      >
                        Create Account
                      </button>
                    </p>
                  ) : (
                    <p className="text-xs text-haven-text-muted">
                      Already have an account?{' '}
                      <button
                        type="button"
                        onClick={() => setMode('login')}
                        className="text-haven-gold font-semibold underline"
                      >
                        Sign In
                      </button>
                    </p>
                  )}
                </div>
              )}
            </form>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
