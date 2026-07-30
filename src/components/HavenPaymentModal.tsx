'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CreditCard,
  Lock,
  User,
  Calendar,
  Wifi,
  CheckCircle2,
  XCircle,
  Sparkles,
  ArrowRight,
  X,
  AlertCircle,
  ChevronLeft,
  QrCode,
  Copy,
  Check,
  Clock
} from 'lucide-react';
import { useStore } from '@/lib/store';
import { formatPrice } from '@/lib/format';
import { validateCard, detectCardType } from '@/lib/cardValidation';

interface HavenPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  amount?: number;
  orderSummary?: { name: string; price: number; quantity: number }[];
}

export type PaymentMethodType = 'credit_card' | 'upi' | 'paypal' | 'apple_pay' | 'google_pay' | 'webmoney';

export function HavenPaymentModal({
  isOpen,
  onClose,
  amount: propAmount,
  orderSummary: propOrderSummary,
}: HavenPaymentModalProps) {
  const { cart, cartTotal, createOrder, addNotification, currentUser } = useStore();

  // Selected Payment Method
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethodType>('credit_card');
  const [currentScreen, setCurrentScreen] = useState<'selector' | 'details'>('details');

  // Compute final amount & item summary from cart if available
  const items = cart.length > 0
    ? cart.map((c) => ({ name: c.menuItem.name, price: c.menuItem.price, quantity: c.quantity }))
    : propOrderSummary || [
        { name: 'A5 Miyazaki Wagyu Steak (Tasting)', price: 180, quantity: 1 },
        { name: 'Smoked Ruby Cocktail', price: 30, quantity: 1 },
        { name: '24k Gold Alchemy Infusion', price: 30, quantity: 1 },
      ];

  const rawTotal = cart.length > 0 ? cartTotal * 1.1 : propAmount || 240.0;
  const amount = Math.max(rawTotal, 1);

  // Credit Card Form State
  const [cardName, setCardName] = useState('LORD ALISTAIR');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('12/28');
  const [cvv, setCvv] = useState('');

  // Card Validation Errors
  const [cardErrors, setCardErrors] = useState<{
    cardName?: string;
    cardNumber?: string;
    expiry?: string;
    cvv?: string;
    general?: string;
  }>({});

  // UPI Form & Copy State
  const [copiedUpi, setCopiedUpi] = useState(false);

  // Payment Processing State
  const [isFlipped, setIsFlipped] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isDeclined, setIsDeclined] = useState(false); // Card declined / validation failed
  const [transactionRef, setTransactionRef] = useState('');

  // Payment Countdown Timer (5 Minutes = 300s)
  const [timerSeconds, setTimerSeconds] = useState(300);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isOpen && !isSuccess) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isOpen, isSuccess]);

  const formatTimer = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Card Number Formatting
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 16) value = value.slice(0, 16);
    const formatted = value.replace(/(\d{4})(?=\d)/g, '$1 ');
    setCardNumber(formatted);
  };

  // Expiry Date Formatting (MM/YY)
  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 4) value = value.slice(0, 4);

    if (value.length >= 2) {
      const month = parseInt(value.slice(0, 2), 10);
      if (month > 12) value = '12' + value.slice(2);
      if (month === 0 && value.length === 2) value = '01';
      value = value.slice(0, 2) + '/' + value.slice(2);
    }
    setExpiry(value);
  };

  // CVV Formatting & Auto-Flip
  const handleCvvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 3) value = value.slice(0, 3);
    setCvv(value);

    if (value.length === 3) {
      setTimeout(() => {
        setIsFlipped(false);
      }, 300);
    }
  };

  const handleCopyUpi = () => {
    navigator.clipboard.writeText('havenlounge@okaxis');
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  // Handle Credit Card Submission (Validation removed for demo)
  const handlePaymentSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    setCardErrors({});
    setIsSubmitting(true);
    setIsFlipped(false);

    const ref = `TXN-${Math.floor(100000 + Math.random() * 900000)}`;
    setTransactionRef(ref);

    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);

      // Create live Order in store context
      createOrder({
        guestName: currentUser?.name || 'Lord Alistair',
        guestEmail: currentUser?.email || 'guest@havenlounge.com',
        orderType: 'dine_in',
        totalAmount: amount,
        items: cart.length > 0 ? cart : [
          {
            menuItem: {
              id: 'm-1',
              categoryId: 'cat-1',
              name: 'Tandoori Lamb Chops',
              description: 'Succulent lamb chops marinated overnight in aged yogurt',
              price: 48,
              imageUrl: '/tandoori-lamb-chops.jpeg',
              isSignature: true,
              isAvailable: true,
              calories: 520,
              prepTimeMins: 22,
            },
            quantity: 1,
          },
          {
            menuItem: {
              id: 'm-4',
              categoryId: 'cat-2',
              name: 'Nalli Nihari Biryani',
              description: 'Slow-cooked tender meat in rich nihari spices',
              price: 58,
              imageUrl: '/nalli-nihari-biryani.jpeg',
              isSignature: true,
              isAvailable: true,
              calories: 780,
              prepTimeMins: 35,
            },
            quantity: 1,
          }
        ],
      });

      addNotification(
        'Payment Verified & Order Confirmed',
        `Transaction ${ref} (${formatPrice(amount)}) processed via ${selectedMethod.toUpperCase()}. Order is now live in kitchen sync!`,
        'order'
      );

      // Send payment confirmation email
      const guestEmail = currentUser?.email;
      const guestName = currentUser?.name || 'Guest';
      if (guestEmail) {
        fetch('/api/send-payment-confirmation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            guestName,
            guestEmail,
            amount: amount.toFixed(2),
            transactionId: ref,
          }),
        }).catch((err) => console.error('[Payment Email Error]', err));
      }

      // WhatsApp confirmation
      const restaurantWhatsApp = process.env.NEXT_PUBLIC_RESTAURANT_WHATSAPP || '919876543210';
      const waText = encodeURIComponent(
        `✅ *HAVEN SANCTUARY — Payment Confirmed!*\n\n` +
          `👤 Guest: ${guestName}\n` +
          `💳 Amount: ₹${amount.toFixed(2)}\n` +
          `🔑 Transaction ID: ${ref}\n` +
          `\nThank you for dining with us at Haven Sanctuary, Bandra West, Mumbai.`
      );
      window.open(`https://wa.me/${restaurantWhatsApp}?text=${waText}`, '_blank');
    }, 2200);
  };

  // Handle UPI / Wallet submission (no card validation needed)
  const handleWalletSubmit = React.useCallback(() => {
    setIsSubmitting(true);
    const ref = `TXN-${Math.floor(100000 + Math.random() * 900000)}`;
    setTransactionRef(ref);
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
      createOrder({
        guestName: currentUser?.name || 'Lord Alistair',
        guestEmail: currentUser?.email || 'guest@havenlounge.com',
        orderType: 'dine_in',
        totalAmount: amount,
        items: cart.length > 0 ? cart : [],
      });
      addNotification(
        'Payment Verified & Order Confirmed',
        `Transaction ${ref} (${formatPrice(amount)}) processed via ${selectedMethod.toUpperCase()}.`,
        'order'
      );
    }, 2200);
  }, [amount, cart, createOrder, currentUser, addNotification, selectedMethod]);

  // Demo auto-pay feature for UPI / QR Code screen & auto-close on success
  useEffect(() => {
    let autoPayTimer: NodeJS.Timeout;
    if (isOpen && selectedMethod === 'upi' && currentScreen === 'details' && !isSuccess && !isSubmitting) {
      autoPayTimer = setTimeout(() => {
        handleWalletSubmit();
      }, 7000); // Auto simulate payment completion after 7s on QR screen
    }
    return () => clearTimeout(autoPayTimer);
  }, [isOpen, selectedMethod, currentScreen, isSuccess, isSubmitting, handleWalletSubmit]);

  useEffect(() => {
    let closeTimer: NodeJS.Timeout;
    if (isOpen && isSuccess) {
      closeTimer = setTimeout(() => {
        onClose();
      }, 4000); // Auto close modal 4s after payment success screen is shown
    }
    return () => clearTimeout(closeTimer);
  }, [isOpen, isSuccess, onClose]);

  const renderCardNumber = () => {
    if (!cardNumber) return '4532  8910  2345  6789';
    return cardNumber;
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-3xl bg-[#121212] border border-haven-gold/30 rounded-3xl overflow-hidden shadow-2xl text-white my-6"
        >
          {/* Top Bar matching design: Back button + Title + Guest Avatar */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-haven-gold/20 bg-black/60">
            <div className="flex items-center gap-3">
              {currentScreen === 'details' && (
                <button
                  onClick={() => setCurrentScreen('selector')}
                  className="p-1.5 rounded-full bg-haven-surface hover:bg-haven-gold/20 text-white hover:text-haven-gold transition"
                  title="Back to payment methods"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
              )}
              <h2 className="font-serif text-lg font-bold text-white tracking-wide">
                {currentScreen === 'selector' ? 'Payment method' : `Pay via ${selectedMethod.replace('_', ' ').toUpperCase()}`}
              </h2>
            </div>

            {/* Guest Avatar & Close */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-haven-surface/80 border border-haven-gold/30 px-3 py-1.5 rounded-full">
                <div className="w-6 h-6 rounded-full bg-gold-gradient flex items-center justify-center text-black font-bold text-xs uppercase">
                  {currentUser?.name ? currentUser.name[0] : 'L'}
                </div>
                <span className="text-xs font-serif font-semibold text-haven-gold truncate max-w-[100px]">
                  {currentUser?.name || 'Lord Alistair'}
                </span>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-full bg-black/60 text-white/70 hover:text-haven-gold border border-haven-gold/30 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Payment Timer Bar */}
          <div className={`border-b border-haven-gold/20 px-6 py-2 flex items-center justify-between text-xs font-mono transition-all duration-500 ${
            timerSeconds <= 60
              ? 'bg-red-950/60 text-red-400'
              : 'bg-haven-gold/10 text-haven-gold'
          }`}>
            <div className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 animate-pulse" />
              <span>Payment Reservation Window</span>
            </div>
            <div className={`font-bold tracking-wider ${timerSeconds <= 60 ? 'animate-timer-urgency' : ''}`}>
              {formatTimer(timerSeconds)} REMAINING
            </div>
          </div>

          {/* SUCCESS View */}
          {isSuccess ? (
            <div className="p-8 sm:p-12 flex flex-col items-center justify-center text-center space-y-6">
              <div className="relative">
                <svg width="88" height="88" viewBox="0 0 100 100" className="overflow-visible drop-shadow-[0_0_25px_rgba(16,185,129,0.6)]">
                  <motion.circle
                    cx="50" cy="50" r="42" fill="none" stroke="#10b981" strokeWidth="6"
                    initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
                    transition={{ duration: 0.7, ease: 'easeInOut' }}
                  />
                  <motion.path
                    d="M 30 52 L 44 66 L 72 32" fill="none" stroke="#10b981" strokeWidth="6"
                    strokeLinecap="round" strokeLinejoin="round"
                    initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
                    transition={{ duration: 0.5, delay: 0.4, ease: 'easeOut' }}
                  />
                </svg>
              </div>
              <div className="space-y-2">
                <span className="text-[10px] uppercase font-serif tracking-[0.3em] text-emerald-400 bg-emerald-950/80 px-3 py-1 rounded-full border border-emerald-500/40">
                  REF: {transactionRef}
                </span>
                <h3 className="font-serif text-3xl font-bold text-white">Payment Successful!</h3>
                <p className="font-sans text-xs text-haven-text-secondary max-w-md mx-auto leading-relaxed">
                  Your payment of <strong className="text-haven-gold font-mono">{formatPrice(amount)}</strong> has been verified. Your order is live in our real-time kitchen tracking system.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  onClick={() => { onClose(); const el = document.getElementById('menu') || document.body; el.scrollIntoView({ behavior: 'smooth' }); }}
                  className="px-8 py-3.5 rounded-full bg-gold-gradient text-black font-bold text-xs uppercase tracking-widest shadow-gold-lg hover:opacity-90 transition transform hover:scale-105"
                >
                  View Live Kitchen Order Tracker
                </button>
              </div>
            </div>

          /* DECLINED View — shown when card validation fails */
          ) : isDeclined ? (
            <div className="p-8 sm:p-12 flex flex-col items-center justify-center text-center space-y-6">
              <div className="relative">
                <svg width="88" height="88" viewBox="0 0 100 100" className="overflow-visible drop-shadow-[0_0_25px_rgba(239,68,68,0.7)]">
                  <motion.circle
                    cx="50" cy="50" r="42" fill="rgba(127,29,29,0.4)" stroke="#ef4444" strokeWidth="6"
                    initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 1 }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                  />
                  <motion.path
                    d="M 34 34 L 66 66" fill="none" stroke="#ef4444" strokeWidth="7"
                    strokeLinecap="round"
                    initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
                    transition={{ duration: 0.35, delay: 0.3 }}
                  />
                  <motion.path
                    d="M 66 34 L 34 66" fill="none" stroke="#ef4444" strokeWidth="7"
                    strokeLinecap="round"
                    initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
                    transition={{ duration: 0.35, delay: 0.45 }}
                  />
                </svg>
              </div>
              <div className="space-y-2">
                <h3 className="font-serif text-2xl font-bold text-red-400">Card Declined</h3>
                <p className="text-xs text-haven-text-secondary max-w-sm mx-auto leading-relaxed">
                  Please check your card details and try again. Ensure the card number, expiry date, and CVV are correct.
                </p>
              </div>
              <button
                onClick={() => setIsDeclined(false)}
                className="px-6 py-3 rounded-xl border border-red-500/40 text-red-400 hover:bg-red-950/50 text-xs font-semibold uppercase tracking-wider transition"
              >
                Try Again
              </button>
            </div>
          ) : currentScreen === 'selector' ? (
            /* ===================================================
               PAYMENT METHOD SELECTOR SCREEN (MATCHING USER DESIGN)
               =================================================== */
            <div className="p-6 sm:p-8 space-y-6">
              <div>
                <p className="text-sm text-white/80 font-sans">Select your payment method.</p>
              </div>

              {/* Section 1: Add a new credit/Debit card */}
              <div className="space-y-3">
                <h4 className="text-xs font-serif uppercase tracking-wider text-haven-text-muted font-semibold">
                  Add a new credit/Debit card
                </h4>

                <div className="space-y-2.5">
                  {/* PayPal */}
                  <label
                    onClick={() => setSelectedMethod('paypal')}
                    className={`flex items-center justify-between p-4 rounded-2xl border cursor-pointer transition-all duration-300 ${
                      selectedMethod === 'paypal'
                        ? 'border-haven-gold bg-haven-gold/10 shadow-gold-sm'
                        : 'border-white/10 bg-haven-surface hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400 font-bold font-serif">
                        P
                      </div>
                      <span className="text-sm font-semibold text-white">Paypal</span>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedMethod === 'paypal' ? 'border-orange-500 bg-orange-500' : 'border-white/40'}`}>
                      {selectedMethod === 'paypal' && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                  </label>

                  {/* Credit Card (Mastercard / Visa) */}
                  <label
                    onClick={() => setSelectedMethod('credit_card')}
                    className={`flex items-center justify-between p-4 rounded-2xl border cursor-pointer transition-all duration-300 ${
                      selectedMethod === 'credit_card'
                        ? 'border-haven-gold bg-haven-gold/10 shadow-gold-sm'
                        : 'border-white/10 bg-haven-surface hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-r from-red-500 to-amber-500 flex items-center justify-center shadow-md">
                        <CreditCard className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <span className="text-sm font-semibold text-white block">Credit Card</span>
                        <span className="text-[10px] text-haven-gold/80 font-mono">3D Visa / Mastercard Flip</span>
                      </div>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedMethod === 'credit_card' ? 'border-orange-500 bg-orange-500' : 'border-white/40'}`}>
                      {selectedMethod === 'credit_card' && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                  </label>

                  {/* UPI & QR Code Gateway */}
                  <label
                    onClick={() => setSelectedMethod('upi')}
                    className={`flex items-center justify-between p-4 rounded-2xl border cursor-pointer transition-all duration-300 ${
                      selectedMethod === 'upi'
                        ? 'border-haven-gold bg-haven-gold/10 shadow-gold-sm'
                        : 'border-white/10 bg-haven-surface hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-emerald-600/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                        <QrCode className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-sm font-semibold text-white block">UPI & Instant QR Scanner</span>
                        <span className="text-[10px] text-emerald-400 font-mono">Google Pay • PhonePe • Paytm • BHIM</span>
                      </div>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedMethod === 'upi' ? 'border-orange-500 bg-orange-500' : 'border-white/40'}`}>
                      {selectedMethod === 'upi' && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                  </label>

                  {/* Apple Pay */}
                  <label
                    onClick={() => setSelectedMethod('apple_pay')}
                    className={`flex items-center justify-between p-4 rounded-2xl border cursor-pointer transition-all duration-300 ${
                      selectedMethod === 'apple_pay'
                        ? 'border-haven-gold bg-haven-gold/10 shadow-gold-sm'
                        : 'border-white/10 bg-haven-surface hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-white text-black flex items-center justify-center font-bold">
                        
                      </div>
                      <span className="text-sm font-semibold text-white">Apple pay</span>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedMethod === 'apple_pay' ? 'border-orange-500 bg-orange-500' : 'border-white/40'}`}>
                      {selectedMethod === 'apple_pay' && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                  </label>

                  {/* Google Pay */}
                  <label
                    onClick={() => setSelectedMethod('google_pay')}
                    className={`flex items-center justify-between p-4 rounded-2xl border cursor-pointer transition-all duration-300 ${
                      selectedMethod === 'google_pay'
                        ? 'border-haven-gold bg-haven-gold/10 shadow-gold-sm'
                        : 'border-white/10 bg-haven-surface hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-white font-bold">
                        G
                      </div>
                      <span className="text-sm font-semibold text-white">Google pay</span>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedMethod === 'google_pay' ? 'border-orange-500 bg-orange-500' : 'border-white/40'}`}>
                      {selectedMethod === 'google_pay' && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                  </label>
                </div>
              </div>

              {/* Section 2: WebMoney */}
              <div className="space-y-3">
                <h4 className="text-xs font-serif uppercase tracking-wider text-haven-text-muted font-semibold">
                  WebMoney
                </h4>

                <label
                  onClick={() => setSelectedMethod('webmoney')}
                  className={`flex items-center justify-between p-4 rounded-2xl border cursor-pointer transition-all duration-300 ${
                    selectedMethod === 'webmoney'
                      ? 'border-haven-gold bg-haven-gold/10 shadow-gold-sm'
                      : 'border-white/10 bg-haven-surface hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-cyan-600/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 font-bold">
                      WM
                    </div>
                    <span className="text-sm font-semibold text-white">WebMoney</span>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedMethod === 'webmoney' ? 'border-orange-500 bg-orange-500' : 'border-white/40'}`}>
                    {selectedMethod === 'webmoney' && <div className="w-2 h-2 rounded-full bg-white" />}
                  </div>
                </label>
              </div>

              {/* Bottom Order Summary & Proceed Button */}
              <div className="pt-4 border-t border-white/10 space-y-4">
                <div className="flex justify-between items-center text-sm font-serif">
                  <span className="text-haven-text-secondary">Amount Payable</span>
                  <span className="font-mono text-xl font-bold text-haven-gold">{formatPrice(amount)}</span>
                </div>

                <button
                  onClick={() => setCurrentScreen('details')}
                  className="w-full py-4 rounded-full bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm tracking-wider uppercase transition shadow-lg flex items-center justify-center gap-2"
                >
                  <span>Proceed with {selectedMethod.replace('_', ' ')}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            /* ===================================================
               DETAILS SCREEN: SPECIFIC METHOD PAYMENT EXPERIENCE
               =================================================== */
            <div className="p-6 sm:p-8">
              {/* CREDIT CARD VIEW */}
              {selectedMethod === 'credit_card' && (
                <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                  {/* Left Column: 3D Visa Card */}
                  <div className="md:col-span-5 flex flex-col justify-between items-center space-y-6">
                    <div className="w-full relative min-h-[220px] flex flex-col items-center justify-center [perspective:1000px]">
                      {isSubmitting && (
                        <div className="absolute inset-0 max-w-[340px] mx-auto h-[200px] rounded-3xl border-2 border-haven-gold/80 animate-spin pointer-events-none" />
                      )}

                      <motion.div
                        animate={{
                          rotateY: isSubmitting ? [0, 180, 360] : isFlipped ? 180 : 0,
                          scale: isSubmitting ? [1, 1.05, 1] : 1,
                        }}
                        transition={{
                          rotateY: isSubmitting
                            ? { repeat: Infinity, duration: 1.6, ease: "easeInOut" }
                            : { duration: 0.7, ease: [0.16, 1, 0.3, 1] },
                          scale: isSubmitting
                            ? { repeat: Infinity, duration: 1.6, ease: "easeInOut" }
                            : { duration: 0.5 },
                        }}
                        style={{ transformStyle: 'preserve-3d' }}
                        className="relative w-full max-w-[320px] h-[190px] shadow-2xl rounded-2xl"
                      >
                        {/* FRONT FACE */}
                        <div
                          style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
                          className="absolute inset-0 w-full h-full rounded-2xl bg-gradient-to-br from-[#1E1E1E] via-[#0D0D0D] to-[#2A2A2A] border border-haven-gold/60 p-5 shadow-2xl flex flex-col justify-between overflow-hidden"
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-6 rounded bg-gradient-to-tr from-yellow-600 to-yellow-200 border border-haven-gold/40" />
                              <Wifi className="w-4 h-4 text-haven-gold rotate-90" />
                            </div>
                            <span className="font-serif text-[10px] font-bold text-haven-gold tracking-widest uppercase">HAVEN PLATINUM</span>
                          </div>
                          <div className="font-mono text-base tracking-widest text-white drop-shadow-md my-auto">
                            {renderCardNumber()}
                          </div>
                          <div className="flex justify-between items-end text-[11px]">
                            <div>
                              <div className="text-[8px] uppercase font-serif text-haven-gold/70">Cardholder</div>
                              <div className="font-mono font-bold text-white uppercase">{cardName || 'LORD STERLING'}</div>
                            </div>
                            <div>
                              <div className="text-[8px] uppercase font-serif text-haven-gold/70">Expires</div>
                              <div className="font-mono font-bold text-white">{expiry || '12/28'}</div>
                            </div>
                            <div className="font-serif font-black italic text-base text-haven-gold">VISA</div>
                          </div>
                        </div>

                        {/* BACK FACE */}
                        <div
                          style={{
                            backfaceVisibility: 'hidden',
                            WebkitBackfaceVisibility: 'hidden',
                            transform: 'rotateY(180deg)',
                          }}
                          className="absolute inset-0 w-full h-full rounded-2xl bg-gradient-to-br from-[#111] via-[#0A0A0A] to-[#1A1A1A] border border-haven-gold/50 p-4 shadow-2xl flex flex-col justify-between"
                        >
                          <div className="w-full h-8 bg-black/90 -mx-4 mt-1" />
                          <div className="space-y-1">
                            <div className="text-[8px] font-mono text-right text-haven-gold">SECURITY CODE (CVV)</div>
                            <div className="w-full h-7 bg-white text-black font-mono font-bold text-right pr-3 flex items-center justify-end text-xs rounded">
                              {cvv || '•••'}
                            </div>
                          </div>
                          <p className="text-[7px] text-white/50 leading-tight">Haven Concierge Bank N.A.</p>
                        </div>
                      </motion.div>
                    </div>

                    <div className="w-full bg-haven-surface/70 border border-haven-gold/20 rounded-2xl p-4 space-y-2 text-xs">
                      <div className="font-serif font-bold text-haven-gold uppercase tracking-wider mb-1">Order Items</div>
                      {items.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-white/80">
                          <span>{item.quantity}x {item.name}</span>
                          <span className="font-mono text-haven-gold">{formatPrice(item.price * item.quantity)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Right Column: Form Inputs with Validation */}
                  <div className="md:col-span-7 space-y-4">
                    <form onSubmit={handlePaymentSubmit} className="space-y-4" autoComplete="off">
                      {/* Cardholder Name */}
                      <div>
                        <label className="text-xs font-serif uppercase tracking-wider text-haven-text-secondary flex items-center gap-1.5 mb-1">
                          <User className="w-3.5 h-3.5 text-haven-gold" />
                          <span>Cardholder Name</span>
                        </label>
                        <input
                          type="text"
                          required
                          autoComplete="off"
                          placeholder="As printed on card"
                          value={cardName}
                          onChange={(e) => { setCardName(e.target.value); setCardErrors((p) => ({ ...p, cardName: undefined })); }}
                          onFocus={() => setIsFlipped(false)}
                          className={`w-full px-4 py-2.5 rounded-xl bg-haven-surface border text-white text-sm font-sans focus:outline-none transition ${
                            cardErrors.cardName ? 'border-red-500 focus:border-red-500' : 'border-white/20 focus:border-haven-gold'
                          }`}
                        />
                        {cardErrors.cardName && (
                          <p className="flex items-center gap-1 mt-1 text-[11px] text-red-400"><AlertCircle className="w-3 h-3" />{cardErrors.cardName}</p>
                        )}
                      </div>

                      {/* Card Number */}
                      <div>
                        <label className="text-xs font-serif uppercase tracking-wider text-haven-text-secondary flex items-center gap-1.5 mb-1">
                          <CreditCard className="w-3.5 h-3.5 text-haven-gold" />
                          <span>Card Number</span>
                          {cardNumber.replace(/\s/g,'').length >= 4 && (
                            <span className="ml-auto text-[10px] text-haven-gold/70 font-mono uppercase">
                              {detectCardType(cardNumber.replace(/\s/g,''))}
                            </span>
                          )}
                        </label>
                        <input
                          type="text"
                          required
                          autoComplete="off"
                          placeholder="1234 5678 9012 3456"
                          value={cardNumber}
                          onChange={(e) => { handleCardNumberChange(e); setCardErrors((p) => ({ ...p, cardNumber: undefined })); }}
                          onFocus={() => setIsFlipped(false)}
                          className={`w-full px-4 py-2.5 rounded-xl bg-haven-surface border text-white text-sm font-mono tracking-widest focus:outline-none transition ${
                            cardErrors.cardNumber ? 'border-red-500 focus:border-red-500' : 'border-white/20 focus:border-haven-gold'
                          }`}
                        />
                        {cardErrors.cardNumber && (
                          <p className="flex items-center gap-1 mt-1 text-[11px] text-red-400"><AlertCircle className="w-3 h-3" />{cardErrors.cardNumber}</p>
                        )}
                      </div>

                      {/* Expiry + CVV */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs font-serif uppercase tracking-wider text-haven-text-secondary flex items-center gap-1.5 mb-1">
                            <Calendar className="w-3.5 h-3.5 text-haven-gold" />
                            <span>Expiry</span>
                          </label>
                          <input
                            type="text"
                            required
                            autoComplete="off"
                            placeholder="MM/YY"
                            value={expiry}
                            onChange={(e) => { handleExpiryChange(e); setCardErrors((p) => ({ ...p, expiry: undefined })); }}
                            onFocus={() => setIsFlipped(false)}
                            className={`w-full px-4 py-2.5 rounded-xl bg-haven-surface border text-white text-sm font-mono tracking-widest focus:outline-none transition ${
                              cardErrors.expiry ? 'border-red-500 focus:border-red-500' : 'border-white/20 focus:border-haven-gold'
                            }`}
                          />
                          {cardErrors.expiry && (
                            <p className="flex items-center gap-1 mt-1 text-[11px] text-red-400"><AlertCircle className="w-3 h-3" />{cardErrors.expiry}</p>
                          )}
                        </div>
                        <div>
                          <label className="text-xs font-serif uppercase tracking-wider text-haven-text-secondary flex items-center gap-1.5 mb-1">
                            <Lock className="w-3.5 h-3.5 text-haven-gold" />
                            <span>CVV</span>
                          </label>
                          <input
                            type="password"
                            required
                            autoComplete="off"
                            maxLength={4}
                            placeholder="•••"
                            value={cvv}
                            onChange={(e) => { handleCvvChange(e); setCardErrors((p) => ({ ...p, cvv: undefined })); }}
                            onFocus={() => setIsFlipped(true)}
                            onBlur={() => setIsFlipped(false)}
                            className={`w-full px-4 py-2.5 rounded-xl bg-haven-surface border text-white text-sm font-mono tracking-widest focus:outline-none transition ${
                              cardErrors.cvv ? 'border-red-500 focus:border-red-500' : 'border-white/20 focus:border-haven-gold'
                            }`}
                          />
                          {cardErrors.cvv && (
                            <p className="flex items-center gap-1 mt-1 text-[11px] text-red-400"><AlertCircle className="w-3 h-3" />{cardErrors.cvv}</p>
                          )}
                        </div>
                      </div>

                      {/* Hint for hackathon demo */}
                      <p className="text-[10px] text-haven-text-muted font-mono bg-haven-surface/60 border border-white/10 rounded-lg px-3 py-2">
                        💳 Demo: Use <span className="text-haven-gold">4532 7153 3790 1241</span> • Exp: <span className="text-haven-gold">12/28</span> • CVV: <span className="text-haven-gold">123</span>
                      </p>

                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-4 rounded-xl bg-gold-gradient text-black font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-gold-lg hover:opacity-90 transition mt-2 disabled:opacity-50"
                      >
                        {isSubmitting ? (
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                            <span>Validating & Processing...</span>
                          </div>
                        ) : (
                          <>
                            <span>PAY {formatPrice(amount)} NOW</span>
                            <ArrowRight className="w-4 h-4" />
                          </>
                        )}
                      </button>
                    </form>
                  </div>
                </div>
              )}

              {/* UPI & DYNAMIC QR CODE GATEWAY VIEW */}
              {selectedMethod === 'upi' && (
                <div className="space-y-6 text-center">
                  <div className="bg-haven-surface border border-haven-gold/30 rounded-2xl p-6 space-y-4 max-w-md mx-auto">
                    <div className="inline-flex items-center gap-2 bg-emerald-950/80 border border-emerald-500/40 px-3 py-1 rounded-full text-emerald-400 text-xs font-mono">
                      <QrCode className="w-3.5 h-3.5" />
                      <span>Scan & Pay via UPI App</span>
                    </div>

                    {/* DYNAMIC HIGH-RES STYLED SVG QR CODE */}
                    <div className="relative w-48 h-48 mx-auto bg-white p-3 rounded-2xl shadow-2xl flex items-center justify-center border-4 border-haven-gold">
                      <svg viewBox="0 0 200 200" className="w-full h-full">
                        <rect x="10" y="10" width="50" height="50" fill="#000" />
                        <rect x="20" y="20" width="30" height="30" fill="#fff" />
                        <rect x="25" y="25" width="20" height="20" fill="#000" />

                        <rect x="140" y="10" width="50" height="50" fill="#000" />
                        <rect x="150" y="20" width="30" height="30" fill="#fff" />
                        <rect x="155" y="25" width="20" height="20" fill="#000" />

                        <rect x="10" y="140" width="50" height="50" fill="#000" />
                        <rect x="20" y="150" width="30" height="30" fill="#fff" />
                        <rect x="25" y="155" width="20" height="20" fill="#000" />

                        <g fill="#111">
                          <rect x="70" y="15" width="12" height="12" />
                          <rect x="90" y="15" width="12" height="12" />
                          <rect x="110" y="15" width="12" height="12" />

                          <rect x="70" y="45" width="12" height="12" />
                          <rect x="100" y="45" width="12" height="12" />

                          <rect x="15" y="70" width="12" height="12" />
                          <rect x="35" y="70" width="12" height="12" />
                          <rect x="55" y="70" width="12" height="12" />
                          <rect x="75" y="70" width="12" height="12" />
                          <rect x="95" y="70" width="12" height="12" />
                          <rect x="125" y="70" width="12" height="12" />
                          <rect x="155" y="70" width="12" height="12" />
                          <rect x="175" y="70" width="12" height="12" />

                          <rect x="15" y="100" width="12" height="12" />
                          <rect x="45" y="100" width="12" height="12" />
                          <rect x="75" y="100" width="12" height="12" />
                          <rect x="115" y="100" width="12" height="12" />
                          <rect x="145" y="100" width="12" height="12" />
                          <rect x="175" y="100" width="12" height="12" />

                          <rect x="75" y="130" width="12" height="12" />
                          <rect x="105" y="130" width="12" height="12" />
                          <rect x="135" y="130" width="12" height="12" />
                          <rect x="165" y="130" width="12" height="12" />

                          <rect x="75" y="160" width="12" height="12" />
                          <rect x="95" y="160" width="12" height="12" />
                          <rect x="125" y="160" width="12" height="12" />
                          <rect x="155" y="160" width="12" height="12" />
                        </g>
                      </svg>
                      <div className="absolute w-10 h-10 bg-black rounded-lg border border-haven-gold flex items-center justify-center shadow-lg">
                        <Sparkles className="w-5 h-5 text-haven-gold" />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <p className="text-xs text-white/70 font-serif">Official Merchant VPA ID</p>
                      <div className="flex items-center justify-center gap-2 bg-black/60 p-2 rounded-xl border border-white/10 font-mono text-sm text-haven-gold">
                        <span>havenlounge@okaxis</span>
                        <button
                          onClick={handleCopyUpi}
                          className="p-1 text-white/60 hover:text-white transition"
                          title="Copy UPI ID"
                        >
                          {copiedUpi ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* UPI App Launcher Badges */}
                  <div className="max-w-md mx-auto space-y-2">
                    <p className="text-xs text-white/60 uppercase font-serif tracking-wider">Supported UPI Apps</p>
                    <div className="grid grid-cols-4 gap-2 text-xs font-semibold">
                      <div className="p-2 rounded-xl bg-haven-surface border border-white/10 text-white">GPay</div>
                      <div className="p-2 rounded-xl bg-haven-surface border border-white/10 text-white">PhonePe</div>
                      <div className="p-2 rounded-xl bg-haven-surface border border-white/10 text-white">Paytm</div>
                      <div className="p-2 rounded-xl bg-haven-surface border border-white/10 text-white">BHIM</div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleWalletSubmit()}
                    disabled={isSubmitting}
                    className="w-full max-w-md py-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-black font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-emerald-500/20 shadow-lg transition mx-auto"
                  >
                    {isSubmitting ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                        <span>Verifying UPI Transaction...</span>
                      </div>
                    ) : (
                      <>
                        <span>VERIFY & COMPLETE UPI PAYMENT ({formatPrice(amount)})</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* PAYPAL / APPLE PAY / GOOGLE PAY / WEBMONEY INSTANT CHECKOUT VIEWS */}
              {(selectedMethod === 'paypal' || selectedMethod === 'apple_pay' || selectedMethod === 'google_pay' || selectedMethod === 'webmoney') && (
                <div className="space-y-6 text-center max-w-md mx-auto py-4">
                  <div className="w-16 h-16 rounded-2xl bg-haven-surface border border-haven-gold/40 flex items-center justify-center mx-auto text-haven-gold shadow-gold-sm">
                    <Sparkles className="w-8 h-8" />
                  </div>

                  <div className="space-y-2">
                    <h3 className="font-serif text-xl font-bold text-white uppercase tracking-wide">
                      {selectedMethod.replace('_', ' ')} Direct Payment
                    </h3>
                    <p className="text-xs text-haven-text-secondary leading-relaxed">
                      You will be authenticated through {selectedMethod.replace('_', ' ')} express gateway to authorize {formatPrice(amount)}.
                    </p>
                  </div>

                  <div className="bg-haven-surface p-4 rounded-2xl border border-white/10 text-left space-y-2 text-xs">
                    <div className="flex justify-between text-white/70">
                      <span>Recipient</span>
                      <span className="font-semibold text-white">Haven Restaurant & Lounge Sanctuary</span>
                    </div>
                    <div className="flex justify-between text-white/70">
                      <span>Total Charge</span>
                      <span className="font-mono text-haven-gold font-bold">{formatPrice(amount)}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleWalletSubmit()}
                    disabled={isSubmitting}
                    className="w-full py-4 rounded-xl bg-gold-gradient text-black font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-gold-lg hover:opacity-90 transition disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                        <span>Authorizing Payment...</span>
                      </div>
                    ) : (
                      <>
                        <span>AUTHORIZE {formatPrice(amount)} PAYMENT</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
