import type { LucideIcon } from "lucide-react";
import type { ComponentType, ReactNode } from "react";

/** Every resource the admin engine can manage. Adding one = a config in ../resources + a key here. */
export type ResourceKey = "categories" | "colors" | "sizes" | "products" | "orders" | "customers";

export interface Row {
  id: number;
}

export type FieldType =
  | "text"
  | "number"
  | "money"
  | "textarea"
  | "switch"
  | "color"
  | "localized"
  | "localizedTextarea"
  | "relation"
  | "image"
  | "images"
  | "variants";

export interface FieldDef {
  /** Path in the form model (react-hook-form dot notation). */
  name: string;
  /** Translation key under admin.fields. */
  label: string;
  type: FieldType;
  required?: boolean;
  /** For "relation": which resource provides the options. */
  relation?: ResourceKey;
  /** Translation key under admin.fields shown under the control. */
  hint?: string;
  /** Full-width in the two-column form grid. */
  wide?: boolean;
  /** Text direction override (codes, URLs, hex values are always LTR). */
  dir?: "ltr" | "rtl";
}

export interface CellContext {
  locale: string;
  t: (key: string, values?: Record<string, string | number>) => string;
  /** Resolves a related row loaded for relation fields (e.g. a product's category). */
  lookup: (resource: ResourceKey, id: number | null | undefined) => Row | undefined;
}

export interface ColumnDef<T extends Row> {
  key: string;
  /** Translation key under admin.fields. */
  label: string;
  cell: (row: T, ctx: CellContext) => ReactNode;
  className?: string;
}

/** A dropdown above the table, sent to the list endpoint as ?<param>=<value>. */
export interface FilterDef {
  param: string;
  /** Translation key under admin for the "all" option. */
  allLabel: string;
  /** labelKey is a full message path, e.g. "orderStatus.PENDING". */
  options: { value: string; labelKey: string }[];
}

export interface ResourceActions {
  create?: boolean;
  edit?: boolean;
  delete?: boolean;
}

export interface ResourceConfig<T extends Row, F extends object> {
  key: ResourceKey;
  /** Path under /api/v1/admin. */
  endpoint: string;
  icon: LucideIcon;
  columns: ColumnDef<T>[];
  fields: FieldDef[];
  emptyForm: () => F;
  toForm: (row: T) => F;
  /** Form model -> request body. Defaults to sending the form model as-is. */
  toRequest?: (form: F) => unknown;
  /** Label used when this resource is offered as options in a relation field. */
  optionLabel: (row: T, locale: string) => string;
  /** Spring Data sort for the list and option lists, e.g. "sortOrder,asc". */
  sort?: string;
  /** Other resources whose rows the columns/fields need (preloaded as lookups). */
  uses?: ResourceKey[];
  dialogSize?: "md" | "lg" | "xl";
  /** Which built-in operations the screen offers. Defaults to all. */
  actions?: ResourceActions;
  filters?: FilterDef[];
  /** Custom read/act view opened from a row, for resources that are not edited through a form. */
  Detail?: ComponentType<{ row: T; onClose: () => void }>;
}

// The registry holds heterogeneous configs; each is fully typed where it is defined.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyResourceConfig = ResourceConfig<any, any>;

/** Identity helper that keeps full type inference inside each resource definition. */
export const defineResource = <T extends Row, F extends object>(config: ResourceConfig<T, F>) => config;
