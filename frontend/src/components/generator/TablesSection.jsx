
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { SearchFilter } from '@/components/common/SearchFilter';
import { DataTable } from '@/components/common/DataTable';
import {
  PageSurface,
  PageToolbar,
  PageWorkspace,
} from '@/components/layout/page-shell';
import { PlusCircleIcon, PlusIcon, RefreshCwIcon } from 'lucide-react';

const searchFields = [
  {
    type: 'text',
    name: 'keyword',
    placeholder: '搜索表名...',
  },
];

export default function TablesSection({
  tables,
  loading,
  searchValues,
  onSearchValuesChange,
  onSearch,
  onReset,
  onRefresh,
  onCreateTable,
  onInitialize,
  onCheckAudit,
  pagination,
  onPageChange,
  onPageSizeChange,
}) {
  const columns = [
    {
      key: 'tableName',
      label: '表名',
      cellClassName: 'font-mono',
    },
    {
      key: 'comment',
      label: '注释',
      render: (value) => value || '-',
    },
    {
      key: 'columnCount',
      label: '字段数',
      numeric: true,
    },
    {
      key: 'isGenerated',
      label: '状态',
      render: (value) => (
        value
          ? <Badge variant="secondary">已生成</Badge>
          : <Badge variant="outline">未生成</Badge>
      ),
    },
  ];

  const renderActions = (table) => (
    <>
      {!table.tableName.startsWith('owl_') && !table.auditFieldsComplete && (
        <Button
          size="sm"
          variant="outline"
          onClick={() => onCheckAudit(table.tableName)}
          disabled={loading}
        >
          <PlusCircleIcon className="h-4 w-4" />
          补全审计字段
        </Button>
      )}
      <Button
        size="sm"
        onClick={() => onInitialize(table.tableName)}
        disabled={table.isGenerated || loading}
      >
        初始化配置
      </Button>
    </>
  );

  return (
    <PageWorkspace>
      <PageToolbar>
        <SearchFilter
          variant="toolbar"
          fields={searchFields}
          values={searchValues}
          onChange={onSearchValuesChange}
          onSearch={onSearch}
          onReset={onReset}
          rightActions={(
            <div className="flex gap-2">
              <Button className="h-10" onClick={onRefresh} variant="outline">
                <RefreshCwIcon className="h-4 w-4" />
                刷新
              </Button>
              <Button className="h-10" onClick={onCreateTable}>
                <PlusIcon className="h-4 w-4" />
                新建业务表
              </Button>
            </div>
          )}
        />
      </PageToolbar>
      <PageSurface className="p-0">
        <DataTable
          variant="workspace"
          density="compact"
          columns={columns}
          data={tables}
          loading={loading}
          pagination={pagination}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
          rowKey="tableName"
          actions={renderActions}
        />
      </PageSurface>
    </PageWorkspace>
  );
}
