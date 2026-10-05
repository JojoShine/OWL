
import React from 'react';
import { TableRow, TableCell } from '@/components/ui/table';
import { Loading } from '@/components/ui/loading';

/**
 * 表格加载行组件
 * 用于在表格数据加载时显示统一的加载指示器
 *
 * @param {number} colSpan - 合并的列数（默认7）
 * @param {'default' | 'workspace'} variant - 视觉样式
 */
export function TableLoading({ colSpan = 7, variant = 'default' }) {
  return (
    <TableRow>
      <TableCell
        colSpan={colSpan}
        className={variant === 'workspace' ? 'py-12 text-center' : 'py-8 text-center'}
      >
        <Loading size="md" variant="pulse" />
      </TableCell>
    </TableRow>
  );
}

export default TableLoading;
