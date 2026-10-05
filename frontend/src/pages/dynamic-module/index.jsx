
import { useEffect, useState } from 'react';
import { useParams } from '@/lib/navigation';
import { Link } from 'react-router-dom';
import axios from '@/lib/utils/http-client';
import { DynamicCrudPage } from '@/components/dynamic-module/DynamicCrudPage';
import { AlertCircle, ArrowLeft, SearchX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Loading } from '@/components/ui/loading';
import { PageShell, PageSurface } from '@/components/layout/page-shell';

export default function DynamicModulePage() {
  const { slug } = useParams();
  const [pageConfig, setPageConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadPageConfig() {
      try {
        setLoading(true);
        setError(null);

        // 从后端加载页面配置
        const response = await axios.get(`/generator/page-config/${slug}`);
        setPageConfig(response.data);
      } catch (err) {
        console.error('Failed to load page config:', err);
        setError(err.response?.data?.message || '模块不存在或加载失败');
      } finally {
        setLoading(false);
      }
    }

    if (slug) {
      loadPageConfig();
    }
  }, [slug]);

  // 加载中状态
  if (loading) {
    return (
      <PageShell>
        <PageSurface className="flex min-h-[420px] items-center justify-center">
          <Loading size="lg" text="正在加载模块..." />
        </PageSurface>
      </PageShell>
    );
  }

  // 错误状态
  if (error) {
    return (
      <PageShell>
        <PageSurface className="flex min-h-[420px] items-center justify-center p-6">
          <div className="max-w-md text-center">
            <div className="mx-auto mb-4 flex size-11 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
              <AlertCircle className="size-5" />
            </div>
            <h2 className="text-xl font-semibold">页面加载失败</h2>
            <p className="mt-2 text-sm text-muted-foreground">{error}</p>
            <Button asChild variant="outline" className="mt-5">
              <Link to="/dashboard">
                <ArrowLeft className="size-4" />
                返回首页
              </Link>
            </Button>
          </div>
        </PageSurface>
      </PageShell>
    );
  }

  // 模块不存在
  if (!pageConfig) {
    return (
      <PageShell>
        <PageSurface className="flex min-h-[420px] items-center justify-center p-6">
          <div className="max-w-md text-center">
            <div className="mx-auto mb-4 flex size-11 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <SearchX className="size-5" />
            </div>
            <h2 className="text-xl font-semibold">模块不存在</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              找不到模块 &quot;{slug}&quot;
            </p>
            <Button asChild variant="outline" className="mt-5">
              <Link to="/dashboard">
                <ArrowLeft className="size-4" />
                返回首页
              </Link>
            </Button>
          </div>
        </PageSurface>
      </PageShell>
    );
  }

  // 渲染动态CRUD页面
  return (
    <PageShell>
      <DynamicCrudPage config={pageConfig} />
    </PageShell>
  );
}
