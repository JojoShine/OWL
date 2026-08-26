'use client';

import { useState, useEffect } from 'react';
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
 * 重命名对话框组件
 */
export default function RenameDialog({ open, onClose, item, isFolder, onSuccess }) {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && item) {
      setName(isFolder ? item.name : item.original_name);
    }
  }, [open, item, isFolder]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name.trim()) {
      return;
    }

    if (name === (isFolder ? item.name : item.original_name)) {
      onClose();
      return;
    }

    setLoading(true);
    try {
      await onSuccess(name);
      onClose();
    } catch (error) {
      console.error('Failed to rename:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => { if (!nextOpen && !loading) onClose(); }}>
      <DialogContent className="max-w-md gap-0 p-0" showCloseButton={!loading}>
        {/* 头部 */}
        <DialogHeader className="border-b px-6 py-5 pr-12">
          <DialogTitle>
            重命名{isFolder ? '文件夹' : '文件'}
          </DialogTitle>
          <DialogDescription>输入新的名称并确认保存</DialogDescription>
        </DialogHeader>

        {/* 内容 */}
        <form onSubmit={handleSubmit}>
          <div className="p-6">
            <Label htmlFor="rename-item-name" className="mb-2 block">
              {isFolder ? '文件夹名称' : '文件名'}
            </Label>
            <Input
              id="rename-item-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={`请输入${isFolder ? '文件夹' : '文件'}名称`}
              disabled={loading}
              autoFocus
            />
          </div>

          {/* 底部按钮 */}
          <DialogFooter className="border-t px-6 py-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              取消
            </Button>
            <Button
              type="submit"
              disabled={loading || !name.trim()}
            >
              {loading ? '重命名中...' : '确定'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
