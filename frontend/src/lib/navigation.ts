import { useMemo, useRef } from 'react';
import { useLocation, useNavigate, useSearchParams as useRouterSearchParams } from 'react-router-dom';
export { useParams } from 'react-router-dom';

// Keep imperative navigation stable so auth initialization does not rerun on route changes.
export function useRouter() {
  const navigate = useNavigate();
  const navigateRef = useRef(navigate);
  navigateRef.current = navigate;
  return useMemo(() => ({
    push: (path: string) => navigateRef.current(path),
    replace: (path: string) => navigateRef.current(path, { replace: true }),
    back: () => navigateRef.current(-1),
  }), []);
}
export function usePathname() { return useLocation().pathname; }
export function useSearchParams() { return useRouterSearchParams()[0]; }
