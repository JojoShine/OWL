'use client';

import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Copy, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

export default function SecretDisplayDialog({ open, onOpenChange, keyData }) {
  const [showSecret, setShowSecret] = useState(false);

  useEffect(() => {
    if (open) setShowSecret(false);
  }, [open]);

  const handleCopy = (text, label) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label}已复制到剪贴板`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>请保存第三方签名凭证</DialogTitle>
          <DialogDescription>
            API Secret 仅展示一次，关闭后无法再次查看。
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* API Key */}
          <div className="space-y-2">
            <Label>API Key</Label>
            <div className="flex gap-2">
              <Input
                value={keyData?.api_key || ''}
                readOnly
                className="font-mono text-sm"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => handleCopy(keyData?.api_key, 'API Key')}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* API Secret */}
          <div className="space-y-2">
            <Label>API Secret</Label>
            <div className="flex gap-2">
              <Input
                type={showSecret ? 'text' : 'password'}
                value={keyData?.api_secret || ''}
                readOnly
                className="font-mono text-sm"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setShowSecret(!showSecret)}
              >
                {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => handleCopy(keyData?.api_secret, 'API Secret')}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* 客户端名称 */}
          <div className="space-y-2">
            <Label>客户端名称</Label>
            <Input
              value={keyData?.client_name || ''}
              readOnly
              className="bg-muted"
            />
          </div>

          {/* 状态 */}
          <div className="space-y-2">
            <Label>状态</Label>
            <Input
              value={keyData?.status === 'active' ? '启用' : '禁用'}
              readOnly
              className="bg-muted"
            />
          </div>

          {/* 警告提示 */}
          <div className="rounded-lg border bg-muted/40 p-4">
            <p className="text-sm text-muted-foreground">
              请立即复制并安全保存 API Secret；重新生成后旧 Secret 会立即失效。
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>
            我已保存，关闭
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
