import { getTableColumns, getTableName, sql, type SQL } from 'drizzle-orm';
import type { PgTable } from 'drizzle-orm/pg-core';

type ColumnKey<T extends PgTable> = keyof T['_']['columns'] & string;

/** Columns of `table` except `exclude`, as [propertyKey, columnName] pairs. */
function columnEntries<T extends PgTable>(table: T, exclude: readonly ColumnKey<T>[]) {
  const columns = getTableColumns(table) as Record<string, { name: string }>;
  return Object.entries(columns)
    .filter(([key]) => !exclude.includes(key as ColumnKey<T>))
    .map(([key, column]) => [key, column.name] as const);
}

/**
 * Builds the `set` clause for an upsert: every column takes the value from the
 * row that conflicted (`excluded.<column>`), except the ones listed in `exclude`.
 * Keeps upserts in sync with the schema automatically (no hand-written column lists).
 */
export function conflictUpdateSet<T extends PgTable>(
  table: T,
  exclude: readonly ColumnKey<T>[] = [],
): Partial<Record<ColumnKey<T>, SQL>> {
  return Object.fromEntries(
    columnEntries(table, exclude).map(([key, name]) => [key, sql.raw(`excluded."${name}"`)]),
  ) as Partial<Record<ColumnKey<T>, SQL>>;
}

/**
 * `WHERE` for an upsert: only update when at least one column actually changed.
 * Unchanged rows are left alone, so their `updated_at` stays meaningful.
 */
export function conflictChangedWhere<T extends PgTable>(
  table: T,
  exclude: readonly ColumnKey<T>[] = [],
): SQL {
  const names = columnEntries(table, exclude).map(([, name]) => `"${name}"`);
  const current = names.map((name) => `"${getTableName(table)}".${name}`);
  const incoming = names.map((name) => `excluded.${name}`);
  return sql.raw(`(${current.join(', ')}) IS DISTINCT FROM (${incoming.join(', ')})`);
}
