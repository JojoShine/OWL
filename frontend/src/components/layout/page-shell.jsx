import React from 'react';
import { cn } from '@/lib/utils';

export function PageShell({ className, ...props }) {
  return <section className={cn('mx-auto w-full max-w-[1600px] space-y-5 2xl:max-w-none', className)} {...props} />;
}

export function PageHeader({ title, description, meta, actions, leading, className }) {
  return (
    <header className={cn('flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between', className)}>
      <div className="flex min-w-0 items-start gap-3">
        {leading ? <div className="shrink-0">{leading}</div> : null}
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-baseline gap-2">
            <h1 className="text-xl font-semibold tracking-[-0.01em] text-foreground">{title}</h1>
            {meta}
          </div>
          {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
        </div>
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
    </header>
  );
}

export function PageToolbar({ className, ...props }) {
  return <div data-slot="page-toolbar" className={cn('rounded-lg border bg-card px-4 py-4', className)} {...props} />;
}

export function PageSurface({ className, ...props }) {
  return <section data-slot="page-surface" className={cn('overflow-hidden rounded-lg border bg-card', className)} {...props} />;
}

export function PageWorkspace({ className, ...props }) {
  return (
    <section
      data-slot="page-workspace"
      className={cn(
        'overflow-hidden rounded-lg border bg-card max-md:space-y-3 max-md:overflow-visible max-md:rounded-none max-md:border-0 max-md:bg-transparent',
        'md:[&>[data-slot=page-toolbar]]:rounded-none md:[&>[data-slot=page-toolbar]]:border-x-0 md:[&>[data-slot=page-toolbar]]:border-t-0',
        '[&>[data-slot=page-surface]]:border-0 [&>[data-slot=page-surface]]:bg-transparent md:[&>[data-slot=page-surface]]:rounded-none',
        '[&_[data-slot=data-table]]:border-0 md:[&_[data-slot=data-table]]:rounded-none',
        className
      )}
      {...props}
    />
  );
}
