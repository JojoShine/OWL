
import React, { useEffect, useState } from 'react';
import { Table } from 'antd';
import { EmptyState } from '@/components/ui/empty-state';
import { Loading } from '@/components/ui/loading';
import { Pagination } from '@/components/ui/pagination';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import './DataTable.css';

const EMPTY_DATA = [];

function renderColumnContent(column, row) {
  return column.render
    ? column.render(row[column.key], row)
    : row[column.key] ?? '-';
}

function getMobileCardLabel(row, rowId, primaryColumn) {
  const primaryValue = primaryColumn ? row[primaryColumn.key] : null;
  if (typeof primaryValue === 'string' || typeof primaryValue === 'number') {
    return String(primaryValue);
  }
  return String(row.name || row.username || row.title || rowId);
}

/**
 * 数据表格组件 - 通用的数据展示表格
 *
 * @param {Object} props
 * @param {Array} props.columns - 列配置数组
 * @param {Array} props.data - 数据数组
 * @param {boolean} props.loading - 加载状态
 * @param {Function} props.actions - 操作列渲染函数 (row) => ReactNode
 * @param {string} props.emptyText - 空数据提示文本
 * @param {Object} props.pagination - 分页配置 { page, total, pageSize }
 * @param {Function} props.onPageChange - 页码变化回调
 * @param {Function} props.onPageSizeChange - 每页数量变化回调
 * @param {string} props.rowKey - 行唯一标识字段名，默认 'id'
 * @param {Function} props.renderSubRow - 子行渲染函数 (row) => ReactNode，如果提供则支持展开
 * @param {boolean} columns[].mobilePrimary - 将该列作为移动端卡片标题
 * @param {boolean} columns[].mobileHidden - 在移动端卡片中隐藏该列
 * @param {ReactNode} columns[].mobileLabel - 移动端卡片使用的字段标签
 *
 * @example
 * // 基础用法
 * const columns = [
 *   { key: 'username', label: '用户名' },
 *   { key: 'email', label: '邮箱' },
 *   { key: 'status', label: '状态', render: (value) => <Badge>{value}</Badge> }
 * ];
 *
 * <DataTable
 *   columns={columns}
 *   data={users}
 *   loading={isLoading}
 *   actions={(row) => (
 *     <>
 *       <Button onClick={() => handleEdit(row)}><Edit className="h-4 w-4" /></Button>
 *       <Button onClick={() => handleDelete(row)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
 *     </>
 *   )}
 *   pagination={{ page: 1, total: 100, pageSize: 10 }}
 *   onPageChange={handlePageChange}
 *   onPageSizeChange={handlePageSizeChange}
 * />
 */
