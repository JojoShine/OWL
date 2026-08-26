'use client';

import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import {
  FolderIcon,
  UploadIcon,
  PlusIcon,
  SearchIcon,
  GridIcon,
  ListIcon,
  HardDriveIcon,
  RefreshCwIcon
} from 'lucide-react';
import { folderApi, fileApi } from '@/lib/api';
import { formatFileSize } from '@/lib/utils/file';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { PageHeader, PageShell, PageSurface, PageToolbar } from '@/components/layout/page-shell';
import FileList from '@/components/files/FileList';

// 对话框组件动态导入 - 仅在需要时加载
const FileUploadDialog = dynamic(() => import('@/components/files/FileUploadDialog'), {
  loading: () => null,
  ssr: false
});
const NewFolderDialog = dynamic(() => import('@/components/files/NewFolderDialog'), {
  loading: () => null,
  ssr: false
});
const FilePreviewDialog = dynamic(() => import('@/components/files/FilePreviewDialog'), {
  loading: () => null,
  ssr: false
});
const FileShareDialog = dynamic(() => import('@/components/files/FileShareDialog'), {
  loading: () => null,
  ssr: false
});
const RenameDialog = dynamic(() => import('@/components/files/RenameDialog'), {
  loading: () => null,
  ssr: false
});
const MoveDialog = dynamic(() => import('@/components/files/MoveDialog'), {
  loading: () => null,
  ssr: false
});
const PermissionDialog = dynamic(() => import('@/components/files/PermissionDialog'), {
  loading: () => null,
  ssr: false
});

