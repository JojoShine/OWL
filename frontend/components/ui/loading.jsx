'use client';

import React from 'react';
import { LoaderCircleIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * 统一的 Loading 组件
 * 用于在全系统统一 loading 样式
 *
 * @param {Object} props
 * @param {string} props.size - 大小: 'sm' | 'md' | 'lg' (默认: 'md')
 * @param {string} props.variant - 样式: 'spinner' | 'pulse' (默认: 'spinner')
 * @param {string} props.text - 加载文本 (默认: '加载中...')
 * @param {string} props.className - 外层容器额外类名
 * @param {boolean} props.fullHeight - 是否填满容器高度 (默认: false)
 */
export function Loading({
  size = 'md',
  variant = 'spinner',
  text = '加载中...',
  className = '',
  fullHeight = false,
}) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
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
          'relative flex items-center justify-center rounded-full bg-muted/70 ring-1 ring-border/60',
          isCompact ? 'h-7 w-7' : size === 'lg' ? 'h-14 w-14' : 'h-11 w-11',
          variant === 'pulse' && 'animate-pulse'
        )}>
          <LoaderCircleIcon
            className={cn('animate-spin text-foreground/75', sizeClasses[size])}
            strokeWidth={1.8}
          />
        </span>
        {text ? (
          <span className={cn('font-medium tracking-wide', textSizeClasses[size])}>{text}</span>
        ) : null}
      </div>
    </div>
  );
}

export default Loading;
