'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

// Types
export type UserRole = 'customer' | 'staff' | 'admin';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  loyaltyPoints: number;
}

export interface MenuItem {
  id: string;
  categoryId: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  isSignature: boolean;
  isAvailable: boolean;
  calories: number;
  prepTimeMins: number;
  pairingNote?: string;
}

export interface MenuCategory {
  id: string;
  name: string;
  displayOrder: number;
}

export interface RestaurantTable {
  id: string;
  tableNumber: number;
  capacity: number;
  section: 'indoor' | 'patio' | 'private_lounge' | 'chef_table';
  status: 'available' | 'reserved' | 'occupied' | 'cleaning';
}

export interface Reservation {
  id: string;
  userId?: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  tableId: string;
  tableNumber: number;
  partySize: number;
  reservationTime: string;
  specialRequests?: string;
  status: 'confirmed' | 'seated' | 'completed' | 'cancelled';
  createdAt: string;
}

export interface CartItem {
  menuItem: MenuItem;
  quantity: number;
  specialNotes?: string;
}

export interface OrderItem {
  id: string;
  menuItem: MenuItem;
  quantity: number;
  unitPrice: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId?: string;
  guestName: string;
  guestEmail: string;
  tableId?: string;
  tableNumber?: number;
  orderType: 'dine_in' | 'takeaway';
  totalAmount: number;
  paymentStatus: 'pending' | 'paid' | 'failed' | 'expired';
  orderStatus: 'pending' | 'in_kitchen' | 'ready' | 'served' | 'completed';
  createdAt: string;
  items: CartItem[];
  timerExpiresAt?: number;
}

export interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  reorderLevel: number;
  costPerUnit: number;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'order' | 'reservation' | 'inventory' | 'system';
  isRead: boolean;
  createdAt: string;
}

// Initial Mock Data
const INITIAL_CATEGORIES: MenuCategory[] = [
  { id: 'cat-1', name: 'Signature Starters', displayOrder: 1 },
  { id: 'cat-2', name: 'Chef Specialties', displayOrder: 2 },
  { id: 'cat-3', name: 'Wood-Fired & Charcoal', displayOrder: 3 },
  { id: 'cat-4', name: 'Artisanal Cocktails', displayOrder: 4 },
  { id: 'cat-5', name: 'Decadent Desserts', displayOrder: 5 },
];

