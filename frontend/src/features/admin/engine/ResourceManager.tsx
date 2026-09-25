"use client";

import { Eye, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm, type FieldValues } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/form-controls";
import { Dialog } from "@/components/ui/dialog";
import { ApiError } from "@/lib/api/errors";
import { FormField } from "./fields";
import { LookupContext, type LookupValue } from "./lookup-context";
import type { AnyResourceConfig, CellContext, ResourceKey, Row } from "./types";
import { useResourceList, useResourceMutations, useResourceOptions } from "./use-resource";

function useDebounced<T>(value: T, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

/** Loads every resource the current one depends on, so relation fields and lookup cells resolve. */
function useLookupRows(config: AnyResourceConfig, registry: Record<ResourceKey, AnyResourceConfig>) {
  const needed = new Set<ResourceKey>(config.uses ?? []);
  config.fields.forEach((f) => {
    if (f.relation) needed.add(f.relation);
    if (f.type === "images") needed.add("colors");
    if (f.type === "variants") (["colors", "sizes"] as const).forEach((k) => needed.add(k));
  });
  // Fixed call order: one query per registry entry, enabled only when needed.
  const results = (Object.keys(registry) as ResourceKey[]).map((key) => ({
    key,
    // eslint-disable-next-line react-hooks/rules-of-hooks -- registry keys are static for the app lifetime
    query: useResourceOptions(registry[key], needed.has(key)),
  }));
  const rows: Partial<Record<ResourceKey, Row[]>> = {};
  results.forEach(({ key, query }) => {
    if (query.data) rows[key] = query.data;
  });
  return rows;
}

export function ResourceManager({
  resource,
  registry,
}: {
  resource: ResourceKey;
  registry: Record<ResourceKey, AnyResourceConfig>;
}) {
  const config = registry[resource];
  const t = useTranslations("admin");
  const te = useTranslations("errors");
  const tAll = useTranslations();
  const locale = useLocale();

  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const q = useDebounced(search.trim());
  const [editing, setEditing] = useState<Row | "new" | null>(null);
  const [deleting, setDeleting] = useState<Row | null>(null);
  const [viewing, setViewing] = useState<Row | null>(null);
  const [filters, setFilters] = useState<Record<string, string>>({});
  const can = { create: true, edit: true, delete: true, ...config.actions };
  const Detail = config.Detail;

  const list = useResourceList(config, page, q, filters);
  const { save, remove } = useResourceMutations(config);
  const rows = useLookupRows(config, registry);
  const lookups: LookupValue = useMemo(() => ({ registry, rows }), [registry, rows]);

  const ctx: CellContext = {
    locale,
    t: (key, values) => t(key, values),
    lookup: (res, id) => (id == null ? undefined : rows[res]?.find((r) => r.id === id)),
  };

  const title = t(`resources.${resource}`);
  const singular = t(`singular.${resource}`);
  const Icon = config.icon;

  return (
    <LookupContext.Provider value={lookups}>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-3">
            <span className="grid size-11 place-items-center rounded-2xl bg-accent-soft text-primary">
              <Icon className="size-5" />
            </span>
            <div>
              <h1 className="text-2xl font-semibold">{title}</h1>
              {list.data && <p className="text-sm text-muted">{t("total", { count: list.data.totalElements })}</p>}
            </div>
          </div>
          <div className="flex w-full flex-wrap gap-2 sm:w-auto">
            {config.filters?.map((f) => (
              <Select
                key={f.param}
                className="h-11 w-full rounded-full sm:w-auto"
                value={filters[f.param] ?? ""}
                onChange={(e) => {
                  setFilters((prev) => ({ ...prev, [f.param]: e.target.value }));
                  setPage(0);
                }}
              >
                <option value="">{t(f.allLabel)}</option>
                {f.options.map((o) => (
                  <option key={o.value} value={o.value}>{tAll(o.labelKey)}</option>
                ))}
              </Select>
            ))}
            <label className="flex h-11 w-full items-center gap-2 rounded-full border border-border bg-surface px-4 text-sm focus-within:border-accent sm:w-auto">
              <Search className="size-4 text-muted" />
              <input value={search} onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(0);
                }} placeholder={t("search")} className="w-full bg-transparent outline-none sm:w-56" />
            </label>
            {can.create && (
              <Button className="w-full sm:w-auto" onClick={() => setEditing("new")}>
                <Plus className="size-4" /> {t("add")}
              </Button>
            )}
          </div>
        </div>

        <div className="overflow-hidden rounded-3xl border border-border bg-surface">
          {/* Phones: one card per row, label/value pairs from the same column definitions. */}
          <ul className={`divide-y divide-border md:hidden ${list.isFetching ? "opacity-60" : ""}`}>
            {list.isLoading && Array.from({ length: 4 }).map((_, i) => (
              <li key={i} className="p-4"><div className="h-16 animate-pulse rounded-xl bg-surface-2" /></li>
            ))}
            {list.data?.content.length === 0 && <li className="px-4 py-12 text-center text-muted">{t("empty")}</li>}
            {list.data?.content.map((row) => {
              const [first, ...rest] = config.columns;
              return (
                <li key={row.id} className="p-4">
                  <div className="flex items-start gap-3">
                    <button
                      type="button"
                      disabled={!Detail && !can.edit}
                      onClick={() => (Detail ? setViewing(row) : setEditing(row))}
                      className="min-w-0 flex-1 text-start"
                    >
                      {first.cell(row, ctx)}
                    </button>
                    <div className="-me-2 -mt-1 flex shrink-0">
                      {can.edit && (
                        <button type="button" onClick={() => setEditing(row)} className="grid size-10 place-items-center rounded-full text-muted hover:bg-surface-2 hover:text-fg" aria-label={t("edit")}>
                          <Pencil className="size-4" />
                        </button>
                      )}
                      {can.delete && (
                        <button type="button" onClick={() => setDeleting(row)} className="grid size-10 place-items-center rounded-full text-muted hover:bg-surface-2 hover:text-danger" aria-label={t("delete")}>
                          <Trash2 className="size-4" />
                        </button>
                      )}
                      {Detail && (
                        <button type="button" onClick={() => setViewing(row)} className="grid size-10 place-items-center rounded-full text-muted hover:bg-surface-2 hover:text-fg" aria-label={t("view")}>
                          <Eye className="size-4" />
                        </button>
                      )}
                    </div>
                  </div>
                  {rest.length > 0 && (
                    <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                      {rest.map((c) => (
                        <div key={c.key} className="min-w-0">
                          <dt className="text-xs text-muted">{t(`fields.${c.label}`)}</dt>
                          <dd className="truncate">{c.cell(row, ctx)}</dd>
                        </div>
                      ))}
                    </dl>
                  )}
                </li>
              );
            })}
          </ul>

          <div className="hidden overflow-x-auto md:block">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-surface-2 text-xs uppercase tracking-wide text-muted">
                <tr>
                  {config.columns.map((c) => (
                    <th key={c.key} className={`px-4 py-3 text-start font-medium ${c.className ?? ""}`}>{t(`fields.${c.label}`)}</th>
                  ))}
                  <th className="w-28 px-4 py-3 text-end font-medium">{t("actions")}</th>
                </tr>
              </thead>
              <tbody className={list.isFetching ? "opacity-60 transition-opacity" : "transition-opacity"}>
                {list.isLoading &&
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-b border-border last:border-0">
                      <td colSpan={config.columns.length + 1} className="px-4 py-4">
                        <div className="h-5 animate-pulse rounded bg-surface-2" />
                      </td>
                    </tr>
                  ))}
                {list.data?.content.length === 0 && (
                  <tr>
                    <td colSpan={config.columns.length + 1} className="px-4 py-14 text-center text-muted">{t("empty")}</td>
                  </tr>
                )}
                {list.data?.content.map((row) => (
                  <tr
                    key={row.id}
                    onClick={Detail ? () => setViewing(row) : undefined}
                    className={`border-b border-border transition last:border-0 hover:bg-surface-2/60 ${Detail ? "cursor-pointer" : ""}`}
                  >
                    {config.columns.map((c) => (
                      <td key={c.key} className={`px-4 py-3 align-middle ${c.className ?? ""}`}>{c.cell(row, ctx)}</td>
                    ))}
                    <td className="px-4 py-3 text-end">
                      <div className="inline-flex gap-1" onClick={(e) => e.stopPropagation()}>
                        {Detail && (
                          <button type="button" onClick={() => setViewing(row)} className="grid size-9 place-items-center rounded-full text-muted hover:bg-surface-2 hover:text-fg" aria-label={t("view")}>
                            <Eye className="size-4" />
                          </button>
                        )}
                        {can.edit && <button type="button" onClick={() => setEditing(row)} className="grid size-9 place-items-center rounded-full text-muted hover:bg-surface-2 hover:text-fg" aria-label={t("edit")}>
                          <Pencil className="size-4" />
                        </button>}
                        {can.delete && <button type="button" onClick={() => setDeleting(row)} className="grid size-9 place-items-center rounded-full text-muted hover:bg-surface-2 hover:text-danger" aria-label={t("delete")}>
                          <Trash2 className="size-4" />
                        </button>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {list.data && list.data.totalPages > 1 && (
            <div className="flex items-center justify-between gap-2 border-t border-border px-3 py-3 text-sm sm:px-4">
              <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>{t("prev")}</Button>
              <span className="text-muted">{page + 1} / {list.data.totalPages}</span>
              <Button variant="outline" size="sm" disabled={page + 1 >= list.data.totalPages} onClick={() => setPage((p) => p + 1)}>{t("next")}</Button>
            </div>
          )}
        </div>
      </div>

      {Detail && viewing && <Detail row={viewing} onClose={() => setViewing(null)} />}

      {editing && (
        <ResourceFormDialog
          config={config}
          row={editing === "new" ? null : editing}
          title={`${editing === "new" ? t("add") : t("edit")} ${singular}`}
          onClose={() => setEditing(null)}
          onSubmit={async (body) => {
            await save.mutateAsync({ id: editing === "new" ? undefined : editing.id, body });
            toast.success(t("saved"));
            setEditing(null);
          }}
        />
      )}

      <Dialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        title={`${t("delete")} ${singular}`}
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeleting(null)}>{t("cancel")}</Button>
            <Button
              variant="danger"
              loading={remove.isPending}
              onClick={async () => {
                if (!deleting) return;
                try {
                  await remove.mutateAsync(deleting.id);
                  toast.success(t("deleted"));
                  setDeleting(null);
                } catch (e) {
                  const code = e instanceof ApiError ? e.code : "generic";
                  toast.error(te.has(code) ? te(code) : te("generic"));
                }
              }}
            >
              {t("delete")}
            </Button>
          </>
        }
      >
        <p className="text-muted">{t("confirmDelete")}</p>
      </Dialog>
    </LookupContext.Provider>
  );
}

