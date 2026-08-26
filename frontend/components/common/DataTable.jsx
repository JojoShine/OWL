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

  return (
    <div
      data-slot="data-table"
      aria-busy={loading}
      className={cn(
        isWorkspace ? 'overflow-hidden rounded-lg border bg-card' : 'space-y-4',
        className
      )}
      {...rest}
    >
      {/* 表格 */}
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
                  {emptyText}
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
                          {column.render
                            ? column.render(row[column.key], row)
                            : row[column.key] ?? '-'}
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

      {/* 分页 */}
      {pagination && (
        <div className={isWorkspace ? 'border-t px-4 py-3' : undefined}>
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
