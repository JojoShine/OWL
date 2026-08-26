'use client';

import { useState, useEffect } from 'react';
import { XIcon, DownloadIcon, ShareIcon, FileIcon } from 'lucide-react';
import { fileApi } from '@/lib/api';
import { formatFileSize, formatDate, isImage, isVideo, isPDF, canPreview } from '@/lib/utils/file';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

/**
 * 文件预览对话框
 */
export default function FilePreviewDialog({ open, onClose, file, onShare }) {
  const [previewUrl, setPreviewUrl] = useState(null);
  const [loading, setLoading] = useState(false);


  /**
   * 加载预览
   */
  useEffect(() => {
    if (open && file && canPreview(file.original_name, file.mime_type)) {
      loadPreview();
    }

    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [open, file]);

  const loadPreview = async () => {
    setLoading(true);

    try {
      const response = await fileApi.previewFile(file.id);
      // response.data 已经是 Blob 对象（因为设置了 responseType: 'blob'）
      // 直接使用它创建 URL
      const url = URL.createObjectURL(response.data);
      setPreviewUrl(url);
    } catch (error) {
      console.error('Failed to load preview:', error);
      toast.error('预览加载失败');
    } finally {
      setLoading(false);
    }
  };

  /**
   * 下载文件
   */
  const handleDownload = async () => {
    try {
      const response = await fileApi.downloadFile(file.id);
      // response.data 已经是 Blob 对象
      const url = window.URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = url;
      link.download = file.original_name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('文件下载成功');
    } catch (error) {
      console.error('Failed to download file:', error);
      toast.error('文件下载失败');
    }
  };

  /**
   * 分享文件
   */
  const handleShare = () => {
    onShare?.(file);
  };

  /**
   * 处理关闭
   */
  const handleClose = () => {
    setPreviewUrl(null);
    onClose();
  };

  if (!open || !file) return null;

  const fileCanPreview = canPreview(file.original_name, file.mime_type);

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => { if (!nextOpen) handleClose(); }}>
      <DialogContent
        className="max-h-[85vh] max-w-4xl gap-0 overflow-hidden p-0"
        showCloseButton={false}
        overlayClassName="bg-black/55"
      >
        {/* 头部 */}
        <DialogHeader className="flex-row items-center justify-between border-b px-6 py-4 text-left">
          <div className="flex-1 min-w-0 mr-4">
            <DialogTitle className="truncate">
              {file.original_name}
            </DialogTitle>
            <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
              <span>{formatFileSize(file.size)}</span>
              <span>上传于 {file.createdAt ? formatDate(file.createdAt) : '未知时间'}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              className="p-2 hover:bg-accent rounded-lg transition-colors"
              title="下载"
            >
              <DownloadIcon className="w-5 h-5 text-muted-foreground" />
            </button>
            <button
              onClick={handleShare}
              className="p-2 hover:bg-accent rounded-lg transition-colors"
              title="分享"
            >
              <ShareIcon className="w-5 h-5 text-muted-foreground" />
            </button>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-accent rounded-lg transition-colors"
            >
              <XIcon className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
        </DialogHeader>

        {/* 预览内容 */}
        <div className="min-h-[360px] flex-1 overflow-auto bg-muted p-6">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-muted-foreground">加载中...</div>
            </div>
          ) : fileCanPreview && previewUrl ? (
            <div className="flex items-center justify-center h-full">
              {isImage(file.original_name, file.mime_type) && (
                <img
                  src={previewUrl}
                  alt={file.original_name}
                  className="max-w-[700px] max-h-[500px] object-contain rounded-lg shadow-lg cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={(e) => {
                    e.stopPropagation();
                    // 可选：添加放大查看功能
                    // 这里暂时只添加视觉反馈，未来可以添加lightbox功能
                  }}
                  title="点击查看原图"
                />
              )}

              {isVideo(file.original_name, file.mime_type) && (
                <video
                  src={previewUrl}
                  controls
                  className="max-w-full max-h-full rounded-lg shadow-lg"
                >
                  您的浏览器不支持视频播放
                </video>
              )}

              {isPDF(file.original_name, file.mime_type) && (
                <iframe
                  src={previewUrl}
                  className="w-full h-full rounded-lg shadow-lg"
                  title={file.original_name}
                />
              )}
            </div>
          ) : (
            /* 不支持预览 */
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <FileIcon className="w-16 h-16 mb-4" />
              <p className="text-lg font-medium text-foreground">此文件不支持预览</p>
              <p className="text-sm mt-2">请下载文件查看内容</p>
              <Button
                onClick={handleDownload}
                className="mt-6"
              >
                <DownloadIcon className="w-4 h-4" />
                下载文件
              </Button>
            </div>
          )}
        </div>

        {/* 底部信息 */}
        <div className="px-6 py-3 border-t border-border bg-muted text-sm text-muted-foreground">
          <div className="flex items-center justify-between">
            <span>类型: {file.mime_type}</span>
            <span>上传于 {file.createdAt ? formatDate(file.createdAt) : '未知时间'}</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
