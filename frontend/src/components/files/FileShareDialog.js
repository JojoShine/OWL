import { getBasePath } from '@/lib/config/runtime';

import { useState, useEffect } from 'react';
import { ShareIcon, CopyIcon, CheckIcon, ClockIcon } from 'lucide-react';
import { fileShareApi } from '@/lib/api';
import { toast } from '@/components/ui/toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

/**
 * 文件分享对话框
 */
export default function FileShareDialog({ open, onClose, file }) {
  const [shareLink, setShareLink] = useState('');
  const [shareCode, setShareCode] = useState('');
  const [expiresInHours, setExpiresInHours] = useState(24);
  const [creating, setCreating] = useState(false);
  const [copied, setCopied] = useState(false);

  /**
   * 重置状态
   */
  useEffect(() => {
    if (open) {
      setShareLink('');
      setShareCode('');
      setExpiresInHours(24);
      setCopied(false);
    }
  }, [open]);

  /**
   * 创建分享链接
   */
  const handleCreateShare = async () => {
    if (!file) return;

    setCreating(true);

    try {
      const response = await fileShareApi.createShare({
        file_id: file.id,
        expires_in_hours: expiresInHours || null
      });

      const data = response.data;
      const code = data.share_code;
      const link = `${window.location.origin}${getBasePath()}/share/${code}`;

      setShareCode(code);
      setShareLink(link);

      toast.success('分享链接创建成功');
    } catch (error) {
      console.error('Failed to create share:', error);
      toast.error(error.response?.data?.message || '创建分享链接失败');
    } finally {
      setCreating(false);
    }
  };

  /**
   * 复制链接
   */
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareLink);
      setCopied(true);
      toast.success('链接已复制到剪贴板');

      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
      toast.error('复制失败');
    }
  };

  /**
   * 处理关闭
   */
  const handleClose = () => {
    if (creating) return;
    onClose();
  };

  if (!open || !file) return null;

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => { if (!nextOpen) handleClose(); }}>
      <DialogContent className="max-w-md gap-0 p-0" showCloseButton={!creating}>
        {/* 头部 */}
        <DialogHeader className="border-b px-6 py-5 pr-12">
          <DialogTitle className="flex items-center gap-2">
            <ShareIcon className="w-5 h-5 text-primary" />
            分享文件
          </DialogTitle>
          <DialogDescription>创建一个有时效限制的公开下载链接</DialogDescription>
        </DialogHeader>

        {/* 内容 */}
        <div className="px-6 py-4">
          {/* 文件信息 */}
          <div className="mb-4 p-3 bg-muted rounded-lg">
            <p className="text-sm font-medium text-foreground truncate">
              {file.original_name}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {file.mime_type}
            </p>
          </div>

          {!shareLink ? (
            /* 创建分享 */
            <>
              <label className="block text-sm font-medium text-foreground mb-2">
                <ClockIcon className="w-4 h-4 inline mr-1" />
                有效期
              </label>
              <Select
                value={String(expiresInHours)}
                onValueChange={(value) => setExpiresInHours(Number(value))}
                disabled={creating}
              >
                <SelectTrigger className="w-full mb-4">
                  <SelectValue placeholder="选择有效期" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 小时</SelectItem>
                  <SelectItem value="6">6 小时</SelectItem>
                  <SelectItem value="24">1 天</SelectItem>
                  <SelectItem value="72">3 天</SelectItem>
                  <SelectItem value="168">7 天</SelectItem>
                  <SelectItem value="720">30 天</SelectItem>
                  <SelectItem value="0">永久</SelectItem>
                </SelectContent>
              </Select>

              <Button
                onClick={handleCreateShare}
                disabled={creating}
                className="w-full"
              >
                {creating ? '创建中...' : '创建分享链接'}
              </Button>
            </>
          ) : (
            /* 显示分享链接 */
            <>
              <label className="block text-sm font-medium text-foreground mb-2">
                分享链接
              </label>
              <div className="flex items-center gap-2 mb-4">
                <Input
                  type="text"
                  value={shareLink}
                  readOnly
                  className="flex-1 bg-muted"
                />
                <Button
                  onClick={handleCopyLink}
                  variant={copied ? "default" : "default"}
                  className={copied ? "bg-green-600 hover:bg-green-700" : ""}
                >
                  {copied ? (
                    <>
                      <CheckIcon className="w-4 h-4" />
                      已复制
                    </>
                  ) : (
                    <>
                      <CopyIcon className="w-4 h-4" />
                      复制
                    </>
                  )}
                </Button>
              </div>

              <label className="block text-sm font-medium text-foreground mb-2">
                分享码
              </label>
              <div className="px-4 py-3 bg-muted rounded-lg text-center mb-4">
                <p className="text-2xl font-bold text-foreground tracking-wider">
                  {shareCode}
                </p>
              </div>

              <Alert variant="info">
                <ClockIcon aria-hidden="true" />
                <AlertDescription>
                  {expiresInHours > 0 ? `此链接将在 ${expiresInHours} 小时后过期` : '此链接永不过期'}
                </AlertDescription>
              </Alert>
            </>
          )}
        </div>

        {/* 底部按钮 */}
        <DialogFooter className="border-t px-6 py-4">
          <Button
            variant="outline"
            onClick={handleClose}
          >
            关闭
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
