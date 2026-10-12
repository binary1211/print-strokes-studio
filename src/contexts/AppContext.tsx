import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, type ReactNode } from "react";
import type { AuthState, CartItem, CartState, Design, PersonalizationState, User } from "@/types";
import { toast } from "sonner";
import { storefrontApi } from "@/lib/api/storefrontApi";
import { customerTokenStorage } from "@/lib/auth/tokenStorage";
import { getApiErrorMessage } from "@/lib/api/apiClient";

const GUEST_CART_KEY = "printstrokes_guest_cart";

interface CartContextType {
  state: CartState;
  addToCart: (item: Omit<CartItem, "id">) => Promise<void>;
  removeFromCart: (itemId: string) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  updateCartItemDesign: (itemId: string, design: Design) => Promise<void>;
  refreshCart: () => Promise<void>;
}

interface AuthContextType {
  state: AuthState;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, phone?: string) => Promise<void>;
  logout: () => Promise<void>;
}

interface PersonalizationContextType {
  state: PersonalizationState;
  setCurrentDesign: (design: Design | null) => void;
  setCanvasReady: (ready: boolean) => void;
  setSelectedLayer: (layerId: string | null) => void;
  setCanvasZoom: (zoom: number) => void;
  setCanvasOffset: (x: number, y: number) => void;
  saveDesign: (design: Design) => Promise<string>;
  loadDesign: (designId: string) => Promise<Design | null>;
}

type CartAction =
  | { type: "SET_CART"; payload: Omit<CartState, "isLoading"> }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "ADD_GUEST_ITEM"; payload: Omit<CartItem, "id"> }
  | { type: "REMOVE_GUEST_ITEM"; payload: string }
  | { type: "UPDATE_GUEST_QUANTITY"; payload: { itemId: string; quantity: number } }
  | { type: "UPDATE_GUEST_DESIGN"; payload: { itemId: string; design: Design } }
  | { type: "CLEAR" };

type AuthAction =
  | { type: "LOADING"; payload: boolean }
  | { type: "AUTHENTICATED"; payload: User }
  | { type: "LOGOUT" };

type PersonalizationAction =
  | { type: "SET_CURRENT_DESIGN"; payload: Design | null }
  | { type: "SET_CANVAS_READY"; payload: boolean }
  | { type: "SET_SELECTED_LAYER"; payload: string | null }
  | { type: "SET_CANVAS_ZOOM"; payload: number }
  | { type: "SET_CANVAS_OFFSET"; payload: { x: number; y: number } };

const summarize = (items: CartItem[]): Omit<CartState, "isLoading"> => ({
  items,
  itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
  total: items.reduce((sum, item) => sum + item.price * item.quantity, 0),
});

const cartReducer = (state: CartState, action: CartAction): CartState => {
  switch (action.type) {
    case "SET_CART":
      return { ...action.payload, isLoading: false };
    case "SET_LOADING":
      return { ...state, isLoading: action.payload };
    case "ADD_GUEST_ITEM": {
      const item: CartItem = { ...action.payload, id: crypto.randomUUID() };
      return { ...summarize([...state.items, item]), isLoading: false };
    }
    case "REMOVE_GUEST_ITEM":
      return { ...summarize(state.items.filter((item) => item.id !== action.payload)), isLoading: false };
    case "UPDATE_GUEST_QUANTITY":
      return {
        ...summarize(state.items.map((item) => item.id === action.payload.itemId
          ? { ...item, quantity: action.payload.quantity }
          : item)),
        isLoading: false,
      };
    case "UPDATE_GUEST_DESIGN":
      return {
        ...summarize(state.items.map((item) => item.id === action.payload.itemId
          ? { ...item, design: action.payload.design, customizationJson: JSON.stringify(action.payload.design) }
          : item)),
        isLoading: false,
      };
    case "CLEAR":
      return { items: [], total: 0, itemCount: 0, isLoading: false };
    default:
      return state;
  }
};

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case "LOADING": return { ...state, isLoading: action.payload };
    case "AUTHENTICATED": return { user: action.payload, isAuthenticated: true, isLoading: false };
    case "LOGOUT": return { user: null, isAuthenticated: false, isLoading: false };
    default: return state;
  }
};

