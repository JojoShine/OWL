import * as React from "react"
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  MoreHorizontalIcon,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button";
import { Pagination as AntPagination, Select } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import './pagination.css';

// 每页条数选项
const PAGE_SIZE_OPTIONS = [5, 10, 15, 20, 50, 100];

function Pagination({
  className,
  page,
  total,
  pageSize = 10,
  onPageChange,
  onPageSizeChange,
  resetPageOnPageSizeChange = true,
  ...props
}) {
  // 如果传入了分页参数，渲染完整的分页组件
  if (page !== undefined && total !== undefined && onPageChange) {
    return <CompletePagination
      page={page}
      total={total}
      pageSize={pageSize}
      onPageChange={onPageChange}
      onPageSizeChange={onPageSizeChange}
      resetPageOnPageSizeChange={resetPageOnPageSizeChange}
      className={className}
    />;
  }

  // 否则作为基础容器使用
  return (
    <nav
      role="navigation"
      aria-label="pagination"
      className={cn("mx-auto flex w-full justify-center", className)}
      {...props}
    />
  );
}

// 完整的分页组件实现
const CompletePagination = React.memo(function CompletePagination({
  page,
  total,
  pageSize,
  onPageChange,
  onPageSizeChange,
  resetPageOnPageSizeChange,
  className,
}) {
  const totalPages = Math.ceil(total / pageSize);
  const handlePageSizeChange = (value) => {
    if (!onPageSizeChange) return;
    onPageSizeChange(value);
    if (resetPageOnPageSizeChange) onPageChange(1);
  };

  return (
    <div className={cn("owl-pagination flex w-full flex-col items-start justify-between gap-4 sm:flex-row sm:items-center", className)}>
      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <span className="whitespace-nowrap">共 {total} 条记录</span>
        <div className="flex items-center gap-2">
          <span className="whitespace-nowrap">每页</span>
          <Select
            aria-label="每页条数" size="small" value={pageSize}
            className="w-[70px]" virtual={false} showSearch={false}
            disabled={!onPageSizeChange} onChange={handlePageSizeChange}
            options={PAGE_SIZE_OPTIONS.map((value) => ({ value, label: String(value) }))}
          />
          <span className="whitespace-nowrap">条</span>
        </div>
      </div>
      {totalPages > 1 && <nav aria-label="pagination" className="max-w-full overflow-x-auto"
        onKeyDown={(event) => {
          if (event.key === ' ' && event.target.matches('.ant-pagination-item')) {
            event.preventDefault();
            event.target.click();
          }
        }}>
        <AntPagination
          current={page} pageSize={pageSize} total={total} size="small"
          locale={zhCN.Pagination} showSizeChanger={false} showLessItems
          onChange={(nextPage) => onPageChange(nextPage)}
          itemRender={(itemPage, type, original) => {
            if (type === 'page') return <button type="button" tabIndex={-1}
              className="owl-pagination-page" aria-label={`第 ${itemPage} 页`}
              aria-current={itemPage === page ? 'page' : undefined}
              onKeyDown={(event) => event.stopPropagation()}>{itemPage}</button>;
            if (type === 'prev' || type === 'next') return React.cloneElement(original, {
              'aria-label': type === 'prev' ? '上一页' : '下一页',
              onKeyDown: (event) => event.stopPropagation(),
            });
            return original;
          }}
        />
      </nav>}
    </div>
  );
});

function PaginationContent({
  className,
  ...props
}) {
  return (
    <ul
      className={cn("flex flex-row items-center gap-1", className)}
      {...props}
    />
  );
}

function PaginationItem({
  className,
  ...props
}) {
  return <li className={cn("", className)} {...props} />;
}

function PaginationLink({
  className,
  isActive,
  disabled,
  size = "icon-sm",
  children,
  ...props
}) {
  return (
    <Button
      type="button"
      disabled={disabled}
      aria-current={isActive ? "page" : undefined}
      variant={isActive ? "default" : "ghost"}
      size={size}
      className={className}
      {...props}
    >
      {children}
    </Button>
  );
}

function PaginationPrevious({
  className,
  ...props
}) {
  return (
    <PaginationLink
      aria-label="上一页"
      size="default"
      className={cn("gap-1 pl-2.5", className)}
      {...props}
    >
      <ChevronLeftIcon className="h-4 w-4" />
      <span>上一页</span>
    </PaginationLink>
  );
}

function PaginationNext({
  className,
  ...props
}) {
  return (
    <PaginationLink
      aria-label="下一页"
      size="default"
      className={cn("gap-1 pr-2.5", className)}
      {...props}
    >
      <span>下一页</span>
      <ChevronRightIcon className="h-4 w-4" />
    </PaginationLink>
  );
}

function PaginationEllipsis({
  className,
  ...props
}) {
  return (
    <span
      aria-hidden
      className={cn("flex h-9 w-9 items-center justify-center", className)}
      {...props}
    >
      <MoreHorizontalIcon className="h-4 w-4" />
      <span className="sr-only">更多页码</span>
    </span>
  );
}

export {
  Pagination,
  PaginationContent,
  PaginationLink,
  PaginationItem,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
}
