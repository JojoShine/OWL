
import { useEffect, useState } from 'react';
import RequireAuth from '@/components/auth/require-auth';
import Sidebar from '@/components/layout/sidebar';
import Header from '@/components/layout/header';
import PageBreadcrumbs from '@/components/layout/breadcrumbs';
import { CombinedProviders } from '@/contexts/CombinedProviders';
import WatermarkRenderer from '@/components/common/watermark/watermark-renderer';
import { cn } from '@/lib/utils';

export default function AuthenticatedLayout({ children }) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [desktopNavCollapsed, setDesktopNavCollapsed] = useState(false);
  const [isDesktop, setIsDesktop] = useState(() => window.matchMedia('(min-width: 768px)').matches);

  useEffect(() => {
    const query = window.matchMedia('(min-width: 768px)');
    const sync = () => {
      setIsDesktop(query.matches);
      if (query.matches) setMobileNavOpen(false);
    };
    sync();
    query.addEventListener('change', sync);
    return () => query.removeEventListener('change', sync);
  }, []);

  const navExpanded = isDesktop ? !desktopNavCollapsed : mobileNavOpen;

  useEffect(() => {
    if (!mobileNavOpen) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setMobileNavOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [mobileNavOpen]);

  return (
    <RequireAuth>
      <CombinedProviders>
        <div className="flex h-screen overflow-hidden">
          {mobileNavOpen && (
            <button
              type="button"
              aria-label="关闭导航菜单"
              className="fixed inset-0 z-40 bg-black/25 md:hidden"
              onClick={() => setMobileNavOpen(false)}
            />
          )}
          <aside
            id="app-sidebar"
            inert={!isDesktop && !mobileNavOpen}
            className={cn(
              'fixed inset-y-0 left-0 z-50 w-60 flex-shrink-0 overflow-hidden transform transition-[width,transform] duration-200 motion-reduce:transition-none md:static md:translate-x-0',
              mobileNavOpen ? 'visible translate-x-0' : 'invisible -translate-x-full',
              desktopNavCollapsed ? 'md:w-16 md:visible' : 'md:w-60 md:visible'
            )}
          >
            <Sidebar collapsed={isDesktop && desktopNavCollapsed} onNavigate={() => setMobileNavOpen(false)} />
          </aside>

          <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
            <Header isDesktop={isDesktop} navExpanded={navExpanded} onMenuClick={() => {
              if (isDesktop) setDesktopNavCollapsed((collapsed) => !collapsed);
              else setMobileNavOpen((open) => !open);
            }} />
            <main className="min-h-0 flex-1 overflow-y-auto bg-background p-4 md:p-5 lg:px-4">
              <PageBreadcrumbs />
              {children}
            </main>
          </div>
        </div>
        <WatermarkRenderer />
      </CombinedProviders>
    </RequireAuth>
  );
}
