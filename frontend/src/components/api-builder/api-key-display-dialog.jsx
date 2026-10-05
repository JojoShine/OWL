
import { useEffect, useState } from 'react';
import { Copy, Eye, EyeOff } from 'lucide-react';
import { toast } from '@/components/ui/toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export default function ApiKeyDisplayDialog({ open, onOpenChange, keyData }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (open) setVisible(false);
  }, [open]);
  const copy = async () => {
    await navigator.clipboard.writeText(keyData?.api_key || '');
    toast.success('接口密钥已复制');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>请保存接口密钥</DialogTitle>
          <DialogDescription>完整密钥仅展示一次，关闭后无法再次查看。</DialogDescription>
        </DialogHeader>
        <div className="space-y-2 py-2">
          <Label>API Key</Label>
          <div className="flex gap-2">
            <Input type={visible ? 'text' : 'password'} value={keyData?.api_key || ''} readOnly className="font-mono" />
            <Button variant="outline" size="icon" onClick={() => setVisible((value) => !value)} aria-label={visible ? '隐藏密钥' : '显示密钥'}>
              {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
            <Button variant="outline" size="icon" onClick={copy} aria-label="复制密钥">
              <Copy className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">调用 SQL 接口时通过 X-API-Key 请求头传递。</p>
        </div>
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>我已保存</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
