'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { ShoppingBag, CheckCircle2 } from 'lucide-react';
import { useStore } from '@/lib/store';

/**
 * CartToast — bottom-left "Added to Selection" popup.
 * Reads cartToast from the global store (set by addToCart).
 * Auto-dismisses after 2.8 s (the store clears cartToast after that).
 * No props needed — mount once globally in layout.tsx.
 */
export default function CartToast() {
  const { cartToast, cart } = useStore();

  // Total quantity currently in cart
  const totalItems = cart.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <AnimatePresence>
      {cartToast && (
        <motion.div
          key="cart-toast"
          initial={{ opacity: 0, x: -40, y: 20 }}
          animate={{ opacity: 1, x: 0, y: 0 }}
          exit={{ opacity: 0, x: -40, y: 10 }}
          transition={{ type: 'spring', stiffness: 340, damping: 28 }}
          className="fixed bottom-6 left-6 z-[9999] flex items-center gap-3 
                     bg-haven-card border border-haven-gold/40 
                     rounded-2xl px-4 py-3 shadow-gold-lg 
                     backdrop-blur-md max-w-xs"
          style={{ boxShadow: '0 4px 32px 0 rgba(212,175,55,0.18)' }}
        >
          {/* Item thumbnail */}
          <div className="relative shrink-0">
            <img
              src={cartToast.imageUrl}
              alt={cartToast.name}
              className="w-12 h-12 rounded-xl object-cover border border-haven-gold/30"
            />
            {/* Gold check badge */}
            <span className="absolute -top-1.5 -right-1.5 bg-haven-gold rounded-full p-0.5 shadow-gold-sm">
              <CheckCircle2 className="w-3.5 h-3.5 text-black fill-black" strokeWidth={2.5} />
            </span>
          </div>

          {/* Text */}
          <div className="flex-1 min-w-0">
            <p className="text-[10px] uppercase tracking-widest text-haven-gold font-semibold font-sans mb-0.5">
              Added to Selection
            </p>
            <p className="text-sm font-serif font-bold text-haven-text-primary truncate leading-tight">
              {cartToast.name}
            </p>
            <p className="text-[10px] text-haven-text-muted mt-0.5 font-sans">
              {totalItems} item{totalItems !== 1 ? 's' : ''} in cart
            </p>
          </div>

          {/* Bag icon */}
          <div className="shrink-0 bg-haven-gold/15 rounded-xl p-2">
            <ShoppingBag className="w-4 h-4 text-haven-gold" />
          </div>

          {/* Animated progress bar (drains over 2.8 s) */}
          <motion.div
            className="absolute bottom-0 left-0 h-[3px] rounded-b-2xl bg-gold-gradient"
            initial={{ width: '100%' }}
            animate={{ width: '0%' }}
            transition={{ duration: 2.8, ease: 'linear' }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
