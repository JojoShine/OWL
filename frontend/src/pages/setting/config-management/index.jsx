
import { useState, useEffect } from 'react';
import SystemInfoTab from '@/components/system-config/SystemInfoTab';
import { systemConfigApi } from '@/lib/api';
import { Loading } from '@/components/ui/loading';
import { PageHeader, PageShell, PageSurface } from '@/components/layout/page-shell';

export default function ConfigManagementPage() {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const response = await systemConfigApi.getConfig();
      if (response.success) {
        setConfig(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch config:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <PageShell>
        <PageHeader
          title="配置管理"
          description="管理系统信息、登录方式与品牌展示配置。"
        />
        <PageSurface className="flex min-h-48 items-center justify-center p-5">
          <Loading size="sm" variant="pulse" />
        </PageSurface>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <PageHeader
        title="配置管理"
        description="管理系统信息、登录方式与品牌展示配置。"
      />
      <PageSurface className="p-5">
        <SystemInfoTab config={config} onUpdate={fetchConfig} />
      </PageSurface>
    </PageShell>
  );
}
