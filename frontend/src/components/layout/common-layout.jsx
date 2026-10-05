
import RequireAuth from '@/components/auth/require-auth';
import Sidebar from '@/components/layout/sidebar';
import Header from '@/components/layout/header';

export default function CommonLayout({ children, padding = true }) {
  return (
    <RequireAuth>
      <div className="h-screen flex overflow-hidden">
        {/* 侧边栏 */}
        <aside className="w-64 flex-shrink-0">
          <Sidebar />
        </aside>

        {/* 主内容区域 */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* 顶部导航 */}
          <Header />

          {/* 页面内容 */}
          <main className={`flex-1 overflow-y-auto bg-background ${padding ? 'p-6' : ''}`}>
            {children}
          </main>
        </div>
      </div>
    </RequireAuth>
  );
}
