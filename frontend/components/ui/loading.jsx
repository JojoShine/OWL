'use client';

import React from 'react';

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

  if (variant === 'pulse') {
    return (
      <div
        className={`flex items-center justify-center ${heightClass} animate-pulse text-muted-foreground ${className}`}
      >
        <span className={textSizeClasses[size]}>{text}</span>
      </div>
    );
  }

  return (
    <div
      className={`flex items-center justify-center ${heightClass} text-muted-foreground ${className}`}
    >
      <div className="flex flex-col items-center gap-3">
        <div
          className={`rounded-full border-4 border-muted border-t-primary animate-spin ${sizeClasses[size]}`}
        />
        {text && <span className={`font-medium ${textSizeClasses[size]}`}>{text}</span>}
      </div>
    </div>
  );
}

export default Loading;
