'use client';

/**
 * 示例业务模块页面
 *
 * 复制此文件到你的业务模块目录，替换 example 为模块名
 * 路由路径：/biz/example
 */

import { useState, useEffect } from 'react';
import { exampleApi } from '@/lib/api/biz/example.api';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { SearchFilter } from '@/components/common/SearchFilter';
import { DataTable } from '@/components/common/DataTable';
import { PageHeader, PageShell, PageSurface, PageToolbar, PageWorkspace } from '@/components/layout/page-shell';

export default function ExamplePage() {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchValues, setSearchValues] = useState({});
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 10, total: 0 });

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const response = await exampleApi.getList({
        keyword: searchValues.keyword || '',
        page: pagination.page,
        pageSize: pagination.pageSize,
      });
      setData(response.data?.items || []);
      if (response.data?.pagination) {
        setPagination(prev => ({ ...prev, total: response.data.pagination.total || 0 }));
      }
    } catch (error) {
      console.error('获取列表失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.page, pagination.pageSize]);

  const handleSearch = () => {
    setPagination(prev => ({ ...prev, page: 1 }));
    setTimeout(() => fetchData(), 0);
  };

  const handleReset = () => {
    setSearchValues({});
    setPagination(prev => ({ ...prev, page: 1 }));
    setTimeout(() => fetchData(), 0);
  };

  const handleDelete = async (id) => {
    try {
      await exampleApi.delete(id);
      toast.success('删除成功');
      fetchData();
    } catch (error) {
      toast.error('删除失败');
    }
  };

  // 表格列定义
  const columns = [
    { key: 'title', title: '标题' },
    { key: 'status', title: '状态' },
    { key: 'created_at', title: '创建时间' },
  ];

  // 搜索字段定义
  const searchFields = [
    { key: 'keyword', label: '关键词', placeholder: '请输入关键词' },
  ];

  return (
    <PageShell>
      <PageHeader
        title="示例模块"
        description="浏览和管理示例业务数据"
        actions={(
            <Button onClick={() => { setEditingItem(null); setIsDialogOpen(true); }}>
              <Plus className="mr-2 h-4 w-4" />
              新建
            </Button>
        )}
      />
      <PageWorkspace>
        <PageToolbar>
          <SearchFilter
            fields={searchFields}
            values={searchValues}
            onChange={setSearchValues}
            onSearch={handleSearch}
            onReset={handleReset}
          />
        </PageToolbar>
        <PageSurface className="p-0">
          <DataTable
            columns={columns}
            data={data}
            loading={isLoading}
            pagination={pagination}
            onPageChange={(page) => setPagination(prev => ({ ...prev, page }))}
          />
        </PageSurface>
      </PageWorkspace>

      {/* 新建/编辑弹窗 */}
      {/* <ExampleDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        item={editingItem}
        onSuccess={() => { setIsDialogOpen(false); fetchData(); }}
      /> */}
    </PageShell>
  );
}
