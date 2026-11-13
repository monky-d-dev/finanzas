// Catálogos (CAT-01..08).
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AccountBehavior } from "./accounts";
import { api } from "./client";

export interface CategoryOut {
  id: string;
  name: string;
  kind: "expense" | "income";
  expense_nature: "fixed" | "variable" | "discretionary" | null;
  parent_id: string | null;
  sort_order: number;
  icon: string | null;
  color: string | null;
  is_active: boolean;
}

export interface AccountTypeOut {
  id: string;
  name: string;
  behavior: AccountBehavior;
  icon: string | null;
  color: string | null;
  is_system: boolean;
  is_active: boolean;
}

export function useCategories(includeInactive = false) {
  return useQuery({
    queryKey: ["categories", includeInactive],
    queryFn: () =>
      api<CategoryOut[]>(
        `/api/v1/catalogs/categories?include_inactive=${includeInactive}`,
      ),
  });
}

export function useAccountTypes(includeInactive = false) {
  return useQuery({
    queryKey: ["account-types", includeInactive],
    queryFn: () =>
      api<AccountTypeOut[]>(`/api/v1/catalogs/account-types?include_inactive=${includeInactive}`),
  });
}

export function useCreateAccountType() {
  const invalidate = useInvalidate(["account-types"]);
  return useMutation({
    mutationFn: (body: { name: string; behavior: AccountBehavior }) =>
      api<AccountTypeOut>("/api/v1/catalogs/account-types", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    onSuccess: invalidate,
  });
}

function useInvalidate(keys: string[]) {
  const qc = useQueryClient();
  return () => keys.forEach((k) => void qc.invalidateQueries({ queryKey: [k] }));
}

export function useCreateCategory() {
  const invalidate = useInvalidate(["categories"]);
  return useMutation({
    mutationFn: (body: {
      name: string;
      kind: "expense" | "income";
      expense_nature?: string | null;
      parent_id?: string | null;
    }) =>
      api<CategoryOut>("/api/v1/catalogs/categories", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    onSuccess: invalidate,
  });
}

export function useUpdateCategory() {
  const invalidate = useInvalidate(["categories"]);
  return useMutation({
    mutationFn: ({
      id,
      ...body
    }: {
      id: string;
      name?: string;
      expense_nature?: string | null;
      // CAT-10: UUID = volverla subcategoría, null = volverla raíz.
      parent_id?: string | null;
      is_active?: boolean;
    }) =>
      api<CategoryOut>(`/api/v1/catalogs/categories/${id}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      }),
    onSuccess: invalidate,
  });
}

export function useDeleteCategory() {
  const invalidate = useInvalidate(["categories"]);
  return useMutation({
    mutationFn: (id: string) =>
      api<void>(`/api/v1/catalogs/categories/${id}`, { method: "DELETE" }),
    onSuccess: invalidate,
  });
}

// CAT-09: orden manual entre hermanas. El caché se actualiza al instante para
// que la fila no "rebote" mientras el servidor responde.
export function useReorderCategories() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) =>
      api<void>("/api/v1/catalogs/categories/order", {
        method: "PUT",
        body: JSON.stringify({ ids }),
      }),
    onMutate: (ids) => {
      const position = new Map(ids.map((id, i) => [id, i]));
      qc.setQueriesData<CategoryOut[]>({ queryKey: ["categories"] }, (old) =>
        old
          ?.map((c) => (position.has(c.id) ? { ...c, sort_order: position.get(c.id)! } : c))
          .sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name)),
      );
    },
    onSettled: () => void qc.invalidateQueries({ queryKey: ["categories"] }),
  });
}
