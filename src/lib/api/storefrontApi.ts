// ponytail: In-memory/localStorage mock storefront API for pure frontend operation.
// Ceiling: Client-side storage only (resets if storage cleared).
// Upgrade path: Reconnect endpoints to a live backend via apiClient once backend service is deployed.

import type {
  Address,
  CartItem,
  CheckoutSession,
  Product,
  ProductTypeSummary,
  User,
} from "@/types";
import {
  MOCK_CATEGORIES,
  MOCK_DEFAULT_ADDRESSES,
  MOCK_DEFAULT_USER,
  MOCK_HOMEPAGE_PRESETS,
  MOCK_PRODUCTS,
} from "@/data/mockStorefrontData";
import { customerTokenStorage } from "@/lib/auth/tokenStorage";

const CART_STORAGE_KEY = "printstrokes_store_cart";
const ADDRESS_STORAGE_KEY = "printstrokes_addresses";

const sleep = (ms = 100) => new Promise((resolve) => setTimeout(resolve, ms));

const readSavedAddresses = (): Address[] => {
  try {
    const raw = localStorage.getItem(ADDRESS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(ADDRESS_STORAGE_KEY, JSON.stringify(MOCK_DEFAULT_ADDRESSES));
      return MOCK_DEFAULT_ADDRESSES;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : MOCK_DEFAULT_ADDRESSES;
  } catch {
    return MOCK_DEFAULT_ADDRESSES;
  }
};

const saveAddresses = (addresses: Address[]) => {
  try {
    localStorage.setItem(ADDRESS_STORAGE_KEY, JSON.stringify(addresses));
  } catch {
    // ignore quota issues
  }
};

const readSavedCart = (): { items: CartItem[]; total: number; itemCount: number } => {
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return { items: [], total: 0, itemCount: 0 };
    const parsed = JSON.parse(raw);
    const items: CartItem[] = Array.isArray(parsed.items) ? parsed.items : [];
    const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
    return { items, total, itemCount };
  } catch {
    return { items: [], total: 0, itemCount: 0 };
  }
};

const saveCart = (cart: { items: CartItem[]; total: number; itemCount: number }) => {
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  } catch {
    // ignore quota issues
  }
};

