import { create } from 'zustand';
import { CartItem } from '@/types/cart';

interface CartStore {
  items: CartItem[];
  isLoading: boolean;

  addItem: (item: CartItem) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;

  setItems: (items: CartItem[]) => void;
  setLoading: (loading: boolean) => void;

  getTotal: () => number;
  getCount: () => number;
  getWeight: () => number;
}

export const useCartStore = create<CartStore>()((set, get) => ({
  items: [],
  isLoading: false,

  addItem: (item) => {
    set((state) => {
      const items = Array.isArray(state.items) ? state.items : [];
      const existing = items.find(
        (i) => i.product_id === item.product_id
      );
      if (existing) {
        return {
          items: items.map((i) =>
            i.product_id === item.product_id
              ? {
                  ...i,
                  quantity: Math.min(
                    i.quantity + item.quantity,
                    i.max_quantity
                  ),
                }
              : i
          ),
        };
      }
      return { items: [...items, item] };
    });
  },

  removeItem: (productId) => {
    set((state) => ({
      items: (Array.isArray(state.items) ? state.items : []).filter(
        (i) => i.product_id !== productId
      ),
    }));
  },

  updateQuantity: (productId, quantity) => {
    set((state) => ({
      items: (Array.isArray(state.items) ? state.items : []).map((i) =>
        i.product_id === productId
          ? { ...i, quantity: Math.min(Math.max(1, quantity), i.max_quantity) }
          : i
      ),
    }));
  },

  clearCart: () => set({ items: [] }),

  setItems: (items) => set({ items: Array.isArray(items) ? items : [] }),
  setLoading: (loading) => set({ isLoading: loading }),

  getTotal: () => {
    const items = get().items;
    if (!Array.isArray(items)) return 0;
    return items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
  },

  getCount: () => {
    const items = get().items;
    if (!Array.isArray(items)) return 0;
    return items.reduce((sum, item) => sum + item.quantity, 0);
  },

  getWeight: () => {
    const items = get().items;
    if (!Array.isArray(items)) return 0;
    return items.reduce(
      (sum, item) => sum + (item.weight ?? 0) * item.quantity,
      0
    );
  },
}));
