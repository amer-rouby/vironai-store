"use client";

import Image from "next/image";
import { FolderTree, Palette, Receipt, Ruler, Shirt, Users } from "lucide-react";
import { Price } from "@/components/ui/price";
import { ORDER_STATUSES, type LocalizedText, type OrderSummary } from "@/lib/api/types";
import { OrderStatusBadge } from "@/features/orders/OrderStatusBadge";
import { AdminOrderDetail } from "../orders/AdminOrderDetail";
import { AdminCustomerDetail, type CustomerRow } from "../customers/AdminCustomerDetail";
import { localized } from "@/lib/utils";
import { defineResource, type AnyResourceConfig, type ResourceKey } from "../engine/types";

/*
 * Every admin screen is declared here. The engine (../engine) renders list, search, pagination,
 * create/edit form, validation errors and delete for each one — no per-screen components.
 */

const emptyText = (): LocalizedText => ({ ar: "", en: "" });

/** Row -> form model: everything except the id, which travels in the URL instead. */
function omitId<T extends { id: number }>(row: T): Omit<T, "id"> {
  const copy: Partial<T> = { ...row };
  delete copy.id;
  return copy as Omit<T, "id">;
}
const badge = (on: boolean, yes: string, no: string) => (
  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${on ? "bg-success/15 text-success" : "bg-surface-2 text-muted"}`}>{on ? yes : no}</span>
);

// Categories ----------------------------------------------------------------------------------------
interface Category {
  id: number;
  slug: string;
  name: LocalizedText;
  imageUrl: string | null;
  parentId: number | null;
  sortOrder: number;
  active: boolean;
}

const categories = defineResource<Category, Omit<Category, "id">>({
  key: "categories",
  endpoint: "categories",
  icon: FolderTree,
  sort: "sortOrder,asc",
  uses: ["categories"],
  optionLabel: (c, locale) => localized(c.name, locale),
  columns: [
    {
      key: "name",
      label: "name",
      cell: (c, { locale }) => (
        <div className="flex items-center gap-3">
          <div className="relative size-10 shrink-0 overflow-hidden rounded-xl bg-surface-2">
            {c.imageUrl && <Image src={c.imageUrl} alt="" fill sizes="40px" className="object-cover" />}
          </div>
          <span className="font-medium">{localized(c.name, locale)}</span>
        </div>
      ),
    },
    { key: "slug", label: "slug", cell: (c) => <code className="text-xs text-muted">{c.slug}</code> },
    {
      key: "parent",
      label: "parent",
      cell: (c, { lookup, locale }) => {
        const parent = lookup("categories", c.parentId) as Category | undefined;
        return parent ? localized(parent.name, locale) : "—";
      },
    },
    { key: "sortOrder", label: "sortOrder", cell: (c) => c.sortOrder },
    { key: "active", label: "active", cell: (c, { t }) => badge(c.active, t("yes"), t("no")) },
  ],
  fields: [
    { name: "name", label: "name", type: "localized", required: true },
    { name: "slug", label: "slug", type: "text", hint: "slugHint", dir: "ltr" },
    { name: "parentId", label: "parent", type: "relation", relation: "categories" },
    { name: "imageUrl", label: "imageUrl", type: "image" },
    { name: "sortOrder", label: "sortOrder", type: "number" },
    { name: "active", label: "active", type: "switch" },
  ],
  emptyForm: () => ({ name: emptyText(), slug: "", imageUrl: "", parentId: null, sortOrder: 0, active: true }),
  toForm: (row) => ({ ...omitId(row), imageUrl: row.imageUrl ?? "" }),
  toRequest: (f) => ({ ...f, slug: f.slug || null, imageUrl: f.imageUrl || null }),
});

// Colors --------------------------------------------------------------------------------------------
interface Color {
  id: number;
  name: LocalizedText;
  hexCode: string;
  sortOrder: number;
}

const colors = defineResource<Color, Omit<Color, "id">>({
  key: "colors",
  endpoint: "colors",
  icon: Palette,
  sort: "sortOrder,asc",
  optionLabel: (c, locale) => localized(c.name, locale),
  columns: [
    {
      key: "name",
      label: "name",
      cell: (c, { locale }) => (
        <div className="flex items-center gap-3">
          <span className="size-7 rounded-full border border-border" style={{ backgroundColor: c.hexCode }} />
          <span className="font-medium">{localized(c.name, locale)}</span>
        </div>
      ),
    },
    { key: "hex", label: "hexCode", cell: (c) => <code className="text-xs text-muted" dir="ltr">{c.hexCode}</code> },
    { key: "sortOrder", label: "sortOrder", cell: (c) => c.sortOrder },
  ],
  fields: [
    { name: "name", label: "name", type: "localized", required: true },
    { name: "hexCode", label: "hexCode", type: "color", required: true },
    { name: "sortOrder", label: "sortOrder", type: "number" },
  ],
  emptyForm: () => ({ name: emptyText(), hexCode: "#C89B7B", sortOrder: 0 }),
  toForm: omitId,
});

// Sizes ---------------------------------------------------------------------------------------------
interface Size {
  id: number;
  code: string;
  sortOrder: number;
}

const sizes = defineResource<Size, Omit<Size, "id">>({
  key: "sizes",
  endpoint: "sizes",
  icon: Ruler,
  sort: "sortOrder,asc",
  optionLabel: (s) => s.code,
  columns: [
    { key: "code", label: "code", cell: (s) => <span className="font-semibold">{s.code}</span> },
    { key: "sortOrder", label: "sortOrder", cell: (s) => s.sortOrder },
  ],
  fields: [
    { name: "code", label: "code", type: "text", required: true, dir: "ltr" },
    { name: "sortOrder", label: "sortOrder", type: "number" },
  ],
  emptyForm: () => ({ code: "", sortOrder: 0 }),
  toForm: omitId,
});

// Products ------------------------------------------------------------------------------------------
interface ProductImage {
  id?: number;
  url: string;
  colorId: number | null;
  sortOrder?: number;
}
interface ProductVariant {
  id?: number;
  colorId: number | null;
  sizeId: number | null;
  sku: string;
  price: number | null;
  stock: number;
  /** Carried through the form untouched: lets the server reject a save made on stale stock. */
  version?: number | null;
}
interface Product {
  id: number;
  slug: string;
  name: LocalizedText;
  description: LocalizedText;
  categoryId: number;
  basePrice: number;
  compareAtPrice: number | null;
  active: boolean;
  featured: boolean;
  images: ProductImage[];
  variants: ProductVariant[];
}
type ProductForm = Omit<Product, "id" | "categoryId" | "basePrice"> & { categoryId: number | null; basePrice: number | null };

const products = defineResource<Product, ProductForm>({
  key: "products",
  endpoint: "products",
  icon: Shirt,
  uses: ["categories"],
  dialogSize: "xl",
  optionLabel: (p, locale) => localized(p.name, locale),
  columns: [
    {
      key: "name",
      label: "name",
      cell: (p, { locale }) => (
        <div className="flex items-center gap-3">
          <div className="relative h-14 w-11 shrink-0 overflow-hidden rounded-lg bg-surface-2">
            {p.images[0] && <Image src={p.images[0].url} alt="" fill sizes="44px" className="object-cover" />}
          </div>
          <div>
            <p className="font-medium">{localized(p.name, locale)}</p>
            <code className="text-xs text-muted">{p.slug}</code>
          </div>
        </div>
      ),
    },
    {
      key: "category",
      label: "category",
      cell: (p, { lookup, locale }) => {
        const c = lookup("categories", p.categoryId) as Category | undefined;
        return c ? localized(c.name, locale) : "—";
      },
    },
    { key: "price", label: "basePrice", cell: (p) => <Price value={p.basePrice} compareAt={p.compareAtPrice} /> },
    { key: "variants", label: "variantCount", cell: (p) => p.variants.length, className: "hidden md:table-cell" },
    {
      key: "stock",
      label: "stockTotal",
      className: "hidden md:table-cell",
      cell: (p) => {
        const total = p.variants.reduce((s, v) => s + v.stock, 0);
        return <span className={total === 0 ? "font-semibold text-danger" : ""}>{total}</span>;
      },
    },
    {
      key: "status",
      label: "active",
      cell: (p, { t }) => (
        <div className="flex flex-wrap gap-1">
          {badge(p.active, t("yes"), t("no"))}
          {p.featured && <span className="rounded-full bg-accent-soft px-2.5 py-0.5 text-xs font-medium text-primary">★</span>}
        </div>
      ),
    },
  ],
  fields: [
    { name: "name", label: "name", type: "localized", required: true },
    { name: "description", label: "description", type: "localizedTextarea", required: true },
    { name: "categoryId", label: "category", type: "relation", relation: "categories", required: true },
    { name: "slug", label: "slug", type: "text", hint: "slugHint", dir: "ltr" },
    { name: "basePrice", label: "basePrice", type: "money", required: true },
    { name: "compareAtPrice", label: "compareAtPrice", type: "money" },
    { name: "active", label: "active", type: "switch" },
    { name: "featured", label: "featured", type: "switch" },
    { name: "images", label: "images", type: "images" },
    { name: "variants", label: "variants", type: "variants" },
  ],
  emptyForm: () => ({
    slug: "",
    name: emptyText(),
    description: emptyText(),
    categoryId: null,
    basePrice: null,
    compareAtPrice: null,
    active: true,
    featured: false,
    images: [],
    variants: [],
  }),
  toForm: (p) => ({
    ...omitId(p),
    images: p.images.map(({ url, colorId }) => ({ url, colorId })),
    variants: p.variants.map(({ colorId, sizeId, sku, price, stock, version }) => ({ colorId, sizeId, sku, price, stock, version })),
  }),
  toRequest: (f) => ({
    ...f,
    slug: f.slug || null,
    images: f.images.filter((i) => i.url.trim()),
    variants: f.variants.map((v) => ({ ...v, sku: v.sku?.trim() || null })),
  }),
});

// Orders ------------------------------------------------------------------------------------------
// Created by customers only: the back office lists, filters and moves them through their lifecycle.
const orders = defineResource<OrderSummary, Record<string, never>>({
  key: "orders",
  endpoint: "orders",
  icon: Receipt,
  actions: { create: false, edit: false, delete: false },
  optionLabel: (o) => o.orderNumber,
  filters: [
    {
      param: "status",
      allLabel: "allStatuses",
      options: ORDER_STATUSES.map((s) => ({ value: s, labelKey: `orderStatus.${s}` })),
    },
  ],
  Detail: AdminOrderDetail,
  columns: [
    { key: "number", label: "orderNumber", cell: (o) => <span className="font-semibold" dir="ltr">{o.orderNumber}</span> },
    { key: "customer", label: "customer", cell: (o) => o.recipientName },
    { key: "items", label: "items", className: "hidden md:table-cell", cell: (o) => o.itemCount },
    { key: "total", label: "total", cell: (o) => <Price value={o.total} /> },
    { key: "status", label: "status", cell: (o) => <OrderStatusBadge status={o.status} /> },
    {
      key: "date",
      label: "placedAt",
      className: "hidden lg:table-cell",
      cell: (o, { locale }) => new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-GB", { dateStyle: "medium", timeStyle: "short" }).format(new Date(o.placedAt)),
    },
  ],
  fields: [],
  emptyForm: () => ({}),
  toForm: () => ({}),
});

// Customers ---------------------------------------------------------------------------------------
// Accounts are created by sign-up; the back office reviews them and can disable (never delete) one.
const customers = defineResource<CustomerRow, Record<string, never>>({
  key: "customers",
  endpoint: "customers",
  icon: Users,
  actions: { create: false, edit: false, delete: false },
  optionLabel: (c) => c.fullName,
  filters: [
    {
      param: "role",
      allLabel: "allRoles",
      options: [
        { value: "CUSTOMER", labelKey: "admin.roleCUSTOMER" },
        { value: "ADMIN", labelKey: "admin.roleADMIN" },
      ],
    },
  ],
  Detail: AdminCustomerDetail,
  columns: [
    {
      key: "name",
      label: "fullName",
      cell: (c) => (
        <div className="min-w-0">
          <p className="truncate font-medium">{c.fullName}</p>
          <p className="truncate text-xs text-muted" dir="ltr">{c.email}</p>
        </div>
      ),
    },
    { key: "phone", label: "phone", className: "hidden lg:table-cell", cell: (c) => <span dir="ltr">{c.phone ?? "—"}</span> },
    { key: "orders", label: "orderCount", cell: (c) => c.orderCount },
    { key: "spent", label: "totalSpent", cell: (c) => <Price value={c.totalSpent} /> },
    { key: "enabled", label: "enabled", cell: (c, { t }) => badge(c.enabled, t("active"), t("disabled")) },
  ],
  fields: [],
  emptyForm: () => ({}),
  toForm: () => ({}),
});

export const resourceRegistry: Record<ResourceKey, AnyResourceConfig> = { orders, products, categories, colors, sizes, customers };
export const resourceOrder: ResourceKey[] = ["orders", "products", "customers", "categories", "colors", "sizes"];
