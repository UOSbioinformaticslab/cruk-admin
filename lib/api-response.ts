import { PaginatedResponse } from './types';

/** Unwrap Laravel-style `{ data: entity }` envelopes (including double-wrapped). */
export function unwrapEntity<T extends { id?: unknown }>(payload: unknown): T | null {
  if (payload == null || typeof payload !== 'object') return null;

  let current = payload as Record<string, unknown>;

  for (let depth = 0; depth < 5; depth++) {
    const hasId = typeof current.id === 'number' || typeof current.id === 'string';

    if (hasId) {
      const nested = current.data;
      if (nested && typeof nested === 'object' && !Array.isArray(nested)) {
        const nestedRecord = nested as Record<string, unknown>;
        const nestedHasId =
          typeof nestedRecord.id === 'number' || typeof nestedRecord.id === 'string';
        if (nestedHasId) {
          current = nestedRecord;
          continue;
        }
      }
      return current as T;
    }

    const nested = current.data;
    if (nested && typeof nested === 'object' && !Array.isArray(nested)) {
      current = nested as Record<string, unknown>;
      continue;
    }

    break;
  }

  return null;
}

/** Unwrap paginated list responses (`{ data: [] }` or `{ data: { data: [] } }`). */
export function unwrapPaginatedList<T>(payload: unknown): {
  items: T[];
  meta: Partial<PaginatedResponse<T>>;
} {
  if (payload == null || typeof payload !== 'object') {
    return { items: [], meta: {} };
  }

  const record = payload as Record<string, unknown>;

  if (Array.isArray(record.data)) {
    return {
      items: record.data as T[],
      meta: pickPaginationMeta(record),
    };
  }

  const nested = record.data;
  if (nested && typeof nested === 'object' && !Array.isArray(nested)) {
    const inner = nested as Record<string, unknown>;
    if (Array.isArray(inner.data)) {
      return {
        items: inner.data as T[],
        meta: pickPaginationMeta(inner),
      };
    }
  }

  return { items: [], meta: {} };
}

function pickPaginationMeta(record: Record<string, unknown>): Partial<PaginatedResponse<unknown>> {
  return {
    current_page: record.current_page as number | undefined,
    last_page: record.last_page as number | undefined,
    per_page: record.per_page as number | undefined,
    total: record.total as number | undefined,
    from: record.from as number | undefined,
    to: record.to as number | undefined,
  };
}

export function formatUserName(user: {
  name?: string;
  firstname?: string;
  lastname?: string;
}): string {
  const fromParts = [user.firstname, user.lastname].filter(Boolean).join(' ').trim();
  return fromParts || user.name || '-';
}

/** Split `name` into first/last when API only returns a combined name field. */
export function normalizeUserFields(user: {
  name?: string;
  firstname?: string;
  lastname?: string;
  [key: string]: unknown;
}) {
  let firstname = user.firstname ?? '';
  let lastname = user.lastname ?? '';

  if (!firstname && !lastname && user.name) {
    const parts = user.name.trim().split(/\s+/);
    firstname = parts[0] ?? '';
    lastname = parts.slice(1).join(' ');
  }

  return { ...user, firstname, lastname };
}

/** Extract a readable message from API / axios errors. */
export function extractApiErrorMessage(error: unknown): string {
  if (!error || typeof error !== 'object') return 'Request failed';

  const axiosErr = error as {
    message?: string;
    response?: { data?: unknown; status?: number };
  };

  const data = axiosErr.response?.data;
  if (data && typeof data === 'object') {
    const record = data as Record<string, unknown>;
    if (typeof record.message === 'string' && record.message) {
      if (Array.isArray(record.errors)) {
        const parts = record.errors.map((err) => {
          if (err && typeof err === 'object') {
            const entry = err as Record<string, unknown>;
            const field = entry.field ? `${entry.field}: ` : '';
            return `${field}${entry.message ?? JSON.stringify(entry)}`;
          }
          return String(err);
        });
        if (parts.length > 0) {
          return `${record.message} (${parts.join('; ')})`;
        }
      }
      if (record.errors && typeof record.errors === 'object') {
        const fieldErrors = Object.entries(record.errors as Record<string, unknown>)
          .flatMap(([field, messages]) => {
            if (Array.isArray(messages)) {
              return messages.map((m) => `${field}: ${String(m)}`);
            }
            return [`${field}: ${String(messages)}`];
          });
        if (fieldErrors.length > 0) {
          return `${record.message} (${fieldErrors.join('; ')})`;
        }
      }
      return record.message;
    }
  }

  if (axiosErr.message) return axiosErr.message;
  return 'Request failed';
}
