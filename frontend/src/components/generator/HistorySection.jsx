import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/common/DataTable';

export default function HistorySection({
  history,
  loading,
  pagination,
  onPageChange,
  onPageSizeChange
}) {
  // 表格列配置
  const columns = [
    {
      key: 'module_name',
      label: '模块名称',
      cellClassName: 'font-medium py-4',
      render: (_, record) => record.module?.module_name || record.module_name || '-'
    },
    {
      key: 'createdAt',
      label: '生成时间',
      cellClassName: 'py-4',
      render: (value) => value ? new Date(value).toLocaleString('zh-CN') : '-'
    },
    {
      key: 'generated_by',
      label: '操作人',
      cellClassName: 'py-4',
      render: (value) => value || '未知'
    },
    {
      key: 'success',
      label: '状态',
      cellClassName: 'py-4',
      render: (value) => value ? (
        <Badge variant="default">成功</Badge>
      ) : (
        <Badge variant="destructive">失败</Badge>
      )
    }
  ];

  return (
    <DataTable
      columns={columns}
      data={history}
      loading={loading}
      pagination={pagination}
      onPageChange={onPageChange}
      onPageSizeChange={onPageSizeChange}
    />
  );
}
