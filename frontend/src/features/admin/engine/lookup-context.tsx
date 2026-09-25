"use client";

import { createContext, useContext } from "react";
import type { AnyResourceConfig, ResourceKey, Row } from "./types";

export interface LookupValue {
  registry: Record<ResourceKey, AnyResourceConfig>;
  rows: Partial<Record<ResourceKey, Row[]>>;
}

export const LookupContext = createContext<LookupValue | null>(null);

export function useLookups() {
  const ctx = useContext(LookupContext);
  if (!ctx) throw new Error("useLookups must be used inside <ResourceManager>");
  return ctx;
}

/** Options for a relation: [{ value, label }] built with the related resource's optionLabel. */
export function useRelationOptions(resource: ResourceKey, locale: string) {
  const { registry, rows } = useLookups();
  const config = registry[resource];
  return (rows[resource] ?? []).map((row) => ({ value: row.id, label: config.optionLabel(row, locale), row }));
}
