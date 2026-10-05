import { getBasePath } from '@/lib/config/runtime';

import { ThemeToggle } from '@/components/layout/theme/theme-toggle';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { cn } from '@/lib/utils';

export function AuthShell({
  children,
  systemName,
  logoUrl,
  description,
  footer,
  backgroundUrl,
  layout = 'center',
}) {
  const coverUrl = backgroundUrl || `${getBasePath()}/login-cover.png`;
  const isSplit = layout === 'left-image' || layout === 'right-image';

  const brandPanel = (
    <aside
      aria-hidden="true"
      className={cn(
        'relative hidden min-h-dvh overflow-hidden border-border bg-muted lg:block',
        layout === 'right-image' ? 'border-l' : 'border-r'
      )}
    >
      {coverUrl ? (
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${coverUrl})` }}
        />
      ) : null}
      <div className="absolute inset-0 bg-foreground/5 dark:bg-background/20" />
    </aside>
  );

  const formPanel = (
    <section className="relative flex min-h-dvh items-center justify-center px-4 py-16 sm:px-8">
      <Card className="w-full max-w-md border-0 bg-transparent shadow-none">
        <CardHeader className="items-center gap-3 text-center">
          <div className="flex flex-col items-center gap-1.5">
            {logoUrl ? (
              // 系统 Logo 支持后台配置的任意资源地址，无法预先加入 Next Image 域名白名单。
              <img
                src={logoUrl}
                alt={`${systemName} 标志`}
                className="mx-auto size-14 rounded-lg object-contain dark:invert"
              />
            ) : null}
            {footer ? (
              <p className="text-center text-xs leading-5 text-muted-foreground">
                {footer}
              </p>
            ) : null}
          </div>
          <div className="space-y-2">
            <CardTitle className="text-2xl font-semibold tracking-[-0.02em]">
              {systemName}
            </CardTitle>
            {description ? <CardDescription>{description}</CardDescription> : null}
          </div>
        </CardHeader>
        <CardContent>{children}</CardContent>
      </Card>
    </section>
  );

  return (
    <main
      className={cn(
        'relative min-h-dvh bg-background',
        isSplit &&
          (layout === 'left-image'
            ? 'lg:grid lg:grid-cols-[minmax(18rem,0.82fr)_minmax(32rem,1.18fr)]'
            : 'lg:grid lg:grid-cols-[minmax(32rem,1.18fr)_minmax(18rem,0.82fr)]')
      )}
      style={
        !isSplit && backgroundUrl
          ? {
              backgroundImage: `linear-gradient(color-mix(in srgb, var(--background) 72%, transparent), color-mix(in srgb, var(--background) 72%, transparent)), url(${backgroundUrl})`,
              backgroundPosition: 'center',
              backgroundSize: 'cover',
            }
          : undefined
      }
    >
      <div className="absolute right-4 top-4 z-10 sm:right-6 sm:top-6">
        <ThemeToggle />
      </div>
      {isSplit && layout === 'left-image' ? brandPanel : null}
      {formPanel}
      {isSplit && layout === 'right-image' ? brandPanel : null}
    </main>
  );
}
