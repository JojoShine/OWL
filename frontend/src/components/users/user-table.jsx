
import { Table } from 'antd';
import { DataTable } from '@/components/common/DataTable';
import { Pagination } from '@/components/ui/pagination';

export function UserTable({ columns, data, loading, pagination, onPageChange, onPageSizeChange, actions, emptyText }) {
  const tableColumns = columns.map((column) => ({
    key: column.key, dataIndex: column.key, title: column.label, render: column.render,
    width: column.key === 'username' ? 140 : column.key === 'status' ? 120 : undefined,
  }));
  tableColumns.push({ key: 'actions', title: '操作', width: 88, render: (_, record) => <div className="flex gap-1">{actions(record)}</div> });
  return <div className="owl-user-table" aria-busy={loading}>
    <div className="hidden md:block">
      <Table size="small" rowKey="id" columns={tableColumns} dataSource={data} pagination={false}
        loading={loading} scroll={{ x: 840 }} locale={{ emptyText }} />
    </div>
    <div className="md:hidden"><DataTable variant="workspace" density="compact" columns={columns} data={data} loading={loading} actions={actions} emptyText={emptyText} /></div>
    <div className="border-t border-border p-4"><Pagination className="flex-col items-start sm:flex-row sm:items-center [&>nav]:max-w-full [&>nav]:overflow-x-auto" {...pagination} onPageChange={onPageChange} onPageSizeChange={onPageSizeChange} /></div>
  </div>;
}
