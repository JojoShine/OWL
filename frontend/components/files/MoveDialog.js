'use client';

import { useState, useEffect } from 'react';
import { FolderIcon, HomeIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Loading } from '@/components/ui/loading';
import { folderApi } from '@/lib/api';
import { toast } from 'sonner';
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
 * 移动文件/文件夹对话框组件
 */
export default function MoveDialog({ open, onClose, item, isFolder, onSuccess }) {
  const [folders, setFolders] = useState([]);
  const [selectedFolderId, setSelectedFolderId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingFolders, setLoadingFolders] = useState(false);

  useEffect(() => {
    if (open) {
      loadFolders();
      setSelectedFolderId(item?.folder_id || item?.parent_id || null);
    }
  }, [open, item]);

  const loadFolders = async () => {
    try {
      setLoadingFolders(true);
      const response = await folderApi.getFolders({ page: 1, limit: 100 });
      let allFolders = response.data?.items || [];

      // 如果正在移动文件夹，需要过滤掉自己和自己的子文件夹
      if (isFolder && item) {
        allFolders = allFolders.filter(folder => {
          // 不能移动到自己
          if (folder.id === item.id) return false;
          // 不能移动到自己的子文件夹（简化版本，只检查直接子级）
          if (folder.parent_id === item.id) return false;
          return true;
        });
      }

      setFolders(allFolders);
    } catch (error) {
      console.error('Failed to load folders:', error);
      toast.error('加载文件夹列表失败');
    } finally {
      setLoadingFolders(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // 检查是否选择了新的文件夹
    const currentLocation = item?.folder_id || item?.parent_id || null;
    if (selectedFolderId === currentLocation) {
      onClose();
      return;
    }

    setLoading(true);
    try {
      await onSuccess(selectedFolderId);
      onClose();
    } catch (error) {
      console.error('Failed to move:', error);
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
            移动{isFolder ? '文件夹' : '文件'}
          </DialogTitle>
          <DialogDescription>选择新的文件夹位置</DialogDescription>
        </DialogHeader>

        {/* 内容 */}
        <form onSubmit={handleSubmit}>
          <div className="p-6">
            <Label className="mb-2 block">
              选择目标位置
            </Label>

            {loadingFolders ? (
              <Loading size="md" variant="pulse" />
            ) : (
              <div className="border border-border rounded-lg max-h-64 overflow-y-auto">
                {/* 根目录选项 */}
                <button
                  type="button"
                  onClick={() => setSelectedFolderId(null)}
                  className={`
                    w-full flex items-center gap-2 px-4 py-3 text-sm text-left transition-colors
                    ${selectedFolderId === null
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-accent'
                    }
                  `}
                >
                  <HomeIcon className="w-4 h-4 flex-shrink-0" />
                  <span>我的文件（根目录）</span>
                </button>

                {/* 文件夹列表 */}
                {folders.map(folder => (
                  <button
                    key={folder.id}
                    type="button"
                    onClick={() => setSelectedFolderId(folder.id)}
                    className={`
                      w-full flex items-center gap-2 px-4 py-3 text-sm text-left transition-colors
                      ${selectedFolderId === folder.id
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-accent'
                      }
                    `}
                  >
                    <FolderIcon className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">{folder.name}</span>
                  </button>
                ))}

                {folders.length === 0 && (
                  <div className="py-8 text-center text-muted-foreground text-sm">
                    暂无文件夹
                  </div>
                )}
              </div>
            )}
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
              disabled={loading || loadingFolders}
            >
              {loading ? '移动中...' : '确定'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
