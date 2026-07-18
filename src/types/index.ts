export interface ProductTypeSummary {
  id: number;
  name: string;
  slug: string;
  imageUrl?: string | null;
  shortDescription?: string | null;
  showOnHomepage?: boolean;
  sortOrder?: number;
  backgroundRemovalRequired?: boolean;
}

export interface ProductVariant {
  id: string;
  name: string;
  price: number;
  dimensions: string;
  width?: number;
  height?: number;
  optionValues?: Record<string, string>;
}

export interface Product {
  id: string;
  title: string;
  description: string;
  category: string;
  categoryId?: number;
  slug?: string;
  materials: string[];
  variants: ProductVariant[];
  basePrice: number;
  personalizationOptions: string[];
  images: string[];
  tags: string[];
  stock: string;
  featured: boolean;
  isCustomizable?: boolean;
  customizationType?: "ADVANCED_DESIGNER" | "SIMPLE_IMAGE" | "TEXT_ONLY" | "NONE";
  templateJson?: string;
  konvaTemplates?: KonvaTemplate[];
  backgroundRemovalRequired?: boolean;
  productType?: ProductTypeSummary | null;
  variantOptionGroups?: VariantOptionGroup[];
  personalization?: {
    supportsImage: boolean;
    supportsText: boolean;
    maxFileSizeMB: number;
    recommendedDPI: number;
  };
}

export interface VariantOptionGroup {
  optionName: string;
  optionValues: string[];
}

export interface KonvaTemplate {
  id?: number;
  templateName?: string | null;
  themeId?: number | null;
  themeName?: string | null;
  orientation: "PORTRAIT" | "LANDSCAPE";
  templateJson?: string | null;
  previewImageUrl?: string | null;
  isActive: boolean;
}

export interface DesignLayer {
  id: string;
  type: "image" | "text";
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  opacity?: number;
  visible: boolean;
  zIndex: number;
}

export interface ImageLayer extends DesignLayer {
  type: "image";
  url: string;
  originalUrl: string;
  scale: number;
  scaleX?: number;
  scaleY?: number;
  cropX: number;
  cropY: number;
  cropWidth: number;
  cropHeight: number;
  filters?: {
    brightness: number;
    contrast: number;
    saturation: number;
  };
}

export interface TextLayer extends DesignLayer {
  type: "text";
  text: string;
  fontFamily: string;
  fontSize: number;
  fontWeight: string;
  color: string;
  textAlign: "left" | "center" | "right";
  letterSpacing: number;
  lineHeight: number;
  hasDropShadow: boolean;
  hasStroke: boolean;
  strokeColor: string;
}

export interface Design {
  id: string;
  productId: string;
  variantId: string;
  layers: Array<ImageLayer | TextLayer>;
  canvasWidth: number;
  canvasHeight: number;
  createdAt: string;
  updatedAt: string;
}

export interface CartItem {
  id: string;
  productId: string;
  productName?: string;
  productSlug?: string;
  variantId: string;
  variantName?: string;
  quantity: number;
  design?: Design;
  customizationJson?: string;
  price: number;
  thumbnail?: string;
  personalizationSummary?: string;
  sku?: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string | null;
  roles?: string[];
  avatar?: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface CartState {
  items: CartItem[];
  total: number;
  itemCount: number;
  isLoading?: boolean;
}

export interface PersonalizationState {
  currentDesign: Design | null;
  isCanvasReady: boolean;
  selectedLayerId: string | null;
  canvasZoom: number;
  canvasOffsetX: number;
  canvasOffsetY: number;
}

export interface ApiResponse<T> {
  statusCode?: number;
  message?: string;
  data?: T;
  success: boolean;
  status?: string;
}

export interface AuthResponse {
  tokenType: string;
  accessToken: string;
  refreshToken: string;
  sessionId?: string;
  expiresInSeconds?: number;
  user: {
    id: number;
    name: string;
    email: string;
    phone?: string | null;
    roles: string[];
  };
}

export interface Address {
  id: number;
  name: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string | null;
  city: string;
  state: string;
  country: string;
  pincode: string;
  isDefault: boolean;
}

export interface CheckoutSession {
  orderId: number;
  orderNumber: string;
  razorpayOrderId: string;
  razorpayKeyId: string;
  amountInPaise: number;
  amount: number;
  currency: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string | null;
}