const INITIAL_MENU: MenuItem[] = [
  // ===================== STARTERS =====================
  {
    id: 'm-1',
    categoryId: 'cat-1',
    name: 'Tandoori Lamb Chops',
    description: 'Succulent lamb chops marinated overnight in aged yogurt, Kashmiri chilli, and royal spices, finished in the tandoor with smoked butter.',
    price: 480,
    imageUrl: '/tandoori-lamb-chops.jpeg',
    isSignature: true,
    isAvailable: true,
    calories: 520,
    prepTimeMins: 22,
    pairingNote: 'Pairs beautifully with a smoky Old Fashioned or Kashmiri Kahwa',
  },
  {
    id: 'm-2',
    categoryId: 'cat-1',
    name: 'Galouti Kebab Platter',
    description: 'Melt-in-mouth Lucknowi Galouti kebabs made with finely minced lamb, rare spices, and pure ghee, served with sheermal and green chutney.',
    price: 420,
    imageUrl: '/galouti-kebab.jpeg',
    isSignature: true,
    isAvailable: true,
    calories: 480,
    prepTimeMins: 18,
    pairingNote: 'Best enjoyed with aged Rum or Masala Chai Old Fashioned',
  },
  {
    id: 'm-3',
    categoryId: 'cat-1',
    name: 'Truffle Malai Broccoli',
    description: 'Charcoal-roasted broccoli and seasonal vegetables tossed in a rich malai and herb marinade, finished with cheese and micro greens.',
    price: 350,
    imageUrl: '/truffle-malai-broccoli.jpeg',
    isSignature: false,
    isAvailable: true,
    calories: 290,
    prepTimeMins: 14,
    pairingNote: 'Excellent with a crisp white wine or fresh Nimbu Pani',
  },

  // ===================== MAIN COURSE =====================
  {
    id: 'm-4',
    categoryId: 'cat-2',
    name: 'Nalli Nihari Biryani',
    description: 'Slow-cooked tender meat in rich nihari spices, layered with aged basmati, saffron, and pure ghee, sealed and dum-pukht for hours.',
    price: 490,
    imageUrl: '/nalli-nihari-biryani.jpeg',
    isSignature: true,
    isAvailable: true,
    calories: 780,
    prepTimeMins: 35,
    pairingNote: 'Perfect with a bold red wine or classic Whisky Highball',
  },
  {
    id: 'm-5',
    categoryId: 'cat-2',
    name: 'Zafrani Dalcha Ghost',
    description: 'Royal-style slow-cooked meat in a rich, spiced gravy tempered with pure ghee, saffron, and aromatic whole spices.',
    price: 520,
    imageUrl: '/dalcha-ghost.jpeg',
    isSignature: true,
    isAvailable: true,
    calories: 690,
    prepTimeMins: 40,
    pairingNote: 'Pairs wonderfully with aged Single Malt',
  },
  {
    id: 'm-6',
    categoryId: 'cat-2',
    name: 'Royal Meat Khichdi',
    description: 'A luxurious khichdi made with aged basmati, tender meat pieces, saffron, and aromatic spices, finished with ghee and pomegranate.',
    price: 380,
    imageUrl: '/truffle-khichdi.jpeg',
    isSignature: false,
    isAvailable: true,
    calories: 410,
    prepTimeMins: 25,
    pairingNote: 'Beautiful with a glass of Chardonnay',
  },
  {
    id: 'm-7',
    categoryId: 'cat-2',
    name: 'Butter Soft Paneer Lababdar',
    description: 'Homemade paneer simmered in a rich tomato-cashew gravy finished with fresh cream, kasuri methi, and a touch of gold.',
    price: 200,
    imageUrl: '/paneer-lababdar.jpeg',
    isSignature: false,
    isAvailable: true,
    calories: 540,
    prepTimeMins: 20,
    pairingNote: 'Classic pairing with Butter Naan',
  },

  // ===================== BREADS =====================
  {
    id: 'm-8',
    categoryId: 'cat-3',
    name: 'Truffle Butter Naan',
    description: 'Soft tandoor-baked naan brushed with aromatic butter and fresh herbs. Best eaten hot.',
    price: 180,
    imageUrl: '/truffle-naan.jpeg',
    isSignature: true,
    isAvailable: true,
    calories: 320,
    prepTimeMins: 8,
  },
  {
    id: 'm-9',
    categoryId: 'cat-3',
    name: 'Sheermal with Saffron Butter',
    description: 'Soft Lucknowi sheermal baked with saffron milk and pure desi ghee, lightly sweet and aromatic.',
    price: 149,
    imageUrl: '/sheermal.jpeg',
    isSignature: false,
    isAvailable: true,
    calories: 280,
    prepTimeMins: 10,
  },

  // ===================== DESSERTS =====================
  {
    id: 'm-10',
    categoryId: 'cat-5',
    name: 'Saffron Rasmalai',
    description: 'Soft rasmalai discs soaked in thickened milk, infused with pure Kashmiri saffron, cardamom, and silver leaf.',
    price: 280,
    imageUrl: '/saffron-rasmalai.jpeg',
    isSignature: true,
    isAvailable: true,
    calories: 460,
    prepTimeMins: 8,
  },
  {
    id: 'm-11',
    categoryId: 'cat-5',
    name: 'Chocolate Bhappa Doi',
    description: 'Slow-steamed Bengali-style sweet yogurt infused with single-origin dark chocolate and roasted hazelnuts.',
    price: 265,
    imageUrl: '/chocolate-bhappa-doi.jpeg',
    isSignature: true,
    isAvailable: true,
    calories: 420,
    prepTimeMins: 6,
  },

  // ===================== COCKTAILS =====================
  {
    id: 'm-12',
    categoryId: 'cat-4',
    name: 'Ember & Gold Old Fashioned',
    description: 'Premium rye whisky, jaggery-smoked syrup, Angostura bitters, finished with orange oil and a cherry.',
    price: 249,
    imageUrl: '/ember-gold-old-fashioned.jpeg',
    isSignature: true,
    isAvailable: true,
    calories: 210,
    prepTimeMins: 6,
  },
  {
    id: 'm-13',
    categoryId: 'cat-4',
    name: 'Kashmiri Kahwa Martini',
    description: 'Premium gin, house-made kahwa cordial, saffron, green cardamom, served ice-cold with a lemon twist.',
    price: 220,
    imageUrl: '/kahwa-martini.jpeg',
    isSignature: true,
    isAvailable: true,
    calories: 190,
    prepTimeMins: 5,
  },
];
const INITIAL_TABLES: RestaurantTable[] = [
  { id: 't-1', tableNumber: 1, capacity: 2, section: 'indoor', status: 'available' },
  { id: 't-2', tableNumber: 2, capacity: 2, section: 'indoor', status: 'occupied' },
  { id: 't-3', tableNumber: 3, capacity: 4, section: 'indoor', status: 'reserved' },
  { id: 't-4', tableNumber: 4, capacity: 4, section: 'indoor', status: 'available' },
  { id: 't-5', tableNumber: 5, capacity: 6, section: 'private_lounge', status: 'occupied' },
  { id: 't-6', tableNumber: 6, capacity: 8, section: 'private_lounge', status: 'available' },
  { id: 't-7', tableNumber: 7, capacity: 2, section: 'patio', status: 'available' },
  { id: 't-8', tableNumber: 8, capacity: 4, section: 'patio', status: 'cleaning' },
  { id: 't-9', tableNumber: 9, capacity: 6, section: 'chef_table', status: 'reserved' },
];

