'use client';

import { Button } from '@/components/ui/button';

export default function ThemePreview({ theme, mode }) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">主题预览</p>
      <div className={`theme-${theme} ${mode === 'dark' ? 'dark' : ''} rounded-lg border bg-muted/30 p-4`}>
        <div className="space-y-3 rounded-md border bg-background p-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-sidebar rounded" />
            <div className="flex-1 h-4 bg-muted rounded" />
          </div>
          <div className="flex gap-2">
            <Button size="sm">主按钮</Button>
            <Button size="sm" variant="outline">
              次按钮
            </Button>
          </div>
          <div className="h-20 rounded border bg-card p-3">
            <div className="h-3 bg-primary/20 rounded w-1/2" />
          </div>
        </div>
      </div>
    </div>
  );
}
