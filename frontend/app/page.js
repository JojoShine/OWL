'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/utils/auth';
import { Loading } from '@/components/ui/loading';

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      // 如果已登录，跳转到dashboard
      if (isAuthenticated()) {
        router.push('/dashboard');
      } else {
        // 未登录，跳转到登录页
        router.push('/login');
      }
    }
  }, [isAuthenticated, isLoading, router]);

  // 显示加载状态
  return (
    <main className="flex min-h-dvh items-center justify-center bg-background">
      <Loading size="lg" text="正在进入管理平台..." />
    </main>
  );
}
