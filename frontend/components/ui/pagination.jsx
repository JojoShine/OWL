import * as React from "react"
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  MoreHorizontalIcon,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
  // 计算总页数 - 使用 useMemo 缓存
  const totalPages = React.useMemo(() => {
    return Math.ceil(total / pageSize);
  }, [total, pageSize]);

  // 生成页码数组 - 使用 useMemo 缓存
  const pageNumbers = React.useMemo(() => {
    const pages = [];

    if (totalPages <= 7) {
      // 如果总页数小于等于7，显示所有页码
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // 总是显示第一页
      pages.push(1);

      // 显示省略号或中间页码
      if (page > 3) {
        pages.push('ellipsis-1');
      }

      // 显示当前页附近的页码
      const start = Math.max(2, page - 1);
      const end = Math.min(totalPages - 1, page + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      // 显示省略号
      if (page < totalPages - 2) {
        pages.push('ellipsis-2');
      }

      // 总是显示最后一页
      pages.push(totalPages);
    }

    return pages;
  }, [page, totalPages]);

  // 上一页处理函数 - 使用 useCallback 缓存
  const handlePrevious = React.useCallback(() => {
    if (page > 1) {
      onPageChange(page - 1);
    }
  }, [page, onPageChange]);

  // 下一页处理函数 - 使用 useCallback 缓存
  const handleNext = React.useCallback(() => {
    if (page < totalPages) {
      onPageChange(page + 1);
    }
  }, [page, totalPages, onPageChange]);

  // 处理每页条数变化
  const handlePageSizeChange = React.useCallback((value) => {
    const newPageSize = parseInt(value, 10);
    if (onPageSizeChange) {
      onPageSizeChange(newPageSize);
      if (resetPageOnPageSizeChange) {
        // 切换每页条数后，重置到第一页
        onPageChange(1);
      }
    }
  }, [onPageSizeChange, onPageChange, resetPageOnPageSizeChange]);

  return (
    <div className={cn("flex items-center justify-between w-full gap-4", className)}>
      {/* 左侧：记录信息和每页条数选择 */}
      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <span className="whitespace-nowrap">共 {total} 条记录</span>
        <div className="flex items-center gap-2">
          <span className="whitespace-nowrap">每页</span>
          <Select value={String(pageSize)} onValueChange={handlePageSizeChange}>
            <SelectTrigger className="h-8 w-[70px]">
              <SelectValue placeholder={pageSize} />
            </SelectTrigger>
            <SelectContent>
              {PAGE_SIZE_OPTIONS.map((size) => (
                <SelectItem key={size} value={String(size)}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="whitespace-nowrap">条</span>
        </div>
      </div>

      {/* 右侧：分页控件 */}
      {totalPages > 1 && (
        <nav role="navigation" aria-label="pagination">
          <ul className="flex flex-row items-center gap-1">
          {/* 上一页 */}
            <li>
              <PaginationPrevious
                onClick={handlePrevious}
                disabled={page === 1}
              />
            </li>

          {/* 页码 */}
            {pageNumbers.map((pageNum) => {
              if (typeof pageNum === 'string') {
                // 省略号
                return (
                  <li key={pageNum}>
                    <PaginationEllipsis />
                  </li>
                );
              }

              // 页码按钮
              return (
                <li key={pageNum}>
                  <PaginationLink
                    onClick={() => onPageChange(pageNum)}
                    isActive={pageNum === page}
                    aria-label={`第 ${pageNum} 页`}
                    className="cursor-pointer"
                  >
                    {pageNum}
                  </PaginationLink>
                </li>
              );
            })}

          {/* 下一页 */}
            <li>
              <PaginationNext
                onClick={handleNext}
                disabled={page === totalPages}
              />
            </li>
          </ul>
        </nav>
      )}
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
    <button
      type="button"
      disabled={disabled}
      aria-current={isActive ? "page" : undefined}
      className={cn(
        buttonVariants({
          variant: isActive ? "default" : "ghost",
          size,
        }),
        className
      )}
      {...props}
    >
      {children}
    </button>
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
