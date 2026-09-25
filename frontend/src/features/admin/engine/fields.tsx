"use client";

import { Plus, Trash2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Controller, useFieldArray } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Switch, Textarea } from "@/components/ui/form-controls";
import { cn } from "@/lib/utils";
import { useRelationOptions } from "./lookup-context";
import { errorAt, requiredRule, toNumberOrNull, useFieldLabels, type FieldProps } from "./field-utils";
import { ImageField, ImagesField } from "./media-fields";
import type { FieldType } from "./types";

export { errorAt, type FieldProps };

// --- Scalar controls -------------------------------------------------------------------------------

function TextField({ field, form }: FieldProps) {
  const { label, hint, requiredMsg } = useFieldLabels(field);
  return (
    <Field label={label} hint={hint} error={errorAt(form, field.name)} htmlFor={field.name}>
      <Input id={field.name} dir={field.dir} aria-invalid={!!errorAt(form, field.name)} {...form.register(field.name, requiredRule(field, requiredMsg))} />
    </Field>
  );
}

function TextareaField({ field, form }: FieldProps) {
  const { label, hint, requiredMsg } = useFieldLabels(field);
  return (
    <Field label={label} hint={hint} error={errorAt(form, field.name)} htmlFor={field.name}>
      <Textarea id={field.name} dir={field.dir} {...form.register(field.name, requiredRule(field, requiredMsg))} />
    </Field>
  );
}

function NumberField({ field, form }: FieldProps) {
  const { label, hint, requiredMsg } = useFieldLabels(field);
  const money = field.type === "money";
  return (
    <Field label={label} hint={hint} error={errorAt(form, field.name)} htmlFor={field.name}>
      <Input
        id={field.name}
        type="number"
        dir="ltr"
        step={money ? "0.01" : "1"}
        min={0}
        aria-invalid={!!errorAt(form, field.name)}
        {...form.register(field.name, { ...requiredRule(field, requiredMsg), setValueAs: toNumberOrNull })}
      />
    </Field>
  );
}

function SwitchField({ field, form }: FieldProps) {
  const { label } = useFieldLabels(field);
  return (
    <Controller
      control={form.control}
      name={field.name}
      render={({ field: f }) => <Switch id={field.name} checked={!!f.value} onChange={f.onChange} label={label} />}
    />
  );
}

