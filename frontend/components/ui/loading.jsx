'use client';

import React from 'react';
import { cn } from '@/lib/utils';

/**
 * 统一的 Loading 组件
 * 用于在全系统统一 loading 样式
 *
 * @param {Object} props
 * @param {string} props.size - 大小: 'sm' | 'md' | 'lg' (默认: 'md')
 * @param {string} props.text - 加载文本 (默认: '加载中...')
 * @param {string} props.className - 外层容器额外类名
 * @param {boolean} props.fullHeight - 是否填满容器高度 (默认: false)
 */
export function Loading({
  size = 'md',
  text = '加载中...',
  className = '',
  fullHeight = false,
}) {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-10 w-10',
    lg: 'h-14 w-14',
  };

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  const heightClass = fullHeight ? 'h-64 md:h-96 lg:h-[500px]' : '';
  const isCompact = size === 'sm';

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn('flex items-center justify-center text-muted-foreground', heightClass, className)}
    >
      <div className={cn('flex items-center', isCompact ? 'gap-2' : 'flex-col gap-3')}>
        <span className={cn(
          'inline-flex shrink-0 animate-spin rounded-full border-2 border-muted-foreground/20 border-t-muted-foreground/70 motion-reduce:animate-none',
          sizeClasses[size]
        )} />
        {text ? (
          <span className={cn('font-normal tracking-wide text-muted-foreground/70', textSizeClasses[size])}>{text}</span>
        ) : null}
      </div>
    </div>
  );
}

export default Loading;