const personalizationReducer = (state: PersonalizationState, action: PersonalizationAction): PersonalizationState => {
  switch (action.type) {
    case "SET_CURRENT_DESIGN": return { ...state, currentDesign: action.payload };
    case "SET_CANVAS_READY": return { ...state, isCanvasReady: action.payload };
    case "SET_SELECTED_LAYER": return { ...state, selectedLayerId: action.payload };
    case "SET_CANVAS_ZOOM": return { ...state, canvasZoom: action.payload };
    case "SET_CANVAS_OFFSET": return { ...state, canvasOffsetX: action.payload.x, canvasOffsetY: action.payload.y };
    default: return state;
  }
};

const readGuestCart = (): Omit<CartState, "isLoading"> => {
  try {
    const raw = localStorage.getItem(GUEST_CART_KEY);
    if (!raw) return { items: [], total: 0, itemCount: 0 };
    const parsed = JSON.parse(raw) as Partial<CartState>;
    return summarize(Array.isArray(parsed.items) ? parsed.items : []);
  } catch {
    localStorage.removeItem(GUEST_CART_KEY);
    return { items: [], total: 0, itemCount: 0 };
  }
};

const safeReadDesigns = (): Design[] => {
  try {
    const parsed = JSON.parse(localStorage.getItem("printstrokes_designs") || "[]") as unknown;
    return Array.isArray(parsed) ? parsed as Design[] : [];
  } catch {
    return [];
  }
};

