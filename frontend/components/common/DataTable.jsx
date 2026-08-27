'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { TableLoading } from '@/components/ui/table-loading';
import { EmptyState } from '@/components/ui/empty-state';
import { Loading } from '@/components/ui/loading';
import { Pagination } from '@/components/ui/pagination';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

function TableFrame({ workspace, children }) {
  if (workspace) return children;

  return <div className="overflow-hidden rounded-lg">{children}</div>;
}

const ROW_TRANSITION_MS = 200;
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
  const [rowsVisible, setRowsVisible] = useState(true);
  const renderedDataRef = useRef(data);
  const transitionStartedAtRef = useRef(0);
  const paginationKey = pagination
    ? `${pagination.page ?? 1}:${pagination.pageSize ?? 10}`
    : null;
  const settledPaginationKeyRef = useRef(paginationKey);
  const isPaginationTransition = paginationKey !== null
    && paginationKey !== settledPaginationKeyRef.current;

  useEffect(() => {
    let swapTimer;
    let revealFrame;
    let revealTimer;

    const hasPendingPagination = paginationKey !== null
      && paginationKey !== settledPaginationKeyRef.current;

    if (loading) {
      if (hasPendingPagination && renderedDataRef.current.length > 0) {
        if (!transitionStartedAtRef.current) {
          transitionStartedAtRef.current = Date.now();
        }
        setRowsVisible(false);
      } else if (!hasPendingPagination) {
        transitionStartedAtRef.current = 0;
        setRowsVisible(true);
      }

      return undefined;
    }

    const revealRows = () => {
      if (typeof window.requestAnimationFrame === 'function') {
        revealFrame = window.requestAnimationFrame(() => setRowsVisible(true));
      } else {
        revealTimer = window.setTimeout(() => setRowsVisible(true), 0);
      }
    };

    if (data !== renderedDataRef.current) {
      const isInitialLoad = renderedDataRef.current.length === 0
        && transitionStartedAtRef.current === 0;
      const elapsed = transitionStartedAtRef.current
        ? Date.now() - transitionStartedAtRef.current
        : ROW_TRANSITION_MS;
      const remainingFadeTime = Math.max(0, ROW_TRANSITION_MS - elapsed);

      const swapRows = () => {
        if (isInitialLoad && data.length > 0) setRowsVisible(false);
        renderedDataRef.current = data;
        setRenderedData(data);
        settledPaginationKeyRef.current = paginationKey;
        transitionStartedAtRef.current = 0;
        revealRows();
      };

      if (remainingFadeTime > 0) {
        swapTimer = window.setTimeout(swapRows, remainingFadeTime);
      } else {
        swapRows();
      }
    } else if (transitionStartedAtRef.current) {
      settledPaginationKeyRef.current = paginationKey;
      transitionStartedAtRef.current = 0;
      revealRows();
    } else if (!hasPendingPagination) {
      setRowsVisible(true);
    }

    return () => {
      if (swapTimer) window.clearTimeout(swapTimer);
      if (revealTimer) window.clearTimeout(revealTimer);
      if (revealFrame) window.cancelAnimationFrame(revealFrame);
    };
  }, [data, loading, paginationKey]);

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

  // 计算总列数（包括操作列）
  const hasExpandable = !!renderSubRow;
  const totalColumns = columns.length + (actions ? 1 : 0) + (hasExpandable ? 1 : 0);
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

  return (
    <div
      data-slot="data-table"
      aria-busy={loading}
      className={cn(
        isWorkspace
          ? 'overflow-hidden rounded-lg border bg-card max-md:overflow-visible max-md:rounded-none max-md:border-0 max-md:bg-transparent'
          : 'space-y-4',
        className
      )}
      {...rest}
    >
      {/* 表格 */}
      <div className="hidden md:block">
        <TableFrame workspace={isWorkspace}>
          <Table>
          <TableHeader className={isWorkspace ? 'bg-muted/60' : undefined}>
            <TableRow className={isWorkspace ? 'hover:bg-muted/60' : undefined}>
              {hasExpandable && (
                <TableHead className={cn('w-10', isWorkspace && 'px-4')}></TableHead>
              )}
              {columns.map((column) => (
                <TableHead
                  key={column.key}
                  className={cn(isWorkspace && 'px-4', column.headerClassName)}
                  style={column.width ? { width: column.width } : undefined}
                >
                  {column.label}
                </TableHead>
              ))}
              {actions && (
                <TableHead className={cn('text-right', isWorkspace && 'px-4')}>
                  {actionsLabel}
                </TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody
            aria-hidden={!rowsVisible}
            inert={!rowsVisible}
            className={cn(
              'transition-opacity duration-200 ease-out motion-reduce:transition-none',
              rowsVisible ? 'opacity-100' : 'pointer-events-none opacity-0'
            )}
          >
            {loading && !(isPaginationTransition && renderedData.length > 0) ? (
              <TableLoading colSpan={totalColumns} variant={isWorkspace ? 'workspace' : 'default'} />
            ) : renderedData.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={totalColumns}
                  className={cn(
                    'text-center py-8 text-muted-foreground',
                    isWorkspace && 'py-12'
                  )}
                >
                  <EmptyState title={emptyText} compact />
                </TableCell>
              </TableRow>
            ) : (
              renderedData.map((row, index) => {
                const rowId = row[rowKey] ?? index;
                const rowLabel = row.name || row.username || rowId;
                const isExpanded = expandedRows.has(rowId);

                return (
                  <React.Fragment key={rowId}>
                    <TableRow className={isWorkspace ? 'hover:bg-muted/30' : undefined}>
                      {hasExpandable && (
                        <TableCell className={cn('w-10', isWorkspace && 'px-4', isCompact && 'h-[50px] py-2')}>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => toggleRow(rowId)}
                            aria-label={isExpanded ? `收起${rowLabel}` : `展开${rowLabel}`}
                          >
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </Button>
                        </TableCell>
                      )}
                      {columns.map((column) => (
                        <TableCell
                          key={column.key}
                          className={cn(
                            isWorkspace && 'px-4',
                            isCompact && 'h-[50px] py-2',
                            column.numeric && 'tabular-data',
                            column.cellClassName
                          )}
                        >
                          {renderColumnContent(column, row)}
                        </TableCell>
                      ))}
                      {actions && (
                        <TableCell className={cn('text-right', isWorkspace && 'px-4', isCompact && 'h-[50px] py-2')}>
                          <div className="flex justify-end gap-2">
                            {actions(row)}
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                    {isExpanded && renderSubRow && (
                      <TableRow>
                        <TableCell colSpan={totalColumns} className="p-0">
                          <div className="bg-muted/30 p-4">
                            {renderSubRow(row)}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </TableBody>
          </Table>
        </TableFrame>
      </div>

      {/* 移动端卡片 */}
      <div className="md:hidden">
        {loading && !(isPaginationTransition && renderedData.length > 0) ? (
          <div className="rounded-lg border bg-card py-4">
            <Loading size="md" />
          </div>
        ) : renderedData.length === 0 ? (
          <div className="rounded-lg border bg-card px-4 py-6">
            <EmptyState title={emptyText} compact />
          </div>
        ) : (
          <div
            aria-hidden={!rowsVisible}
            inert={!rowsVisible}
            className={cn(
              'space-y-3 transition-opacity duration-200 ease-out motion-reduce:transition-none',
              rowsVisible ? 'opacity-100' : 'pointer-events-none opacity-0'
            )}
          >
            {renderedData.map((row, index) => {
              const rowId = row[rowKey] ?? index;
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
