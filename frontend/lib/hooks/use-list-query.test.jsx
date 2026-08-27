import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useListQuery } from './use-list-query';

describe('useListQuery', () => {
  it('keeps draft filters separate until search is submitted', () => {
    const { result } = renderHook(() => useListQuery({ initialFilters: { name: '' } }));

    act(() => result.current.setDraftFilters({ name: 'Alice' }));
    expect(result.current.appliedFilters).toEqual({ name: '' });

    act(() => result.current.submit());
    expect(result.current.appliedFilters).toEqual({ name: 'Alice' });
    expect(result.current.pagination.page).toBe(1);
  });

  it('resets filters and pagination atomically', () => {
    const { result } = renderHook(() => useListQuery({
      initialFilters: { status: '' },
      initialPageSize: 20,
    }));

    act(() => {
      result.current.setDraftFilters({ status: 'active' });
      result.current.setPage(3);
    });
    act(() => result.current.submit());
    act(() => result.current.reset());

    expect(result.current.draftFilters).toEqual({ status: '' });
    expect(result.current.appliedFilters).toEqual({ status: '' });
    expect(result.current.pagination).toMatchObject({ page: 1, pageSize: 20 });
  });

  it('advances the query version for every explicit submit', () => {
    const { result } = renderHook(() => useListQuery({ initialFilters: { name: '' } }));

    const initialVersion = result.current.queryVersion;
    act(() => result.current.submit());
    const firstVersion = result.current.queryVersion;
    act(() => result.current.submit());

    expect(firstVersion).toBe(initialVersion + 1);
    expect(result.current.queryVersion).toBe(firstVersion + 1);
  });
});
