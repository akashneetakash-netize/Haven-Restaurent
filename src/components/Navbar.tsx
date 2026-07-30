'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ShoppingBag, User as UserIcon, Menu, X, LayoutDashboard, CreditCard } from 'lucide-react';
import { useStore } from '@/lib/store';
import { AuthModal } from '@/components/AuthModal';

interface NavbarProps {
  onOpenCart?: () => void;
  onOpenPayment?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenCart, onOpenPayment }) => {
  const { currentUser, cart } = useStore();
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const cartItemCount = cart.reduce((total, item) => total + item.quantity, 0);

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-40 bg-haven-bg/80 backdrop-blur-xl border-b border-haven-gold/15 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          
    {/* ========== BRAND LOGO ========== */}
<Link href="/" className="flex items-center gap-3 group">
  {/* Round Logo Container */}
  <div className="relative w-11 h-11 sm:w-12 sm:h-12 rounded-full overflow-hidden border border-haven-gold/40 bg-black shadow-[0_0_12px_rgba(201,162,39,0.25)] group-hover:border-haven-gold group-hover:shadow-[0_0_18px_rgba(201,162,39,0.45)] transition-all duration-300 flex-shrink-0">
    <Image
      src="/logo.png"
      alt="Haven Restaurant & Lounge"
      fill
      className="object-cover object-center scale-110"
      priority
    />
  </div>

            {/* Optional: Keep text next to logo (you can remove this div if you want only the logo) */}
            <div className="hidden sm:block">
              <span className="font-serif text-xl sm:text-2xl font-bold tracking-widest text-haven-text-primary group-hover:text-haven-gold transition">
                HAVEN
              </span>
              <span className="block text-[9px] uppercase tracking-[0.3em] text-haven-gold font-sans font-semibold">
                Restaurant & Lounge
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-8 text-xs font-sans uppercase tracking-widest text-haven-text-secondary">
            <Link href="/#experience" className="hover:text-haven-gold transition">
              The Experience
            </Link>
            <Link href="/menu" className="hover:text-haven-gold transition">
              Digital Menu
            </Link>
            <Link href="/reservations" className="hover:text-haven-gold transition">
              Reservations
            </Link>
            <Link href="/#order-tracker" className="hover:text-haven-gold transition">
              Live Tracker
            </Link>

            {(currentUser?.role === 'staff' || currentUser?.role === 'admin') && (
              <Link
                href="/dashboard"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-haven-gold/40 text-haven-gold bg-haven-gold/10 hover:bg-haven-gold/20 transition shadow-gold-sm"
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span>Dashboard ({currentUser.role})</span>
              </Link>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 sm:gap-4">
            {onOpenPayment && (
              <button
                onClick={onOpenPayment}
                className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-haven-gold/50 bg-haven-gold/10 hover:bg-haven-gold hover:text-black text-haven-gold text-xs font-serif uppercase tracking-wider transition shadow-gold-sm"
              >
                <CreditCard className="w-4 h-4" />
                <span>Pay & Checkout</span>
              </button>
            )}

            <button
              onClick={onOpenCart}
              className="relative p-2.5 rounded-full border border-haven-border bg-haven-surface hover:border-haven-gold/50 text-haven-text-primary transition"
              aria-label="View Cart"
            >
              <ShoppingBag className="w-5 h-5 text-haven-gold" />
              {cartItemCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-gold-gradient text-black font-bold text-[10px] flex items-center justify-center shadow-gold-sm animate-pulse">
                  {cartItemCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setIsAuthOpen(true)}
              className={`hidden sm:flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-sans uppercase tracking-wider transition shadow-gold-sm ${
                currentUser
                  ? 'border-haven-gold bg-haven-gold/10 text-haven-gold hover:bg-haven-gold hover:text-black'
                  : 'border-haven-gold/40 bg-haven-card hover:border-haven-gold text-haven-text-primary'
              }`}
            >
              <UserIcon className={`w-4 h-4 ${currentUser ? 'text-haven-gold' : 'text-haven-gold'}`} />
              <span className="truncate max-w-[100px]">
                {currentUser ? currentUser.name : 'Sign In'}
              </span>
            </button>

            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 text-haven-text-primary hover:text-haven-gold"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-haven-card/95 border-b border-haven-gold/20 px-6 py-6 space-y-4">
            <Link
              href="/#experience"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block text-sm uppercase tracking-widest text-haven-text-primary hover:text-haven-gold"
            >
              The Experience
            </Link>
            <Link
              href="/menu"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block text-sm uppercase tracking-widest text-haven-text-primary hover:text-haven-gold"
            >
              Digital Menu
            </Link>
            <Link
              href="/reservations"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block text-sm uppercase tracking-widest text-haven-text-primary hover:text-haven-gold"
            >
              Reservations
            </Link>
            <Link
              href="/#order-tracker"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block text-sm uppercase tracking-widest text-haven-text-primary hover:text-haven-gold"
            >
              Live Order Tracker
            </Link>

            {onOpenPayment && (
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onOpenPayment();
                }}
                className="w-full py-2.5 rounded-full bg-gold-gradient text-black font-semibold text-xs uppercase tracking-widest text-center flex items-center justify-center gap-2"
              >
                <CreditCard className="w-4 h-4" />
                <span>Pay & Checkout</span>
              </button>
            )}

            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                setIsAuthOpen(true);
              }}
              className={`w-full py-2.5 rounded-full border text-xs uppercase tracking-widest font-semibold text-center transition ${
                currentUser
                  ? 'border-haven-gold bg-haven-gold/10 text-haven-gold hover:bg-haven-gold hover:text-black'
                  : 'border-haven-gold text-haven-gold'
              }`}
            >
              {currentUser ? `Hi, ${currentUser.name}` : 'Sign In'}
            </button>
          </div>
        )}
      </nav>

      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
    </>
  );
};