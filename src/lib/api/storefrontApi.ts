import type {
  Address,
  ApiResponse,
  AuthResponse,
  CartItem,
  CheckoutSession,
  KonvaTemplate,
  Product,
  ProductTypeSummary,
  ProductVariant,
  User,
  VariantOptionGroup,
} from "@/types";
import { apiClient } from "@/lib/api/apiClient";
import { customerTokenStorage, mapUser } from "@/lib/auth/tokenStorage";

interface BackendMedia {
  role?: string;
  url?: string;
}

interface BackendVariant {
  id?: number;
  combinationName?: string;
  extraPrice?: number;
  optionValues?: Record<string, string>;
  isActive?: boolean;
}

interface BackendProduct {
  id: number;
  name: string;
  slug?: string;
  shortDescription?: string;
  description?: string;
  basePrice?: number;
  salePrice?: number | null;
  categoryId?: number;
  categoryName?: string;
  media?: BackendMedia[];
  mainProductImageUrl?: string;
  variantsEnabled?: boolean;
  variants?: BackendVariant[];
  variantOptionGroups?: VariantOptionGroup[];
  photoUploadRequired?: boolean;
  textRequired?: boolean;
  konvaEditorEnabled?: boolean;
  konvaTemplates?: KonvaTemplate[];
  backgroundRemovalRequired?: boolean;
  productType?: ProductTypeSummary | null;
}

interface BackendCartItem {
  id: number;
  productId: number;
  productName: string;
  productSlug?: string;
  productImageUrl?: string;
  variantId?: number | null;
  variantName?: string | null;
  sku?: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  customizationJson?: string | null;
  previewImageUrl?: string | null;
}

interface BackendCart {
  cartId: number;
  totalQuantity: number;
  subtotal: number;
  currency: string;
  items: BackendCartItem[];
}

