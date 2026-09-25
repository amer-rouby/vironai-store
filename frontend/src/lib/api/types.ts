/** Mirrors of the backend contracts (com.verona.store.*Dtos). */

export interface LocalizedText {
  ar: string;
  en: string;
}

export interface Page<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface ApiErrorBody {
  status: number;
  code: string;
  message: string;
  path?: string;
  fieldErrors?: Record<string, string>;
}

// Identity ------------------------------------------------------------------------------------
export type Role = "CUSTOMER" | "ADMIN";

export interface SessionUser {
  id: number;
  email: string;
  fullName: string;
  phone: string | null;
  role: Role;
}

export interface AuthResponse {
  accessToken: string;
  expiresAt: string;
  user: SessionUser;
}

// Storefront ----------------------------------------------------------------------------------
export interface CategoryView {
  id: number;
  slug: string;
  name: LocalizedText;
  imageUrl: string | null;
  parentId: number | null;
}

export interface ColorView {
  id: number;
  name: LocalizedText;
  hexCode: string;
}

export interface SizeView {
  id: number;
  code: string;
}

export interface FiltersView {
  categories: CategoryView[];
  colors: ColorView[];
  sizes: SizeView[];
}

export interface ProductCard {
  id: number;
  slug: string;
  name: LocalizedText;
  price: number;
  compareAtPrice: number | null;
  imageUrl: string | null;
  hoverImageUrl: string | null;
  colorHexes: string[];
  inStock: boolean;
}

export interface ProductDetail {
  id: number;
  slug: string;
  name: LocalizedText;
  description: LocalizedText;
  category: CategoryView;
  basePrice: number;
  compareAtPrice: number | null;
  images: { url: string; colorId: number | null }[];
  colors: ColorView[];
  sizes: SizeView[];
  variants: { id: number; colorId: number; sizeId: number; price: number; stock: number }[];
}

export type ProductSort = "NEWEST" | "PRICE_ASC" | "PRICE_DESC";

// Ordering ------------------------------------------------------------------------------------
export const GOVERNORATES = [
  "CAIRO", "GIZA", "QALYUBIA", "ALEXANDRIA", "BEHEIRA", "DAKAHLIA", "DAMIETTA", "GHARBIA", "KAFR_EL_SHEIKH",
  "MONUFIA", "SHARQIA", "PORT_SAID", "ISMAILIA", "SUEZ", "FAYOUM", "BENI_SUEF", "MINYA", "ASSIUT", "SOHAG",
  "QENA", "LUXOR", "ASWAN", "MATROUH", "RED_SEA", "NEW_VALLEY", "NORTH_SINAI", "SOUTH_SINAI",
] as const;
export type Governorate = (typeof GOVERNORATES)[number];

export const ORDER_STATUSES = ["PENDING_PAYMENT", "PENDING", "CONFIRMED", "SHIPPED", "DELIVERED", "CANCELLED"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];
export type PaymentMethod = "CASH_ON_DELIVERY" | "CARD";

export interface CheckoutOptions {
  paymentMethods: PaymentMethod[];
  freeShippingThreshold: number | null;
}
export type LineIssue = "UNAVAILABLE" | "OUT_OF_STOCK" | "INSUFFICIENT_STOCK";

export interface CartItemInput {
  variantId: number;
  quantity: number;
}

export interface QuoteLine {
  variantId: number;
  productSlug: string | null;
  productName: LocalizedText | null;
  colorName: LocalizedText | null;
  colorHex: string | null;
  sizeCode: string | null;
  imageUrl: string | null;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
  availableStock: number;
  issue: LineIssue | null;
}

export interface Quote {
  lines: QuoteLine[];
  subtotal: number;
  shippingFee: number | null;
  total: number;
  freeShippingThreshold: number | null;
  orderable: boolean;
}

export interface ShippingAddress {
  recipientName: string;
  phone: string;
  governorate: Governorate;
  city: string;
  street: string;
  building: string | null;
}

export interface OrderLine {
  productSlug: string;
  productName: LocalizedText;
  colorName: LocalizedText;
  colorHex: string;
  sizeCode: string;
  sku: string;
  imageUrl: string | null;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

export interface OrderView {
  id: number;
  orderNumber: string;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  subtotal: number;
  shippingFee: number;
  total: number;
  address: ShippingAddress;
  notes: string | null;
  placedAt: string;
  items: OrderLine[];
  history: { status: OrderStatus; note: string | null; changedAt: string }[];
  cancellable: boolean;
  nextStatuses: OrderStatus[];
  customer: { id: number; fullName: string; email: string } | null;
  paymentUrl: string | null;
  paymentExpiresAt: string | null;
}

export interface OrderSummary {
  id: number;
  orderNumber: string;
  status: OrderStatus;
  total: number;
  itemCount: number;
  placedAt: string;
  previewImageUrl: string | null;
  recipientName: string;
  governorate: Governorate;
}
