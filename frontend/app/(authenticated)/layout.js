'use client';

import { useEffect, useState } from 'react';
import RequireAuth from '@/components/auth/require-auth';
import Sidebar from '@/components/layout/sidebar';
import Header from '@/components/layout/header';
import { CombinedProviders } from '@/contexts/CombinedProviders';
import WatermarkRenderer from '@/components/common/watermark/watermark-renderer';
import { cn } from '@/lib/utils';

export default function AuthenticatedLayout({ children }) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

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
              className="fixed inset-0 z-40 bg-slate-950/25 md:hidden"
              onClick={() => setMobileNavOpen(false)}
            />
          )}
          <aside
            className={cn(
              'fixed inset-y-0 left-0 z-50 w-60 flex-shrink-0 transform transition-transform md:static md:translate-x-0',
              mobileNavOpen ? 'translate-x-0' : '-translate-x-full'
            )}
          >
            <Sidebar onNavigate={() => setMobileNavOpen(false)} />
          </aside>

          <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
            <Header onMenuClick={() => setMobileNavOpen(true)} />
            <main className="flex-1 overflow-y-auto bg-background p-4 md:p-5">
              {children}
            </main>
          </div>
        </div>
        <WatermarkRenderer />
      </CombinedProviders>
    </RequireAuth>
  );
}