export function DataTable({
  columns = [],
  data = EMPTY_DATA,
  loading = false,
  actions,
  actionsLabel = '操作',
  variant = 'workspace',
  density = 'compact',
  emptyText = '暂无数据',
  pagination,
  onPageChange,
  onPageSizeChange,
  rowKey = 'id',
  renderSubRow,
  className,
  ...rest
}) {
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [renderedData, setRenderedData] = useState(data);
  // Retain the settled rows while a replacement request is in flight.
  useEffect(() => {
    if (!loading) setRenderedData(data);
  }, [data, loading]);
  const displayedData = loading ? renderedData : data;
  const getRowKey = (row, index = displayedData.indexOf(row)) => typeof rowKey === 'function' ? rowKey(row) : row[rowKey] ?? index;

  // 切换行展开状态
  const toggleRow = (rowId) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      if (next.has(rowId)) {
        next.delete(rowId);
      } else {
        next.add(rowId);
      }
      return next;
    });
  };

  const hasExpandable = !!renderSubRow;
  const isWorkspace = variant === 'workspace';
  const isCompact = density === 'compact';
  const selectionColumn = columns.find((column) => column.key === '__selection');
  const mobileColumns = columns.filter(
    (column) => column.key !== '__selection' && !column.mobileHidden
  );
  const mobilePrimaryColumn = mobileColumns.find((column) => column.mobilePrimary)
    || mobileColumns[0];
  const mobileDetailColumns = mobileColumns.filter(
    (column) => column !== mobilePrimaryColumn
  );

  const tableColumns = columns.map((column) => ({
    key: column.key,
    dataIndex: column.key,
    title: column.label,
    width: column.width,
    onHeaderCell: () => ({ className: column.headerClassName }),
    onCell: () => ({ className: cn(column.numeric && 'tabular-data', column.cellClassName) }),
    render: (_value, row) => renderColumnContent(column, row),
  }));
  if (actions) tableColumns.push({
    key: '__actions', title: actionsLabel, align: 'right',
    render: (_value, row) => <div className="flex justify-end gap-2">{actions(row)}</div>,
  });

  return (
    <div
      data-slot="data-table"
      aria-busy={loading}
      className={cn(
        'owl-data-table',
        isWorkspace
          ? 'overflow-hidden rounded-lg border bg-card max-md:overflow-visible max-md:rounded-none max-md:border-0 max-md:bg-transparent'
          : 'space-y-4',
        className
      )}
      {...rest}
    >
      {/* Desktop uses Ant Table; mobile retains the established card layout. */}
      <div className="hidden md:block" inert={loading || undefined}>
        <Table
          columns={tableColumns}
          dataSource={displayedData}
          rowKey={getRowKey}
          size={isCompact ? 'small' : 'middle'}
          pagination={false}
          scroll={{ x: 'max-content' }}
          loading={{ spinning: loading, indicator: <Loading size="sm" text="" /> }}
          locale={{ emptyText: loading ? null : <EmptyState title={emptyText} compact /> }}
          expandable={hasExpandable ? {
            expandedRowKeys: [...expandedRows],
            expandedRowRender: (row) => <div className="bg-muted/30 p-4">{renderSubRow(row)}</div>,
            onExpandedRowsChange: (keys) => setExpandedRows(new Set(keys)),
            expandIcon: ({ expanded, onExpand, record }) => <Button
              type="button" variant="ghost" size="sm" className="h-8 w-8 p-0"
              aria-label={`${expanded ? '收起' : '展开'}${record.name || record.username || getRowKey(record)}`}
              aria-expanded={expanded}
              onClick={(event) => onExpand(record, event)}
            >{expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}</Button>,
          } : undefined}
        />
      </div>

      {/* 移动端卡片 */}
      <div className="relative md:hidden">
        {loading && renderedData.length > 0 && <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/60"><Loading size="sm" /></div>}
        {loading && renderedData.length === 0 ? (
          <div className="rounded-lg border bg-card py-4">
            <Loading size="md" />
          </div>
        ) : renderedData.length === 0 ? (
          <div className="rounded-lg border bg-card px-4 py-6">
            <EmptyState title={emptyText} compact />
          </div>
        ) : (
          <div
            inert={loading || undefined}
            className="space-y-3"
          >
            {renderedData.map((row, index) => {
              const rowId = getRowKey(row, index);
              const rowLabel = getMobileCardLabel(row, rowId, mobilePrimaryColumn);
              const isExpanded = expandedRows.has(rowId);

              return (
                <article
                  key={rowId}
                  data-slot="data-table-mobile-card"
                  aria-label={rowLabel}
                  className="overflow-hidden rounded-lg border bg-card"
                >
                  <div className="p-4">
                    <div className="flex min-w-0 items-start gap-3">
                      {selectionColumn ? (
                        <div className="flex h-6 shrink-0 items-center">
                          {renderColumnContent(selectionColumn, row)}
                        </div>
                      ) : null}
                      <div className={cn(
                        'min-w-0 flex-1 break-words font-medium leading-6',
                        mobilePrimaryColumn?.numeric && 'tabular-data',
                        mobilePrimaryColumn?.mobileClassName
                      )}>
                        {mobilePrimaryColumn ? renderColumnContent(mobilePrimaryColumn, row) : rowLabel}
                      </div>
                      {hasExpandable ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 shrink-0 p-0"
                          onClick={() => toggleRow(rowId)}
                          aria-label={isExpanded ? `收起${rowLabel}` : `展开${rowLabel}`}
                        >
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </Button>
                      ) : null}
                    </div>

                    {mobileDetailColumns.length > 0 ? (
                      <dl className="mt-3 space-y-2.5 border-t pt-3">
                        {mobileDetailColumns.map((column) => (
                          <div
                            key={column.key}
                            className="grid grid-cols-[minmax(4.75rem,0.38fr)_minmax(0,1fr)] items-start gap-3"
                          >
                            <dt className="pt-0.5 text-xs leading-5 text-muted-foreground/70">
                              {column.mobileLabel ?? column.label}
                            </dt>
                            <dd className={cn(
                              'min-w-0 break-words text-sm leading-5 [&_code]:whitespace-normal [&_code]:break-all [&_pre]:whitespace-pre-wrap',
                              column.numeric && 'tabular-data',
                              column.mobileClassName
                            )}>
                              {renderColumnContent(column, row)}
                            </dd>
                          </div>
                        ))}
                      </dl>
                    ) : null}
                  </div>

                  {isExpanded && renderSubRow ? (
                    <div className="border-t bg-muted/25 p-4">
                      {renderSubRow(row)}
                    </div>
                  ) : null}

                  {actions ? (
                    <div className="flex items-center justify-between gap-3 border-t bg-muted/15 px-4 py-2.5">
                      <span className="text-xs text-muted-foreground/60">{actionsLabel}</span>
                      <div className="flex flex-wrap justify-end gap-1.5">
                        {actions(row)}
                      </div>
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>
        )}
      </div>

      {/* 分页 */}
      {pagination && (
        <div className={isWorkspace
          ? 'border-t px-4 py-3 max-md:mt-3 max-md:rounded-lg max-md:border max-md:bg-card'
          : undefined}>
          <Pagination
            page={pagination.page}
            total={pagination.total}
            pageSize={pagination.pageSize}
            onPageChange={onPageChange}
            onPageSizeChange={onPageSizeChange}
            className={
              isWorkspace
                ? 'flex-col items-start sm:flex-row sm:items-center [&>nav]:max-w-full [&>nav]:overflow-x-auto'
                : undefined
            }
          />
        </div>
      )}
    </div>
  );
}