const INITIAL_INVENTORY: InventoryItem[] = [
  { id: 'inv-1', name: 'A5 Miyazaki Wagyu Beef', quantity: 4.5, unit: 'kg', reorderLevel: 5.0, costPerUnit: 240 },
  { id: 'inv-2', name: 'Black Winter Truffles', quantity: 180, unit: 'g', reorderLevel: 250, costPerUnit: 8.5 },
  { id: 'inv-3', name: 'Hokkaido Sea Scallops', quantity: 8, unit: 'kg', reorderLevel: 10, costPerUnit: 45 },
  { id: 'inv-4', name: 'Chilean Sea Bass Fillets', quantity: 12, unit: 'kg', reorderLevel: 8, costPerUnit: 38 },
  { id: 'inv-5', name: 'Edible 24k Gold Flakes', quantity: 15, unit: 'vials', reorderLevel: 5, costPerUnit: 65 },
  { id: 'inv-6', name: 'Valrhona 70% Dark Chocolate', quantity: 14, unit: 'kg', reorderLevel: 10, costPerUnit: 22 },
];

interface StoreContextType {
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  categories: MenuCategory[];
  menuItems: MenuItem[];
  toggleItemAvailability: (id: string) => void;
  tables: RestaurantTable[];
  updateTableStatus: (tableId: string, status: RestaurantTable['status']) => void;
  reservations: Reservation[];
  addReservation: (res: Omit<Reservation, 'id' | 'createdAt' | 'status'>) => void;
  orders: Order[];
  createOrder: (order: Omit<Order, 'id' | 'orderNumber' | 'createdAt' | 'orderStatus' | 'paymentStatus'>) => Order;
  updateOrderStatus: (orderId: string, status: Order['orderStatus']) => void;
  updateOrderPayment: (orderId: string, status: Order['paymentStatus']) => void;
  cart: CartItem[];
  addToCart: (item: MenuItem, quantity?: number, specialNotes?: string) => void;
  removeFromCart: (itemId: string) => void;
  updateCartQuantity: (itemId: string, delta: number) => void;
  clearCart: () => void;
  cartTotal: number;
  inventory: InventoryItem[];
  updateInventoryQuantity: (id: string, newQty: number) => void;
  notifications: NotificationItem[];
  addNotification: (title: string, message: string, type: NotificationItem['type']) => void;
  markNotificationRead: (id: string) => void;
  // Cart toast (bottom-left "Added to cart" popup)
  cartToast: { name: string; imageUrl: string } | null;
  // Hard 5-Minute Timer State
  paymentTimerSeconds: number;
  isPaymentTimerActive: boolean;
  startPaymentTimer: () => void;
  cancelPaymentTimer: () => void;
  activeCheckoutOrderId: string | null;
  setActiveCheckoutOrderId: (id: string | null) => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>({
    id: 'usr-guest-1',
    email: 'guest@havenlounge.com',
    name: 'Lord Alistair',
    role: 'customer',
    loyaltyPoints: 1250,
  });

