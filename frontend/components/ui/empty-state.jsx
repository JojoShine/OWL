'use client';

import React from 'react';
import { InboxIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export function EmptyState({
  icon: Icon = InboxIcon,
  title = '暂无数据',
  description,
  action,
  compact = false,
  className,
}) {
  return (
    <div
      className={cn(
        'flex w-full flex-col items-center justify-center text-center',
        compact ? 'gap-2.5 py-4' : 'gap-4 py-10',
        className
      )}
    >
      <div
        className={cn(
          'flex items-center justify-center rounded-2xl bg-muted/35 text-muted-foreground/45',
          compact ? 'h-12 w-12' : 'h-16 w-16'
        )}
      >
        <Icon className={compact ? 'h-6 w-6' : 'h-8 w-8'} strokeWidth={1.5} />
      </div>
      <div className="max-w-sm space-y-1.5">
        <p className={cn('font-normal text-muted-foreground/75', compact ? 'text-sm' : 'text-base')}>
          {title}
        </p>
        {description ? (
          <p className={cn(
            'font-normal leading-5 text-muted-foreground/50',
            compact ? 'text-xs' : 'text-sm'
          )}>
            {description}
          </p>
        ) : null}
      </div>
      {action ? <div className="pt-1">{action}</div> : null}
    </div>
  );
}

export default EmptyState;
