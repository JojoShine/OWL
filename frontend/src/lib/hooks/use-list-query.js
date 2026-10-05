
import { useCallback, useRef, useState } from 'react';

export function useListQuery({ initialFilters = {}, initialPageSize = 10 } = {}) {
  const initialFiltersRef = useRef(initialFilters);
  const [draftFilters, setDraftFilters] = useState(initialFiltersRef.current);
  const [appliedFilters, setAppliedFilters] = useState(initialFiltersRef.current);
  const [pagination, setPagination] = useState({ page: 1, pageSize: initialPageSize, total: 0 });
  const [queryVersion, setQueryVersion] = useState(0);

  const submit = useCallback(() => {
    setAppliedFilters({ ...draftFilters });
    setPagination((previous) => ({ ...previous, page: 1 }));
    setQueryVersion((version) => version + 1);
  }, [draftFilters]);

  const reset = useCallback(() => {
    setDraftFilters({ ...initialFiltersRef.current });
    setAppliedFilters({ ...initialFiltersRef.current });
    setPagination((previous) => ({ ...previous, page: 1 }));
    setQueryVersion((version) => version + 1);
  }, []);

  const setPage = useCallback((page) => {
    setPagination((previous) => ({ ...previous, page }));
  }, []);

  const setPageSize = useCallback((pageSize) => {
    setPagination((previous) => ({ ...previous, page: 1, pageSize }));
  }, []);

  const setTotal = useCallback((total) => {
    setPagination((previous) => ({ ...previous, total }));
  }, []);

  return {
    draftFilters,
    setDraftFilters,
    appliedFilters,
    queryVersion,
    pagination,
    setPagination,
    submit,
    reset,
    setPage,
    setPageSize,
    setTotal,
  };
}
