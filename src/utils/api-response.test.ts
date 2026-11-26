import { describe, expect, it } from 'vitest';
import {
  extractApiErrorMessage,
  formatUserName,
  normalizeUserFields,
  unwrapEntity,
  unwrapPaginatedList,
} from './api-response';

describe('unwrapEntity', () => {
  it('returns null for empty payloads', () => {
    expect(unwrapEntity(null)).toBeNull();
    expect(unwrapEntity('user')).toBeNull();
  });

  it('returns a flat entity', () => {
    expect(unwrapEntity({ id: 4, name: 'Ada' })).toEqual({ id: 4, name: 'Ada' });
  });

  it('unwraps nested Laravel envelopes until the entity with an id', () => {
    const entity = { id: 4, name: 'Ada' };
    expect(unwrapEntity({ data: { data: entity } })).toEqual(entity);
  });

  it('stops when a nested data object is not itself an entity', () => {
    const entity = { id: 4, data: { label: 'profile' } };
    expect(unwrapEntity(entity)).toEqual(entity);
  });
});

describe('unwrapPaginatedList', () => {
  it('returns an empty list for non-objects', () => {
    expect(unwrapPaginatedList(null)).toEqual({ items: [], meta: {} });
  });

  it('reads a top-level data array and pagination meta', () => {
    const result = unwrapPaginatedList<{ id: number }>({
      data: [{ id: 1 }],
      current_page: 2,
      last_page: 5,
      total: 40,
    });

    expect(result.items).toEqual([{ id: 1 }]);
    expect(result.meta).toMatchObject({ current_page: 2, last_page: 5, total: 40 });
  });

  it('reads a double-wrapped list', () => {
    const result = unwrapPaginatedList<{ id: number }>({
      data: { data: [{ id: 9 }], last_page: 3 },
    });

    expect(result.items).toEqual([{ id: 9 }]);
    expect(result.meta.last_page).toBe(3);
  });
});

describe('formatUserName', () => {
  it('prefers first and last name', () => {
    expect(formatUserName({ name: 'Stored', firstname: 'Ada', lastname: 'Lovelace' })).toBe(
      'Ada Lovelace'
    );
  });

  it('falls back to the combined name, then a dash', () => {
    expect(formatUserName({ name: 'Ada Lovelace' })).toBe('Ada Lovelace');
    expect(formatUserName({})).toBe('-');
  });
});

describe('normalizeUserFields', () => {
  it('splits a combined name when first and last are missing', () => {
    expect(normalizeUserFields({ id: 1, name: 'Ada Lovelace' })).toEqual({
      id: 1,
      name: 'Ada Lovelace',
      firstname: 'Ada',
      lastname: 'Lovelace',
    });
  });

  it('keeps names the API already split', () => {
    expect(normalizeUserFields({ name: 'Other', firstname: 'Grace', lastname: 'Hopper' })).toMatchObject({
      firstname: 'Grace',
      lastname: 'Hopper',
    });
  });
});

describe('extractApiErrorMessage', () => {
  it('returns a fallback for non-objects', () => {
    expect(extractApiErrorMessage(null)).toBe('Request failed');
  });

  it('joins field errors from an array payload', () => {
    const message = extractApiErrorMessage({
      response: {
        data: {
          message: 'Validation failed',
          errors: [{ field: 'email', message: 'taken' }, 'name is required'],
        },
      },
    });

    expect(message).toBe('Validation failed (email: taken; name is required)');
  });

  it('joins Laravel field error maps', () => {
    const message = extractApiErrorMessage({
      response: {
        data: {
          message: 'The given data was invalid.',
          errors: { email: ['taken'], name: 'required' },
        },
      },
    });

    expect(message).toBe('The given data was invalid. (email: taken; name: required)');
  });

  it('uses a plain message, then the error message', () => {
    expect(extractApiErrorMessage({ response: { data: { message: 'Nope' } } })).toBe('Nope');
    expect(extractApiErrorMessage({ message: 'Network Error' })).toBe('Network Error');
  });
});
