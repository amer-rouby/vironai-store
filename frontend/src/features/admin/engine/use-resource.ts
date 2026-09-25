"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient, toQuery } from "@/lib/api/client";
import type { Page } from "@/lib/api/types";
import type { AnyResourceConfig, Row } from "./types";

const keys = {
  all: (resource: string) => ["admin", resource] as const,
  list: (resource: string, page: number, q: string) => ["admin", resource, "list", page, q] as const,
  options: (resource: string) => ["admin", resource, "options"] as const,
};

export function useResourceList(config: AnyResourceConfig, page: number, q: string, filters: Record<string, string> = {}) {
  return useQuery({
    queryKey: [...keys.list(config.key, page, q), filters],
    queryFn: () =>
      apiClient.get<Page<Row>>(`/admin/${config.endpoint}${toQuery({ page, size: 15, q, sort: config.sort, ...filters })}`),
    placeholderData: keepPreviousData,
  });
}

/** Whole (small) resource for dropdowns and lookups; shared cache across every screen that needs it. */
export function useResourceOptions(config: AnyResourceConfig, enabled = true) {
  return useQuery({
    queryKey: keys.options(config.key),
    queryFn: () => apiClient.get<Page<Row>>(`/admin/${config.endpoint}${toQuery({ size: 500, sort: config.sort })}`),
    select: (page) => page.content,
    staleTime: 60_000,
    enabled,
  });
}

export function useResourceMutations(config: AnyResourceConfig) {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: keys.all(config.key) });
  const base = `/admin/${config.endpoint}`;

  const save = useMutation({
    mutationFn: ({ id, body }: { id?: number; body: unknown }) =>
      id ? apiClient.put<Row>(`${base}/${id}`, body) : apiClient.post<Row>(base, body),
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: (id: number) => apiClient.delete(`${base}/${id}`),
    onSuccess: invalidate,
  });

  return { save, remove };
}