const safeNumber = (value: unknown, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const parseDimension = (name = "") => {
  const match = name.match(/(\d+(?:\.\d+)?)\s*[x×]\s*(\d+(?:\.\d+)?)/i);
  if (!match) return { width: 300, height: 300 };
  return {
    width: Math.max(1, safeNumber(match[1], 12)) * 25,
    height: Math.max(1, safeNumber(match[2], 12)) * 25,
  };
};

export const mapBackendProductToStorefront = (product: BackendProduct): Product => {
  const media = Array.isArray(product.media) ? product.media : [];
  const images = [
    media.find((item) => item.role === "MAIN")?.url,
    media.find((item) => item.role === "MOCKUP")?.url,
    ...media.filter((item) => item.role === "GALLERY").map((item) => item.url),
    product.mainProductImageUrl,
  ].filter((value): value is string => Boolean(value));

  const activeVariants = (product.variants ?? []).filter((variant) => variant.isActive !== false);
  const variants: ProductVariant[] = product.variantsEnabled && activeVariants.length > 0
    ? activeVariants.map((variant, index) => {
        const name = variant.combinationName || "Standard Variant";
        const dimensions = parseDimension(name);
        return {
          id: String(variant.id ?? index),
          name,
          dimensions: name,
          price: safeNumber(product.salePrice ?? product.basePrice) + safeNumber(variant.extraPrice),
          width: dimensions.width,
          height: dimensions.height,
          optionValues: variant.optionValues ?? {},
        };
      })
    : [{
        id: "standard",
        name: "Standard",
        dimensions: "Standard Size",
        price: safeNumber(product.salePrice ?? product.basePrice),
        width: 300,
        height: 300,
        optionValues: {},
      }];

  const personalizationOptions: string[] = [];
  if (product.photoUploadRequired) personalizationOptions.push("photo");
  if (product.textRequired) personalizationOptions.push("text");

  const isCustomizable = Boolean(
    product.photoUploadRequired || product.textRequired || product.konvaEditorEnabled,
  );

  return {
    id: String(product.id),
    title: product.name,
    description: product.shortDescription || product.description || "",
    category: product.categoryName || "Custom Products",
    categoryId: product.categoryId,
    slug: product.slug,
    materials: ["Premium Acrylic"],
    variants,
    basePrice: safeNumber(product.salePrice ?? product.basePrice),
    personalizationOptions,
    images: images.length > 0 ? Array.from(new Set(images)) : ["/placeholder.svg"],
    tags: [product.categoryName || "custom"],
    stock: "in-stock",
    featured: false,
    isCustomizable,
    customizationType: product.konvaEditorEnabled
      ? "ADVANCED_DESIGNER"
      : product.textRequired && !product.photoUploadRequired
        ? "TEXT_ONLY"
        : product.photoUploadRequired
          ? "SIMPLE_IMAGE"
          : "NONE",
    konvaTemplates: product.konvaTemplates ?? [],
    backgroundRemovalRequired: Boolean(
      product.backgroundRemovalRequired || product.productType?.backgroundRemovalRequired,
    ),
    productType: product.productType ?? null,
    variantOptionGroups: product.variantOptionGroups ?? [],
    personalization: {
      supportsImage: Boolean(product.photoUploadRequired),
      supportsText: Boolean(product.textRequired),
      maxFileSizeMB: 10,
      recommendedDPI: 300,
    },
  };
};

const mapCart = (cart: BackendCart): { items: CartItem[]; total: number; itemCount: number } => ({
  total: safeNumber(cart.subtotal),
  itemCount: safeNumber(cart.totalQuantity),
  items: (cart.items ?? []).map((item) => ({
    id: String(item.id),
    productId: String(item.productId),
    productName: item.productName,
    productSlug: item.productSlug,
    variantId: item.variantId == null ? "standard" : String(item.variantId),
    variantName: item.variantName ?? undefined,
    quantity: item.quantity,
    price: safeNumber(item.unitPrice),
    thumbnail: item.previewImageUrl || item.productImageUrl || "/placeholder.svg",
    customizationJson: item.customizationJson ?? undefined,
    personalizationSummary: item.customizationJson ? "Customized design" : undefined,
    sku: item.sku,
  })),
});

export const storefrontApi = {
  auth: {
    login: async (email: string, password: string): Promise<User> => {
      const response = await apiClient.post<ApiResponse<AuthResponse>>("/api/v1/auth/login", { email, password });
      const auth = response.data.data;
      if (!response.data.success || !auth) throw new Error(response.data.message || "Login failed");
      customerTokenStorage.setAuth(auth);
      return mapUser(auth.user);
    },
    signup: async (name: string, email: string, password: string, phone?: string): Promise<User> => {
      const response = await apiClient.post<ApiResponse<AuthResponse>>("/api/v1/auth/signup", {
        name,
        email,
        password,
        phone: phone || undefined,
      });
      const auth = response.data.data;
      if (!response.data.success || !auth) throw new Error(response.data.message || "Signup failed");
      customerTokenStorage.setAuth(auth);
      return mapUser(auth.user);
    },
    me: async (): Promise<User> => {
      const response = await apiClient.get<ApiResponse<AuthResponse["user"]>>("/api/v1/auth/me");
      const profile = response.data.data;
      if (!response.data.success || !profile) throw new Error(response.data.message || "Unable to load profile");
      const user = mapUser(profile);
      customerTokenStorage.setUser(user);
      return user;
    },
    logout: async () => {
      try {
        if (customerTokenStorage.getAccessToken()) await apiClient.post("/api/v1/auth/logout");
      } finally {
        customerTokenStorage.clear();
      }
    },
  },

  products: {
    list: async (): Promise<Product[]> => {
      const response = await apiClient.get<ApiResponse<BackendProduct[]>>("/api/v1/product");
      return (response.data.data ?? []).map(mapBackendProductToStorefront);
    },
    get: async (idOrSlug: string): Promise<Product | null> => {
      const list = await storefrontApi.products.list();
      const match = list.find((item) => item.id === idOrSlug || item.slug === idOrSlug);
      if (match) return match;
      if (!/^\d+$/.test(idOrSlug)) return null;
      const response = await apiClient.get<ApiResponse<BackendProduct>>(`/api/v1/product/${idOrSlug}`);
      return response.data.data ? mapBackendProductToStorefront(response.data.data) : null;
    },
    categories: async <T = unknown[]>(): Promise<T> => {
      const response = await apiClient.get<ApiResponse<T>>("/api/v1/category");
      return (response.data.data ?? []) as T;
    },
    homepagePresets: async (): Promise<ProductTypeSummary[]> => {
      const response = await apiClient.get<ApiResponse<ProductTypeSummary[]>>("/api/v1/product-type-presets/homepage");
      return response.data.data ?? [];
    },
    presets: async (): Promise<ProductTypeSummary[]> => {
      const response = await apiClient.get<ApiResponse<ProductTypeSummary[]>>("/api/v1/product-type-presets");
      return response.data.data ?? [];
    },
  },

  cart: {
    get: async () => {
      const response = await apiClient.get<ApiResponse<BackendCart>>("/api/v1/cart");
      if (!response.data.data) return { items: [], total: 0, itemCount: 0 };
      return mapCart(response.data.data);
    },
    add: async (item: Omit<CartItem, "id">) => {
      const variantId = item.variantId === "standard" ? null : Number(item.variantId);
      const response = await apiClient.post<ApiResponse<BackendCart>>("/api/v1/cart/items", {
        productId: Number(item.productId),
        variantId: Number.isFinite(variantId) ? variantId : null,
        quantity: item.quantity,
        customizationJson: item.customizationJson || (item.design ? JSON.stringify(item.design) : undefined),
        previewImageUrl: item.thumbnail,
      });
      if (!response.data.data) throw new Error(response.data.message || "Unable to add item to cart");
      return mapCart(response.data.data);
    },
    update: async (itemId: string, patch: { quantity?: number; customizationJson?: string; previewImageUrl?: string }) => {
      const response = await apiClient.patch<ApiResponse<BackendCart>>(`/api/v1/cart/items/${itemId}`, patch);
      if (!response.data.data) throw new Error(response.data.message || "Unable to update cart item");
      return mapCart(response.data.data);
    },
    remove: async (itemId: string) => {
      const response = await apiClient.delete<ApiResponse<BackendCart>>(`/api/v1/cart/items/${itemId}`);
      return response.data.data ? mapCart(response.data.data) : storefrontApi.cart.get();
    },
    clear: async () => {
      await apiClient.delete("/api/v1/cart");
      return { items: [], total: 0, itemCount: 0 };
    },
  },

  addresses: {
    list: async (): Promise<Address[]> => {
      const response = await apiClient.get<ApiResponse<Address[]>>("/api/v1/addresses");
      return response.data.data ?? [];
    },
    create: async (address: Omit<Address, "id">): Promise<Address> => {
      const response = await apiClient.post<ApiResponse<Address>>("/api/v1/addresses", address);
      if (!response.data.data) throw new Error(response.data.message || "Unable to save address");
      return response.data.data;
    },
  },

  checkout: {
    create: async (shippingAddressId: number): Promise<CheckoutSession> => {
      const response = await apiClient.post<ApiResponse<CheckoutSession>>("/api/v1/orders/checkout", {
        shippingAddressId,
      });
      if (!response.data.data) throw new Error(response.data.message || "Unable to start checkout");
      return response.data.data;
    },
    verify: async (payload: {
      orderId: number;
      razorpayOrderId: string;
      razorpayPaymentId: string;
      razorpaySignature: string;
    }) => {
      const response = await apiClient.post<ApiResponse<unknown>>("/api/v1/payments/razorpay/verify", payload);
      if (!response.data.success) throw new Error(response.data.message || "Payment verification failed");
      return response.data;
    },
  },

  customization: {
    removeBackground: async (productId: string, file: File): Promise<string> => {
      if (!/^image\/(png|jpeg|jpg|webp)$/i.test(file.type)) {
        throw new Error("Please upload a PNG, JPG, JPEG, or WebP image");
      }
      if (file.size > 10 * 1024 * 1024) throw new Error("Image must be 10 MB or smaller");

      const formData = new FormData();
      formData.append("file", file, file.name);
      const response = await apiClient.post(
        `/api/v1/customization/products/${productId}/remove-background`,
        formData,
        { responseType: "blob", headers: { Accept: "image/png,image/jpeg,application/octet-stream" } },
      );
      if (!(response.data instanceof Blob) || response.data.size === 0) {
        throw new Error("Background removal returned an empty image");
      }
      return URL.createObjectURL(response.data);
    },
  },
};
