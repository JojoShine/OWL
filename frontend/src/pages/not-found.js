import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function NotFound() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardContent className="py-8 text-center">
          <p className="mb-3 text-sm font-medium text-muted-foreground">404</p>
          <h1 className="text-2xl font-semibold tracking-[-0.02em]">页面不存在</h1>
          <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-muted-foreground">
            你访问的页面可能已被移动、删除，或当前地址有误。
          </p>
          <Button asChild className="mt-6">
            <Link to="/">
              <ArrowLeft className="size-4" />
              返回首页
            </Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