function ColorField({ field, form }: FieldProps) {
  const { label, hint, requiredMsg } = useFieldLabels(field);
  return (
    <Controller
      control={form.control}
      name={field.name}
      rules={requiredRule(field, requiredMsg)}
      render={({ field: f }) => (
        <Field label={label} hint={hint} error={errorAt(form, field.name)} htmlFor={field.name}>
          <div className="flex gap-2">
            <input
              type="color"
              aria-label={label}
              value={/^#[0-9a-f]{6}$/i.test(f.value ?? "") ? f.value : "#000000"}
              onChange={(e) => f.onChange(e.target.value.toUpperCase())}
              className="h-11 w-14 cursor-pointer rounded-xl border border-border bg-surface p-1"
            />
            <Input id={field.name} dir="ltr" value={f.value ?? ""} onChange={(e) => f.onChange(e.target.value)} placeholder="#A0522D" />
          </div>
        </Field>
      )}
    />
  );
}

function LocalizedField({ field, form }: FieldProps) {
  const { label, hint, requiredMsg } = useFieldLabels(field);
  const t = useTranslations("admin");
  const Control = field.type === "localizedTextarea" ? Textarea : Input;
  return (
    <Field label={label} hint={hint}>
      <div className="grid gap-2 sm:grid-cols-2">
        {(["ar", "en"] as const).map((lang) => {
          const path = `${field.name}.${lang}`;
          const error = errorAt(form, path);
          return (
            <div key={lang} className="space-y-1">
              <div className="relative">
                <span className="pointer-events-none absolute end-3 top-2.5 rounded bg-surface-2 px-1.5 text-[10px] font-semibold text-muted">
                  {lang === "ar" ? t("arabic") : t("english")}
                </span>
                <Control dir={lang === "ar" ? "rtl" : "ltr"} aria-invalid={!!error} className="pe-16" {...form.register(path, requiredRule(field, requiredMsg))} />
              </div>
              {error && <p className="text-xs text-danger">{error}</p>}
            </div>
          );
        })}
      </div>
    </Field>
  );
}

function RelationField({ field, form }: FieldProps) {
  const { label, hint, requiredMsg } = useFieldLabels(field);
  const t = useTranslations("admin.fields");
  const locale = useLocale();
  const options = useRelationOptions(field.relation!, locale);
  return (
    <Field label={label} hint={hint} error={errorAt(form, field.name)} htmlFor={field.name}>
      <Select
        id={field.name}
        aria-invalid={!!errorAt(form, field.name)}
        {...form.register(field.name, { ...requiredRule(field, requiredMsg), setValueAs: toNumberOrNull })}
      >
        <option value="">{t("none")}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </Select>
    </Field>
  );
}

// --- Collection editors ----------------------------------------------------------------------------

function VariantsField({ field, form }: FieldProps) {
  const { label, requiredMsg } = useFieldLabels(field);
  const t = useTranslations("admin");
  const tf = useTranslations("admin.fields");
  const locale = useLocale();
  const colors = useRelationOptions("colors", locale);
  const sizes = useRelationOptions("sizes", locale);
  const { fields, append, remove } = useFieldArray({ control: form.control, name: field.name });
  // Table-like row from md up; on phones each variant is a card with labelled inputs in two columns.
  const row = "grid grid-cols-2 gap-2 md:grid-cols-[1fr_1fr_1.2fr_7rem_6rem_2.5rem] md:items-center";
  const cellLabel = "mb-1 block text-xs text-muted md:sr-only";

  return (
    <Field label={label}>
      <div className="space-y-2 md:space-y-0 md:overflow-hidden md:rounded-2xl md:border md:border-border">
        <div className={cn(row, "hidden bg-surface-2 px-2 py-2 text-xs font-medium text-muted md:grid")}>
          {["color", "size", "sku", "price", "stock"].map((h) => (
            <span key={h}>{tf(h)}</span>
          ))}
          <span />
        </div>
        {fields.map((item, i) => {
          const p = `${field.name}.${i}`;
          return (
            <div key={item.id} className={cn(row, "rounded-2xl border border-border p-3 md:rounded-none md:border-0 md:border-t md:px-2 md:py-1.5")}>
              <label>
                <span className={cellLabel}>{tf("color")}</span>
                <Select className="h-10 md:h-9" aria-invalid={!!errorAt(form, `${p}.colorId`)} {...form.register(`${p}.colorId`, { required: requiredMsg, setValueAs: toNumberOrNull })}>
                  <option value="" />
                  {colors.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                </Select>
              </label>
              <label>
                <span className={cellLabel}>{tf("size")}</span>
                <Select className="h-10 md:h-9" aria-invalid={!!errorAt(form, `${p}.sizeId`)} {...form.register(`${p}.sizeId`, { required: requiredMsg, setValueAs: toNumberOrNull })}>
                  <option value="" />
                  {sizes.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                </Select>
              </label>
              <label className="col-span-2 md:col-span-1">
                <span className={cellLabel}>{tf("sku")}</span>
                <Input className="h-10 md:h-9" dir="ltr" placeholder="auto" {...form.register(`${p}.sku`)} />
              </label>
              <label>
                <span className={cellLabel}>{tf("price")}</span>
                <Input className="h-10 md:h-9" type="number" inputMode="decimal" step="0.01" min={0} dir="ltr" {...form.register(`${p}.price`, { setValueAs: toNumberOrNull })} />
              </label>
              <label>
                <span className={cellLabel}>{tf("stock")}</span>
                <Input className="h-10 md:h-9" type="number" inputMode="numeric" min={0} dir="ltr" aria-invalid={!!errorAt(form, `${p}.stock`)} {...form.register(`${p}.stock`, { setValueAs: (v) => toNumberOrNull(v) ?? 0 })} />
              </label>
              <button
                type="button"
                className="col-span-2 flex h-10 items-center justify-center gap-2 rounded-xl text-sm text-muted hover:bg-danger/10 hover:text-danger md:col-span-1 md:size-10 md:rounded-full"
                onClick={() => remove(i)}
                aria-label={t("delete")}
              >
                <Trash2 className="size-4" /> <span className="md:sr-only">{t("delete")}</span>
              </button>
            </div>
          );
        })}
      </div>
      <Button type="button" variant="outline" size="sm" className="mt-2 w-full sm:w-auto sm:self-start" onClick={() => append({ colorId: null, sizeId: null, sku: "", price: null, stock: 0 })}>
        <Plus className="size-4" /> {t("addRow")}
      </Button>
    </Field>
  );
}

/** Field registry: a new field type = one component + one entry here. */
export const FIELD_COMPONENTS: Record<FieldType, (props: FieldProps) => React.ReactNode> = {
  text: TextField,
  textarea: TextareaField,
  number: NumberField,
  money: NumberField,
  switch: SwitchField,
  color: ColorField,
  localized: LocalizedField,
  localizedTextarea: LocalizedField,
  relation: RelationField,
  image: ImageField,
  images: ImagesField,
  variants: VariantsField,
};

export function FormField(props: FieldProps) {
  const Component = FIELD_COMPONENTS[props.field.type];
  const wide = props.field.wide || ["localized", "localizedTextarea", "image", "images", "variants"].includes(props.field.type);
  return (
    <div className={cn(wide && "sm:col-span-2", props.field.type === "switch" && "self-end pb-2")}>
      <Component {...props} />
    </div>
  );
}