  const [categories] = useState<MenuCategory[]>(INITIAL_CATEGORIES);
  const [menuItems, setMenuItems] = useState<MenuItem[]>(INITIAL_MENU);
  const [tables, setTables] = useState<RestaurantTable[]>(INITIAL_TABLES);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartToast, setCartToast] = useState<{ name: string; imageUrl: string } | null>(null);
  const [inventory, setInventory] = useState<InventoryItem[]>(INITIAL_INVENTORY);
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: 'notif-1',
      title: 'VIP Reservation Confirmed',
      message: 'Table #9 Chef Table reserved for Lord Alistair at 8:30 PM.',
      type: 'reservation',
      isRead: false,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'notif-2',
      title: 'Low Stock Forecast',
      message: 'A5 Miyazaki Wagyu Beef is at 4.5kg (reorder level: 5kg).',
      type: 'inventory',
      isRead: false,
      createdAt: new Date().toISOString(),
    },
  ]);

  // Payment Timer (5 mins = 300s)
  const [paymentTimerSeconds, setPaymentTimerSeconds] = useState<number>(300);
  const [isPaymentTimerActive, setIsPaymentTimerActive] = useState<boolean>(false);
  const [activeCheckoutOrderId, setActiveCheckoutOrderId] = useState<string | null>(null);

  // Broadcast Channel for live tab sync
  const [channel, setChannel] = useState<BroadcastChannel | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      const bc = new BroadcastChannel('haven_realtime_sync');
      bc.onmessage = (event) => {
        const { type, payload } = event.data;
        if (type === 'TOGGLE_AVAILABILITY') {
          setMenuItems((prev) =>
            prev.map((item) => (item.id === payload.id ? { ...item, isAvailable: payload.isAvailable } : item))
          );
        } else if (type === 'UPDATE_ORDER_STATUS') {
          setOrders((prev) =>
            prev.map((o) => (o.id === payload.id ? { ...o, orderStatus: payload.status } : o))
          );
        } else if (type === 'UPDATE_TABLE_STATUS') {
          setTables((prev) =>
            prev.map((t) => (t.id === payload.id ? { ...t, status: payload.status } : t))
          );
        }
      };
      setChannel(bc);
      return () => bc.close();
    }
  }, []);

  // Broadcast helper
  const broadcast = (type: string, payload: any) => {
    if (channel) {
      channel.postMessage({ type, payload });
    }
  };

  // Toggle Item Availability (Kitchen <-> Guest Sync!)
  const toggleItemAvailability = (id: string) => {
    setMenuItems((prev) => {
      const next = prev.map((item) => {
        if (item.id === id) {
          const updated = { ...item, isAvailable: !item.isAvailable };
          broadcast('TOGGLE_AVAILABILITY', { id, isAvailable: updated.isAvailable });
          return updated;
        }
        return item;
      });
      return next;
    });

    const targetItem = menuItems.find((m) => m.id === id);
    if (targetItem) {
      const nextState = !targetItem.isAvailable;
      addNotification(
        nextState ? 'Menu Item Restocked' : 'Menu Item Sold Out',
        `"${targetItem.name}" is now marked as ${nextState ? 'Available' : 'Sold Out'} across all guest portals.`,
        'system'
      );
    }
  };

  // Table Status Update
  const updateTableStatus = (tableId: string, status: RestaurantTable['status']) => {
    setTables((prev) =>
      prev.map((t) => {
        if (t.id === tableId) {
          broadcast('UPDATE_TABLE_STATUS', { id: tableId, status });
          return { ...t, status };
        }
        return t;
      })
    );
  };

  // Reservation creation
  const addReservation = (resData: Omit<Reservation, 'id' | 'createdAt' | 'status'>) => {
    const newRes: Reservation = {
      ...resData,
      id: `res-${Date.now()}`,
      status: 'confirmed',
      createdAt: new Date().toISOString(),
    };
    setReservations((prev) => [newRes, ...prev]);
    if (resData.tableId) {
      updateTableStatus(resData.tableId, 'reserved');
    }
    addNotification(
      'Reservation Confirmed',
      `Reservation for ${resData.guestName} (${resData.partySize} guests) at ${resData.reservationTime}.`,
      'reservation'
    );
  };

  // Cart operations
  const addToCart = (menuItem: MenuItem, quantity = 1, specialNotes?: string) => {
    if (!menuItem.isAvailable) return;
    setCart((prev) => {
      const existingIndex = prev.findIndex((i) => i.menuItem.id === menuItem.id);
      if (existingIndex > -1) {
        const next = [...prev];
        next[existingIndex].quantity += quantity;
        return next;
      }
      return [...prev, { menuItem, quantity, specialNotes }];
    });
    // Trigger bottom-left toast notification
    setCartToast({ name: menuItem.name, imageUrl: menuItem.imageUrl });
    setTimeout(() => setCartToast(null), 2800);
  };

  const removeFromCart = (itemId: string) => {
    setCart((prev) => prev.filter((i) => i.menuItem.id !== itemId));
  };

  const updateCartQuantity = (itemId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((i) => {
          if (i.menuItem.id === itemId) {
            const newQty = i.quantity + delta;
            return newQty > 0 ? { ...i, quantity: newQty } : null;
          }
          return i;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const clearCart = () => setCart([]);

  const cartTotal = cart.reduce((sum, item) => sum + item.menuItem.price * item.quantity, 0);

  // Order creation — called from payment modal after successful payment
  const createOrder = (orderData: Omit<Order, 'id' | 'orderNumber' | 'createdAt' | 'orderStatus' | 'paymentStatus'>) => {
    const orderNum = `HVN-${Math.floor(1000 + Math.random() * 9000)}`;
    const newOrder: Order = {
      ...orderData,
      id: `ord-${Date.now()}`,
      orderNumber: orderNum,
      orderStatus: 'in_kitchen', // Immediately send to kitchen after payment
      paymentStatus: 'paid',     // Already paid via payment modal
      createdAt: new Date().toISOString(),
      timerExpiresAt: Date.now() + 300 * 1000,
    };
    setOrders((prev) => [newOrder, ...prev]);
    setActiveCheckoutOrderId(newOrder.id);
    setCart([]); // Clear cart after successful checkout
    addNotification(
      'Order Live in Kitchen!',
      `Order ${orderNum} (₹${newOrder.totalAmount.toFixed(2)}) confirmed & sent to kitchen. Watch it in Live Tracker!`,
      'order'
    );
    return newOrder;
  };

  const updateOrderStatus = (orderId: string, status: Order['orderStatus']) => {
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id === orderId) {
          broadcast('UPDATE_ORDER_STATUS', { id: orderId, status });
          return { ...o, orderStatus: status };
        }
        return o;
      })
    );
  };

  const updateOrderPayment = (orderId: string, status: Order['paymentStatus']) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, paymentStatus: status } : o))
    );
  };

  // Inventory update
  const updateInventoryQuantity = (id: string, newQty: number) => {
    setInventory((prev) =>
      prev.map((item) => (item.id === id ? { ...item, quantity: newQty } : item))
    );
  };

  // Notification addition
  const addNotification = (title: string, message: string, type: NotificationItem['type']) => {
    const newNotif: NotificationItem = {
      id: `notif-${Date.now()}`,
      title,
      message,
      type,
      isRead: false,
      createdAt: new Date().toISOString(),
    };
    setNotifications((prev) => [newNotif, ...prev]);
  };

  const markNotificationRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  };

  // Payment 5-Min Timer Tick Effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPaymentTimerActive && paymentTimerSeconds > 0) {
      interval = setInterval(() => {
        setPaymentTimerSeconds((prev) => prev - 1);
      }, 1000);
    } else if (isPaymentTimerActive && paymentTimerSeconds === 0) {
      // Hard 5-Minute Timer Expired!
      setIsPaymentTimerActive(false);
      if (activeCheckoutOrderId) {
        updateOrderPayment(activeCheckoutOrderId, 'expired');
      }
      addNotification(
        'Payment Session Expired',
        'Your 5-minute payment session expired. Reservation slot/cart cleared.',
        'system'
      );
    }
    return () => clearInterval(interval);
  }, [isPaymentTimerActive, paymentTimerSeconds, activeCheckoutOrderId]);

  const startPaymentTimer = () => {
    setPaymentTimerSeconds(300);
    setIsPaymentTimerActive(true);
  };

  const cancelPaymentTimer = () => {
    setIsPaymentTimerActive(false);
    setPaymentTimerSeconds(300);
    setActiveCheckoutOrderId(null);
  };

  return (
    <StoreContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        categories,
        menuItems,
        toggleItemAvailability,
        tables,
        updateTableStatus,
        reservations,
        addReservation,
        orders,
        createOrder,
        updateOrderStatus,
        updateOrderPayment,
        cart,
        addToCart,
        removeFromCart,
        updateCartQuantity,
        clearCart,
        cartTotal,
        inventory,
        updateInventoryQuantity,
        notifications,
        addNotification,
        markNotificationRead,
        cartToast,
        paymentTimerSeconds,
        isPaymentTimerActive,
        startPaymentTimer,
        cancelPaymentTimer,
        activeCheckoutOrderId,
        setActiveCheckoutOrderId,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};
