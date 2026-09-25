"use client";

import Image from "next/image";
import { ArrowDown, ArrowUp, ImagePlus, Trash2, Upload } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useRef, useState } from "react";
import { useFieldArray, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/form-controls";
import { cn } from "@/lib/utils";
import { errorAt, toNumberOrNull, useFieldLabels, type FieldProps } from "./field-utils";
import { useRelationOptions } from "./lookup-context";
import { ACCEPTED_IMAGES, uploadImage } from "./upload";

/** Shows a thumbnail for anything the loader can render: http(s) CDN URLs and our own /media/ files. */
const isPreviewable = (url: string | undefined): url is string =>
  !!url && (/^https?:\/\//.test(url) || url.startsWith("/media/"));

/** Uploads files in parallel and reports each failure by its error code; returns the stored URLs. */
function useImageUploads() {
  const te = useTranslations("errors");
  const [pending, setPending] = useState(0);
  const upload = async (files: File[]) => {
    setPending((n) => n + files.length);
    const results = await Promise.allSettled(files.map(uploadImage));
    setPending((n) => n - files.length);
    const urls: string[] = [];
    results.forEach((r) => {
      if (r.status === "fulfilled") {
        urls.push(r.value);
      } else {
        const code = (r.reason as { code?: string })?.code ?? "generic";
        toast.error(te.has(code) ? te(code) : te("generic"));
      }
    });
    return urls;
  };
  return { upload, uploading: pending > 0 };
}

function UploadDropzone({
  onFiles,
  uploading,
  multiple,
}: {
  onFiles: (files: File[]) => void;
  uploading: boolean;
  multiple?: boolean;
}) {
  const t = useTranslations("admin");
  const input = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        const files = Array.from(e.dataTransfer.files);
        if (files.length) onFiles(multiple ? files : files.slice(0, 1));
      }}
      className={cn(
        "flex flex-wrap items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-4 text-sm transition",
        over ? "border-primary bg-accent-soft/50" : "border-border",
      )}
    >
      <input
        ref={input}
        type="file"
        accept={ACCEPTED_IMAGES}
        multiple={multiple}
        hidden
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          e.target.value = "";
          if (files.length) onFiles(files);
        }}
      />
      <Button type="button" variant="secondary" size="sm" loading={uploading} onClick={() => input.current?.click()}>
        {!uploading && <Upload className="size-4" />} {uploading ? t("uploading") : t("upload")}
      </Button>
      <span className="text-muted">{t("dropHere")}</span>
    </div>
  );
}

/** Ordered gallery: upload / drag-drop or paste URLs, tag a photo with a color, reorder, remove. */
export function ImagesField({ field, form }: FieldProps) {
  const { label, requiredMsg } = useFieldLabels(field);
  const t = useTranslations("admin");
  const locale = useLocale();
  const colors = useRelationOptions("colors", locale);
  const { fields, append, remove, move } = useFieldArray({ control: form.control, name: field.name });
  const values = useWatch({ control: form.control, name: field.name }) as { url: string }[] | undefined;
  const { upload, uploading } = useImageUploads();

  return (
    <Field label={label}>
      <div className="space-y-2">
        {fields.map((item, i) => {
          const url = values?.[i]?.url;
          const path = `${field.name}.${i}`;
          const urlError = errorAt(form, `${path}.url`);
          return (
            <div key={item.id} className="flex items-start gap-2 rounded-2xl border border-border p-2">
              <div className="relative size-14 shrink-0 overflow-hidden rounded-xl bg-surface-2">
                {isPreviewable(url) && <Image src={url} alt="" fill sizes="56px" className="object-cover" />}
              </div>
              <div className="grid flex-1 gap-2 sm:grid-cols-[1fr_10rem]">
                <Input dir="ltr" placeholder={t("imageUrl")} aria-invalid={!!urlError} {...form.register(`${path}.url`, { required: requiredMsg })} />
                <Select {...form.register(`${path}.colorId`, { setValueAs: toNumberOrNull })}>
                  <option value="">{t("anyColor")}</option>
                  {colors.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </Select>
              </div>
              <div className="flex flex-col">
                <button type="button" className="p-1 text-muted hover:text-fg disabled:opacity-30" disabled={i === 0} onClick={() => move(i, i - 1)} aria-label="up">
                  <ArrowUp className="size-4" />
                </button>
                <button type="button" className="p-1 text-muted hover:text-fg disabled:opacity-30" disabled={i === fields.length - 1} onClick={() => move(i, i + 1)} aria-label="down">
                  <ArrowDown className="size-4" />
                </button>
              </div>
              <button type="button" className="p-2 text-muted hover:text-danger" onClick={() => remove(i)} aria-label={t("delete")}>
                <Trash2 className="size-4" />
              </button>
            </div>
          );
        })}
        <UploadDropzone
          multiple
          uploading={uploading}
          onFiles={async (files) => (await upload(files)).forEach((url) => append({ url, colorId: null }))}
        />
        <Button type="button" variant="ghost" size="sm" onClick={() => append({ url: "", colorId: null })}>
          <ImagePlus className="size-4" /> {t("addImage")}
        </Button>
      </div>
    </Field>
  );
}

/** Single image (e.g. a category cover): upload or paste a URL, with preview. */
export function ImageField({ field, form }: FieldProps) {
  const { label, hint } = useFieldLabels(field);
  const t = useTranslations("admin");
  const { upload, uploading } = useImageUploads();
  const url = useWatch({ control: form.control, name: field.name }) as string | undefined;
  return (
    <Field label={label} hint={hint} error={errorAt(form, field.name)}>
      <div className="flex items-start gap-3">
        <div className="relative size-20 shrink-0 overflow-hidden rounded-2xl bg-surface-2">
          {isPreviewable(url) && <Image src={url} alt="" fill sizes="80px" className="object-cover" />}
        </div>
        <div className="flex-1 space-y-2">
          <Input dir="ltr" placeholder={t("imageUrl")} {...form.register(field.name)} />
          <UploadDropzone
            uploading={uploading}
            onFiles={async (files) => {
              const [uploaded] = await upload(files.slice(0, 1));
              if (uploaded) form.setValue(field.name, uploaded, { shouldDirty: true });
            }}
          />
        </div>
      </div>
    </Field>
  );
}
