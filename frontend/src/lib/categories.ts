// CAT-09 / CAT-11: árbol de categorías para selectores y listados.
import type { CategoryOut } from "../api/catalogs";

/**
 * Ordena una lista plana (ya filtrada) como árbol: cada raíz seguida de sus
 * subcategorías, respetando el orden manual que trae el API (CAT-09). Una
 * subcategoría cuyo padre no está en la lista (p. ej. padre inactivo) se
 * trata como raíz para no perderla del selector.
 */
export function orderCategoryTree(list: CategoryOut[]): CategoryOut[] {
  const ids = new Set(list.map((c) => c.id));
  const childrenOf = new Map<string, CategoryOut[]>();
  const roots: CategoryOut[] = [];
  for (const c of list) {
    if (c.parent_id && ids.has(c.parent_id)) {
      const siblings = childrenOf.get(c.parent_id) ?? [];
      siblings.push(c);
      childrenOf.set(c.parent_id, siblings);
    } else {
      roots.push(c);
    }
  }
  return roots.flatMap((root) => [root, ...(childrenOf.get(root.id) ?? [])]);
}

/** Etiqueta de `<option>`: las subcategorías van con sangría (CAT-11). */
export function categoryOptionLabel(c: CategoryOut): string {
  return c.parent_id ? `   ↳ ${c.name}` : c.name;
}
