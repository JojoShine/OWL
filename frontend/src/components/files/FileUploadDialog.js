
import { useState, useRef, useCallback } from 'react';
import {
  UploadIcon,
  FileIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  Loader2Icon,
  TrashIcon
} from 'lucide-react';
import { fileApi } from '@/lib/api';
import { formatFileSize, getFileIcon, validateFileSize } from '@/lib/utils/file';
import { toast } from '@/components/ui/toast';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const MAX_FILE_SIZE = 100 * 1024 * 1024;
const isImage = (file) => file.type.startsWith('image/');

/**
 * 文件上传对话框组件
 */
export default function FileUploadDialog({ open, onClose, folderId, onUploadComplete }) {
  const [files, setFiles] = useState([]); // 待上传的文件列表
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [previewUrls, setPreviewUrls] = useState({}); // 图片预览 URL {fileId: url}
  const fileInputRef = useRef(null);

  /**
   * 生成图片预览
   */
  const generateImagePreview = useCallback((file, fileId) => {
    if (!isImage(file)) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrls(prev => ({
        ...prev,
        [fileId]: e.target.result
      }));
    };
    reader.onerror = () => {
      console.error('Failed to read image file:', file.name);
    };
    reader.readAsDataURL(file);
  }, []);

  /**
   * 处理文件选择
   */
  const handleFileSelect = useCallback((selectedFiles) => {
    const fileArray = Array.from(selectedFiles);

    // 验证文件大小
    const validFiles = [];
    const invalidFiles = [];

    fileArray.forEach(file => {
      if (validateFileSize(file, MAX_FILE_SIZE)) {
        const fileId = `${file.name}-${Date.now()}-${Math.random()}`;
        validFiles.push({
          file,
          id: fileId,
          name: file.name,
          size: file.size,
          status: 'pending', // pending | uploading | success | error
          progress: 0,
          error: null
        });

        // 为图片生成预览
        generateImagePreview(file, fileId);
      } else {
        invalidFiles.push(file.name);
      }
    });

    if (invalidFiles.length > 0) {
      toast.error(`以下文件超过大小限制 (${formatFileSize(MAX_FILE_SIZE)}):\n${invalidFiles.join(', ')}`);
    }

    setFiles(prev => [...prev, ...validFiles]);
  }, [generateImagePreview]);

  /**
   * 文件输入变化
   */
  const handleFileInputChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileSelect(e.target.files);
      // 重置input以允许选择相同文件
      e.target.value = '';
    }
  };

  /**
   * 拖拽事件处理
   */
  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files);
    }
  }, [handleFileSelect]);

  /**
   * 移除文件
   */
  const handleRemoveFile = (fileId) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
    // 清理图片预览 URL
    setPreviewUrls(prev => {
      const newUrls = { ...prev };
      delete newUrls[fileId];
      return newUrls;
    });
  };

  /**
   * 开始上传
   */
  const handleUpload = async () => {
    const pendingFiles = files.filter(f => f.status === 'pending');

    if (pendingFiles.length === 0) {
      toast.warning('没有待上传的文件');
      return;
    }

    setUploading(true);

    // 逐个上传文件（也可以批量上传）
    for (const fileItem of pendingFiles) {
      try {
        // 更新状态为上传中
        setFiles(prev =>
          prev.map(f =>
            f.id === fileItem.id
              ? { ...f, status: 'uploading', progress: 0 }
              : f
          )
        );

        // 上传文件
        await fileApi.uploadFiles(
          fileItem.file,
          folderId,
          (progress) => {
            // 更新进度
            setFiles(prev =>
              prev.map(f =>
                f.id === fileItem.id
                  ? { ...f, progress }
                  : f
              )
            );
          }
        );

        // 上传成功
        setFiles(prev =>
          prev.map(f =>
            f.id === fileItem.id
              ? { ...f, status: 'success', progress: 100 }
              : f
          )
        );
      } catch (error) {
        console.error(`Failed to upload ${fileItem.name}:`, error);

        // 上传失败
        setFiles(prev =>
          prev.map(f =>
            f.id === fileItem.id
              ? { ...f, status: 'error', error: error.message || '上传失败' }
              : f
          )
        );
      }
    }

    setUploading(false);

    // 使用 setTimeout 确保在当前渲染周期之外调用回调，避免 React 警告
    setTimeout(() => {
      // 计算上传结果
      setFiles(currentFiles => {
        const uploadedFileIds = pendingFiles.map(f => f.id);
        const currentBatchFiles = currentFiles.filter(f => uploadedFileIds.includes(f.id));
        const successCount = currentBatchFiles.filter(f => f.status === 'success').length;
        const errorCount = currentBatchFiles.filter(f => f.status === 'error').length;

        if (successCount === currentBatchFiles.length && successCount > 0) {
          // 全部成功
          toast.success(`成功上传 ${successCount} 个文件`);
          // 在 setTimeout 中调用，确保不在 render 周期内
          setTimeout(() => {
            onUploadComplete?.();
            handleClose();
          }, 100);
        } else if (successCount > 0) {
          // 部分成功
          toast.success(`成功上传 ${successCount} 个文件，${errorCount} 个失败`);
          setTimeout(() => onUploadComplete?.(), 0);
        } else {
          // 全部失败
          toast.error('文件上传失败');
        }

        return currentFiles;
      });
    }, 0);
  };

  /**
   * 关闭对话框
   */
  const handleClose = () => {
    if (uploading) {
      toast.warning('文件正在上传中，请稍候...');
      return;
    }

    setFiles([]);
    setPreviewUrls({});
    onClose();
  };

  /**
   * 获取状态图标
   */
  const getStatusIcon = (status) => {
    switch (status) {
      case 'uploading':
        return <Loader2Icon className="w-5 h-5 text-primary animate-spin" />;
      case 'success':
        return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
      case 'error':
        return <AlertCircleIcon className="w-5 h-5 text-red-500" />;
      default:
        return null;
    }
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => { if (!nextOpen) handleClose(); }}>
      <DialogContent
        className="max-h-[85vh] max-w-2xl gap-0 overflow-hidden p-0"
        showCloseButton={!uploading}
        onEscapeKeyDown={(event) => { if (uploading) event.preventDefault(); }}
        onPointerDownOutside={(event) => { if (uploading) event.preventDefault(); }}
      >
        {/* 头部 */}
        <DialogHeader className="border-b px-6 py-5 pr-12">
          <DialogTitle>上传文件</DialogTitle>
          <DialogDescription>选择一个或多个文件上传到当前目录</DialogDescription>
        </DialogHeader>

        {/* 内容 */}
        <div className="min-h-0 flex-1 overflow-y-auto p-6">
          {/* 拖拽上传区域 */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`
              border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
              transition-colors
              ${dragActive
                ? 'border-primary bg-primary/10'
                : 'border-border hover:border-primary/50 hover:bg-accent'
              }
            `}
          >
            <UploadIcon className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg font-medium text-foreground mb-2">
              拖拽文件到此处，或点击选择文件
            </p>
            <p className="text-sm text-muted-foreground">
              支持单个或多个文件上传，最大 {formatFileSize(MAX_FILE_SIZE)}
            </p>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileInputChange}
            className="hidden"
          />

          {/* 文件列表 */}
          {files.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-semibold text-foreground mb-3">
                文件列表 ({files.length})
              </h3>

              <div className="space-y-2">
                {files.map(fileItem => {
                  const FileIconComponent = getFileIcon(fileItem.name);
                  const hasPreview = previewUrls[fileItem.id];

                  return (
                    <div
                      key={fileItem.id}
                      className="flex items-center gap-3 p-3 border border-border rounded-lg bg-card"
                    >
                      {/* 文件图标或图片预览 */}
                      {hasPreview ? (
                        <div className="w-16 h-16 flex-shrink-0 rounded-md overflow-hidden bg-muted">
                          {/* 本地 FileReader 预览不能使用 Next Image。 */}
                          <img
                            src={previewUrls[fileItem.id]}
                            alt={fileItem.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <FileIconComponent className="w-8 h-8 text-muted-foreground flex-shrink-0" />
                      )}

                      {/* 文件信息 */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {fileItem.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatFileSize(fileItem.size)}
                        </p>

                        {/* 进度条 */}
                        {fileItem.status === 'uploading' && (
                          <div className="mt-2">
                            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                              <div
                                className="h-full bg-primary transition-all duration-300"
                                style={{ width: `${fileItem.progress}%` }}
                              />
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              {fileItem.progress}%
                            </p>
                          </div>
                        )}

                        {/* 错误信息 */}
                        {fileItem.status === 'error' && (
                          <p className="text-xs text-destructive mt-1">
                            {fileItem.error}
                          </p>
                        )}
                      </div>

                      {/* 状态图标 */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {getStatusIcon(fileItem.status)}

                        {/* 删除按钮 */}
                        {fileItem.status === 'pending' && !uploading && (
                          <button
                            onClick={() => handleRemoveFile(fileItem.id)}
                            className="p-1 hover:bg-accent rounded-lg transition-colors"
                          >
                            <TrashIcon className="w-4 h-4 text-muted-foreground" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* 底部按钮 */}
        <DialogFooter className="border-t px-6 py-4">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={uploading}
          >
            取消
          </Button>
          <Button
            onClick={handleUpload}
            disabled={uploading || files.filter(f => f.status === 'pending').length === 0}
          >
            {uploading && <Loader2Icon className="w-4 h-4 animate-spin" />}
            {uploading ? '上传中...' : '开始上传'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