export const storefrontApi = {
  auth: {
    login: async (email: string, password: string): Promise<User> => {
      await sleep(150);
      if (!email || !password) throw new Error("Email and password are required");

      const existingUser = customerTokenStorage.getUser();
      const user: User = existingUser && existingUser.email.toLowerCase() === email.toLowerCase()
        ? existingUser
        : {
            id: `usr_${Date.now()}`,
            name: email.split("@")[0].replace(/[._-]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
            email,
            phone: "9876543210",
            roles: ["CUSTOMER"],
          };

      customerTokenStorage.setUser(user);
      sessionStorage.setItem("customerAccessToken", `mock_token_${Date.now()}`);
      localStorage.setItem("customerRefreshToken", `mock_refresh_${Date.now()}`);
      return user;
    },

    signup: async (name: string, email: string, password: string, phone?: string): Promise<User> => {
      await sleep(150);
      if (!name || !email || !password) throw new Error("Please fill all required registration fields");

      const user: User = {
        id: `usr_${Date.now()}`,
        name: name.trim(),
        email: email.trim(),
        phone: phone || "9876543210",
        roles: ["CUSTOMER"],
      };

      customerTokenStorage.setUser(user);
      sessionStorage.setItem("customerAccessToken", `mock_token_${Date.now()}`);
      localStorage.setItem("customerRefreshToken", `mock_refresh_${Date.now()}`);
      return user;
    },

    me: async (): Promise<User> => {
      await sleep(50);
      const user = customerTokenStorage.getUser() ?? MOCK_DEFAULT_USER;
      customerTokenStorage.setUser(user);
      return user;
    },

    logout: async () => {
      await sleep(50);
      customerTokenStorage.clear();
    },
  },

  products: {
    list: async (): Promise<Product[]> => {
      await sleep(50);
      return MOCK_PRODUCTS;
    },

    get: async (idOrSlug: string): Promise<Product | null> => {
      await sleep(50);
      const found = MOCK_PRODUCTS.find(
        (p) => String(p.id) === String(idOrSlug) || p.slug === idOrSlug,
      );
      return found ?? null;
    },

    categories: async <T = unknown[]>(): Promise<T> => {
      await sleep(50);
      return MOCK_CATEGORIES as unknown as T;
    },

    homepagePresets: async (): Promise<ProductTypeSummary[]> => {
      await sleep(50);
      return MOCK_HOMEPAGE_PRESETS;
    },

    presets: async (): Promise<ProductTypeSummary[]> => {
      await sleep(50);
      return MOCK_HOMEPAGE_PRESETS;
    },
  },

  cart: {
    get: async () => {
      await sleep(50);
      return readSavedCart();
    },

    add: async (item: Omit<CartItem, "id">) => {
      await sleep(50);
      const current = readSavedCart();
      const newItem: CartItem = {
        ...item,
        id: crypto.randomUUID(),
      };
      const updatedItems = [...current.items, newItem];
      const nextCart = {
        items: updatedItems,
        itemCount: updatedItems.reduce((sum, i) => sum + i.quantity, 0),
        total: updatedItems.reduce((sum, i) => sum + i.price * i.quantity, 0),
      };
      saveCart(nextCart);
      return nextCart;
    },

    update: async (itemId: string, patch: { quantity?: number; customizationJson?: string; previewImageUrl?: string }) => {
      await sleep(50);
      const current = readSavedCart();
      const updatedItems = current.items.map((item) => {
        if (item.id !== itemId) return item;
        return {
          ...item,
          quantity: patch.quantity !== undefined ? patch.quantity : item.quantity,
          customizationJson: patch.customizationJson !== undefined ? patch.customizationJson : item.customizationJson,
          thumbnail: patch.previewImageUrl !== undefined ? patch.previewImageUrl : item.thumbnail,
        };
      });
      const nextCart = {
        items: updatedItems,
        itemCount: updatedItems.reduce((sum, i) => sum + i.quantity, 0),
        total: updatedItems.reduce((sum, i) => sum + i.price * i.quantity, 0),
      };
      saveCart(nextCart);
      return nextCart;
    },

    remove: async (itemId: string) => {
      await sleep(50);
      const current = readSavedCart();
      const updatedItems = current.items.filter((item) => item.id !== itemId);
      const nextCart = {
        items: updatedItems,
        itemCount: updatedItems.reduce((sum, i) => sum + i.quantity, 0),
        total: updatedItems.reduce((sum, i) => sum + i.price * i.quantity, 0),
      };
      saveCart(nextCart);
      return nextCart;
    },

    clear: async () => {
      await sleep(50);
      const empty = { items: [], total: 0, itemCount: 0 };
      saveCart(empty);
      return empty;
    },
  },

  addresses: {
    list: async (): Promise<Address[]> => {
      await sleep(50);
      return readSavedAddresses();
    },

    create: async (address: Omit<Address, "id">): Promise<Address> => {
      await sleep(50);
      const existing = readSavedAddresses();
      const newAddress: Address = {
        ...address,
        id: existing.length > 0 ? Math.max(...existing.map((a) => a.id)) + 1 : 1,
      };
      const updated = [...existing, newAddress];
      saveAddresses(updated);
      return newAddress;
    },
  },

  checkout: {
    create: async (shippingAddressId: number): Promise<CheckoutSession> => {
      await sleep(100);
      const cart = readSavedCart();
      const addresses = readSavedAddresses();
      const address = addresses.find((a) => a.id === shippingAddressId) || addresses[0];
      const user = customerTokenStorage.getUser() || MOCK_DEFAULT_USER;
      const orderNum = `PS-${Math.floor(100000 + Math.random() * 900000)}`;

      return {
        orderId: Math.floor(1000 + Math.random() * 9000),
        orderNumber: orderNum,
        razorpayOrderId: `order_mock_${Date.now()}`,
        razorpayKeyId: "rzp_test_mock_printstrokes",
        amountInPaise: Math.round(cart.total * 100),
        amount: cart.total,
        currency: "INR",
        customerName: address?.name || user.name,
        customerEmail: user.email,
        customerPhone: address?.phone || user.phone,
      };
    },

    verify: async (_payload: {
      orderId: number;
      razorpayOrderId: string;
      razorpayPaymentId: string;
      razorpaySignature: string;
    }) => {
      await sleep(100);
      return { success: true, message: "Payment verified successfully" };
    },
  },

  customization: {
    removeBackground: async (_productId: string, file: File): Promise<string> => {
      await sleep(100);
      if (!/^image\/(png|jpeg|jpg|webp)$/i.test(file.type)) {
        throw new Error("Please upload a PNG, JPG, JPEG, or WebP image");
      }
      return URL.createObjectURL(file);
    },
  },
};
