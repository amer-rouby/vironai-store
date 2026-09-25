"use client";

import { useTranslations } from "next-intl";
import type { FieldValues, UseFormReturn } from "react-hook-form";
import type { FieldDef } from "./types";

export interface FieldProps {
  field: FieldDef;
  form: UseFormReturn<FieldValues>;
}

/** Reads a nested error message ("variants.0.stock") out of react-hook-form's error tree. */
export function errorAt(form: UseFormReturn<FieldValues>, path: string): string | undefined {
  let node: unknown = form.formState.errors;
  for (const part of path.split(".")) node = (node as Record<string, unknown> | undefined)?.[part];
  return (node as { message?: string } | undefined)?.message || undefined;
}

export const toNumberOrNull = (v: unknown) =>
  v === "" || v === null || v === undefined || Number.isNaN(Number(v)) ? null : Number(v);

export const requiredRule = (field: FieldDef, message: string) => (field.required ? { required: message } : {});

export function useFieldLabels(field: FieldDef) {
  const t = useTranslations("admin.fields");
  const te = useTranslations("errors");
  return { label: t(field.label), hint: field.hint ? t(field.hint) : undefined, requiredMsg: te("required") };
}
