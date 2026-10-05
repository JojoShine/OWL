
import { useEffect } from 'react';
import { useRouter, usePathname } from '@/lib/navigation';
import { Loading } from '@/components/ui/loading';
import { useAuth } from '@/lib/utils/auth';

/**
 * 路由保护组件
 * 用于保护需要认证的页面
 */
export default function RequireAuth({ children }) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // 等待加载完成后再检查
    if (!isLoading) {
      // 如果未登录，跳转到登录页
      if (!isAuthenticated()) {
        router.push('/login');
      }
    }
  }, [isAuthenticated, isLoading, router, pathname]);

  // 加载中显示loading
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading size="lg" variant="spinner" fullHeight={false} />
      </div>
    );
  }

  // 未登录不渲染内容（会在useEffect中跳转）
  if (!isAuthenticated()) {
    return null;
  }

  // 已登录，渲染子组件
  return <>{children}</>;
}