const CartContext = createContext<CartContextType | null>(null);
const AuthContext = createContext<AuthContextType | null>(null);
const PersonalizationContext = createContext<PersonalizationContextType | null>(null);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [cartState, cartDispatch] = useReducer(cartReducer, undefined, () => ({ ...readGuestCart(), isLoading: false }));
  const [authState, authDispatch] = useReducer(authReducer, {
    user: customerTokenStorage.getUser(),
    isAuthenticated: Boolean(customerTokenStorage.getUser()),
    isLoading: true,
  });
  const [personalizationState, personalizationDispatch] = useReducer(personalizationReducer, {
    currentDesign: null,
    isCanvasReady: false,
    selectedLayerId: null,
    canvasZoom: 1,
    canvasOffsetX: 0,
    canvasOffsetY: 0,
  });

  const refreshCart = useCallback(async () => {
    cartDispatch({ type: "SET_LOADING", payload: true });
    try {
      const cart = await storefrontApi.cart.get();
      cartDispatch({ type: "SET_CART", payload: cart });
    } catch {
      cartDispatch({ type: "SET_LOADING", payload: false });
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    const initialize = async () => {
      const existingUser = customerTokenStorage.getUser();
      if (!existingUser) {
        authDispatch({ type: "LOGOUT" });
        return;
      }
      try {
        const user = await storefrontApi.auth.me();
        if (cancelled) return;
        authDispatch({ type: "AUTHENTICATED", payload: user });
      } catch {
        customerTokenStorage.clear();
        if (!cancelled) authDispatch({ type: "LOGOUT" });
      }
    };
    void initialize();
    return () => { cancelled = true; };
  }, []);

  const addToCart = useCallback(async (item: Omit<CartItem, "id">) => {
    const cart = await storefrontApi.cart.add(item);
    cartDispatch({ type: "SET_CART", payload: cart });
  }, []);

  const removeFromCart = useCallback(async (itemId: string) => {
    const cart = await storefrontApi.cart.remove(itemId);
    cartDispatch({ type: "SET_CART", payload: cart });
  }, []);

  const updateQuantity = useCallback(async (itemId: string, quantity: number) => {
    if (quantity <= 0) return removeFromCart(itemId);
    const cart = await storefrontApi.cart.update(itemId, { quantity });
    cartDispatch({ type: "SET_CART", payload: cart });
  }, [removeFromCart]);

  const clearCart = useCallback(async () => {
    const cart = await storefrontApi.cart.clear();
    cartDispatch({ type: "SET_CART", payload: cart });
  }, []);

  const updateCartItemDesign = useCallback(async (itemId: string, design: Design) => {
    const cart = await storefrontApi.cart.update(itemId, {
      customizationJson: JSON.stringify(design),
      previewImageUrl: design.layers.find((layer) => layer.type === "image")?.url,
    });
    cartDispatch({ type: "SET_CART", payload: cart });
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    authDispatch({ type: "LOADING", payload: true });
    try {
      const user = await storefrontApi.auth.login(email, password);
      authDispatch({ type: "AUTHENTICATED", payload: user });
      toast.success("Welcome back!");
    } catch (error) {
      authDispatch({ type: "LOGOUT" });
      throw new Error(getApiErrorMessage(error, "Invalid email or password"));
    }
  }, []);

  const register = useCallback(async (name: string, email: string, password: string, phone?: string) => {
    authDispatch({ type: "LOADING", payload: true });
    try {
      const user = await storefrontApi.auth.signup(name, email, password, phone);
      authDispatch({ type: "AUTHENTICATED", payload: user });
      toast.success("Account created successfully!");
    } catch (error) {
      authDispatch({ type: "LOGOUT" });
      throw new Error(getApiErrorMessage(error, "Registration failed"));
    }
  }, []);

  const logout = useCallback(async () => {
    await storefrontApi.auth.logout();
    authDispatch({ type: "LOGOUT" });
    toast.success("Logged out successfully");
  }, []);

  const saveDesign = useCallback(async (design: Design) => {
    const id = design.id || crypto.randomUUID();
    const designs = safeReadDesigns().filter((item) => item.id !== id);
    designs.push({ ...design, id });
    try { localStorage.setItem("printstrokes_designs", JSON.stringify(designs.slice(-20))); } catch { /* optional */ }
    return id;
  }, []);

  const loadDesign = useCallback(async (designId: string) => safeReadDesigns().find((item) => item.id === designId) ?? null, []);

  const cartValue = useMemo<CartContextType>(() => ({
    state: cartState,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    updateCartItemDesign,
    refreshCart,
  }), [cartState, addToCart, removeFromCart, updateQuantity, clearCart, updateCartItemDesign, refreshCart]);

  const authValue = useMemo<AuthContextType>(() => ({ state: authState, login, register, logout }), [authState, login, register, logout]);

  const personalizationValue = useMemo<PersonalizationContextType>(() => ({
    state: personalizationState,
    setCurrentDesign: (design) => personalizationDispatch({ type: "SET_CURRENT_DESIGN", payload: design }),
    setCanvasReady: (ready) => personalizationDispatch({ type: "SET_CANVAS_READY", payload: ready }),
    setSelectedLayer: (layerId) => personalizationDispatch({ type: "SET_SELECTED_LAYER", payload: layerId }),
    setCanvasZoom: (zoom) => personalizationDispatch({ type: "SET_CANVAS_ZOOM", payload: zoom }),
    setCanvasOffset: (x, y) => personalizationDispatch({ type: "SET_CANVAS_OFFSET", payload: { x, y } }),
    saveDesign,
    loadDesign,
  }), [personalizationState, saveDesign, loadDesign]);

  return (
    <CartContext.Provider value={cartValue}>
      <AuthContext.Provider value={authValue}>
        <PersonalizationContext.Provider value={personalizationValue}>
          {children}
        </PersonalizationContext.Provider>
      </AuthContext.Provider>
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within AppProvider");
  return context;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AppProvider");
  return context;
};

export const usePersonalization = () => {
  const context = useContext(PersonalizationContext);
  if (!context) throw new Error("usePersonalization must be used within AppProvider");
  return context;
};