export default function FilesPage() {
  const router = useRouter();

  // 状态管理
  const [currentFolderInfo, setCurrentFolderInfo] = useState(null);
  const [folders, setFolders] = useState([]);
  const [files, setFiles] = useState([]);
  const [stats, setStats] = useState(null);
  const [viewMode, setViewMode] = useState('grid');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItems, setSelectedItems] = useState([]);

  // 对话框状态
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [newFolderDialogOpen, setNewFolderDialogOpen] = useState(false);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [moveDialogOpen, setMoveDialogOpen] = useState(false);
  const [permissionDialogOpen, setPermissionDialogOpen] = useState(false);
  const [currentFile, setCurrentFile] = useState(null);
  const [currentItem, setCurrentItem] = useState(null);
  const [currentItemIsFolder, setCurrentItemIsFolder] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  // 定义加载函数 - 必须在 useEffect 之前定义
  const loadRootContents = useCallback(async () => {
    try {
      setLoading(true);
      const [foldersResponse, filesResponse] = await Promise.all([
        folderApi.getFolders({ parent_id: 'null' }),
        fileApi.getFiles({ folder_id: 'null' })
      ]);
      setFolders(foldersResponse.data?.items || []);
      setFiles(filesResponse.data?.items || []);
    } catch (error) {
      console.error('Failed to load root contents:', error);
      toast.error('加载根目录失败');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadFolderContents = useCallback(async (folderId) => {
    try {
      setLoading(true);
      const response = await folderApi.getFolderContents(folderId);
      const data = response.data || {};
      setFolders(data.folders || []);
      setFiles(data.files || []);
    } catch (error) {
      console.error('Failed to load folder contents:', error);
      toast.error('加载文件夹内容失败');
    } finally {
      setLoading(false);
    }
  }, []);

  // 初始化：加载存储统计和根目录内容
  useEffect(() => {
    loadInitialData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 当前文件夹变化时，加载文件夹内容（仅在非初始化状态下触发）
  useEffect(() => {
    if (currentFolderInfo !== null) {
      loadFolderContents(currentFolderInfo.id);
    }
  }, [currentFolderInfo, loadFolderContents]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const statsResponse = await fileApi.getStats();
      setStats(statsResponse.data || {});
      await loadRootContents();
    } catch (error) {
      console.error('Failed to load initial data:', error);
      toast.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = useCallback(() => {
    if (currentFolderInfo) {
      loadFolderContents(currentFolderInfo.id);
    } else {
      loadRootContents();
    }
    fileApi.getStats()
      .then(response => setStats(response.data))
      .catch(error => console.error('Failed to refresh stats:', error));
  }, [currentFolderInfo, loadFolderContents, loadRootContents]);

  const handleFolderClick = async (folderId, folderName = null) => {
    if (folderId === null) {
      setCurrentFolderInfo(null);
      setSelectedItems([]);
      return;
    }
    if (folderName) {
      setCurrentFolderInfo({ id: folderId, name: folderName });
      setSelectedItems([]);
      return;
    }
    try {
      const response = await folderApi.getFolderById(folderId);
      setCurrentFolderInfo({
        id: response.data.id,
        name: response.data.name,
        parentId: response.data.parentId
      });
      setSelectedItems([]);
    } catch (error) {
      console.error('Failed to get folder info:', error);
      toast.error('获取文件夹信息失败');
    }
  };

  const handleFileClick = (file) => {
    setCurrentFile(file);
    setPreviewDialogOpen(true);
  };

  const handleItemAction = async (item, action, isFolder) => {
    setCurrentFile(item);
    switch (action) {
      case 'preview':
        setPreviewDialogOpen(true);
        break;
      case 'download':
        try {
          const response = await fileApi.downloadFile(item.id);
          const url = window.URL.createObjectURL(response.data);
          const link = document.createElement('a');
          link.href = url;
          link.download = item.original_name;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
          toast.success('文件下载成功');
        } catch (error) {
          console.error('Failed to download file:', error);
          toast.error('文件下载失败');
        }
        break;
      case 'share':
        setShareDialogOpen(true);
        break;
      case 'rename':
        setCurrentItem(item);
        setCurrentItemIsFolder(isFolder);
        setRenameDialogOpen(true);
        break;
      case 'move':
        setCurrentItem(item);
        setCurrentItemIsFolder(isFolder);
        setMoveDialogOpen(true);
        break;
      case 'copy':
        toast.info('复制功能将在下一步实现');
        break;
      case 'permissions':
        setCurrentItem(item);
        setCurrentItemIsFolder(isFolder);
        setPermissionDialogOpen(true);
        break;
      case 'delete':
        setItemToDelete({ item, isFolder });
        setConfirmDialogOpen(true);
        break;
      default:
        console.warn(`Unknown action: ${action}`);
    }
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    const { item, isFolder } = itemToDelete;
    try {
      if (isFolder) {
        await folderApi.deleteFolder(item.id);
      } else {
        await fileApi.deleteFile(item.id);
      }
      toast.success('删除成功');
      handleRefresh();
    } catch (error) {
      console.error('Failed to delete:', error);
      const errorMessage = error.response?.data?.message || error.message || '删除失败';
      toast.error(errorMessage);
    } finally {
      setItemToDelete(null);
    }
  };

  const handleRename = async (newName) => {
    if (!currentItem) return;
    try {
      if (currentItemIsFolder) {
        await folderApi.updateFolder(currentItem.id, { name: newName });
        toast.success('文件夹重命名成功');
      } else {
        await fileApi.updateFile(currentItem.id, { original_name: newName });
        toast.success('文件重命名成功');
      }
      handleRefresh();
    } catch (error) {
      console.error('Failed to rename:', error);
      const errorMessage = error.response?.data?.message || error.message || '重命名失败';
      toast.error(errorMessage);
      throw error;
    }
  };

  const handleMove = async (targetFolderId) => {
    if (!currentItem) return;
    try {
      if (currentItemIsFolder) {
        await folderApi.updateFolder(currentItem.id, { parent_id: targetFolderId });
        toast.success('文件夹移动成功');
      } else {
        await fileApi.moveFile(currentItem.id, targetFolderId);
        toast.success('文件移动成功');
      }
      handleRefresh();
    } catch (error) {
      console.error('Failed to move:', error);
      const errorMessage = error.response?.data?.message || error.message || '移动失败';
      toast.error(errorMessage);
      throw error;
    }
  };

  const getFilteredItems = () => {
    if (!searchQuery.trim()) {
      return { folders, files };
    }
    const query = searchQuery.toLowerCase();
    return {
      folders: folders.filter(folder =>
        folder.name.toLowerCase().includes(query)
      ),
      files: files.filter(file =>
        file.original_name.toLowerCase().includes(query) ||
        file.filename.toLowerCase().includes(query)
      )
    };
  };

  const { folders: filteredFolders, files: filteredFiles } = getFilteredItems();

  return (
    <PageShell>
      <PageHeader
        title="文件管理"
        description="管理您的文件和文件夹"
        actions={(
          <div className="flex min-h-10 items-center gap-2 rounded-md border bg-card px-3 py-2">
          {stats ? (
            <>
              <HardDriveIcon className="w-5 h-5 text-muted-foreground" />
              <div className="text-sm">
                <span className="font-medium text-foreground">
                  {formatFileSize(stats.totalSize)}
                </span>
                <span className="text-muted-foreground ml-1">
                  / {stats.totalFiles} 个文件
                </span>
              </div>
            </>
          ) : (
            <div className="w-32 h-4 bg-muted-foreground/10 rounded animate-pulse" />
          )}
          </div>
        )}
      />

      {/* 操作按钮和搜索 */}
      <PageToolbar className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={() => setUploadDialogOpen(true)}>
            <UploadIcon />
            上传文件
          </Button>
          <Button
            variant="outline"
            onClick={() => setNewFolderDialogOpen(true)}
          >
            <PlusIcon />
            新建文件夹
          </Button>
          <Button
            variant="outline"
            onClick={handleRefresh}
          >
            <RefreshCwIcon />
            刷新
          </Button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[240px] flex-1 lg:flex-none">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="搜索文件或文件夹..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 lg:w-72"
            />
          </div>
          <div className="flex items-center gap-0.5 border border-border rounded-md p-0.5">
            <Button
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
              size="icon-sm"
              onClick={() => setViewMode('grid')}
            >
              <GridIcon />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'secondary' : 'ghost'}
              size="icon-sm"
              onClick={() => setViewMode('list')}
            >
              <ListIcon />
            </Button>
          </div>
        </div>
      </PageToolbar>

      {/* 文件列表 */}
      <PageSurface className="p-5">
        <FileList
          folders={filteredFolders}
          files={filteredFiles}
          currentFolder={currentFolderInfo}
          viewMode={viewMode}
          loading={loading}
          onFolderClick={handleFolderClick}
          onFileClick={handleFileClick}
          onAction={handleItemAction}
        />
      </PageSurface>

      {/* 对话框组件 - 仅在打开时渲染 */}
      {uploadDialogOpen && (
        <FileUploadDialog
          open={uploadDialogOpen}
          onClose={() => setUploadDialogOpen(false)}
          folderId={currentFolderInfo?.id}
          onUploadComplete={handleRefresh}
        />
      )}
      {newFolderDialogOpen && (
        <NewFolderDialog
          open={newFolderDialogOpen}
          onClose={() => setNewFolderDialogOpen(false)}
          parentFolderId={currentFolderInfo?.id}
          onSuccess={handleRefresh}
        />
      )}
      {previewDialogOpen && (
        <FilePreviewDialog
          open={previewDialogOpen}
          onClose={() => setPreviewDialogOpen(false)}
          file={currentFile}
          onShare={(file) => {
            setCurrentFile(file);
            setPreviewDialogOpen(false);
            setShareDialogOpen(true);
          }}
        />
      )}
      {shareDialogOpen && (
        <FileShareDialog
          open={shareDialogOpen}
          onClose={() => setShareDialogOpen(false)}
          file={currentFile}
        />
      )}
      <ConfirmDialog
        open={confirmDialogOpen}
        onOpenChange={setConfirmDialogOpen}
        onConfirm={handleConfirmDelete}
        title="确认删除"
        description={
          itemToDelete
            ? `确定要删除 "${itemToDelete.isFolder ? itemToDelete.item.name : itemToDelete.item.original_name}" 吗？此操作无法撤销。`
            : ''
        }
        confirmText="删除"
        cancelText="取消"
        variant="destructive"
      />
      {renameDialogOpen && (
        <RenameDialog
          open={renameDialogOpen}
          onClose={() => setRenameDialogOpen(false)}
          item={currentItem}
          isFolder={currentItemIsFolder}
          onSuccess={handleRename}
        />
      )}
      {moveDialogOpen && (
        <MoveDialog
          open={moveDialogOpen}
          onClose={() => setMoveDialogOpen(false)}
          item={currentItem}
          isFolder={currentItemIsFolder}
          onSuccess={handleMove}
        />
      )}
      {permissionDialogOpen && (
        <PermissionDialog
          open={permissionDialogOpen}
          onClose={() => setPermissionDialogOpen(false)}
          item={currentItem}
          isFolder={currentItemIsFolder}
        />
      )}
    </PageShell>
  );
}
