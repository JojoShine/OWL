
import { useState } from 'react';
import { FolderPlusIcon } from 'lucide-react';
import { folderApi } from '@/lib/api';
import { toast } from '@/components/ui/toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

/**
 * 新建文件夹对话框
 */
export default function NewFolderDialog({ open, onClose, parentFolderId, onSuccess }) {
  const [folderName, setFolderName] = useState('');
  const [creating, setCreating] = useState(false);

  /**
   * 处理创建
   */
  const handleCreate = async () => {
    if (!folderName.trim()) {
      toast.warning('请输入文件夹名称');
      return;
    }

    setCreating(true);

    try {
      await folderApi.createFolder({
        name: folderName.trim(),
        parent_id: parentFolderId || null
      });

      toast.success('文件夹创建成功');
      setFolderName('');
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Failed to create folder:', error);
      toast.error(error.response?.data?.message || '创建文件夹失败');
    } finally {
      setCreating(false);
    }
  };

  /**
   * 处理关闭
   */
  const handleClose = () => {
    if (creating) return;
    setFolderName('');
    onClose();
  };

  /**
   * 处理键盘事件
   */
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleCreate();
    } else if (e.key === 'Escape') {
      handleClose();
    }
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => { if (!nextOpen) handleClose(); }}>
      <DialogContent className="max-w-md gap-0 p-0" showCloseButton={!creating}>
        {/* 头部 */}
        <DialogHeader className="border-b px-6 py-5 pr-12">
          <DialogTitle className="flex items-center gap-2">
            <FolderPlusIcon className="w-5 h-5 text-primary" />
            新建文件夹
          </DialogTitle>
          <DialogDescription>在当前目录中创建一个新文件夹</DialogDescription>
        </DialogHeader>

        {/* 内容 */}
        <div className="px-6 py-4">
          <Label htmlFor="new-folder-name" className="mb-2 block">
            文件夹名称
          </Label>
          <Input
            id="new-folder-name"
            type="text"
            value={folderName}
            onChange={(e) => setFolderName(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="输入文件夹名称"
            autoFocus
            disabled={creating}
          />
        </div>

        {/* 底部按钮 */}
        <DialogFooter className="border-t px-6 py-4">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={creating}
          >
            取消
          </Button>
          <Button
            onClick={handleCreate}
            disabled={creating || !folderName.trim()}
          >
            {creating ? '创建中...' : '创建'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
