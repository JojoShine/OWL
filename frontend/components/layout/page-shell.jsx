import React from 'react';
import { cn } from '@/lib/utils/cn';

export function PageShell({ className, ...props }) {
  return <section className={cn('mx-auto w-full max-w-[1600px] space-y-5', className)} {...props} />;
}

export function PageHeader({ title, description, meta, actions, className }) {
  return (
    <header className={cn('flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between', className)}>
      <div className="min-w-0 space-y-1">
        <div className="flex flex-wrap items-baseline gap-2">
          <h1 className="text-xl font-semibold tracking-[-0.01em] text-foreground">{title}</h1>
          {meta}
        </div>
        {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
    </header>
  );
}

export function PageToolbar({ className, ...props }) {
  return <div className={cn('rounded-lg border bg-card px-5 py-4', className)} {...props} />;
}

export function PageSurface({ className, ...props }) {
  return <section className={cn('overflow-hidden rounded-lg border bg-card', className)} {...props} />;
}
