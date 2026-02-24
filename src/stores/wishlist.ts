import { create } from 'zustand';

export interface WishlistItem {
  product_id: string;
  name: string;
  slug: string;
  image: string;
  price: number;
  old_price: number | null;
  added_at: string;
}

interface WishlistStore {
  items: WishlistItem[];

  addItem: (item: WishlistItem) => void;
  removeItem: (productId: string) => void;
  toggleItem: (item: WishlistItem) => void;
  hasItem: (productId: string) => boolean;
  clearAll: () => void;
  setItems: (items: WishlistItem[]) => void;
  getCount: () => number;
}

export const useWishlistStore = create<WishlistStore>()((set, get) => ({
  items: [],

  addItem: (item) => {
    set((state) => {
      const items = Array.isArray(state.items) ? state.items : [];
      if (items.some((i) => i.product_id === item.product_id)) {
        return state;
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

  toggleItem: (item) => {
    const has = get().hasItem(item.product_id);
    if (has) {
      get().removeItem(item.product_id);
    } else {
      get().addItem(item);
    }
  },

  hasItem: (productId) => {
    const items = get().items;
    if (!Array.isArray(items)) return false;
    return items.some((i) => i.product_id === productId);
  },

  clearAll: () => set({ items: [] }),

  setItems: (items) => set({ items: Array.isArray(items) ? items : [] }),

  getCount: () => {
    const items = get().items;
    return Array.isArray(items) ? items.length : 0;
  },
}));