function ResourceFormDialog({
  config,
  row,
  title,
  onClose,
  onSubmit,
}: {
  config: AnyResourceConfig;
  row: Row | null;
  title: string;
  onClose: () => void;
  onSubmit: (body: unknown) => Promise<void>;
}) {
  const t = useTranslations("admin");
  const te = useTranslations("errors");
  const form = useForm<FieldValues>({ defaultValues: row ? config.toForm(row) : config.emptyForm() });
  const close = useCallback(() => !form.formState.isSubmitting && onClose(), [form.formState.isSubmitting, onClose]);

  const submit = form.handleSubmit(async (values) => {
    try {
      await onSubmit(config.toRequest ? config.toRequest(values) : values);
    } catch (e) {
      if (e instanceof ApiError) {
        // Server-side validation lands on the exact field, including rows inside collections.
        e.fieldPaths().forEach(([path, message]) => form.setError(path, { message }));
        toast.error(te.has(e.code) ? te(e.code) : e.message);
      } else {
        toast.error(te("generic"));
      }
    }
  });

  return (
    <Dialog
      open
      onClose={close}
      title={title}
      size={config.dialogSize ?? "md"}
      footer={
        <>
          <Button variant="ghost" onClick={close}>{t("cancel")}</Button>
          <Button onClick={submit} loading={form.formState.isSubmitting}>{t("save")}</Button>
        </>
      }
    >
      <form onSubmit={submit} className="grid gap-5 sm:grid-cols-2" noValidate>
        {config.fields.map((field) => (
          <FormField key={field.name} field={field} form={form} />
        ))}
        <button type="submit" className="hidden" />
      </form>
    </Dialog>
  );
}
