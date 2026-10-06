
import { useState, useRef } from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Upload, X } from 'lucide-react';
import { uploadApi } from '@/lib/api/system/upload.api';
import { toast } from '@/components/ui/toast';

/**
 * 通用文件上传组件
 *
 * @param {string} label - 标签文本
 * @param {string} value - 当前值（Minio 路径）
 * @param {function} onUpload - 上传完成回调，返回 Minio 路径
 * @param {string} category - 文件分类：logo, background, normal
 * @param {string} aspectRatio - 纵横比：square, auto
 * @param {number} maxSize - 最大文件大小（MB）
 * @param {string} height - 容器高度
 * @param {string} accept - 接受的文件类型，默认 image/*
 */
export default function FileUploader({
  label,
  value,
  onUpload,
  category = 'normal',
  aspectRatio = 'square',
  maxSize = 2,
  height = 'h-48',
  accept = 'image/*',
}) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    // 验证文件大小
    if (file.size > maxSize * 1024 * 1024) {
      toast.error(`文件大小不能超过 ${maxSize}MB`);
      return;
    }

    setUploading(true);
    try {
      // 上传文件到通用上传接口
      const response = await uploadApi.uploadFile(file, category);

      const path = response.data?.data?.path || response.data?.path;

      if (path) {
        onUpload?.(path);
        toast.success('文件上传成功');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('文件上传失败：' + (error.response?.data?.message || error.message));
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = () => {
    onUpload?.(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // 构造文件 URL - 使用流接口获取文件
  const getFileUrl = (path) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    const url = uploadApi.getFileStreamUrl(path);
    return url;
  };

  // 判断是否是图片文件（用于预览）
  const isImage = (path) => {
    if (!path) return false;
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp'];
    return imageExtensions.some(ext => path.toLowerCase().endsWith(ext));
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <input ref={fileInputRef} type="file" accept={accept} aria-label={`上传${label}`}
        className="hidden" onChange={handleFileChange} disabled={uploading} />

      <div
        className={`
        relative border-2 border-dashed rounded-lg overflow-hidden ${height}
        ${aspectRatio === 'square' ? 'aspect-square' : ''}
        ${!value ? 'bg-muted' : ''}
      `}
      >
        {value ? (
          <>
            {isImage(value) ? (
              // 上传资源地址由后端动态返回，使用原生图片元素预览。
              <img
                src={getFileUrl(value)}
                alt={label}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-muted">
                <div className="text-center">
                  <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">
                    {value.split('/').pop()}
                  </p>
                </div>
              </div>
            )}
            <div className="absolute inset-x-2 bottom-2 flex justify-center">
              <Button type="button" variant="secondary" disabled={uploading} onClick={() => fileInputRef.current?.click()}>
                <Upload className="size-4" />{uploading ? '上传中...' : '更换图片'}
              </Button>
            </div>
            <Button
              aria-label={`移除${label}`}
              type="button"
              variant="destructive"
              size="icon"
              style={{ position: 'absolute', top: 8, right: 8 }}
              onClick={handleDelete}
              disabled={uploading}
            >
              <X className="w-4 h-4" />
            </Button>
          </>
        ) : (
          <button type="button" disabled={uploading} onClick={() => fileInputRef.current?.click()} className="w-full flex flex-col items-center justify-center h-full cursor-pointer hover:bg-muted/50 transition">
            <Upload className="w-8 h-8 text-muted-foreground mb-2" />
            <span className="text-sm text-muted-foreground">
              {uploading ? '上传中...' : '点击上传'}
            </span>
            <span className="text-xs text-muted-foreground mt-1">
              最大 {maxSize}MB
            </span>

          </button>
        )}
      </div>
    </div>
  );
}
